const rateLimit = require("express-rate-limit");
const env = require("../config/env");

// Protects YOUR server (and your Groq bill) from a client hammering the
// endpoint — whether that's a bug in your own frontend or someone abusing
// a public URL.
const invoiceRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMinutes * 60 * 1000,
  max: env.rateLimitMaxRequests,
  standardHeaders: true, // sends RateLimit-* headers so clients can self-throttle
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

module.exports = { invoiceRateLimiter };
