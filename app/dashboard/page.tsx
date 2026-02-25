import React from 'react';
import SummaryCard from '@/components/dashboard/summary-card';
import IncomeExpenseChart from '@/components/dashboard/income-expense-chart';
import ExpenseDistributionChart from '@/components/dashboard/expense-distribution-chart';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import {
  DollarSign,
  CreditCard,
  Wallet,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AccountType } from '@/generated/prisma/client';

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/api/auth/signin');
  }

  const userId = session.user.id;

  // Fetch all ledger entries for the user to calculate balances
  // In a real large-scale app, we would use aggregations or specialized tables
  const ledgerEntries = await prisma.ledgerEntries.findMany({
    where: {
      transaction: {
        userId: userId,
      },
    },
    include: {
      account: true,
      transaction: true,
    },
  });

  const summary = ledgerEntries.reduce(
    (acc, entry) => {
      const { debit, credit, account } = entry;
      const d = Number(debit);
      const c = Number(credit);

      switch (account.accountType) {
        case AccountType.INCOME:
          acc.income += c - d;
          break;
        case AccountType.EXPENSE:
          acc.expenses += d - c;
          break;
        case AccountType.ASSET:
          acc.assets += d - c;
          // Simplified Accounts Receivable logic (e.g., accounts starting with 13)
          if (account.code.startsWith('13')) {
            acc.receivable += d - c;
          }
          break;
        case AccountType.LIABILITY:
          acc.liabilities += c - d;
          // Simplified Accounts Payable logic (e.g., accounts starting with 23)
          if (account.code.startsWith('23')) {
            acc.payable += c - d;
          }
          break;
      }
      return acc;
    },
    { income: 0, expenses: 0, assets: 0, liabilities: 0, receivable: 0, payable: 0 }
  );

  const netBalance = summary.assets - summary.liabilities;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate monthly trends for Income vs Expenses
  const monthlyData: Record<string, { month: string, income: number, expense: number }> = {};
  
  // Calculate distribution for Expenses
  const distributionData: Record<string, { name: string, value: number }> = {};

  ledgerEntries.forEach(entry => {
    const date = entry.transaction.date;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'short' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthLabel, income: 0, expense: 0 };
    }

    const d = Number(entry.debit);
    const c = Number(entry.credit);

    if (entry.account.accountType === AccountType.INCOME) {
      monthlyData[monthKey].income += c - d;
    } else if (entry.account.accountType === AccountType.EXPENSE) {
      const amount = d - c;
      monthlyData[monthKey].expense += amount;

      const categoryName = entry.account.name;
      if (!distributionData[categoryName]) {
        distributionData[categoryName] = { name: categoryName, value: 0 };
      }
      distributionData[categoryName].value += amount;
    }
  });

  const chartData = Object.values(monthlyData).sort((a, b) => {
    // Sort by date key if needed
    return 0;
  });

  const distributionList = Object.values(distributionData);

  const summaryData = [
    {
      title: 'Total Income',
      amount: formatCurrency(summary.income),
      percentage: '0%', // Placeholder for now
      isIncrease: true,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Total Expenses',
      amount: formatCurrency(summary.expenses),
      percentage: '0%',
      isIncrease: false,
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Net Balance',
      amount: formatCurrency(netBalance),
      percentage: '0%',
      isIncrease: netBalance >= 0,
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Accounts Receivable',
      amount: formatCurrency(summary.receivable),
      percentage: '0%',
      isIncrease: true,
      icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Accounts Payable',
      amount: formatCurrency(summary.payable),
      percentage: '0%',
      isIncrease: false,
      icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  // Fetch recent transactions
  const recentTransactions = await prisma.transactions.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      ledgerEntries: {
        include: {
          account: true,
        },
      },
    },
  });

  const formattedTransactions = recentTransactions.map((t) => {
    // Determine a primary category and amount for display
    const expenseEntry = t.ledgerEntries.find(e => e.account.accountType === AccountType.EXPENSE);
    const incomeEntry = t.ledgerEntries.find(e => e.account.accountType === AccountType.INCOME);
    const assetEntry = t.ledgerEntries.find(e => e.account.accountType === AccountType.ASSET);
    
    let category = 'Transfer';
    let amount = 0;
    let isIncome = false;

    if (expenseEntry) {
      category = expenseEntry.account.name;
      amount = Number(expenseEntry.debit) - Number(expenseEntry.credit);
    } else if (incomeEntry) {
      category = incomeEntry.account.name;
      amount = Number(incomeEntry.credit) - Number(incomeEntry.debit);
      isIncome = true;
    } else if (assetEntry) {
      category = assetEntry.account.name;
      amount = Math.abs(Number(assetEntry.debit) - Number(assetEntry.credit));
    }

    return {
      date: t.date.toISOString().split('T')[0],
      description: t.description || 'No description',
      category,
      amount: (isIncome ? '+' : '-') + formatCurrency(amount),
      status: 'Completed',
    };
  });

  const hasData = ledgerEntries.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-6 bg-muted rounded-full">
          <Wallet className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">No data yet</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Start by adding your first transaction or connecting an account to see your financial overview here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {summaryData.map((data, index) => (
          <SummaryCard
            key={index}
            title={data.title}
            amount={data.amount}
            percentage={data.percentage}
            isIncrease={data.isIncrease}
            icon={data.icon}
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <IncomeExpenseChart data={chartData} />
        </div>
        <div className="lg:col-span-3">
          <ExpenseDistributionChart data={distributionList} />
        </div>
      </div>
      <div>
        <RecentTransactions transactions={formattedTransactions} />
      </div>
    </div>
  );
};

export default DashboardPage;
