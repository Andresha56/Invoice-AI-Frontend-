import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MOCK_CATALOG, MOCK_CLIENTS } from "../data/knowledgeBase.js";
import type { ExtractedEntities } from "../types.js";
import { INVOICE_EXTRACTION_PROMPT } from "../constant/prompt.js";
import { normalizeGeminiResponse } from "../util/normalizeGeminiResponse.js";

export interface LlmService {
  extractEntities: (
    prompt: string,
  ) => Promise<{ entities: ExtractedEntities; source: "llm" | "heuristic" }>;
  heuristicExtractEntities: (prompt: string) => ExtractedEntities;
}

function createAiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    return new GoogleGenerativeAI(apiKey);
  }
  console.warn(
    "[LlmService] GEMINI_API_KEY is not set; falling back to the heuristic parser for every request.",
  );
  return null;
}

/**
 * Lightweight Gemini entity extractor.
 * Takes minimal tokens (~50 tokens output) with strictly typed schema.
 */
async function extractWithGemini(
  aiClient: GoogleGenerativeAI | null,
  prompt: string,
): Promise<ExtractedEntities> {
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
          invoice: {
            type: SchemaType.OBJECT,
            properties: {
              invoiceNumber: {
                type: SchemaType.STRING,
                description: "Invoice number if explicitly provided.",
              },

              invoiceDate: {
                type: SchemaType.STRING,
                description:
                  "Invoice date if explicitly provided. Prefer ISO format YYYY-MM-DD.",
              },

              dueDate: {
                type: SchemaType.STRING,
                description:
                  "Exact payment due date if explicitly provided. Prefer ISO format YYYY-MM-DD.",
              },

              dueDays: {
                type: SchemaType.NUMBER,
                description:
                  "Number of days until payment is due, such as 15 or 30.",
              },

              paymentTerms: {
                type: SchemaType.STRING,
                description:
                  "Payment terms exactly or accurately summarized from the user's request.",
              },

              currency: {
                type: SchemaType.STRING,
                description:
                  "ISO currency code such as INR, USD, EUR, or GBP.",
              },

              currencySymbol: {
                type: SchemaType.STRING,
                description:
                  "Currency symbol such as ₹, $, €, or £.",
              },

              notes: {
                type: SchemaType.STRING,
                description:
                  "Additional invoice notes explicitly provided by the user.",
              },
            },
          },

          seller: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Seller or business name.",
              },

              email: {
                type: SchemaType.STRING,
                description: "Seller email address.",
              },

              phone: {
                type: SchemaType.STRING,
                description: "Seller phone number.",
              },

              address: {
                type: SchemaType.STRING,
                description: "Seller billing/business address.",
              },

              taxId: {
                type: SchemaType.STRING,
                description:
                  "Seller GST, VAT, or other tax identification number.",
              },
            },
          },

          clientQuery: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Customer or client name/company.",
              },

              email: {
                type: SchemaType.STRING,
                description: "Customer email address.",
              },

              phone: {
                type: SchemaType.STRING,
                description: "Customer phone number.",
              },

              address: {
                type: SchemaType.STRING,
                description: "Customer billing address.",
              },

              taxId: {
                type: SchemaType.STRING,
                description:
                  "Customer GST, VAT, or other tax identification number.",
              },
            },
          },

          items: {
            type: SchemaType.ARRAY,
            description: "Products or services included in the invoice.",

            items: {
              type: SchemaType.OBJECT,

              properties: {
                queryName: {
                  type: SchemaType.STRING,
                  description:
                    "Name or description of the product or service.",
                },

                quantity: {
                  type: SchemaType.NUMBER,
                  description:
                    "Quantity of the item. Defaults to 1 when a quantity is not specified.",
                },

                unit: {
                  type: SchemaType.STRING,
                  description:
                    "Unit such as hour, day, month, piece, license, or item if explicitly mentioned.",
                },

                explicitUnitPrice: {
                  type: SchemaType.NUMBER,
                  description:
                    "Price per single unit when explicitly provided.",
                },

                explicitTotalPrice: {
                  type: SchemaType.NUMBER,
                  description:
                    "Total price for this line item when explicitly stated as a total rather than a unit price.",
                },

                explicitTaxRate: {
                  type: SchemaType.NUMBER,
                  description:
                    "Tax percentage specifically applicable to this line item.",
                },

                discountPercentage: {
                  type: SchemaType.NUMBER,
                  description:
                    "Discount percentage specifically applicable to this line item.",
                },

                discountAmount: {
                  type: SchemaType.NUMBER,
                  description:
                    "Fixed discount amount specifically applicable to this line item.",
                },
              },

              required: ["queryName", "quantity"],
            },
          },

          taxOverride: {
            type: SchemaType.NUMBER,
            description:
              "Overall tax percentage applicable to the invoice, such as 18 for 18% GST.",
          },

          discountPercentage: {
            type: SchemaType.NUMBER,
            description:
              "Overall invoice discount percentage if explicitly provided.",
          },

          discountAmount: {
            type: SchemaType.NUMBER,
            description:
              "Overall invoice discount amount if explicitly provided.",
          },
        },

        required: ["items"],
      },
    },
  });

  const result = await model.generateContent(
    `${INVOICE_EXTRACTION_PROMPT}
      User request:${prompt}`,
  );
  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Gemini returned non-JSON output despite responseMimeType: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return normalizeGeminiResponse(parsed);
}

/**
 * Deterministic regex & NLP heuristic entity extractor.
 * Accurately parses clients, quantities, items, currencies, and total/unit prices.
 */
function heuristicExtractEntities(prompt: string): ExtractedEntities {
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

  // Only add a line item when we actually identified one from the prompt.
  // Leaving `items` empty when nothing was detected lets
  // `invoiceEngine.checkMissingDetails` correctly ask the user what they're
  // invoicing for, instead of silently billing a fabricated ₹1000 "Custom
  // Professional Service" placeholder the user never mentioned.
  if (itemName) {
    items.push({
      queryName: itemName,
      quantity: quantity > 0 ? quantity : 1,
      explicitUnitPrice,
      explicitTaxRate: taxOverride,
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
 * Factory function that creates an LlmService instance.
 * Replaces the class: the Gemini client lives in a closure instead of `this`.
 *
 * Main entity extraction: tries Gemini Flash first, falls back gracefully
 * to the deterministic heuristic parser.
 */
export function createLlmService(): LlmService {
  const aiClient = createAiClient();

  async function extractEntities(
    prompt: string,
  ): Promise<{ entities: ExtractedEntities; source: "llm" | "heuristic" }> {
    if (aiClient) {
      try {
        const entities = await extractWithGemini(aiClient, prompt);
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

  return {
    extractEntities,
    heuristicExtractEntities,
  };
}

export const llmService = createLlmService();