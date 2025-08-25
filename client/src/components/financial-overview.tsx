import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialOverview() {
  const { data: overview, isLoading } = useQuery<{
    currentBalance: number;
    monthlyIncome: number;
    monthlySpending: number;
    savingsProgress: number;
  }>({
    queryKey: ["/api/analytics/overview"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-20 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
    })
      .format(amount)
      .replace("MAD", "DH");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '0ms'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-current-balance">
                {formatCurrency(overview?.currentBalance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
              <Wallet className="text-secondary h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-sm text-secondary font-medium" data-testid="text-balance-change">
              {(overview?.currentBalance || 0) > 0
                ? `+${formatCurrency(Math.abs(overview?.currentBalance || 0))}`
                : formatCurrency(overview?.currentBalance || 0)} this month
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '100ms'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-income">
                {formatCurrency(overview?.monthlyIncome || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
              <TrendingUp className="text-secondary h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-sm text-secondary font-medium">On track</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '200ms'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Spending</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-spending">
                {formatCurrency(overview?.monthlySpending || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
              <TrendingDown className="text-warning h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-sm text-warning font-medium" data-testid="text-spending-status">
              Track your progress
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '300ms'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Savings Goal</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-savings-progress">
                {overview?.savingsProgress || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
              <Target className="text-primary h-6 w-6" />
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: `${Math.min(overview?.savingsProgress || 0, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
