// WHY THIS EXISTS ALONGSIDE invoiceJsonSchema.js:
// Groq's strict mode guarantees the SHAPE of the JSON (right fields, right
// types). It does NOT guarantee the VALUES make sense (e.g. a negative
// quantity, an empty invoiceNumber, a malformed date). Never trust an
// external API's output blindly in production — validate it again on your
// side with rules Groq's schema can't express. This is standard
// defense-in-depth, not paranoia: providers change behavior, have bugs, or
// occasionally return edge cases even in strict mode.

const { z } = require("zod");
const logger = require("../utils/logger")
const partySchema = z.object({
  name: z.string().min(1, "Party name cannot be empty"),
  email: z.string().email().nullable().or(z.literal("")).nullable(),
});

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().nonnegative("Rate cannot be negative"),
  amount: z.number().nonnegative(),
});

const customFieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

const invoiceZodSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  from: partySchema,
  to: partySchema,
  lineItems: z.array(lineItemSchema).min(1, "Invoice needs at least one line item"),
  currency: z.string().length(3, "Expected a 3-letter currency code"),
  grandTotal: z.number().nonnegative(),
  notes: z.string().nullable(),
  customFields: z.array(customFieldSchema),
});

module.exports = { invoiceZodSchema };
