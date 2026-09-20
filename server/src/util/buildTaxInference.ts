import { DEFAULT_TAX_LABEL } from "../constant/index.js";
import { InferenceDetail } from "../types.js";

export const buildTaxInference = (taxOverride: number | undefined): InferenceDetail =>
  taxOverride !== undefined
    ? {
        field: "tax_rate",
        label: "GST / Tax Rate",
        value: `${taxOverride}%`,
        source: "explicit_prompt",
        explanation: `Explicit tax rate of ${taxOverride}% requested in prompt.`,
      }
    : {
        field: "tax_rate",
        label: "GST / Tax Rate",
        value: DEFAULT_TAX_LABEL,
        source: "default_inferred",
        explanation: `Tax rate not mentioned; applied standard 18% GST service tax rate.`,
      };