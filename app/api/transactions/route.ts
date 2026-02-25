
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET all transactions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transactions.findMany({
      where: { userId: session.user.id },
      include: {
        ledgerEntries: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST a new transaction
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { description, date, ledgerEntries } = await req.json();

  if (!description || !date || !ledgerEntries || !Array.isArray(ledgerEntries)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const newTransaction = await prisma.transactions.create({
      data: {
        description,
        date: new Date(date),
        numbering: 'manual', // Or generate a unique one
        userId: session.user.id,
        ledgerEntries: {
          create: ledgerEntries.map(
            (entry: {
              accountId: string;
              debit: number;
              credit: number;
            }) => ({
              accountId: entry.accountId,
              debit: entry.debit,
              credit: entry.credit,
            })
          ),
        },
      },
      include: {
        ledgerEntries: true,
      },
    });
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
