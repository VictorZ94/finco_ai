import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// --- Configuration & Types ---

// Schema de validación Zod para respuesta del LLM
const TransactionSchema = z.object({
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

type TransactionParsed = z.infer<typeof TransactionSchema>;

type APIResponse = {
  success: boolean;
  data?: {
    transaccion: TransactionParsed;
    requiere_confirmacion: boolean;
    mensaje_usuario: string;
    transaccion_id?: string;
  };
  error?: string;
};

// --- Helper Functions ---

async function getUserContext(userId: string) {
  // Fetch last 5 messages
  const history = await prisma.messages.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Reverse to chronological order for the LLM
  return history.reverse().map((msg) => ({
    role: msg.role === Role.USER ? "user" : "assistant",
    content: msg.content,
  }));
}

async function getCategories(userId: string) {
  // Fetch movable accounts that belong to Income (4) or Expenses (5)
  const accounts = await prisma.financialAccounts.findMany({
    where: {
      userId,
      canReceiveMovement: true,
      OR: [
        { code: { startsWith: '4' } },
        { code: { startsWith: '5' } },
      ]
    },
    select: { name: true, code: true },
  });

  return accounts.map((a) => ({ 
    nombre: a.name, 
    tipo: a.code.startsWith('4') ? "INCOME" : "EXPENSE" 
  }));
}

async function getPaymentMethods(userId: string) {
  // Fetch movable accounts that belong to Assets (1), Liabilities (2), or Equity (3)
  // Restricted: Agent should not write to 1 or 11 (though they are not movable, we ensure here)
  const accounts = await prisma.financialAccounts.findMany({
    where: {
      userId,
      canReceiveMovement: true,
      OR: [
        { code: { startsWith: '1' } },
        { code: { startsWith: '2' } },
        { code: { startsWith: '3' } },
      ],
      NOT: [
        { code: '1' },
        { code: '11' }
      ]
    },
    select: { id: true, name: true, code: true },
  });
  return accounts;
}

async function findAccountByName(userId: string, name: string) {
  return await prisma.financialAccounts.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      canReceiveMovement: true
    },
  });
}

