import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MOCK_CATALOG, MOCK_CLIENTS } from "../data/knowledgeBase.js";
import type { ExtractedEntities } from "../types.js";

/**
 * Returns an initialized GoogleGenerativeAI client if GEMINI_API_KEY is present.
 */
function getAiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    return new GoogleGenerativeAI(apiKey);
  }
  return null;
}

/**
 * Lightweight Gemini entity extractor.
 * Takes minimal tokens (~50 tokens output) with strictly typed schema.
 */
export async function extractWithGemini(
  prompt: string,
): Promise<ExtractedEntities> {
  const aiClient = getAiClient();
  if (!aiClient) {
    throw new Error("AI Client not initialized");
  }

  const model = aiClient.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          clientQuery: {
            type: SchemaType.STRING,
            description:
              "Name of the client or company being billed (e.g. ABC Ltd, Acme)",
          },
          items: {
            type: SchemaType.ARRAY,
            description: "Line items or services mentioned",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                queryName: {
                  type: SchemaType.STRING,
                  description: "Name or description of the product/service",
                },
                quantity: {
                  type: SchemaType.NUMBER,
                  description:
                    "Quantity/count of the item. Defaults to 1 if not specified.",
                },
                explicitUnitPrice: {
                  type: SchemaType.NUMBER,
                  description: "Unit price per item if stated, otherwise omit.",
                },
                explicitTaxRate: {
                  type: SchemaType.NUMBER,
                  description:
                    "Tax rate for this item if stated (e.g. 18 for 18%).",
                },
              },
              required: ["queryName", "quantity"],
            },
          },
          currency: {
            type: SchemaType.STRING,
            description: "Currency code (e.g. INR, USD, EUR, GBP)",
          },
          currencySymbol: {
            type: SchemaType.STRING,
            description: "Currency symbol (e.g. ₹, $, €, £)",
          },
          taxOverride: {
            type: SchemaType.NUMBER,
            description: "Overall GST or tax percentage mentioned (e.g. 18)",
          },
          discountPercentage: {
            type: SchemaType.NUMBER,
            description: "Discount percentage if mentioned (e.g. 10)",
          },
          dueDays: {
            type: SchemaType.NUMBER,
            description: "Payment due terms in number of days (e.g. 15, 30)",
          },
        },
        required: ["items"],
      },
    },
  });

  const result = await model.generateContent(
    `Extract key invoice entities from this text: "${prompt}". Do not do math.`,
  );
  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(text) as ExtractedEntities;
  return parsed;
}

/**
 * Deterministic regex & NLP heuristic entity extractor.
 * Accurately parses clients, quantities, items, currencies, and total/unit prices.
 */
