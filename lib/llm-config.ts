import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Define the schema for structured output
export const TransactionSchema = z.object({
  monto: z.number().describe("El monto de la transacción."),
  tipo: z
    .enum(["ingreso", "gasto"])
    .describe("El tipo de transacción: ingreso o gasto."),
  categoria: z
    .string()
    .describe(
      "La categoría de la transacción, debe coincidir con la lista proporcionada.",
    ),
  subcategoria: z.string().nullable().describe("Subcategoría opcional."),
  fecha: z.string().describe("Fecha de la transacción (ISO o relativa)."),
  metodo_pago: z
    .string()
    .nullable()
    .describe("Método de pago utilizado (ej. Efectivo, Tarjeta)."),
  confianza: z
    .number()
    .describe("Nivel de confianza en la extracción (0.0 a 1.0)."),
  pregunta_aclaratoria: z
    .string()
    .nullable()
    .describe("Pregunta para el usuario si falta información."),
  razonamiento: z.string().describe("Breve explicación de la clasificación."),
});

export type TransactionParsed = z.infer<typeof TransactionSchema>;

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
    messages,
    text: {
      format: zodResponseFormat(TransactionSchema, "transaction"),
    },
  });

  return response.output_parsed;
}
