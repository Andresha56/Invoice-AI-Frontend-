// controller/invoice-controller.ts
import { llmService } from "../services/llmService.js";
import { invoiceEngine } from "../services/invoice.engine.js";
import type { Request, Response } from "express";
import type { GenerateInvoiceRequest } from "../types.js";

export const generateInvoice = async (req: Request, res: Response) => {

  try {
    const { prompt, addons, allowDefaults } =
      req.body as GenerateInvoiceRequest;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "A valid prompt description is required.",
      });
      return;
    }

    const { entities, source } = await llmService.extractEntities(prompt);

    const missingDetails = invoiceEngine.checkMissingDetails(entities);

    if (missingDetails.length > 0 && !allowDefaults) {
      res.json({
        success: false,
        requiresClarification: true,
        missingDetails,
        message:
          "Some mandatory invoice details were not specified in the prompt.",
      });
      return;
    }
    const invoice = await invoiceEngine.assembleInvoice(
      entities,
      addons,
      source,
    );

    console.log(
      `[Invoice Generated] Engine: ${source.toUpperCase()} | Client: ${invoice.client.companyName} | Total: ${invoice.currencySymbol}${invoice.grandTotal}`,
    );

    res.json({  
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("[POST /api/invoice/generate] Error:", error);

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate invoice",
    });
  }
};