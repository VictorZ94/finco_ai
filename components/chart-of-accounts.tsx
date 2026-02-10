"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  level: number;
  canReceiveMovement: boolean;
  parentId: string | null;
  totalDebit: number;
  totalCredit: number;
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/financial-accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data);
        // Initially expand level 1 and 2
        const initialExpanded: Record<string, boolean> = {};
        data.forEach((a: Account) => {
          if (a.level < 2) initialExpanded[a.code] = true;
        });
        setExpanded(initialExpanded);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderAccount = (account: Account) => {
    const isExpanded = expanded[account.code];
    const hasChildren = accounts.some((a) => a.parentId === account.id);
    const depth = account.level - 1;

    // Filter children for this account if expanded
    const children = accounts.filter((a) => a.parentId === account.id);

    return (
      <div key={account.id} className="w-full">
        <div 
          className={`flex items-center p-2 hover:bg-slate-50 border-b last:border-0 cursor-pointer ${account.level === 1 ? 'bg-slate-50/50 font-bold' : ''}`}
          onClick={() => hasChildren && toggleExpand(account.code)}
        >
          <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft: `${depth * 1.5}rem` }}>
            <span className="w-6 flex-shrink-0 flex items-center justify-center">
              {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
            </span>
            <span className="w-20 flex-shrink-0 font-mono text-xs text-slate-500">{account.code}</span>
            <span className="truncate text-sm">{account.name}</span>
            {account.canReceiveMovement && (
              <span className="ml-2 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full uppercase font-semibold">Aux</span>
            )}
          </div>
          
          <div className="flex w-64 text-right text-sm font-mono">
            <div className="w-32 px-2 text-blue-700">
              {account.totalDebit > 0 ? formatCurrency(account.totalDebit) : "—"}
            </div>
            <div className="w-32 px-2 text-red-700">
              {account.totalCredit > 0 ? formatCurrency(account.totalCredit) : "—"}
            </div>
          </div>
        </div>
        {isExpanded && children.map(renderAccount)}
      </div>
    );
  };

  // Start with top-level accounts (level 1)
  const rootAccounts = accounts.filter((a) => a.level === 1);

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30">
        <div>
          <CardTitle className="text-xl">Balance de Comprobación</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Saldos acumulados por jerarquía de cuentas</p>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center p-2 bg-slate-100/50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b">
          <div className="flex-1 px-8">Cuenta / Nombre</div>
          <div className="flex w-64 text-right">
            <div className="w-32 px-2">Débito</div>
            <div className="w-32 px-2">Crédito</div>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="bg-white overflow-hidden">
            {rootAccounts.length > 0 ? (
              rootAccounts.map(renderAccount)
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p>No hay cuentas configuradas en el sistema.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
