import { SYSTEM_PROMPT } from "@/constants/prompt";
import { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import {
  findAccountByName,
  getCategories,
  getPaymentMethods,
  getUserContext,
} from "@/lib/helpers";
import { getStructuredChatCompletion, TransactionParsed } from "@/lib/llm-config";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// --- Configuration & Types ---

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

    // 4. Construct the full prompt with history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT(categoryList, paymentMethodList) },
      ...history,
      { role: "user", content: message },
    ];

    // Call the model with a timeout
    const responsePromise = getStructuredChatCompletion(messages, "gpt-4o-mini");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout calling AI service")), 30000),
    );

    const result = (await Promise.race([
      responsePromise,
      timeoutPromise,
    ])) as TransactionParsed;

    if (!result) {
      throw new Error("No se pudo obtener una respuesta válida de la IA.");
    }

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
