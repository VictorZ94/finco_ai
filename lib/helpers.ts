import { AccountType, Nature, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getChatCompletion } from "./llm-config";

export async function getOrCreateConversation(userId: string) {
  let conversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId },
    });
  }

  return conversation;
}

export async function saveMessage(
  userId: string,
  conversationId: string,
  role: Role,
  content: string,
) {
  return await prisma.messages.create({
    data: {
      userId,
      conversationId,
      role,
      content,
    },
  });
}

export async function getHybridMemory(conversationId: string) {
  // 1. Get the summary
  const memory = await prisma.conversationMemory.findUnique({
    where: { conversationId },
  });

  // 2. Get the last 5 messages
  const lastMessages = await prisma.messages.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Reverse to chronological order
  const shortTermMemory = lastMessages.reverse().map((msg) => ({
    role: msg.role.toLowerCase(),
    content: msg.content,
  }));

  return {
    summary: memory?.summary || null,
    shortTermMemory,
  };
}

export async function updateSummary(conversationId: string) {
  // Get all messages older than the last 5
  const allMessages = await prisma.messages.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });

  if (allMessages.length <= 5) return;

  const messagesToSummarize = allMessages.slice(5).reverse();
  const currentSummary = await prisma.conversationMemory.findUnique({
    where: { conversationId },
  });

  const prompt = `
Tu tarea es actualizar un resumen estructurado de una conversación financiera.
Resumen actual:
${currentSummary?.summary || "No hay resumen previo."}

Nuevos mensajes para integrar al resumen:
${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join("\n")}

Instrucciones:
- El resumen debe ser acumulativo.
- Debe conservar preferencias del usuario, datos financieros relevantes, decisiones previas y contexto funcional.
- Debe ser informativo y estructurado, no narrativo.
- Mantén el resumen conciso pero completo.
- El objetivo es que el LLM tenga todo el contexto necesario sin leer todos los mensajes antiguos.
`;

  const newSummary = await getChatCompletion([
    { role: "system", content: "Eres un experto en gestión de memoria de asistentes financieros." },
    { role: "user", content: prompt },
  ]);

  if (newSummary) {
    await prisma.conversationMemory.upsert({
      where: { conversationId },
      update: { summary: newSummary },
      create: { conversationId, summary: newSummary },
    });
  }
}

export async function getUserContext(userId: string) {
  const conversation = await getOrCreateConversation(userId);
  const { summary, shortTermMemory } = await getHybridMemory(conversation.id);

  const context = [];

  if (summary) {
    context.push({
      role: "system",
      content: `CONTEXTO DE LA CONVERSACIÓN (RESUMEN DE MENSAJES ANTERIORES):\n${summary}`,
    });
  }

  return {
    history: [...context, ...shortTermMemory],
    conversationId: conversation.id,
  };
}

export async function getCategories(userId: string) {
  // Fetch movable accounts that belong to Income (4) or Expenses (5)
  const accounts = await prisma.financialAccounts.findMany({
    where: {
      userId,
      canReceiveMovement: true,
      OR: [{ code: { startsWith: "4" } }, { code: { startsWith: "5" } }],
    },
    select: { name: true, code: true },
  });

  return accounts.map((a) => ({
    nombre: a.name,
    codigo: a.code,
    tipo: a.code.startsWith("4") ? "INCOME" : "EXPENSE",
  }));
}

export async function getPaymentMethods(userId: string) {
  // Fetch movable accounts that belong to Assets (1), Liabilities (2), or Equity (3)
  // Restricted: Agent should not write to 1 or 11 (though they are not movable, we ensure here)
  const accounts = await prisma.financialAccounts.findMany({
    where: {
      userId,
      canReceiveMovement: true,
      OR: [
        { code: { startsWith: "1" } },
        { code: { startsWith: "2" } },
        { code: { startsWith: "3" } },
      ],
      NOT: [{ code: "1" }, { code: "11" }],
    },
    select: { id: true, name: true, code: true },
  });
  return accounts.map(a => ({
    nombre: a.name,
    codigo: a.code,
  }));
}

export async function findAccountByName(userId: string, name: string) {
  return await prisma.financialAccounts.findFirst({
    where: {
      userId,
      name: { contains: name, mode: "insensitive" },
      canReceiveMovement: true,
    },
  });
}

export async function getOrCreateAccount(userId: string, accountData: { name: string, code?: string | null }) {
  // 1. Try to find by code if provided
  if (accountData.code) {
    const existing = await prisma.financialAccounts.findUnique({
      where: { userId_code: { userId, code: accountData.code } }
    });
    if (existing) return existing;
  }

  // 2. Try to find by name
  const existingByName = await prisma.financialAccounts.findFirst({
    where: {
      userId,
      name: { equals: accountData.name, mode: 'insensitive' },
      canReceiveMovement: true
    }
  });
  if (existingByName) return existingByName;

  // 3. Create if not found and code is provided
  // If code is not provided, we might need to invent one or use a default "Miscellaneous" code
  // But usually the LLM should provide a code based on the new schema
  let code = accountData.code;
  if (!code) {
    // Fallback: This is risky, but let's try to find a "Miscellaneous" or similar
    // For now, let's assume LLM provides code. If not, we use a generic one.
    code = "999999"; 
  }

  // Determine level, nature, type from code
  let level = 1;
  if (code.includes('-')) level = 4;
  else if (code.length === 2) level = 2;
  else if (code.length === 4) level = 3;
  else if (code.length >= 6) level = 4;

  let nature = Nature.DEBIT;
  let accountType = AccountType.EXPENSE;

  const firstDigit = code[0];
  if (firstDigit === '1') {
    nature = Nature.DEBIT;
    accountType = AccountType.ASSET;
  } else if (firstDigit === '2') {
    nature = Nature.CREDIT;
    accountType = AccountType.LIABILITY;
  } else if (firstDigit === '3') {
    nature = Nature.CREDIT;
    accountType = AccountType.EQUITY;
  } else if (firstDigit === '4') {
    nature = Nature.CREDIT;
    accountType = AccountType.INCOME;
  } else if (firstDigit === '5') {
    nature = Nature.DEBIT;
    accountType = AccountType.EXPENSE;
  }

  // Find parent
  let parentId = null;
  if (level > 1) {
    let parentCode = "";
    if (code.includes('-')) parentCode = code.split('-')[0];
    else if (level === 2) parentCode = code[0];
    else if (level === 3) parentCode = code.substring(0, 2);
    else if (level === 4) parentCode = code.substring(0, 4);

    const parent = await prisma.financialAccounts.findUnique({
      where: { userId_code: { userId, code: parentCode } }
    });
    parentId = parent?.id || null;
  }

  return await prisma.financialAccounts.create({
    data: {
      code,
      name: accountData.name,
      nature,
      level,
      accountType,
      canReceiveMovement: true,
      userId,
      parentId
    }
  });
}

export async function getNumbering(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  const lastTransaction = await prisma.transactions.findFirst({
    where: {
      userId: userId,
      numbering: {
        startsWith: `${currentYear}-`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      numbering: true,
    },
  });

  let nextNumber = 1;
  if (lastTransaction) {
    const lastCount = parseInt(lastTransaction.numbering.split("-")[1]);
    nextNumber = lastCount + 1;
  }

  return `${currentYear}-${nextNumber}`;
}
