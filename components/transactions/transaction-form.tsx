
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinancialAccounts } from '@prisma/client';
import { X, Plus } from 'lucide-react';

interface TransactionFormProps {
  transaction?: any; // Full transaction object for editing
  onSave: (data: any) => void;
  onCancel: () => void;
  accounts: FinancialAccounts[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSave,
  onCancel,
  accounts,
}) => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setLedgerEntries(
        transaction.ledgerEntries.map((entry: any) => ({
          accountId: entry.accountId,
          debit: parseFloat(entry.debit),
          credit: parseFloat(entry.credit),
        }))
      );
    }
  }, [transaction]);

  const handleEntryChange = (index: number, field: string, value: any) => {
    const newEntries = [...ledgerEntries];
    (newEntries[index] as any)[field] = value;
    setLedgerEntries(newEntries);
  };

  const addEntry = () => {
    setLedgerEntries([...ledgerEntries, { accountId: '', debit: 0, credit: 0 }]);
  };

  const removeEntry = (index: number) => {
    const newEntries = ledgerEntries.filter((_, i) => i !== index);
    setLedgerEntries(newEntries);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ description, date, ledgerEntries });
  };

  const totalDebit = ledgerEntries.reduce((acc, entry) => acc + Number(entry.debit), 0);
  const totalCredit = ledgerEntries.reduce((acc, entry) => acc + Number(entry.credit), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ledgerEntries.map((entry, index) => (
            <TableRow key={index}>
              <TableCell>
                <Select
                  value={entry.accountId}
                  onValueChange={(value) =>
                    handleEntryChange(index, 'accountId', value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={entry.debit}
                  onChange={(e) =>
                    handleEntryChange(index, 'debit', parseFloat(e.target.value))
                  }
                  className="text-right"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={entry.credit}
                  onChange={(e) =>
                    handleEntryChange(index, 'credit', parseFloat(e.target.value))
                  }
                  className="text-right"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-2" /> Add Entry
        </Button>
        <div className="text-right">
            <div className={`font-bold ${isBalanced ? 'text-green-500' : 'text-red-500'}`}>
                Total Debit: {totalDebit.toFixed(2)} | Total Credit: {totalCredit.toFixed(2)}
            </div>
            {!isBalanced && <p className="text-red-500 text-xs">Debits must equal credits.</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isBalanced}>
          {transaction ? 'Update' : 'Create'} Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
