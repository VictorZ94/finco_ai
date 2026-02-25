
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionData {
  name: string;
  value: number;
}

interface ExpenseDistributionChartProps {
  data?: DistributionData[];
}

const ExpenseDistributionChart = ({ data = [] }: ExpenseDistributionChartProps) => {
  return (
    <Card className="rounded-lg border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Expense Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center bg-gray-50/50 rounded-md border border-dashed">
            <p className="text-muted-foreground">No expense data for this period.</p>
          </div>
        ) : (
          <div className="h-80 w-full flex flex-col justify-center space-y-4">
            {/* Real pie/donut chart would go here */}
            <p className="text-sm text-center text-muted-foreground mb-4">Expense categories by value:</p>
            <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2">
              {data.sort((a,b) => b.value - a.value).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="truncate flex-1 font-medium">{item.name}</span>
                  <span className="ml-4 tabular-nums">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseDistributionChart;
