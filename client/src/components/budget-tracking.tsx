import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Car, Gamepad2, ShoppingBag, Zap } from "lucide-react";

const categoryIcons = {
  "Food & Dining": Utensils,
  "Transportation": Car,
  "Entertainment": Gamepad2,
  "Shopping": ShoppingBag,
  "Bills & Utilities": Zap,
};

const categoryColors = {
  "Food & Dining": "bg-blue-100 text-blue-600",
  "Transportation": "bg-purple-100 text-purple-600",
  "Entertainment": "bg-green-100 text-green-600",
  "Shopping": "bg-red-100 text-red-600",
  "Bills & Utilities": "bg-yellow-100 text-yellow-600",
};

export default function BudgetTracking() {
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  const calculateProgress = (spent: string, limit: string) => {
    return (parseFloat(spent) / parseFloat(limit)) * 100;
  };

  const getRemainingColor = (spent: string, limit: string) => {
    const remaining = parseFloat(limit) - parseFloat(spent);
    const progress = calculateProgress(spent, limit);
    
    if (progress > 100) return "text-destructive";
    if (progress > 80) return "text-warning";
    return "text-foreground";
  };

  const getProgressColor = (spent: string, limit: string) => {
    const progress = calculateProgress(spent, limit);
    
    if (progress > 100) return "bg-destructive";
    if (progress > 80) return "bg-warning";
    return "bg-secondary";
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Budget Overview</CardTitle>
          <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium text-sm" data-testid="button-manage-budgets">
            Manage Budgets
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {budgets?.map((budget: any) => {
            const IconComponent = categoryIcons[budget.category as keyof typeof categoryIcons] || Utensils;
            const iconColor = categoryColors[budget.category as keyof typeof categoryColors] || "bg-blue-100 text-blue-600";
            const progress = calculateProgress(budget.currentSpent, budget.monthlyLimit);
            const remaining = parseFloat(budget.monthlyLimit) - parseFloat(budget.currentSpent);
            
            return (
              <div key={budget.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-category-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {budget.category}
                      </p>
                      <p className="text-sm text-gray-500" data-testid={`text-spending-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {formatCurrency(budget.currentSpent)} of {formatCurrency(budget.monthlyLimit)} spent
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getRemainingColor(budget.currentSpent, budget.monthlyLimit)}`} data-testid={`text-remaining-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {remaining < 0 ? `-${formatCurrency(Math.abs(remaining).toString())}` : formatCurrency(remaining.toString())}
                    </p>
                    <p className="text-sm text-gray-500">
                      {remaining < 0 ? "over budget" : "remaining"}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(budget.currentSpent, budget.monthlyLimit)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
