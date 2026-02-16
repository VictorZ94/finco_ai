import { prisma } from "@/lib/prisma";
import { findAccountByName, getNumbering } from "./helpers";

export const createAccountingTransactionFromChat = async (
  transaction: any,
  userId: string,
) => {
  const numbering = await getNumbering(userId);
  const accountCategory = await findAccountByName(userId, transaction.category);
  const accountPaymentMethod = await findAccountByName(
    userId,
    transaction.paymentMethod,
  );

  return await prisma.$transaction(async (tx) => {
    return await tx.transactions.create({
      data: {
        description: transaction.description,
        date: new Date(transaction.date),
        numbering,
        userId,
        ledgerEntries: {
          createMany: {
            data: [
              {
                debit: transaction.amount,
                accountId: accountCategory!.id,
              },
              {
                credit: transaction.amount,
                accountId: accountPaymentMethod!.id,
              },
            ],
          },
        },
      },
    });
  });
};
