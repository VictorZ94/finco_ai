
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const transactions = [
  {
    date: '2024-07-28',
    description: 'Bonsai Coffee Roasters',
    category: 'Food',
    amount: '-$12.50',
    status: 'Completed',
  },
  {
    date: '2024-07-27',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    amount: '-$15.99',
    status: 'Completed',
  },
  {
    date: '2024-07-26',
    description: 'Salary Deposit',
    category: 'Income',
    amount: '+$5,000.00',
    status: 'Completed',
  },
  {
    date: '2024-07-25',
    description: 'Amazon Purchase',
    category: 'Shopping',
    amount: '-$250.75',
    status: 'Pending',
  },
  {
    date: '2024-07-24',
    description: 'Gas Bill',
    category: 'Utilities',
    amount: '-$75.00',
    status: 'Completed',
  },
];

const RecentTransactions = () => {
  return (
    <Card className="rounded-lg border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Here are the most recent transactions from your accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell
                  className={
                    transaction.amount.startsWith('+')
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {transaction.amount}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.status === 'Completed'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
