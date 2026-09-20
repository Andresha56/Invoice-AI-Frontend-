import { MOCK_CATALOG } from "../data/knowledgeBase.js";
import {
  getBusinessProfile,
  matchCatalogItem,
  matchClient,
} from "./ragService.js";
import type {
  ExtractedEntities,
  InferenceDetail,
  Invoice,
  InvoiceAddons,
  InvoiceItem,
  MissingFieldInfo,
} from "../types.js";

let invoiceCounter = 1001;

/**
 * Checks for missing mandatory invoice details.
 */
export function checkMissingDetails(
  entities: ExtractedEntities,
): MissingFieldInfo[] {
  const missing: MissingFieldInfo[] = [];

  // 1. Mandatory Client Check
  if (!entities.clientQuery || entities.clientQuery.trim() === "") {
    missing.push({
      field: "client",
      label: "Client / Company Name",
      message:
        "Specify who this invoice is billed to (e.g. 'for ABC Ltd' or 'to Acme Corp').",
      quickSuggestions: ["for ABC Ltd", "for Acme Corp", "for Infosys"],
    });
  }

  // 2. Mandatory Items & Price Check
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
    // Check if any item lacks both explicit price AND catalog price
    const hasUnpricedNovelItem = entities.items.some((it) => {
      if (it.explicitUnitPrice !== undefined && it.explicitUnitPrice > 0) {
        return false;
      }
      const cleanName = it.queryName.toLowerCase().trim();
      const inCatalog = MOCK_CATALOG.some(
        (c) =>
          c.name.toLowerCase().includes(cleanName) ||
          c.keywords.some(
            (kw) => cleanName.includes(kw) || kw.includes(cleanName),
          ),
      );
      return !inCatalog;
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
}

/**
 * Converts a numeric amount into words (supports INR and other currencies).
 */
export function numberToWords(num: number, currency: string): string {
  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertThousands(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return `${b[Math.floor(n / 10)]} ${a[n % 10]}`.trim();
    return `${a[Math.floor(n / 100)]} Hundred ${convertThousands(n % 100)}`.trim();
  }

  let result = "";
  if (rounded >= 10000000) {
    result += `${convertThousands(Math.floor(rounded / 10000000))} Crore `;
  }
  if (rounded % 10000000 >= 100000) {
    result += `${convertThousands(Math.floor((rounded % 10000000) / 100000))} Lakh `;
  }
  if (rounded % 100000 >= 1000) {
    result += `${convertThousands(Math.floor((rounded % 100000) / 1000))} Thousand `;
  }
  if (rounded % 1000 > 0) {
    result += convertThousands(rounded % 1000);
  }

  const currencyWord = currency === "INR" ? "Rupees" : "Dollars";
  return `${result.trim()} ${currencyWord} Only`;
}

/**
 * Assembles a complete, mathematically verified invoice with explicit vs inferred telemetry.
 */
export function assembleInvoice(
  entities: ExtractedEntities,
  addons: InvoiceAddons = {},
  source: "llm" | "heuristic",
): Invoice {
  const business = getBusinessProfile();
  const {
    client,
    isMatched: clientMatched,
    source: clientSource,
  } = matchClient(entities.clientQuery);

  const inferences: InferenceDetail[] = [];
  let ragEnrichedItems = 0;

  // Record Client Inference
  if (clientSource === "rag_client") {
    inferences.push({
      field: "client",
      label: "Client Details",
      value: `${client.companyName} (${client.taxId || "Tax ID verified"})`,
      source: "rag_client",
      explanation: `Matched '${client.companyName}' from Customer Directory with registered GSTIN and address.`,
    });
  } else if (clientSource === "explicit_prompt") {
    inferences.push({
      field: "client",
      label: "Client Details",
      value: client.companyName,
      source: "explicit_prompt",
      explanation: `Extracted '${client.companyName}' from prompt; created new draft client record.`,
    });
  } else {
    inferences.push({
      field: "client",
      label: "Client Details",
      value: `${client.companyName} (Default)`,
      source: "default_inferred",
      explanation: `Client was not mentioned in the prompt; defaulted to primary account '${client.companyName}'.`,
    });
  }

  // Process line items through RAG catalog matcher
  const items: InvoiceItem[] = entities.items.map((rawItem, idx) => {
    const catalogResult = matchCatalogItem(
      rawItem.queryName,
      rawItem.explicitUnitPrice,
      rawItem.explicitTaxRate ?? entities.taxOverride,
    );

    if (catalogResult.fromCatalog) {
      ragEnrichedItems++;
    }

    const quantity = Math.max(1, rawItem.quantity || 1);
    const unitPrice = catalogResult.unitPrice;
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    const taxRate = catalogResult.taxRate;
    const taxAmount = Math.round(lineTotal * (taxRate / 100) * 100) / 100;

    // Record pricing inference for this item
    if (catalogResult.priceSource === "explicit_prompt") {
      inferences.push({
        field: `item_${idx + 1}_price`,
        label: `${catalogResult.name} (Rate)`,
        value: `${entities.currencySymbol || "₹"}${unitPrice.toLocaleString("en-IN")}`,
        source: "explicit_prompt",
        explanation: `Unit price was explicitly stated in prompt (${entities.currencySymbol || "₹"}${unitPrice}).`,
      });
    } else if (catalogResult.priceSource === "rag_catalog") {
      inferences.push({
        field: `item_${idx + 1}_price`,
        label: `${catalogResult.name} (Rate)`,
        value: `${entities.currencySymbol || "₹"}${unitPrice.toLocaleString("en-IN")}`,
        source: "rag_catalog",
        explanation: `No price stated in prompt; automatically retrieved standard rate from Service Catalog.`,
      });
    } else {
      inferences.push({
        field: `item_${idx + 1}_price`,
        label: `${catalogResult.name} (Rate)`,
        value: `${entities.currencySymbol || "₹"}${unitPrice.toLocaleString("en-IN")}`,
        source: "default_inferred",
        explanation: `Price was missing from prompt and not found in catalog; applied default rate.`,
      });
    }

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

  // Record Tax Inference
  if (entities.taxOverride !== undefined) {
    inferences.push({
      field: "tax_rate",
      label: "GST / Tax Rate",
      value: `${entities.taxOverride}%`,
      source: "explicit_prompt",
      explanation: `Explicit tax rate of ${entities.taxOverride}% requested in prompt.`,
    });
  } else {
    inferences.push({
      field: "tax_rate",
      label: "GST / Tax Rate",
      value: "18% GST",
      source: "default_inferred",
      explanation: `Tax rate not mentioned; applied standard 18% GST service tax rate.`,
    });
  }

  // Record Payment Terms Inference
  if (entities.dueDays && entities.dueDays !== 15) {
    inferences.push({
      field: "due_date",
      label: "Payment Due Date",
      value: `${entities.dueDays} Days Terms`,
      source: "explicit_prompt",
      explanation: `Payment terms of ${entities.dueDays} days explicitly requested in prompt.`,
    });
  } else {
    inferences.push({
      field: "due_date",
      label: "Payment Due Date",
      value: "Net-15 (15 Days)",
      source: "default_inferred",
      explanation: `Payment terms not mentioned; defaulted to standard Net-15 days from issue date.`,
    });
  }

  // Record Currency Inference
  if (entities.currency) {
    inferences.push({
      field: "currency",
      label: "Currency",
      value: `${entities.currency} (${entities.currencySymbol || "₹"})`,
      source: "explicit_prompt",
      explanation: `Currency was detected from prompt symbol or code (${entities.currency}).`,
    });
  } else {
    inferences.push({
      field: "currency",
      label: "Currency",
      value: "INR (₹)",
      source: "default_inferred",
      explanation: `Default workspace currency INR (₹) applied.`,
    });
  }

  // Subtotal
  const subtotal = items.reduce((acc, it) => acc + it.total, 0);

  // Discount
  let discountPercentage = entities.discountPercentage || 0;
  if (addons.discount) {
    const match = addons.discount.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      discountPercentage = parseFloat(match[1]);
    }
  }
  const discountAmount =
    Math.round(subtotal * (discountPercentage / 100) * 100) / 100;

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Tax Total
  const taxTotal =
    Math.round(
      items.reduce((acc, it) => {
        const itemTaxable =
          it.total - (it.total / (subtotal || 1)) * discountAmount;
        return acc + itemTaxable * (it.taxRate / 100);
      }, 0) * 100,
    ) / 100;

  // Grand Total
  const grandTotal = Math.round((taxableAmount + taxTotal) * 100) / 100;

  // Dates
  const today = new Date();
  const issueDateStr = today.toISOString().split("T")[0];

  const dueDays = entities.dueDays || 15;
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + dueDays);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const invoiceNumber = `INV-${today.getFullYear()}-${invoiceCounter++}`;

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    date: issueDateStr,
    dueDate: dueDateStr,
    currency: entities.currency || "INR",
    currencySymbol: entities.currencySymbol || "₹",
    sender: business,
    client,
    items,
    subtotal,
    discountAmount,
    discountPercentage,
    taxTotal,
    grandTotal,
    amountInWords: numberToWords(grandTotal, entities.currency || "INR"),
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
}

export const invoiceEngine = {
  checkMissingDetails,
  assembleInvoice,
  numberToWords,
};
