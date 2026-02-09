import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const movableOnly = searchParams.get("movable") === "true";

    const accounts = await prisma.financialAccounts.findMany({
      where: {
        userId: session.user.id,
        ...(movableOnly ? { canReceiveMovement: true } : {}),
      },
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: { ledgerEntries: true }
        }
      }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
      const parentCode = level === 2 ? code[0] : (level === 3 ? code.substring(0, 2) : code.substring(0, 4));
      const parent = await prisma.financialAccounts.findUnique({
        where: { userId_code: { userId: session.user.id, code: parentCode } },
      });
      if (!parent) {
        return NextResponse.json({ error: `Parent account with code ${parentCode} not found` }, { status: 400 });
      }
      parentId = parent.id;
    }

    const newAccount = await prisma.financialAccounts.create({
      data: {
        code,
        name,
        nature,
        level,
        canReceiveMovement: canReceiveMovement || (level === 4), // Default true for subaccounts
        userId: session.user.id,
        parentId,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
