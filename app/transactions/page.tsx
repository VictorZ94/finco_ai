
import React from 'react';
import TransactionList from '@/components/transactions/transaction-list';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manual Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <TransactionList />
      </Card>
    </div>
  );
}
