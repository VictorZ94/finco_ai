import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

// Define the schema for structured output
export const TransactionSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  paymentMethod: z.string().min(1),
  date: z.string().refine((val) => {
    // Validate ISO date format
    return !isNaN(Date.parse(val));
  }),
  description: z.string().min(1),
  type: z.enum(["expense", "income"]),
});

const UnifiedSchema = z.object({
  mode: z.enum(["chat", "clarification", "transaction_ready"]),
  message: z.string().optional().nullable(),
  missingFields: z.array(z.string()).optional().nullable(),
  transaction: TransactionSchema.optional().nullable(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calls OpenAI with structured output support.
 */
export async function getStructuredChatCompletion(
  messages: any[],
  model: string = "gpt-4o-mini",
) {
  const response = await openai.responses.parse({
    model,
    input: messages,
    text: {
      format: zodTextFormat(UnifiedSchema, "transaction_response"),
    },
  });

  return response.output_parsed;
}
