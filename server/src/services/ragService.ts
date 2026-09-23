import {
  DEFAULT_BUSINESS_PROFILE,
  MOCK_CATALOG,
  MOCK_CLIENTS,
} from "../data/knowledgeBase.js";
import type { BusinessProfile, CatalogItem, ClientRecord } from "../types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum token length considered meaningful for token-level client matching
 *  (filters out noise like "a", "of", "ltd" abbreviated fragments, etc). */
const MIN_MATCH_TOKEN_LENGTH = 2;

const DEFAULT_ITEM_UNIT_PRICE = 2500;
const DEFAULT_ITEM_TAX_RATE = 18;
const DEFAULT_ITEM_HSN_SAC_CODE = "998311";
const DEFAULT_ITEM_NAME = "Custom Professional Service";

const PENDING_TAX_ID = "GSTIN-PENDING";
const DEFAULT_CLIENT_ADDRESS = "Client Business Address, Commercial District";

type ClientMatchSource = "rag_client" | "explicit_prompt" | "default_inferred";
type PriceSource = "explicit_prompt" | "rag_catalog" | "default_inferred";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Converts "acme corp" -> "Acme Corp". */
const toTitleCase = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Derives a placeholder contact email from a display name, e.g. "Acme Corp" -> "contact@acmecorp.com". */
const buildPlaceholderEmail = (displayName: string): string => {
  const sanitized = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `contact@${sanitized || "client"}.com`;
};

export class RagService {
  /**
   * Retrieves the sender's business profile.
   */
  public getBusinessProfile(): BusinessProfile {
    return DEFAULT_BUSINESS_PROFILE;
  }

  /**
   * Matches a client from the knowledge base directory by, in order:
   * 1. Direct substring match on company/contact name.
   * 2. Token-level match (e.g. "ABC" matches "ABC Ltd").
   * 3. Falling back to a synthesized client record built from the raw query.
   *
   * If no query is supplied at all, defaults to the first known client.
   */
  public matchClient(query?: string): {
    client: ClientRecord;
    isMatched: boolean;
    source: ClientMatchSource;
  } {
    if (!query || !query.trim()) {
      return {
        client: MOCK_CLIENTS[0],
        isMatched: true,
        source: "default_inferred",
      };
    }

    const cleanQuery = query.toLowerCase().trim();

    // 1. Direct match by companyName or name
    const directMatch = MOCK_CLIENTS.find((c) => {
      const company = c.companyName.toLowerCase();
      const name = c.name.toLowerCase();
      return (
        company.includes(cleanQuery) ||
        cleanQuery.includes(company) ||
        name.includes(cleanQuery)
      );
    });

    if (directMatch) {
      return { client: directMatch, isMatched: true, source: "rag_client" };
    }

    // 2. Token-level matching (e.g. "ABC" matches "ABC Ltd")
    const queryTokens = cleanQuery.split(/\s+/);
    const tokenMatch = MOCK_CLIENTS.find((c) => {
      const companyTokens = c.companyName.toLowerCase().split(/\s+/);
      return queryTokens.some(
        (token) =>
          token.length > MIN_MATCH_TOKEN_LENGTH &&
          companyTokens.includes(token),
      );
    });

    if (tokenMatch) {
      return { client: tokenMatch, isMatched: true, source: "rag_client" };
    }

    // 3. Fallback: synthesize a new client record from the explicit prompt
    const formattedName = toTitleCase(query);

    return {
      client: {
        id: `client-${crypto.randomUUID()}`,
        name: formattedName,
        companyName: formattedName,
        email: buildPlaceholderEmail(formattedName),
        address: DEFAULT_CLIENT_ADDRESS,
        taxId: PENDING_TAX_ID,
      },
      isMatched: false,
      source: "explicit_prompt",
    };
  }

  /**
   * Matches an item query against the service/product catalog by name or
   * keyword. Falls back to a synthesized custom-item entry when nothing in
   * the catalog matches. An explicit price/tax rate, when provided, always
   * takes precedence over the catalog's or the default's values.
   */
  public matchCatalogItem(
    queryName: string,
    explicitPrice?: number,
    explicitTaxRate?: number,
  ): {
    name: string;
    unitPrice: number;
    taxRate: number;
    hsnSacCode?: string;
    fromCatalog: boolean;
    priceSource: PriceSource;
  } {
    const cleanQuery = queryName.toLowerCase().trim();
    const hasExplicitPrice = explicitPrice !== undefined && explicitPrice > 0;

    const matchedCatalogItem = this.findCatalogMatch(cleanQuery);

    if (matchedCatalogItem) {
      return {
        name: matchedCatalogItem.name,
        unitPrice: hasExplicitPrice ? explicitPrice! : matchedCatalogItem.unitPrice,
        taxRate: explicitTaxRate ?? matchedCatalogItem.defaultTaxRate,
        hsnSacCode: matchedCatalogItem.hsnSacCode,
        fromCatalog: true,
        priceSource: hasExplicitPrice ? "explicit_prompt" : "rag_catalog",
      };
    }

    // Fallback: title-case the query name into a custom line item
    const formattedName = toTitleCase(cleanQuery);

    return {
      name: formattedName || DEFAULT_ITEM_NAME,
      unitPrice: hasExplicitPrice ? explicitPrice! : DEFAULT_ITEM_UNIT_PRICE,
      taxRate: explicitTaxRate ?? DEFAULT_ITEM_TAX_RATE,
      hsnSacCode: DEFAULT_ITEM_HSN_SAC_CODE,
      fromCatalog: false,
      priceSource: hasExplicitPrice ? "explicit_prompt" : "default_inferred",
    };
  }

  /** Finds a catalog entry whose name or keywords overlap with the query. */
  private findCatalogMatch(cleanQuery: string): CatalogItem | undefined {
    return MOCK_CATALOG.find((cat) => {
      if (cat.name.toLowerCase().includes(cleanQuery)) return true;
      return cat.keywords.some(
        (keyword) => cleanQuery.includes(keyword) || keyword.includes(cleanQuery),
      );
    });
  }
}

export const ragService = new RagService();