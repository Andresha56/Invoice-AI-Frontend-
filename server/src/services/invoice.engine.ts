import { ragService } from "./ragService.js";
import {DEFAULT_DUE_DAYS,DEFAULT_CURRENCY,DEFAULT_CURRENCY_SYMBOL} from "../constant/index.js"
import type {
  ExtractedEntities,
  InferenceDetail,
  Invoice,
  InvoiceAddons,
  InvoiceItem,
  MissingFieldInfo,
} from "../types.js";
import { numberToWords } from "../util/numberToWords.js";
import { buildPriceInference } from "../util/buildPriceInference.js";
import { isInCatalog } from "../util/isInCatalog.js";
import { buildClientInference } from "../util/buildClientInference.js";
import { roundToTwo } from "../util/roundToTwo.js";
import { buildTaxInference } from "../util/buildTaxInference.js";
import { buildDueDateInference } from "../util/buildDueDateInference.js";
import { buildCurrencyInference } from "../util/buildCurrencyInference.js";
import { nextInvoiceNumber } from "../util/getNextInvoiceNumber.js";


type InvoiceSource = "llm" | "heuristic";

const toDateString = (date: Date): string => date.toISOString().split("T")[0];

/**
 * Checks for missing mandatory invoice details.
 */
export const checkMissingDetails = (
  entities: ExtractedEntities,
): MissingFieldInfo[] => {
  const missing: MissingFieldInfo[] = [];

  // 1. Mandatory client check
  if (!entities.clientQuery || entities.clientQuery.trim() === "") {
    missing.push({
      field: "client",
      label: "Client / Company Name",
      message:
        "Specify who this invoice is billed to (e.g. 'for ABC Ltd' or 'to Acme Corp').",
      quickSuggestions: ["for ABC Ltd", "for Acme Corp", "for Infosys"],
    });
  }

  // 2. Mandatory items & price check
  if (!entities.items || entities.items.length === 0) {
    missing.push({
      field: "item",
      label: "Service / Product",
      message: "Specify what service or product you are invoicing for.",
      quickSuggestions: [
        "for 2 logo designs",
        "for Website Development",
        "for SEO Audit",
      ],
    });
  } else {
    // An item is "unpriced" if it has no explicit price AND isn't in the catalog
    const hasUnpricedNovelItem = entities.items.some((item) => {
      if (item.explicitUnitPrice !== undefined && item.explicitUnitPrice > 0) {
        return false;
      }
      return !isInCatalog(item.queryName);
    });

    if (hasUnpricedNovelItem) {
      missing.push({
        field: "price",
        label: "Item Price / Rate",
        message:
          "Custom service not found in your catalog. Please state a price (e.g. 'at ₹5,000 each').",
        quickSuggestions: [
          "at ₹5,000 each",
          "at ₹15,000 each",
          "at ₹25,000 each",
        ],
      });
    }
  }

  return missing;
};

/**
 * Assembles a complete, mathematically verified invoice with explicit vs
 * inferred telemetry.
 */
export const assembleInvoice = (
  entities: ExtractedEntities,
  addons: InvoiceAddons = {},
  source: InvoiceSource,
): Invoice => {
  const business = ragService.getBusinessProfile();
  const {
    client,
    isMatched: clientMatched,
    source: clientSource,
  } = ragService.matchClient(entities.clientQuery);

  const currencySymbol = entities.currencySymbol || DEFAULT_CURRENCY_SYMBOL;
  const inferences: InferenceDetail[] = [];
  let ragEnrichedItems = 0;

  // Client inference
  inferences.push(buildClientInference(client, clientSource));

  // Line items through RAG catalog matcher
  const items: InvoiceItem[] = entities.items.map((rawItem, idx) => {
    const catalogResult = ragService.matchCatalogItem(
      rawItem.queryName,
      rawItem.explicitUnitPrice,
      rawItem.explicitTaxRate ?? entities.taxOverride,
    );

    if (catalogResult.fromCatalog) {
      ragEnrichedItems++;
    }

    const quantity = Math.max(1, rawItem.quantity || 1);
    const unitPrice = catalogResult.unitPrice;
    const lineTotal = roundToTwo(quantity * unitPrice);
    const taxRate = catalogResult.taxRate;
    const taxAmount = roundToTwo(lineTotal * (taxRate / 100));

    inferences.push(buildPriceInference(idx, catalogResult, currencySymbol));

    return {
      id: `item-${idx + 1}`,
      description: catalogResult.name,
      hsnSacCode: catalogResult.hsnSacCode,
      quantity,
      unitPrice,
      taxRate,
      taxAmount,
      total: lineTotal,
      fromCatalog: catalogResult.fromCatalog,
      priceSource: catalogResult.priceSource,
    };
  });

  // Tax, payment terms and currency inferences
  inferences.push(
    buildTaxInference(entities.taxOverride),
    buildDueDateInference(entities.dueDays),
    buildCurrencyInference(entities.currency, entities.currencySymbol),
  );

  // Subtotal
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);

  // Discount
  let discountPercentage = entities.discountPercentage || 0;
  if (addons.discount) {
    const match = addons.discount.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      discountPercentage = parseFloat(match[1]);
    }
  }
  const discountAmount = roundToTwo(subtotal * (discountPercentage / 100));
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Tax total (discount distributed proportionally across line items)
  const taxTotal = roundToTwo(
    items.reduce((acc, item) => {
      const itemTaxable =
        item.total - (item.total / (subtotal || 1)) * discountAmount;
      return acc + itemTaxable * (item.taxRate / 100);
    }, 0),
  );

  // Grand total
  const grandTotal = roundToTwo(taxableAmount + taxTotal);

  // Dates
  const today = new Date();
  const dueDays = entities.dueDays || DEFAULT_DUE_DAYS;
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + dueDays);

  const currency = entities.currency || DEFAULT_CURRENCY;

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber: nextInvoiceNumber(today),
    date: toDateString(today),
    dueDate: toDateString(dueDate),
    currency,
    currencySymbol,
    sender: business,
    client,
    items,
    subtotal,
    discountAmount,
    discountPercentage,
    taxTotal,
    grandTotal,
    amountInWords: numberToWords(grandTotal, currency),
    addons,
    notes: addons.notes || business.defaultNotes,
    terms: addons.terms || business.defaultTerms.join("\n"),
    inferences,
    metadata: {
      generatedWith: source,
      ragEnrichedItems,
      clientMatched,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Backwards-compatible facade so existing call sites like
 * `invoiceEngine.assembleInvoice(...)` keep working unchanged.
 */
export const invoiceEngine = {
  checkMissingDetails,
  assembleInvoice,
} as const;

