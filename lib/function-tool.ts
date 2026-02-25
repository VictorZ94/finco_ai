import { prisma } from "@/lib/prisma";
import { getOrCreateAccount, getNumbering } from "./helpers";

export const createAccountingTransactionFromChat = async (
  transaction: any,
  userId: string,
  messageId?: string,
) => {
  const numbering = await getNumbering(userId);
  
  // Use getOrCreateAccount to ensure transaction never fails due to missing categories
  const accountCategory = await getOrCreateAccount(userId, transaction.category);
  const accountPaymentMethod = await getOrCreateAccount(userId, transaction.paymentMethod);

  return await prisma.$transaction(async (tx) => {
    return await tx.transactions.create({
      data: {
        description: transaction.description,
        date: new Date(transaction.date),
        numbering,
        userId,
        messageId,
        ledgerEntries: {
          createMany: {
            data: [
              {
                debit: transaction.type === 'expense' ? transaction.amount : 0,
                credit: transaction.type === 'income' ? transaction.amount : 0,
                accountId: accountCategory.id,
              },
              {
                debit: transaction.type === 'income' ? transaction.amount : 0,
                credit: transaction.type === 'expense' ? transaction.amount : 0,
                accountId: accountPaymentMethod.id,
              },
            ],
          },
        },
      },
    });
  });
};
