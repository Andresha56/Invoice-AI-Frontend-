// A minimal structured logger. In a bigger production system you'd swap
// this for pino/winston + a log aggregator (Datadog, CloudWatch, etc.) —
// but the SHAPE of what you log (level, message, context, timestamp)
// stays the same, so this is a fine starting point.

function log(level, message, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  // In production, plain JSON lines are ideal — log aggregators parse them
  // automatically. In development, this is still readable enough.
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (message, context) => log("info", message, context),
  warn: (message, context) => log("warn", message, context),
  error: (message, context) => log("error", message, context),
};
