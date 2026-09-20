import { DEFAULT_DUE_DAYS } from "../constant/index.js";
import { InferenceDetail } from "../types.js";

export const buildDueDateInference = (
  dueDays: number | undefined,
): InferenceDetail =>
  dueDays && dueDays !== DEFAULT_DUE_DAYS
    ? {
        field: "due_date",
        label: "Payment Due Date",
        value: `${dueDays} Days Terms`,
        source: "explicit_prompt",
        explanation: `Payment terms of ${dueDays} days explicitly requested in prompt.`,
      }
    : {
        field: "due_date",
        label: "Payment Due Date",
        value: "Net-15 (15 Days)",
        source: "default_inferred",
        explanation: `Payment terms not mentioned; defaulted to standard Net-15 days from issue date.`,
      };