export function heuristicExtractEntities(prompt: string): ExtractedEntities {
  const text = prompt.trim();

  // 1. Currency Detection
  let currency = "INR";
  let currencySymbol = "₹";

  if (/\b(?:dollars?|usd|bucks)\b|\$/i.test(text)) {
    currency = "USD";
    currencySymbol = "$";
  } else if (/\b(?:euros?|eur)\b|€/i.test(text)) {
    currency = "EUR";
    currencySymbol = "€";
  } else if (/\b(?:pounds?|gbp)\b|£/i.test(text)) {
    currency = "GBP";
    currencySymbol = "£";
  } else if (/\b(?:rupees?|inr|rs\.?)\b|₹/i.test(text)) {
    currency = "INR";
    currencySymbol = "₹";
  }

  // 2. Client Detection
  let clientQuery: string | undefined;

  // Check directory of known clients first
  for (const client of MOCK_CLIENTS) {
    const companyRegex = new RegExp(
      "\\b" +
        client.companyName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") +
        "\\b",
      "i",
    );
    if (companyRegex.test(text)) {
      clientQuery = client.companyName;
      break;
    }
  }

  if (!clientQuery) {
    // Look for company names with designations: 'for ABC Ltd', 'for Acme Corp', etc.
    const companyDesignationMatch = text.match(
      /(?:for|to|bill)\s+([A-Z0-9][A-Za-z0-9\s&.]+?\b(?:Ltd|Limited|Corp|Corporation|Inc|Pvt|LLC|Technologies|Solutions|Media|Enterprises|Agency|Co)\b)/i,
    );
    if (companyDesignationMatch) {
      clientQuery = companyDesignationMatch[1].trim();
    }
  }

  if (!clientQuery) {
    // Look for 'bill [Name]' or 'to [Name]' or 'for [Name]' where [Name] does NOT start with a number
    const nameMatch = text.match(
      /(?:(?:bill|to)\s+|invoice\s+for\s+|for\s+)([A-Z][A-Za-z0-9\s&.]+?)(?=\s+(?:for\b|to\b|at\b|@|with\b|total\b|price\b|\d+%|$))/i,
    );
    if (
      nameMatch &&
      !/^\d+/.test(nameMatch[1].trim()) &&
      !/^(an|the|my|all|each|invoice|service|custom|metallic|widgets|website|logo)$/i.test(
        nameMatch[1].trim(),
      )
    ) {
      clientQuery = nameMatch[1].trim();
    }
  }

  // 3. Tax detection (e.g. 18% GST, 5% tax)
  let taxOverride: number | undefined;
  const taxMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:gst|tax|vat)\b/i);
  if (taxMatch && taxMatch[1]) {
    taxOverride = parseFloat(taxMatch[1]);
  }

  // 4. Payment terms / due days
  let dueDays = 15;
  const dueMatch = text.match(
    /(?:due\s+in|within|terms\s+of|net)\s*(\d+)\s*days?/i,
  );
  if (dueMatch && dueMatch[1]) {
    dueDays = parseInt(dueMatch[1], 10);
  }

  // 5. Discount
  let discountPercentage: number | undefined;
  const discountMatch =
    text.match(/(?:discount[:\s]+|discount\s+of\s+)(\d+(?:\.\d+)?)\s*%/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*%\s*discount/i);
  if (discountMatch && discountMatch[1]) {
    discountPercentage = parseFloat(discountMatch[1]);
  }

  // 6. Pricing: Total Price vs Unit Price
  let explicitTotalPrice: number | undefined;
  let explicitUnitPrice: number | undefined;

  // Pattern for total price: e.g. 'total price is 1300 dollar', 'total of $1300', 'total is 1300'
  const totalMatch = text.match(
    /(?:total\s*(?:price|amount|cost)?|overall\s*(?:price|amount)?)\s*(?:is|of|:)?\s*(?:(?:₹|\$|€|£|\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b|\bRs\.?\s*)\s*)?([\d,]+(?:\.\d+)?)\s*(?:dollars?|rupees?|inr|usd|euros?|pounds?)?/i,
  );
  if (totalMatch) {
    explicitTotalPrice = parseFloat(totalMatch[1].replace(/,/g, ""));
  }

  // Pattern for unit price: e.g. 'at ₹5,000 each', 'at 5000', '@ 500', 'at $100 per hour'
  const unitMatch = text.match(
    /(?:at|@)\s*(?:(?:₹|\$|€|£|\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b|\bRs\.?\s*)\s*)?([\d,]+(?:\.\d+)?)\s*(?:each|per\s+[a-zA-Z]+|\/hour|\/unit|\/item)?/i,
  );
  if (unitMatch) {
    explicitUnitPrice = parseFloat(unitMatch[1].replace(/,/g, ""));
  }

  // Standalone currency price if neither found yet: e.g. '$100' or '₹5,000'
  if (explicitTotalPrice === undefined && explicitUnitPrice === undefined) {
    const currPriceMatch = text.match(
      /(?:₹|\$|€|£|\bRs\.?\s*)\s*([\d,]+(?:\.\d+)?)/i,
    );
    if (currPriceMatch) {
      explicitUnitPrice = parseFloat(currPriceMatch[1].replace(/,/g, ""));
    }
  }

  // 7. Item & Quantity Extraction
  let quantity = 1;
  let itemName = "";

  // Pattern: '(\d+) ([item name])' e.g. '2 custom metallic widgets', '2 logo designs'
  // Exclude matching the client name
  const qtyItemMatch = text.match(
    /(?:for|of)?\s*(\d+)\s+([a-zA-Z0-9\s-]+?)(?=\s+(?:for\s+[A-Z]|to\s+[A-Z]|at\b|@|with\b|total\b|price\b|\d+%|$))/i,
  );

  if (qtyItemMatch) {
    const candidateName = qtyItemMatch[2]
      .trim()
      .replace(/^(service|items|units?)\s+/i, "");

    if (
      !clientQuery ||
      !candidateName.toLowerCase().includes(clientQuery.toLowerCase())
    ) {
      quantity = parseInt(qtyItemMatch[1], 10);
      itemName = candidateName;
    }
  }

  // If item name not found, check catalog keywords
  if (!itemName) {
    for (const cat of MOCK_CATALOG) {
      if (new RegExp(cat.name, "i").test(text)) {
        itemName = cat.name;
        break;
      }
      for (const kw of cat.keywords) {
        if (new RegExp("\\b" + kw + "\\b", "i").test(text)) {
          itemName = cat.name;
          break;
        }
      }
      if (itemName) break;
    }
  }

  // If total price was given and unit price wasn't, calculate unitPrice
  if (explicitTotalPrice !== undefined && explicitUnitPrice === undefined) {
    explicitUnitPrice =
      quantity > 0 ? explicitTotalPrice / quantity : explicitTotalPrice;
  }

  const items: ExtractedEntities["items"] = [];

  if (itemName) {
    items.push({
      queryName: itemName,
      quantity: quantity > 0 ? quantity : 1,
      explicitUnitPrice: explicitUnitPrice,
      explicitTaxRate: taxOverride,
    });
  } else {
    items.push({
      queryName: "Custom Professional Service",
      quantity: quantity > 0 ? quantity : 1,
      explicitUnitPrice: explicitUnitPrice || 1000,
      explicitTaxRate: taxOverride ?? 18,
    });
  }

  return {
    clientQuery,
    items,
    currency,
    currencySymbol,
    taxOverride,
    discountPercentage,
    dueDays,
  };
}

/**
 * Main entity extraction method.
 * Tries Gemini Flash first; falls back gracefully to deterministic heuristic parser.
 */
export async function extractEntities(
  prompt: string,
): Promise<{ entities: ExtractedEntities; source: "llm" | "heuristic" }> {
  const aiClient = getAiClient();
  if (aiClient) {
    try {
      const entities = await extractWithGemini(prompt);
      return { entities, source: "llm" };
    } catch (err) {
      console.warn(
        "[LlmService] Gemini extraction failed or rate limited, falling back to heuristic engine:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const entities = heuristicExtractEntities(prompt);
  return { entities, source: "heuristic" };
}

export const llmService = {
  extractEntities,
  extractWithGemini,
  heuristicExtractEntities,
};