// --- Main Handler ---

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Mensaje inválido o faltante." },
        { status: 400 },
      );
    }

    // 1. Authentication / User Context
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const targetUserId = session.user.id;

    // 2. Fetch Context & Categories
    const [history, categories, paymentMethods] = await Promise.all([
      getUserContext(targetUserId),
      getCategories(targetUserId),
      getPaymentMethods(targetUserId),
    ]);

    const categoryList = categories
      .map((c) => `- ${c.nombre} (${c.tipo})`)
      .join("\n");
    const paymentMethodList = paymentMethods
      .map((p) => `- ${p.name}`)
      .join("\n");

    // 3. Build System Prompt
    const SYSTEM_PROMPT = `Eres un asistente financiero que ayuda a registrar transacciones de forma conversacional.

REGLAS ESTRICTAS:
1. Extrae SIEMPRE: monto, tipo (ingreso/gasto), categoría.
2. Si falta información crítica (monto o tipo), pregunta amablemente en 'pregunta_aclaratoria'.
3. Usa lenguaje simple y amigable, NUNCA términos contables técnicos.
4. Responde SOLO en formato JSON válido que cumpla el esquema proporcionado.
5. La confianza debe ser 0.8+ para registro automático, sino solicita confirmación (confianza baja).
6. Fechas: interpreta "hoy", "ayer", "la semana pasada" correctamente a formato ISO (YYYY-MM-DD).

CATEGORÍAS DISPONIBLES (tienes que elegir una de estas si es posible):
${categoryList || "- (No hay categorías definidas, sugiere crear una)"}

MÉTODOS DE PAGO DISPONIBLES (para gastos) / CUENTAS DE DESTINO (para ingresos):
${paymentMethodList || "- (No hay métodos de pago definidos, usa 'Efectivo' por defecto)"}

FORMATO DE RESPUESTA (JSON):
{
  "monto": number,
  "tipo": "ingreso" | "gasto",
  "categoria": string, // debe coincidir exactamente con lista
  "subcategoria": string | null,
  "fecha": string, // ISO date
  "metodo_pago": string | null, // debe coincidir con la lista de métodos de pago
  "confianza": number, // 0.0 a 1.0
  "pregunta_aclaratoria": string | null, // si necesitas más info
  "razonamiento": string // breve explicación de tu clasificación
}

IMPORTANTE:
- Si el usuario menciona varios gastos/ingresos, procesa solo UNO y sugiere registrar los demás después.
- Se estricto con las categorías.
- Si no estás seguro de la categoría, pon confianza < 0.8 y sugiere opciones.
`;

    // 4. Call Langchain / OpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini", // Or gpt-3.5-turbo if preferred for cost
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(TransactionSchema);

    // Construct the full prompt with history
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history.map((h) =>
        h.role === "user"
          ? new HumanMessage(h.content)
          : new AIMessage(h.content),
      ),
      new HumanMessage(message),
    ];

    // Call the model with a timeout
    const responsePromise = model.invoke(messages);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout calling AI service")), 30000),
    );

    const result = (await Promise.race([
      responsePromise,
      timeoutPromise,
    ])) as TransactionParsed;

    console.log("AI Response:", result);

    // 5. Process Result
    let transactionId: string | undefined;
    let userMessageResponse = result.razonamiento; // Default response

    // Save User Message
    const userMsgRecord = await prisma.messages.create({
      data: {
        content: message,
        role: Role.USER,
        userId: targetUserId,
      },
    });

    if (result.confianza >= 0.8 && !result.pregunta_aclaratoria) {
      // High confidence -> Register Transaction

      // Find Category Account
      const categoryAccount = await findAccountByName(
        targetUserId,
        result.categoria,
      );

      // Find Payment Method Account (or default)
      let paymentAccountName = result.metodo_pago;
      if (!paymentAccountName && paymentMethods.length > 0) {
        // Default to first asset if not specified, or handle logic
        paymentAccountName = paymentMethods[0].name;
      }

      const paymentAccount = paymentAccountName
        ? await findAccountByName(targetUserId, paymentAccountName)
        : null;

      if (categoryAccount && paymentAccount) {
        try {
          // Create Transaction
          const transaction = await prisma.transactions.create({
            data: {
              numbering: `TX-${Date.now()}`, // Simple numbering
              description: result.razonamiento,
              amount: result.monto,
              date: new Date(result.fecha),
              userId: targetUserId,
              messageId: userMsgRecord.id,
            },
          });

          // Double Entry Logic
          // Expense: Debit Expense Account, Credit Asset Account
          // Income: Debit Asset Account, Credit Income Account

          const entries = [];

          if (result.tipo === "gasto") {
            entries.push({
              transactionId: transaction.id,
              accountId: categoryAccount.id, // Expense
              debit: result.monto,
              credit: 0,
            });
            entries.push({
              transactionId: transaction.id,
              accountId: paymentAccount.id, // Asset
              debit: 0,
              credit: result.monto,
            });
          } else {
            // ingreso
            entries.push({
              transactionId: transaction.id,
              accountId: paymentAccount.id, // Asset
              debit: result.monto,
              credit: 0,
            });
            entries.push({
              transactionId: transaction.id,
              accountId: categoryAccount.id, // Income
              debit: 0,
              credit: result.monto,
            });
          }

          await prisma.ledgerEntries.createMany({
            data: entries,
          });

          transactionId = transaction.id;
          userMessageResponse = `✅ Transacción registrada: ${result.tipo} de ${result.monto} en ${result.categoria}.`;
        } catch (dbError) {
          console.error("Database error saving transaction:", dbError);
          userMessageResponse =
            "Hubo un error guardando la transacción en la base de datos.";
        }
      } else {
        // Account missing handling
        userMessageResponse = `No pude encontrar las cuentas necesarias: Categoría '${result.categoria}' o Método '${result.metodo_pago}'. Por favor verifica tus cuentas.`;
      }
    } else {
      // Low confidence or clarification needed
      userMessageResponse =
        result.pregunta_aclaratoria ||
        `No estoy seguro. ${result.razonamiento}`;
    }

    // Save Assistant Response
    await prisma.messages.create({
      data: {
        content: userMessageResponse,
        role: Role.ASSISTANT,
        userId: targetUserId,
      },
    });

    const apiResponse: APIResponse = {
      success: true,
      data: {
        transaccion: result,
        requiere_confirmacion:
          result.confianza < 0.8 || !!result.pregunta_aclaratoria,
        mensaje_usuario: userMessageResponse,
        transaccion_id: transactionId,
      },
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
