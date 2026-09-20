// ============================================================================
// INVOICE SCHEMA — the single source of truth for your app
// ============================================================================
// Design philosophy:
//   1. CORE fields  -> strict, typed, used by 90% of invoices, safe to build
//                      fixed UI around (tables, totals, layout).
//   2. MUST-HAVE    -> the extras you explicitly asked for (logo, QR,
//      EXTRAS         signature, stamp, bank details, discount, T&C, notes).
//                      Strict shape, but every field is optional since not
//                      every invoice/business uses all of them.
//   3. CUSTOM       -> the escape hatch. Anything the AI extracts from user
//      FIELDS          text that doesn't map to a known field lands here as
//                      {label, value} pairs — never silently dropped.
// ============================================================================

// ---------------------------------------------------------------------------
// Shared primitives

/** ISO-8601 date string, e.g. "2026-09-19" */
export type ISODateString = string;

/** 3-letter ISO 4217 currency code, e.g. "USD", "INR", "EUR" */
export type CurrencyCode = string;

/** Base64 data-URI or a hosted URL — your renderer should accept both */
export type ImageSource = string;

export type DiscountType = "percentage" | "fixed";
export type TaxType = "percentage" | "fixed";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

// ---------------------------------------------------------------------------
// Party (used for both "from" / company and "to" / client, and optional
// "ship to" / "bill to" if they differ)
// ---------------------------------------------------------------------------

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Party {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;

  /** Tax registration numbers — GST, VAT, EIN, PAN, etc. Kept generic since
   *  the required tax-ID label/format varies wildly by country. */
  taxIds?: { label: string; value: string }[];
}

// ---------------------------------------------------------------------------
// Line items
// ---------------------------------------------------------------------------

export interface LineItem {
  id: string; // stable client-side id (uuid) for React keys / editing
  description: string;
  quantity: number;
  unit?: string; // "hrs", "pcs", "kg", "days"...
  rate: number; // price per unit, before discount/tax
  discount?: {
    type: DiscountType;
    value: number; // 10 (=10%) or 10 (=$10) depending on type
  };
  tax?: {
    type: TaxType;
    value: number; // 18 (=18%) or 18 (=$18)
    label?: string; // "GST", "VAT", "Sales Tax"
  };
  amount: number; // computed: final line total, always present for display

  /** Anything about THIS line item that doesn't fit above — e.g. "Batch #",
   *  "HSN/SAC code", "Serial number". Same escape-hatch pattern as the
   *  invoice-level customFields. */
  customFields?: CustomField[];
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface BankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string; // US
  ifscCode?: string; // India
  swiftCode?: string; // international
  iban?: string; // Europe/int'l
  branch?: string;
}

export interface PaymentLink {
  label: string; // "Pay with Stripe", "Pay with UPI"
  url: string;
}

export interface PaymentInfo {
  bankDetails?: BankDetails;
  paymentLinks?: PaymentLink[];
  acceptedMethods?: string[]; // ["Bank Transfer", "UPI", "Card", "Cash"]
  /** QR code for payment (UPI QR, PayPal.me QR, crypto address QR, etc.) */
  qrCode?: {
    image: ImageSource;
    label?: string; // "Scan to pay via UPI"
  };
}

// ---------------------------------------------------------------------------
// Branding / sign-off (your "must have" list)
// ---------------------------------------------------------------------------

export interface Branding {
  companyLogo?: ImageSource;
  companyStamp?: ImageSource; // seal/stamp image
  brandColor?: string; // hex, for accent styling in the rendered template
}

export interface SignOff {
  signatureImage?: ImageSource; // drawn/uploaded signature
  signedBy?: string; // name under the signature
  signedTitle?: string; // "Founder", "Accounts Manager"
  signedDate?: ISODateString;
}

// ---------------------------------------------------------------------------
// Totals — computed server-side/client-side, but shipped in the JSON so the
// renderer never has to re-derive math (and so you can validate AI output
// against your own recomputation).
// ---------------------------------------------------------------------------

export interface Totals {
  subtotal: number; // sum of line item amounts before invoice-level discount/tax
  discountTotal?: number;
  taxTotal?: number;
  shippingCost?: number;
  roundOff?: number;
  grandTotal: number;
  amountPaid?: number;
  amountDue?: number; // grandTotal - amountPaid
  currency: CurrencyCode;
}

