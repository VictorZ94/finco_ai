
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Wallet,
} from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: string;
  percentage: string;
  isIncrease: boolean;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  percentage,
  isIncrease,
  icon,
}) => {
  return (
    <Card className="rounded-lg border-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{amount}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          {isIncrease ? (
            <ArrowUp className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-500" />
          )}
          {percentage} from last month
        </p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
