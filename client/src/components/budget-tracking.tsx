import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import * as Icons from "lucide-react";
import { useState } from "react";
import ManageBudgetsDialog from "@/components/manage-budgets-dialog";

interface BudgetTrackingProps {
  selectedMonth: string;
}

export default function BudgetTracking({ selectedMonth }: BudgetTrackingProps) {
  const { data: budgets, isLoading } = useQuery<any[]>({
    queryKey: ["/api/budgets", { selectedMonth }],
  });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const [open, setOpen] = useState(false);

  const { data: insights } = useQuery<any[]>({
    queryKey: ["/api/insights"],
  });

  const getInsightForCategory = (category: string) => {
    return insights?.find(insight => insight.category === category && insight.isRead === "false");
  };

  const insightIcons = {
    warning: AlertTriangle,
    success: TrendingUp,
    info: BarChart3,
  };

  const insightColors = {
    warning: "text-warning",
    success: "text-secondary",
    info: "text-primary",
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl">
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
      currency: "MAD",
    })
      .format(parseFloat(amount))
      .replace("MAD", "DH");
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
    <>
      <ManageBudgetsDialog open={open} onOpenChange={setOpen} />
      <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '200ms'}}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">Budget Overview</CardTitle>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80 font-medium text-sm transition-all hover:scale-105" 
              data-testid="button-manage-budgets" 
              onClick={() => setOpen(true)}
            >
              Manage Budgets
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {budgets?.map((budget: any, index: number) => {
              const category = categories?.find((c: any) => c.name === budget.category);
              const IconComponent = (Icons as any)[category?.icon] || (Icons as any)["Circle"];
              const progress = calculateProgress(budget.currentSpent, budget.monthlyLimit);
              const remaining = parseFloat(budget.monthlyLimit) - parseFloat(budget.currentSpent);
              
              return (
                <div key={budget.id} className="space-y-3 animate-fadeIn" style={{animationDelay: `${300 + index * 100}ms`}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: `${category?.color || "#3b82f6"}20`, color: category?.color || "#3b82f6" }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground" data-testid={`text-category-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {budget.category}
                          </p>
                          {(() => {
                            const insight = getInsightForCategory(budget.category);
                            if (insight) {
                              const InsightIcon = insightIcons[insight.type as keyof typeof insightIcons] || BarChart3;
                              const iconColor = insightColors[insight.type as keyof typeof insightColors] || "text-primary";
                              return (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button 
                                      className={`insight-badge p-1 hover:bg-accent rounded-full transition-colors ${iconColor}`} 
                                      data-testid={`insight-icon-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                                    >
                                      <InsightIcon className="h-4 w-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" side="top">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-sm">{insight.title}</p>
                                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-spending-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                          {formatCurrency(budget.currentSpent)} of {formatCurrency(budget.monthlyLimit)} spent
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getRemainingColor(budget.currentSpent, budget.monthlyLimit)}`} data-testid={`text-remaining-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {remaining < 0 ? `-${formatCurrency(Math.abs(remaining).toString())}` : formatCurrency(remaining.toString())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {remaining < 0 ? "over budget" : "remaining"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(budget.currentSpent, budget.monthlyLimit)}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}