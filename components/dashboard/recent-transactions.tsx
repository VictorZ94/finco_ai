
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

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: string;
  status: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

const RecentTransactions = ({ transactions = [] }: RecentTransactionsProps) => {
  return (
    <Card className="rounded-lg border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Here are the most recent transactions from your accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No recent transactions found.</p>
          </div>
        ) : (
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
                        ? 'text-green-500 font-medium'
                        : 'text-red-500 font-medium'
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
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
