import { ragService } from "../services/ragService.js";
import { InferenceDetail } from "../types.js";
import { formatAmount } from "./formatAmount.js";

type CatalogMatch = ReturnType<typeof ragService.matchCatalogItem>;

export const buildPriceInference = (
  idx: number,
  catalogResult: CatalogMatch,
  currencySymbol: string,
): InferenceDetail => {
  const base = {
    field: `item_${idx + 1}_price`,
    label: `${catalogResult.name} (Rate)`,
    value: formatAmount(catalogResult.unitPrice, currencySymbol),
  };

  if (catalogResult.priceSource === "explicit_prompt") {
    return {
      ...base,
      source: "explicit_prompt",
      explanation: `Unit price was explicitly stated in prompt (${currencySymbol}${catalogResult.unitPrice}).`,
    };
  }

  if (catalogResult.priceSource === "rag_catalog") {
    return {
      ...base,
      source: "rag_catalog",
      explanation: `No price stated in prompt; automatically retrieved standard rate from Service Catalog.`,
    };
  }

  return {
    ...base,
    source: "default_inferred",
    explanation: `Price was missing from prompt and not found in catalog; applied default rate.`,
  };
};
