import { auth } from "@/lib/auth";
import { verifyServerAuth } from "@/lib/middlewares/verify-auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export async function GET(request: Request) {
  return verifyServerAuth(async (session: Session) => {
    try {
      const { searchParams } = new URL(request.url);
      const movableOnly = searchParams.get("movable") === "true";

      const accounts = await prisma.financialAccounts.findMany({
        where: {
          userId: session!.user.id,
          ...(movableOnly ? { canReceiveMovement: true } : {}),
        },
        orderBy: { code: "asc" },
      });

      // Get direct sums for each account
      const balances = await prisma.ledgerEntries.groupBy({
        by: ["accountId"],
        _sum: {
          debit: true,
          credit: true,
        },
        where: {
          account: {
            userId: session!.user.id,
          },
        },
      });

      // Map balances to account IDs for easy lookup
      const balanceMap: Record<string, { debit: number; credit: number }> = {};
      balances.forEach((b) => {
        balanceMap[b.accountId] = {
          debit: b._sum.debit ? Number(b._sum.debit) : 0,
          credit: b._sum.credit ? Number(b._sum.credit) : 0,
        };
      });

      // Calculate hierarchical totals
      const calculateTotals = (
        accountId: string,
      ): { totalDebit: number; totalCredit: number } => {
        const direct = balanceMap[accountId] || { debit: 0, credit: 0 };
        const children = accounts.filter((a) => a.parentId === accountId);

        let totalDebit = direct.debit;
        let totalCredit = direct.credit;

        children.forEach((child) => {
          const childTotals = calculateTotals(child.id);
          totalDebit += childTotals.totalDebit;
          totalCredit += childTotals.totalCredit;
        });

        return { totalDebit, totalCredit };
      };

      // Add totals to each account
      const accountsWithBalances = accounts.map((account) => {
        const totals = calculateTotals(account.id);
        return {
          ...account,
          totalDebit: totals.totalDebit,
          totalCredit: totals.totalCredit,
        };
      });

      return NextResponse.json(accountsWithBalances);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, nature, canReceiveMovement } = body;

    // Basic validation
    if (!code || !name || !nature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Determine level based on code length (1, 2, 4, 6)
    // 1 digit -> Level 1
    // 2 digits -> Level 2
    // 4 digits -> Level 3
    // 6 digits -> Level 4
    let level = 1;
    if (code.length === 2) level = 2;
    else if (code.length === 4) level = 3;
    else if (code.length >= 6) level = 4;

    // Find parent
    let parentId = null;
    if (level > 1) {
      const parentCode =
        level === 2
          ? code[0]
          : level === 3
            ? code.substring(0, 2)
            : code.substring(0, 4);
      const parent = await prisma.financialAccounts.findUnique({
        where: { userId_code: { userId: session.user.id, code: parentCode } },
      });
      if (!parent) {
        return NextResponse.json(
          { error: `Parent account with code ${parentCode} not found` },
          { status: 400 },
        );
      }
      parentId = parent.id;
    }

    const newAccount = await prisma.financialAccounts.create({
      data: {
        code,
        name,
        nature,
        level,
        canReceiveMovement: canReceiveMovement || level === 4, // Default true for subaccounts
        userId: session.user.id,
        parentId,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