/** Invoice-level discount/tax (as opposed to per-line-item) */
export interface AdjustmentLine {
  label: string; // "Early bird discount", "Service Tax"
  type: DiscountType | TaxType;
  value: number;
}

// ---------------------------------------------------------------------------
// The escape hatch — CUSTOM FIELDS
// ---------------------------------------------------------------------------

export interface CustomField {
  label: string;
  value: string;
  /** Optional — lets the AI flag fields it wasn't fully confident mapping,
   *  so your UI can highlight them for user review before finalizing. */
  confidence?: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// THE INVOICE
// ---------------------------------------------------------------------------

export interface Invoice {
  // --- identity -------------------------------------------------------
  invoiceNumber: string;
  invoiceDate: ISODateString;
  dueDate?: ISODateString;
  status?: InvoiceStatus;
  poNumber?: string; // purchase order number, common enough to be core
  referenceNumber?: string;

  // --- parties ---------------------------------------------------------
  from: Party; // your company / the sender
  to: Party; // the client / bill-to
  shipTo?: Party; // optional, only if different from "to"

  // --- branding + sign-off (must-haves) --------------------------------
  branding?: Branding;
  signOff?: SignOff;

  // --- content -----------------------------------------------------------
  lineItems: LineItem[];
  adjustments?: AdjustmentLine[]; // invoice-level discounts/extra taxes
  totals: Totals;

  // --- payments (must-have: bank details, QR) ---------------------------
  payment?: PaymentInfo;

  // --- boilerplate text (must-haves) -------------------------------------
  notes?: string; // "Thank you for your business!"
  termsAndConditions?: string;
  privateInternalNotes?: string; // never rendered on client-facing PDF

  // --- misc / recurring ---------------------------------------------------
  language?: string; // "en", "hi" — for i18n rendering
  isRecurring?: boolean;
  recurrenceRule?: string; // e.g. "monthly", or an RRULE string

  // --- the escape hatch ----------------------------------------------------
  /** Anything the user's free text mentioned that doesn't map to a field
   *  above — e.g. "Project Code", "Warranty period", "Delivery instructions".
   *  Always populate this instead of dropping data or inventing new
   *  top-level fields. Rendered as a generic key-value block in the UI. */
  customFields?: CustomField[];

  // --- metadata (not user-facing, useful for your app) ---------------------
  meta?: {
    createdAt?: string;
    updatedAt?: string;
    templateId?: string; // which visual template to render with
    aiParsingNotes?: string; // model can leave itself a note, e.g.
    // "assumed USD since no currency was specified"
  };
}

// ---------------------------------------------------------------------------
// Prompting contract (put this in your system prompt, not just as a comment)
// ---------------------------------------------------------------------------
// 1. Extract known fields into their designated schema slots.
// 2. Never invent data. If a required-looking field (currency, due date) is
//    missing, omit it — do not guess silently. Optionally add a note in
//    meta.aiParsingNotes if you made an assumption (e.g. default currency).
// 3. Anything you can't map -> customFields as {label, value}.
// 4. Always compute totals honestly from lineItems; don't ask the AI to
//    "trust" a user-stated total — recompute and flag a mismatch instead.
// 4b. Recommended validation flow: AI returns Invoice JSON -> your code
//     recomputes totals from lineItems -> if recomputed totals differ from
//     totals.grandTotal by more than a rounding tolerance, flag it in the UI
//     (don't silently overwrite either value).
// 5. Use tool-use/function-calling (Claude) or Structured Outputs (OpenAI)
//    with this exact shape as the schema, so malformed JSON is impossible.

// ---------------------------------------------------------------------------
// Example minimal valid invoice (for tests / fixtures)
// ---------------------------------------------------------------------------

export const exampleInvoice: Invoice = {
  invoiceNumber: "INV-2026-001",
  invoiceDate: "2026-09-19",
  dueDate: "2026-10-19",
  from: { name: "Acme Studio", email: "hello@acmestudio.com" },
  to: { name: "Globex Corp", email: "accounts@globex.com" },
  lineItems: [
    {
      id: "li_1",
      description: "Website redesign — Phase 1",
      quantity: 1,
      rate: 45000,
      amount: 45000,
    },
  ],
  totals: {
    subtotal: 45000,
    grandTotal: 45000,
    currency: "INR",
  },
  notes: "Thank you for your business!",
  customFields: [
    { label: "Project Code", value: "GX-2026-14", confidence: "high" },
  ],
};
