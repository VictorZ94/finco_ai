import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getUserContext(userId: string) {
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
  return accounts;
}

export async function findAccountByName(userId: string, name: string) {
  return await prisma.financialAccounts.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      canReceiveMovement: true,
    },
  });
}
