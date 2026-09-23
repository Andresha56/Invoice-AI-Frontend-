import type { ExtractedEntities } from "../types.js";

/**
 * Shape of the raw JSON Gemini returns, per the `responseSchema` declared in
 * `llmService.ts`. This intentionally captures a few fields (per-item
 * `explicitTotalPrice`, `discountPercentage`/`discountAmount`, `seller`,
 * contact details on `clientQuery`) that the rest of the app does not yet
 * use — see the notes below on where they're dropped.
 */
interface RawGeminiInvoiceItem {
  queryName: string;
  quantity?: number;
  unit?: string;
  explicitUnitPrice?: number;
  explicitTotalPrice?: number;
  explicitTaxRate?: number;
  discountPercentage?: number;
  discountAmount?: number;
}

interface RawGeminiResponse {
  invoice?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    dueDays?: number;
    paymentTerms?: string;
    currency?: string;
    currencySymbol?: string;
    notes?: string;
  };
  seller?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  };
  clientQuery?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  };
  items?: RawGeminiInvoiceItem[];
  taxOverride?: number;
  discountPercentage?: number;
  discountAmount?: number;
}

/** Narrows an unknown JSON value down to the raw Gemini response shape we expect. */
const isRawGeminiResponse = (value: unknown): value is RawGeminiResponse =>
  typeof value === "object" && value !== null && Array.isArray((value as RawGeminiResponse).items);

/**
 * Resolves a line item's unit price: prefer an explicit per-unit price; if
 * only a total was given, derive the unit price the same way the heuristic
 * parser does (total / quantity).
 */
const resolveUnitPrice = (
  item: RawGeminiInvoiceItem,
  quantity: number,
): number | undefined => {
  if (item.explicitUnitPrice !== undefined && item.explicitUnitPrice > 0) {
    return item.explicitUnitPrice;
  }
  if (item.explicitTotalPrice !== undefined && item.explicitTotalPrice > 0) {
    return quantity > 0 ? item.explicitTotalPrice / quantity : item.explicitTotalPrice;
  }
  return undefined;
};

/**
 * Maps Gemini's raw (nested) JSON response onto the flat `ExtractedEntities`
 * shape the rest of the app consumes.
 *
 * Known, intentional gaps (flagged here rather than silently handled):
 * - Per-item `discountPercentage` / `discountAmount` are extracted by the
 *   model but dropped here — `InvoiceItem` / the invoice engine have no
 *   concept of a per-line discount yet, only a single invoice-level one.
 * - A top-level absolute `discountAmount` (as opposed to a percentage) is
 *   also dropped for the same reason — `ExtractedEntities` only carries
 *   `discountPercentage`.
 * - `seller` (business profile overrides) and the contact fields on
 *   `clientQuery` (email/phone/address/taxId) are extracted by the model but
 *   not applied — `ragService.getBusinessProfile()` always returns the
 *   fixed default profile, and unmatched clients get a synthesized
 *   placeholder address/email rather than what the user actually typed.
 *   Wiring these through is a larger change to `ragService`/`invoiceEngine`
 *   and is left as a follow-up.
 *
 * Throws if the payload doesn't even have an `items` array, so the caller's
 * existing fallback-to-heuristic logic kicks in on malformed responses.
 */
export function normalizeGeminiResponse(raw: unknown): ExtractedEntities {
  if (!isRawGeminiResponse(raw)) {
    throw new Error("Gemini response did not match the expected schema (missing items array)");
  }

  const items: ExtractedEntities["items"] = (raw.items ?? []).map((item) => {
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    return {
      queryName: item.queryName,
      quantity,
      explicitUnitPrice: resolveUnitPrice(item, quantity),
      explicitTaxRate: item.explicitTaxRate,
    };
  });

  return {
    clientQuery: raw.clientQuery?.name?.trim() || undefined,
    items,
    currency: raw.invoice?.currency,
    currencySymbol: raw.invoice?.currencySymbol,
    taxOverride: raw.taxOverride,
    discountPercentage: raw.discountPercentage,
    dueDays: raw.invoice?.dueDays,
  };
}
