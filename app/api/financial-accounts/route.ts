import { auth } from "@/lib/auth";
import { Session, verifyServerAuth } from "@/lib/middlewares/verify-auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return verifyServerAuth(async (session: Session) => {
    try {
      const { searchParams } = new URL(request.url);
      const movableOnly = searchParams.get("movable") === "true";

      const dbAccounts = await prisma.financialAccounts.findMany({
        where: {
          userId: session!.user.id,
        },
        orderBy: { code: "asc" },
      });

      // Get direct sums for each account from ledger entries
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

      const directBalanceMap: Record<string, { debit: number; credit: number }> = {};
      balances.forEach((b) => {
        directBalanceMap[b.accountId] = {
          debit: b._sum.debit ? Number(b._sum.debit) : 0,
          credit: b._sum.credit ? Number(b._sum.credit) : 0,
        };
      });

      // Map to quickly find accounts by code
      const accountsByCode = new Map();
      dbAccounts.forEach(a => accountsByCode.set(a.code, { ...a, isSynthetic: false }));

      const getAccountMeta = (code: string) => {
        const firstDigit = code[0];
        let nature = "DEBIT";
        let accountType = "ASSET";
        let name = "Cuenta Genérica";

        if (firstDigit === '1') { name = "Activo"; nature = "DEBIT"; accountType = "ASSET"; }
        else if (firstDigit === '2') { name = "Pasivo"; nature = "CREDIT"; accountType = "LIABILITY"; }
        else if (firstDigit === '3') { name = "Patrimonio"; nature = "CREDIT"; accountType = "EQUITY"; }
        else if (firstDigit === '4') { name = "Ingresos"; nature = "CREDIT"; accountType = "INCOME"; }
        else if (firstDigit === '5') { name = "Gastos"; nature = "DEBIT"; accountType = "EXPENSE"; }

        // Specific names for common levels
        if (code === '11') name = "Disponible";
        if (code === '1105') name = "Caja";
        if (code === '21') name = "Obligaciones Financieras";
        if (code === '41') name = "Operacionales";
        if (code === '51') name = "Operacionales de Administración";
        if (code === '5105') name = "Gastos de Personal";

        return { name, nature, accountType };
      };

      // Synthesize missing parents
      dbAccounts.forEach(acc => {
        const code = acc.code;
        const parts = [];
        
        // Extract hierarchy: 5105-01 -> 5, 51, 5105
        if (code.includes('-')) {
          const base = code.split('-')[0];
          parts.push(base[0]); // Level 1
          if (base.length >= 2) parts.push(base.substring(0, 2)); // Level 2
          if (base.length >= 4) parts.push(base.substring(0, 4)); // Level 3
        } else {
          if (code.length >= 1) parts.push(code[0]);
          if (code.length >= 2) parts.push(code.substring(0, 2));
          if (code.length >= 4) parts.push(code.substring(0, 4));
        }

        parts.forEach(pCode => {
          if (!accountsByCode.has(pCode)) {
            const meta = getAccountMeta(pCode);
            accountsByCode.set(pCode, {
              id: `synthetic-${pCode}`,
              code: pCode,
              name: meta.name,
              nature: meta.nature,
              accountType: meta.accountType,
              level: pCode.length === 1 ? 1 : pCode.length === 2 ? 2 : 3,
              canReceiveMovement: false,
              userId: session!.user.id,
              isSynthetic: true
            });
          }
        });
      });

      const allAccounts = Array.from(accountsByCode.values());

      // Helper to check if code 'child' is a descendant of code 'parent'
      const isDescendant = (parent: string, child: string) => {
        if (parent === child) return false;
        const cleanParent = parent.replace('-', '');
        const cleanChild = child.replace('-', '');
        return cleanChild.startsWith(cleanParent);
      };

      // Calculate totals and hierarchy info
      let result = allAccounts.map((account) => {
        let totalDebit = directBalanceMap[account.id]?.debit || 0;
        let totalCredit = directBalanceMap[account.id]?.credit || 0;

        // Sum real descendants from DB
        dbAccounts.forEach(other => {
          if (isDescendant(account.code, other.code)) {
            const otherBalance = directBalanceMap[other.id];
            if (otherBalance) {
              totalDebit += otherBalance.debit;
              totalCredit += otherBalance.credit;
            }
          }
        });

        // Dynamic Level
        const code = account.code;
        let dynamicLevel = 1;
        if (code.includes('-')) dynamicLevel = 4;
        else if (code.length === 4) dynamicLevel = 3;
        else if (code.length === 2) dynamicLevel = 2;

        // Dynamic Parent ID
        let dynamicParentId = null;
        if (dynamicLevel > 1) {
          let parentCode = "";
          if (dynamicLevel === 4) parentCode = code.split('-')[0];
          else if (dynamicLevel === 3) parentCode = code.substring(0, 2);
          else if (dynamicLevel === 2) parentCode = code.substring(0, 1);

          const parent = allAccounts.find(a => a.code === parentCode);
          dynamicParentId = parent ? parent.id : null;
        }

        return {
          ...account,
          level: dynamicLevel,
          parentId: dynamicParentId,
          totalDebit,
          totalCredit,
        };
      });

      if (movableOnly) {
        result = result.filter(a => a.canReceiveMovement);
      }

      return NextResponse.json(result.sort((a, b) => a.code.localeCompare(b.code)));
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
    const { code, name, nature, canReceiveMovement, accountType } = body;

    if (!code || !name || !nature || !accountType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Determine level dynamically
    let level = 1;
    if (code.includes('-')) level = 4;
    else if (code.length === 2) level = 2;
    else if (code.length === 4) level = 3;
    else if (code.length >= 6) level = 4;

    // Determine parent code
    let parentId = null;
    if (level > 1) {
      let parentCode = "";
      if (code.includes('-')) parentCode = code.split('-')[0];
      else if (level === 2) parentCode = code[0];
      else if (level === 3) parentCode = code.substring(0, 2);
      else if (level === 4) parentCode = code.substring(0, 4);

      const parent = await prisma.financialAccounts.findUnique({
        where: { userId_code: { userId: session.user.id, code: parentCode } },
      });
      parentId = parent?.id || null;
    }

    const newAccount = await prisma.financialAccounts.create({
      data: {
        code,
        name,
        nature,
        level,
        accountType,
        canReceiveMovement: canReceiveMovement !== undefined ? canReceiveMovement : (level === 4),
        userId: session.user.id,
        parentId,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
