// The JSON Schema we hand to Groq's Structured Outputs (strict: true).
// Reminder of strict mode's two hard rules:
//   - every property listed in "required" (use a nullable type for optional
//     fields instead of omitting them)
//   - every object sets "additionalProperties": false

const invoiceJsonSchema = {
  type: "object",
  properties: {
    invoiceNumber: { type: "string" },
    invoiceDate: { type: "string", description: "ISO date, e.g. 2026-09-19" },
    dueDate: { type: ["string", "null"] },
    from: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: ["string", "null"] },
      },
      required: ["name", "email"],
      additionalProperties: false,
    },
    to: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: ["string", "null"] },
      },
      required: ["name", "email"],
      additionalProperties: false,
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          rate: { type: "number" },
          amount: { type: "number" },
        },
        required: ["description", "quantity", "rate", "amount"],
        additionalProperties: false,
      },
    },
    currency: { type: "string", description: "e.g. INR, USD" },
    grandTotal: { type: "number" },
    notes: { type: ["string", "null"] },
    customFields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "from",
    "to",
    "lineItems",
    "currency",
    "grandTotal",
    "notes",
    "customFields",
  ],
  additionalProperties: false,
};

module.exports = { invoiceJsonSchema };
