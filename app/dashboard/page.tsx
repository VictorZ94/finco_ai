
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

const summaryData = [
  {
    title: 'Total Income',
    amount: '$12,345.67',
    percentage: '12.5%',
    isIncrease: true,
    icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Total Expenses',
    amount: '$6,543.21',
    percentage: '8.2%',
    isIncrease: false,
    icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Net Balance',
    amount: '$5,802.46',
    percentage: '4.3%',
    isIncrease: true,
    icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Accounts Receivable',
    amount: '$1,234.56',
    percentage: '15.0%',
    isIncrease: true,
    icon: <ArrowRight className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: 'Accounts Payable',
    amount: '$789.01',
    percentage: '5.0%',
    isIncrease: false,
    icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
  },
];

const DashboardPage = () => {
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
          <IncomeExpenseChart />
        </div>
        <div className="lg:col-span-3">
          <ExpenseDistributionChart />
        </div>
      </div>
      <div>
        <RecentTransactions />
      </div>
    </div>
  );
};

export default DashboardPage;
