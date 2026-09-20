

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

export const InvoiceController = async (req, res, next) => {
  try {
    // 1. Validate the incoming request
    const parseResult = requestBodySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { text } = parseResult.data;

    // 2. Call the AI
    const rawInvoice = await parseInvoiceWithGroq(text);

    // 3. Validate the AI output
    const validation = invoiceZodSchema.safeParse(rawInvoice);

    if (!validation.success) {
      logger.error("AI output failed validation", {
        issues: validation.error.flatten(),
      });

      return res.status(502).json({
        error:
          "AI returned data that didn't pass validation. Please try rephrasing your input.",
      });
    }

    const invoice = validation.data;

    // 4. Recompute totals instead of blindly trusting AI output
    const { computedSubtotal, totalsMatch } =
      recomputeAndCheckTotal(invoice);

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
      err.statusCode = 503;
      return next(err);
    }

    if (err instanceof GroqPermanentError) {
      err.statusCode = 502;
      return next(err);
    }

    return next(err);
  }
};