import cors from "cors";
import "dotenv/config";
import express from "express";
import {
  DEFAULT_BUSINESS_PROFILE,
  MOCK_CATALOG,
  MOCK_CLIENTS,
} from "./data/knowledgeBase.js";
import {
  assembleInvoice,
  checkMissingDetails,
} from "./services/invoiceEngine.js";
import { extractEntities } from "./services/llmService.js";
import type { GenerateInvoiceRequest } from "./types.js";

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for Vite frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);

// Support JSON payloads including base64 image strings up to 10MB
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "invoice-ai-backend",
    time: new Date().toISOString(),
    geminiEnabled: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0,
    ),
  });
});

// Knowledge Base Directory (for RAG inspection & catalog display)
app.get("/api/knowledge", (_req, res) => {
  res.json({
    clients: MOCK_CLIENTS,
    catalog: MOCK_CATALOG,
    businessProfile: DEFAULT_BUSINESS_PROFILE,
  });
});

// Main Invoice Generation Route (Minimal LLM + RAG Pipeline)
app.post("/api/invoice/generate", async (req, res) => {
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

    // Step 1: Lightweight Entity Extraction (LLM or Heuristic Fallback)
    const { entities, source } = await extractEntities(prompt);

    // Step 2: Validate mandatory details
    const missingDetails = checkMissingDetails(entities);

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

    // Step 3: RAG Knowledge Retrieval + Deterministic Assembly
    const invoice = assembleInvoice(entities, addons, source);

    console.log(
      `[Invoice Generated] Engine: ${source.toUpperCase()} (AI Gemini: ${
        source === "llm" ? "YES" : "NO - Fallback"
      }) | Client: ${invoice.client.companyName} | Total: ${invoice.currencySymbol}${invoice.grandTotal}`,
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
        error instanceof Error ? error.message : "Failed to generate invoice",
    });
  }
});

app.listen(port, () => {
  console.log(`=========================================`);
  console.log(`🚀 InvoiceAI Backend running at http://localhost:${port}`);
  console.log(`📁 Health Check: http://localhost:${port}/api/health`);
  console.log(
    `🤖 Gemini API: ${
      process.env.GEMINI_API_KEY ? "Connected" : "Heuristic RAG Fallback Active"
    }`,
  );
  console.log(`=========================================`);
});
