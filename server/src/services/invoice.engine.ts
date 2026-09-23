import { ragService } from "./ragService.js";
import {
  DEFAULT_DUE_DAYS,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  MISSING_FIELD_DEFINITIONS,
  InvoiceSource,
} from "../constant/index.js";
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
import { buildClientInference } from "../util/buildClientInference.js";
import { roundToTwo } from "../util/roundToTwo.js";
import { buildTaxInference } from "../util/buildTaxInference.js";
import { buildDueDateInference } from "../util/buildDueDateInference.js";
import { buildCurrencyInference } from "../util/buildCurrencyInference.js";
import { nextInvoiceNumber } from "../util/getNextInvoiceNumber.js";
import { resolveDiscountPercentage } from "../util/getDiscountedValue.js";
import { isUnpricedNovelItem } from "../util/getUnPricesItem.js";
import { computeTaxTotal } from "../util/geComputedTotalTax.js";
import { computeDueDate } from "../util/getComputedDueDate.js";


const toDateString = (date: Date): string => date.toISOString().split("T")[0];

export const checkMissingDetails = (
  entities: ExtractedEntities,
): MissingFieldInfo[] => {
  const missing: MissingFieldInfo[] = [];

  if (!entities.clientQuery) {
    missing.push(MISSING_FIELD_DEFINITIONS.client);
  }

  if (!entities.items || entities.items.length === 0) {
    missing.push(MISSING_FIELD_DEFINITIONS.item);
  } else if (entities.items.some(isUnpricedNovelItem)) {
    missing.push(MISSING_FIELD_DEFINITIONS.price);
  }

  return missing;
};

/** Resolves a single extracted line item against the catalog and computes its totals. */
const resolveLineItem = (
  rawItem: ExtractedEntities["items"][number],
  index: number,
  taxOverride: number | undefined,
  currencySymbol: string,
): { item: InvoiceItem; inference: InferenceDetail } => {
  const catalogResult = ragService.matchCatalogItem(
    rawItem.queryName,
    rawItem.explicitUnitPrice,
    rawItem.explicitTaxRate ?? taxOverride,
  );

  const quantity = Math.max(1, rawItem.quantity || 1);
  const unitPrice = catalogResult.unitPrice;
  const lineTotal = roundToTwo(quantity * unitPrice);
  const taxRate = catalogResult.taxRate;
  const taxAmount = roundToTwo(lineTotal * (taxRate / 100));

  const item: InvoiceItem = {
    id: `item-${index + 1}`,
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

  const inference = buildPriceInference(index, catalogResult, currencySymbol);

  return { item, inference };
};

export const assembleInvoice = async (
  entities: ExtractedEntities,
  addons: InvoiceAddons = {},
  source: InvoiceSource,
): Promise<Invoice> => {
  //correct till here 
  const business = ragService.getBusinessProfile();
  const {
    client,
    isMatched: clientMatched,
    source: clientSource,
  } = ragService.matchClient(entities.clientQuery);

  const currencySymbol = entities.currencySymbol || DEFAULT_CURRENCY_SYMBOL;
  const currency = entities.currency || DEFAULT_CURRENCY;
  const dueDays = entities.dueDays || DEFAULT_DUE_DAYS;

  const inferences: InferenceDetail[] = [buildClientInference(client, clientSource)];

  const resolvedItems = entities.items.map((rawItem, idx) =>
    resolveLineItem(rawItem, idx, entities.taxOverride, currencySymbol),
  );
  const items: InvoiceItem[] = resolvedItems.map((r) => r.item);
  const ragEnrichedItems = items.filter((item) => item.fromCatalog).length;

  inferences.push(
    ...resolvedItems.map((r) => r.inference),
    buildTaxInference(entities.taxOverride),
    buildDueDateInference(entities.dueDays),
    buildCurrencyInference(entities.currency, entities.currencySymbol),
  );

  const subtotal = roundToTwo(items.reduce((acc, item) => acc + item.total, 0));

  const discountPercentage = resolveDiscountPercentage(entities, addons);
  const discountAmount = roundToTwo(subtotal * (discountPercentage / 100));
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxTotal = computeTaxTotal(items, subtotal, discountAmount);
  const grandTotal = roundToTwo(taxableAmount + taxTotal);

  const today = new Date();
  const dueDate = computeDueDate(today, dueDays);
  const invoiceNumber = await nextInvoiceNumber(today);

  return {
    id: `inv-${crypto.randomUUID()}`,
    invoiceNumber,
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

