import { MOCK_CATALOG } from "../data/knowledgeBase.js";

export const isInCatalog = (queryName: string): boolean => {
  const cleanName = queryName.toLowerCase().trim();
  return MOCK_CATALOG.some(
    (entry) =>
      entry.name.toLowerCase().includes(cleanName) ||
      entry.keywords.some(
        (kw) => cleanName.includes(kw) || kw.includes(cleanName),
      ),
  );
};