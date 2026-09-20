import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from "../constant/index.js";
import { InferenceDetail } from "../types.js";

export const buildCurrencyInference = (
  currency: string | undefined,
  currencySymbol: string | undefined,
): InferenceDetail =>
  currency
    ? {
        field: "currency",
        label: "Currency",
        value: `${currency} (${currencySymbol || DEFAULT_CURRENCY_SYMBOL})`,
        source: "explicit_prompt",
        explanation: `Currency was detected from prompt symbol or code (${currency}).`,
      }
    : {
        field: "currency",
        label: "Currency",
        value: `${DEFAULT_CURRENCY} (${DEFAULT_CURRENCY_SYMBOL})`,
        source: "default_inferred",
        explanation: `Default workspace currency INR (₹) applied.`,
      };