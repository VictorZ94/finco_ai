import { SYSTEM_PROMPT } from "@/constants/system-prompt";
import {
  getCategories,
  getPaymentMethods,
  getUserContext,
} from "@/lib/helpers";
import { getStructuredChatCompletion } from "@/lib/llm-config";
import { Session, verifyServerAuth } from "@/lib/middlewares/verify-auth";
import { NextResponse } from "next/server";

// --- Configuration & Types ---

type APIResponse = {
  success: boolean;
  data?: {
    transaccion: string;
    requiere_confirmacion: boolean;
    mensaje_usuario: string;
    transaccion_id?: string;
  };
  error?: string;
};

// --- Main Handler ---

export async function POST(request: Request) {
  return verifyServerAuth(async (session: Session) => {
    try {
      const body = await request.json();
      const { message } = body;

      if (!message || typeof message !== "string") {
        return NextResponse.json(
          { success: false, error: "Mensaje inválido o faltante." },
          { status: 400 },
        );
      }
      const targetUserId = session!.user.id;

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
        {
          role: "system",
          content: SYSTEM_PROMPT(categoryList, paymentMethodList),
        },
        ...history,
        { role: "user", content: message },
      ];

      console.log("Messages sent to LLM:", messages);

      // Call the model
      const result = await getStructuredChatCompletion(messages, "gpt-4o-mini");
      console.log("LLM Result:", result);
      return NextResponse.json({
        success: true,
        data: {
          transaction: result,
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);
      return NextResponse.json(
        {
          success: false,
          error: (error as Error).message || "Internal Server Error",
        },
        { status: 500 },
      );
    }
  });
}
