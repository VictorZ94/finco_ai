import ChartOfAccounts from "@/components/chart-of-accounts";

export default function AccountsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión Financiera</h1>
        <p className="text-muted-foreground">Administra tu plan de cuentas y visualiza la estructura jerárquica.</p>
      </div>
      <ChartOfAccounts />
    </div>
  );
}
