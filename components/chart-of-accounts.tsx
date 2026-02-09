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
        setLoading(false);
      });
  }, []);

  const toggleExpand = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
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
          className={`flex items-center p-2 hover:bg-slate-100 rounded-md cursor-pointer ${account.canReceiveMovement ? 'text-blue-600' : 'font-bold'}`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => hasChildren && toggleExpand(account.code)}
        >
          <span className="w-6 flex items-center justify-center">
            {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : null}
          </span>
          <span className="w-20 font-mono text-sm">{account.code}</span>
          <span className="flex-1">{account.name}</span>
          {account.canReceiveMovement && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase font-medium">Movible</span>
          )}
        </div>
        {isExpanded && children.map(renderAccount)}
      </div>
    );
  };

  // Start with top-level accounts (level 1)
  const rootAccounts = accounts.filter((a) => a.level === 1);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Catálogo de Cuentas</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-10">Cargando catálogo...</div>
        ) : (
          <div className="border rounded-lg divide-y bg-white">
            {rootAccounts.length > 0 ? (
              rootAccounts.map(renderAccount)
            ) : (
              <div className="p-4 text-center text-slate-500">No hay cuentas configuradas.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
