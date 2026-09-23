import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import routes from "./routes/index.js";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : DEFAULT_ALLOWED_ORIGINS;

const app = express();


app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.use("/api", routes);

// JSON 404 for anything that didn't match a route above.
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler. Must be declared with 4 args (including `_next`)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled error]", err);
  res.status(500).json({
    success: false,
    error: err instanceof Error ? err.message : "Internal server error",
  });
});

export default app;