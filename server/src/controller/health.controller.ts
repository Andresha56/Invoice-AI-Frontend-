
import type { Request, Response } from "express";

export const getHealthCheck = (_req:Request, res:Response) => {
  res.json({
    status: "ok",
    service: "invoice-ai-backend",
    time: new Date().toISOString(),
    geminiEnabled: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0,
    ),
  });
}