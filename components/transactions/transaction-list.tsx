
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TransactionForm from './transaction-form';
import { FinancialAccounts } from '@prisma/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccounts[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  const fetchAccounts = async () => {
    // This assumes an API endpoint to get financial accounts exists.
    // We will create this if it does not exist.
    const res = await fetch('/api/financial-accounts');
    if (res.ok) {
        const data = await res.json();
        setAccounts(data);
    } else {
        console.error("Failed to fetch accounts");
        setAccounts([]); // Set empty array on failure
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, []);

  const handleSave = async (data: any) => {
    const url = selectedTransaction
      ? `/api/transactions/${selectedTransaction.id}`
      : '/api/transactions';
    const method = selectedTransaction ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchTransactions();
      setIsFormOpen(false);
      setSelectedTransaction(null);
    } else {
      // Handle error
      console.error('Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
      } else {
        console.error('Failed to delete transaction');
      }
    }
  };

  const openForm = (transaction: any | null = null) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Edit' : 'Create'} Transaction
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={selectedTransaction}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedTransaction(null);
            }}
            accounts={accounts}
          />
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const totalDebit = t.ledgerEntries.reduce(
              (acc: any, entry: any) => acc + parseFloat(entry.debit),
              0
            );
            return (
              <TableRow key={t.id}>
                <TableCell>
                  {new Date(t.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell className="text-right">
                  ${totalDebit.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openForm(t)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
