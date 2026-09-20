const express = require("express");
const helmet = require("helmet");
const env = require("./config/env"); // validates env vars at startup — must be first
const logger = require("./utils/logger");
const invoiceRoutes = require("./routes/invoiceRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet()); // sets sensible security headers (CSP, no-sniff, etc.)
app.use(express.json({ limit: "100kb" })); // caps request body size — abuse protection

// Basic request logging
app.use((req, res, next) => {
  logger.info("Incoming request", { method: req.method, path: req.path });
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/invoices", invoiceRoutes);

// 404 for anything unmatched
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Must be registered LAST
app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`Server listening on port ${env.port}`, { env: env.nodeEnv });
});

// Graceful shutdown — let in-flight requests finish instead of dropping them
// when your host sends a stop signal (deploys, scaling events, etc.)
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  // Force-exit if something hangs for more than 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Don't let one unexpected error crash the whole process silently
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
