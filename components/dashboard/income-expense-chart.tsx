import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data?: MonthlyData[];
}

const IncomeExpenseChart = ({ data = [] }: IncomeExpenseChartProps) => {
  return (
    <Card className="rounded-lg border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center bg-gray-50/50 rounded-md border border-dashed">
            <p className="text-muted-foreground">Not enough data to generate chart.</p>
          </div>
        ) : (
          <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-md">
            <p className="text-gray-500">Real line chart with {data.length} months</p>
            {/* Here we would use Recharts if installed */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
