import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IncomeExpenseChart = () => {
  return (
    <Card className="rounded-lg border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-md">
          <p className="text-gray-500">Line chart placeholder</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
