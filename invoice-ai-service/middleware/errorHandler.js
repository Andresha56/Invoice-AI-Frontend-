const env = require("../config/env");
const logger = require("../utils/logger");

// Keep this LAST in server.js's middleware chain.
function errorHandler(err, req, res, _next) {
  logger.error("Unhandled error", {
    message: err.message,
    stack: env.nodeEnv === "development" ? err.stack : undefined,
    path: req.path,
  });

  const status = err.statusCode || 500;

  res.status(status).json({
    error:
      env.nodeEnv === "production"
        ? "Something went wrong processing your request."
        : err.message, // full detail only outside production, for your own debugging
  });
}

module.exports = { errorHandler };
