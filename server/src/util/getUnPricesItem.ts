import { ExtractedEntities } from "../types.js";
import { isInCatalog } from "./isInCatalog.js";

/**
 * An item is considered "unpriced" (and therefore blocking) when it has no
 * explicit positive unit price supplied by the user AND it cannot be
 * resolved against the business's catalog.
 */
export const isUnpricedNovelItem = (item: ExtractedEntities["items"][number]): boolean => {
  const hasExplicitPrice =
    item.explicitUnitPrice !== undefined && item.explicitUnitPrice > 0;
  if (hasExplicitPrice) return false;
  return !isInCatalog(item.queryName);
};