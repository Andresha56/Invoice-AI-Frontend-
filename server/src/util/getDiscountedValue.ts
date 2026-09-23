import { DISCOUNT_PERCENT_PATTERN, MAX_DISCOUNT_PERCENTAGE, MIN_DISCOUNT_PERCENTAGE } from "../constant/index.js";
import { ExtractedEntities, InvoiceAddons } from "../types.js";


const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);


export const resolveDiscountPercentage = (
  entities: ExtractedEntities,
  addons: InvoiceAddons,
): number => {
  let discountPercentage = entities.discountPercentage || 0;

  const match = addons.discount?.match(DISCOUNT_PERCENT_PATTERN);
  if (match) {
    discountPercentage = parseFloat(match[1]);
  }

  return clamp(discountPercentage, MIN_DISCOUNT_PERCENTAGE, MAX_DISCOUNT_PERCENTAGE);
};