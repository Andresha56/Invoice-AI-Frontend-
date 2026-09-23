import { InvoiceItem } from "../types.js";
import { roundToTwo } from "./roundToTwo.js";


/**
 * Computes total tax owed across all line items, distributing the flat
 * discount proportionally across each line before applying its tax rate.
 */

export const computeTaxTotal = (
  items: readonly InvoiceItem[],
  subtotal: number,
  discountAmount: number,
): number => {
  if (subtotal <= 0) return 0;

  const taxTotal = items.reduce((acc, item) => {
    const itemShareOfDiscount = (item.total / subtotal) * discountAmount;
    const itemTaxableAmount = item.total - itemShareOfDiscount;
    return acc + itemTaxableAmount * (item.taxRate / 100);
  }, 0);

  return roundToTwo(taxTotal);
};