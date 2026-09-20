const express = require("express");
const { z } = require("zod");
const { parseInvoiceWithGroq, GroqTransientError, GroqPermanentError } = require("../services/groqClient");
const { invoiceZodSchema } = require("../schema/invoiceZodSchema");
const { invoiceRateLimiter } = require("../middleware/rateLimiter");
const env = require("../config/env");
const logger = require("../utils/logger");

const router = express.Router();

const requestBodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "text cannot be empty")
    .max(
      env.maxInputLength,
      `text cannot exceed ${env.maxInputLength} characters`
    ),
});

// Recompute the grand total ourselves rather than trusting the AI's math.
// If it doesn't match within a small rounding tolerance, we flag it instead
// of silently overwriting either number — the caller/UI can then decide
// whether to show a warning to the user.
function recomputeAndCheckTotal(invoice) {
  const computedSubtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const tolerance = 0.01;
  const totalsMatch =
    Math.abs(computedSubtotal - invoice.grandTotal) <= tolerance;

  return { computedSubtotal, totalsMatch };
}

router.post("/parse", invoiceRateLimiter, async (req, res, next) => {
  try {
    // 1. Validate the incoming request itself
    const parseResult = requestBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.flatten().fieldErrors,
      });
    }
    const { text } = parseResult.data;

    // 2. Call the AI (already has its own retry/timeout logic inside)
    const rawInvoice = await parseInvoiceWithGroq(text);

    // 3. Validate the AI's output against OUR rules too (defense-in-depth —
    //    see the comment at the top of invoiceZodSchema.js for why)
    const validation = invoiceZodSchema.safeParse(rawInvoice);
    if (!validation.success) {
      logger.error("AI output failed validation", {
        issues: validation.error.flatten(),
      });
      return res.status(502).json({
        error: "AI returned data that didn't pass validation. Please try rephrasing your input.",
      });
    }
    const invoice = validation.data;

    // 4. Sanity-check the math ourselves rather than trusting it blindly
    const { computedSubtotal, totalsMatch } = recomputeAndCheckTotal(invoice);

    return res.status(200).json({
      invoice,
      warnings: totalsMatch
        ? []
        : [
            `Computed line-item total (${computedSubtotal}) doesn't match grandTotal (${invoice.grandTotal}) — please review.`,
          ],
    });
  } catch (err) {
    if (err instanceof GroqTransientError) {
      err.statusCode = 503; // service temporarily unavailable — client can retry
      return next(err);
    }
    if (err instanceof GroqPermanentError) {
      err.statusCode = 502; // upstream (Groq) gave us something unusable
      return next(err);
    }
    next(err); // unknown error -> generic 500 via errorHandler
  }
});

module.exports = router;
