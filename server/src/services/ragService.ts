import {
  DEFAULT_BUSINESS_PROFILE,
  MOCK_CATALOG,
  MOCK_CLIENTS,
} from "../data/knowledgeBase.js";
import type { BusinessProfile, CatalogItem, ClientRecord } from "../types.js";

export class RagService {
  /**
   * Retrieves the sender's business profile.
   */
  public getBusinessProfile(): BusinessProfile {
    return DEFAULT_BUSINESS_PROFILE;
  }

  /**
   * Matches a client from the knowledge base directory.
   * If not found, constructs a new client entity from the query.
   */
  public matchClient(query?: string): {
    client: ClientRecord;
    isMatched: boolean;
    source: "rag_client" | "explicit_prompt" | "default_inferred";
  } {
    if (!query || query.trim() === "") {
      return {
        client: MOCK_CLIENTS[0],
        isMatched: true,
        source: "default_inferred",
      };
    }

    const cleanQuery = query.toLowerCase().trim();

    // 1. Direct match by companyName or name
    const matched = MOCK_CLIENTS.find((c) => {
      const company = c.companyName.toLowerCase();
      const name = c.name.toLowerCase();
      return (
        company.includes(cleanQuery) ||
        cleanQuery.includes(company) ||
        name.includes(cleanQuery)
      );
    });

    if (matched) {
      return { client: matched, isMatched: true, source: "rag_client" };
    }

    // 2. Token-level matching (e.g. "ABC" matches "ABC Ltd")
    const queryTokens = cleanQuery.split(/\s+/);
    const tokenMatched = MOCK_CLIENTS.find((c) => {
      const companyTokens = c.companyName.toLowerCase().split(/\s+/);
      return queryTokens.some(
        (t) => t.length > 2 && companyTokens.some((ct) => ct === t),
      );
    });

    if (tokenMatched) {
      return { client: tokenMatched, isMatched: true, source: "rag_client" };
    }

    // 3. Fallback: synthesize new client record from explicit prompt
    const formattedName = query
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const sanitizedEmail = formattedName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return {
      client: {
        id: `client-${Date.now()}`,
        name: formattedName,
        companyName: formattedName,
        email: `contact@${sanitizedEmail || "client"}.com`,
        address: "Client Business Address, Commercial District",
        taxId: "GSTIN-PENDING",
      },
      isMatched: false,
      source: "explicit_prompt",
    };
  }

  /**
   * Matches an item query against the service/product catalog.
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
    priceSource: "explicit_prompt" | "rag_catalog" | "default_inferred";
  } {
    const cleanQuery = queryName.toLowerCase().trim();

    // Look for keyword matches in catalog
    const matchedCatalog = MOCK_CATALOG.find((cat) => {
      if (cat.name.toLowerCase().includes(cleanQuery)) return true;
      return cat.keywords.some(
        (kw) => cleanQuery.includes(kw) || kw.includes(cleanQuery),
      );
    });

    if (matchedCatalog) {
      const isExplicitPrice = explicitPrice !== undefined && explicitPrice > 0;
      return {
        name: matchedCatalog.name,
        unitPrice: isExplicitPrice ? explicitPrice! : matchedCatalog.unitPrice,
        taxRate:
          explicitTaxRate !== undefined
            ? explicitTaxRate
            : matchedCatalog.defaultTaxRate,
        hsnSacCode: matchedCatalog.hsnSacCode,
        fromCatalog: true,
        priceSource: isExplicitPrice ? "explicit_prompt" : "rag_catalog",
      };
    }

    // Fallback: title-case the query name
    const formattedName = cleanQuery
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const hasExplicitPrice = explicitPrice !== undefined && explicitPrice > 0;

    return {
      name: formattedName || "Custom Professional Service",
      unitPrice: hasExplicitPrice ? explicitPrice! : 2500,
      taxRate: explicitTaxRate !== undefined ? explicitTaxRate : 18,
      hsnSacCode: "998311",
      fromCatalog: false,
      priceSource: hasExplicitPrice ? "explicit_prompt" : "default_inferred",
    };
  }
}

export const ragService = new RagService();
