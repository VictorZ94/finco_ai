
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET a single transaction by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const transaction = await prisma.transactions.findFirst({
      where: { id, userId: session.user.id },
      include: {
        ledgerEntries: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error(`Error fetching transaction ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT (update) a transaction by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { description, date, ledgerEntries } = await req.json();

  if (!description || !date || !ledgerEntries || !Array.isArray(ledgerEntries)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // First, delete existing ledger entries for this transaction
    await prisma.ledgerEntries.deleteMany({
      where: { transactionId: id },
    });

    // Then, update the transaction and create the new ledger entries
    const updatedTransaction = await prisma.transactions.update({
      where: { id },
      data: {
        description,
        date: new Date(date),
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

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE a transaction by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.transactions.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
