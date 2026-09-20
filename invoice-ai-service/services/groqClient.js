const { invoiceJsonSchema } = require("../schema/invoiceJsonSchema");
const env = require("../config/env");
const logger = require("../utils/logger");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 20_000; // don't let a hung request hold a connection forever
const MAX_RETRIES = 3;

// Typed errors so the route layer can decide what HTTP status to send back,
// instead of every failure looking like a generic 500.
class GroqTransientError extends Error {} // safe to retry (429, 502, 503, 504, timeout)
class GroqPermanentError extends Error {} // NOT safe to retry (400, 401, invalid schema, etc.)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqOnce(userText) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.groqApiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You extract invoice details from free text into the given JSON schema. " +
              "Never invent information that isn't in the text. If a field is missing, " +
              "use null. Put anything you can't map to a known field into customFields " +
              "as {label, value} pairs instead of dropping it.",
          },
          { role: "user", content: userText },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "invoice",
            strict: true,
            schema: invoiceJsonSchema,
          },
        },
      }),
    });

    // Transient: worth retrying (rate limit or server-side hiccup)
    if (response.status === 429 || response.status >= 500) {
      const body = await response.text();
      throw new GroqTransientError(
        `Groq returned ${response.status}: ${body}`
      );
    }

    // Permanent: retrying won't help (bad request, auth failure, etc.)
    if (!response.ok) {
      const body = await response.text();
      throw new GroqPermanentError(`Groq returned ${response.status}: ${body}`);
    }

    const data = await response.json();
    const jsonString = data?.choices?.[0]?.message?.content;

    if (!jsonString) {
      throw new GroqPermanentError(
        "Groq response had no content — unexpected response shape"
      );
    }

    try {
      return JSON.parse(jsonString);
    } catch {
      // Should be essentially impossible with strict:true, but never trust
      // an external API 100% — handle it anyway.
      throw new GroqPermanentError("Groq returned content that wasn't valid JSON");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GroqTransientError("Groq request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls Groq with retry + exponential backoff for transient failures.
 * Permanent failures are thrown immediately without wasting retries.
 */
async function parseInvoiceWithGroq(userText) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGroqOnce(userText);
    } catch (err) {
      lastError = err;

      if (err instanceof GroqPermanentError) {
        logger.error("Groq permanent error — not retrying", {
          error: err.message,
        });
        throw err;
      }

      logger.warn(`Groq transient error on attempt ${attempt}/${MAX_RETRIES}`, {
        error: err.message,
      });

      if (attempt < MAX_RETRIES) {
        const backoffMs = 500 * 2 ** (attempt - 1); // 500ms, 1s, 2s...
        await sleep(backoffMs);
      }
    }
  }

  throw lastError;
}

module.exports = {
  parseInvoiceWithGroq,
  GroqTransientError,
  GroqPermanentError,
};
