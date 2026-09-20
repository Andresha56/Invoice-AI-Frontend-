// Loads and validates environment variables ONCE, at startup.
// If something required is missing, we crash immediately with a clear
// message — this is much better than discovering it mid-request in
// production, three hours after deploy.

require("dotenv").config();

const required = ["GROQ_API_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
      `Missing required environment variable(s): ${missing.join(", ")}`
  );
  process.exit(1);
}

module.exports = {
  groqApiKey: process.env.GROQ_API_KEY,
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || "4000", 10),
  rateLimitWindowMinutes: parseInt(
    process.env.RATE_LIMIT_WINDOW_MINUTES || "15",
    10
  ),
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "50",
    10
  ),
};
