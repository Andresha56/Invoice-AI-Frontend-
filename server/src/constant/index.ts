import { MissingFieldInfo } from "../types.js";

export const DEFAULT_DUE_DAYS = 15;
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_CURRENCY_SYMBOL = "₹";
export const DEFAULT_TAX_LABEL = "18% GST";
export const ONES: readonly string[] = [
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



export const TENS: readonly string[] = [
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

export const DISCOUNT_PERCENT_PATTERN = /(\d+(?:\.\d+)?)/;

export const MISSING_FIELD_DEFINITIONS: Record<
  "client" | "item" | "price",
  MissingFieldInfo
> = {
  client: {
    field: "client",
    label: "Client / Company Name",
    message:
      "Specify who this invoice is billed to (e.g. 'for ABC Ltd' or 'to Acme Corp').",
    quickSuggestions: ["for ABC Ltd", "for Acme Corp", "for Infosys"],
  },
  item: {
    field: "item",
    label: "Service / Product",
    message: "Specify what service or product you are invoicing for.",
    quickSuggestions: [
      "for 2 logo designs",
      "for Website Development",
      "for SEO Audit",
    ],
  },
  price: {
    field: "price",
    label: "Item Price / Rate",
    message:
      "Custom service not found in your catalog. Please state a price (e.g. 'at ₹5,000 each').",
    quickSuggestions: [
      "at ₹5,000 each",
      "at ₹15,000 each",
      "at ₹25,000 each",
    ],
  },
};

export type InvoiceSource = "llm" | "heuristic";

export const MIN_DISCOUNT_PERCENTAGE = 0;
export const MAX_DISCOUNT_PERCENTAGE = 100;