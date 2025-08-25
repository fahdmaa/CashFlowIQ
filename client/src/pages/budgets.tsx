import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { PiggyBank, Target, AlertTriangle, TrendingUp, Settings, Plus, PieChart } from "lucide-react";
import Header from "@/components/header";
import ManageBudgetsDialog from "@/components/manage-budgets-dialog";
import { Progress } from "@/components/ui/progress";
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Budgets() {
  const [isManageBudgetsOpen, setIsManageBudgetsOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  const { data: budgets, isLoading: budgetsLoading } = useQuery<any[]>({
    queryKey: ["/api/budgets"],
  });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
    })
      .format(value)
      .replace("MAD", "DH");
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!budgets) return { totalBudget: 0, totalSpent: 0, totalRemaining: 0, budgetsOverLimit: 0 };
    
    const totals = budgets.reduce((acc, budget) => {
      const limit = parseFloat(budget.monthlyLimit);
      const spent = parseFloat(budget.currentSpent);
      const remaining = limit - spent;
      
      acc.totalBudget += limit;
      acc.totalSpent += spent;
      acc.totalRemaining += Math.max(0, remaining);
      if (spent > limit) acc.budgetsOverLimit++;
      
      return acc;
    }, { totalBudget: 0, totalSpent: 0, totalRemaining: 0, budgetsOverLimit: 0 });
    
    return totals;
  };

  const totals = calculateTotals();
  const overallProgress = totals.totalBudget > 0 
    ? (totals.totalSpent / totals.totalBudget) * 100 
    : 0;

  const getProgressColor = (spent: string, limit: string) => {
    const spentAmount = parseFloat(spent);
    const limitAmount = parseFloat(limit);
    const percentage = (spentAmount / limitAmount) * 100;
    
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    if (percentage >= 60) return "bg-primary";
    return "bg-secondary";
  };

  const getRemainingColor = (spent: string, limit: string) => {
    const spentAmount = parseFloat(spent);
    const limitAmount = parseFloat(limit);
    const percentage = (spentAmount / limitAmount) * 100;
    
    if (percentage >= 100) return "text-destructive";
    if (percentage >= 80) return "text-warning";
    return "text-secondary";
  };

  // Get current month transactions for each budget
  const getCurrentMonthSpending = (categoryName: string) => {
    if (!transactions) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => 
        t.category === categoryName && 
        t.type === "expense" &&
        new Date(t.date) >= startOfMonth
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  if (budgetsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAddTransaction={() => setIsAddTransactionOpen(true)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAddTransaction={() => setIsAddTransactionOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '0ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totals.totalBudget)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <PiggyBank className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '100ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-warning">
                    {formatCurrency(totals.totalSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <TrendingUp className="text-warning h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '200ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Remaining</p>
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrency(totals.totalRemaining)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <Target className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '300ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Over Budget</p>
                  <p className="text-2xl font-bold text-destructive">
                    {totals.budgetsOverLimit}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <AlertTriangle className="text-destructive h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="rounded-xl mb-8 animate-fadeIn" style={{animationDelay: '400ms'}}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Overall Budget Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(totals.totalSpent)} of {formatCurrency(totals.totalBudget)}
                </span>
                <span className="font-medium text-foreground">
                  {overallProgress.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(overallProgress, 100)} 
                className="h-3"
              />
              {overallProgress > 100 && (
                <p className="text-sm text-destructive mt-2">
                  ⚠️ You're {formatCurrency(totals.totalSpent - totals.totalBudget)} over your total budget
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Chart and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donut Chart */}
          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '500ms'}}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">Budget Distribution</CardTitle>
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No budget data available
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsChart>
                      <Pie
                        data={budgets.map((budget: any) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          return {
                            name: budget.category,
                            value: parseFloat(budget.monthlyLimit),
                            spent: parseFloat(budget.currentSpent),
                            color: category?.color || "#3b82f6"
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {budgets.map((budget: any, index: number) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={category?.color || "#3b82f6"}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value: any) => {
                          const budget = budgets.find((b: any) => b.category === value);
                          const percentage = ((parseFloat(budget.monthlyLimit) / totals.totalBudget) * 100).toFixed(0);
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </RechartsChart>
                  </ResponsiveContainer>
                  
                  {/* Center text */}
                  <div className="relative -mt-52 pointer-events-none">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.totalBudget)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budgets List */}
          <Card className="rounded-xl animate-fadeIn lg:col-span-2" style={{animationDelay: '600ms'}}>
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground">Budget Details</CardTitle>
                <Button
                  onClick={() => setIsManageBudgetsOpen(true)}
                  className="bg-primary text-white hover:bg-primary/90 transition-all hover:scale-105"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Budgets
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {!budgets || budgets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No budgets set up yet. Click "Manage Budgets" to get started!
                  </div>
                ) : (
                  budgets.map((budget: any, index: number) => {
                  const category = categories?.find((c: any) => c.name === budget.category);
                  const IconComponent = (Icons as any)[category?.icon] || (Icons as any)["Circle"];
                  const progress = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
                  const remaining = parseFloat(budget.monthlyLimit) - parseFloat(budget.currentSpent);
                  const actualSpent = getCurrentMonthSpending(budget.category);
                  
                  return (
                    <div 
                      key={budget.id} 
                      className="border border-border rounded-lg p-6 hover:bg-accent/50 transition-all animate-slideInLeft"
                      style={{animationDelay: `${600 + index * 50}ms`}}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: `${category?.color || "#3b82f6"}20`, 
                              color: category?.color || "#3b82f6" 
                            }}
                          >
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">
                              {budget.category}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Monthly limit: {formatCurrency(budget.monthlyLimit)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getRemainingColor(budget.currentSpent, budget.monthlyLimit)}`}>
                            {remaining < 0 
                              ? `-${formatCurrency(Math.abs(remaining))}` 
                              : formatCurrency(remaining)
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {remaining < 0 ? "over budget" : "remaining"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Spent: {formatCurrency(budget.currentSpent)}
                          </span>
                          <span className="font-medium text-foreground">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(budget.currentSpent, budget.monthlyLimit)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        {actualSpent !== parseFloat(budget.currentSpent) && (
                          <p className="text-xs text-muted-foreground">
                            Current month spending: {formatCurrency(actualSpent)}
                          </p>
                        )}
                        
                        {progress >= 80 && progress < 100 && (
                          <div className="flex items-center space-x-2 mt-3">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <p className="text-sm text-warning">
                              You've used {progress.toFixed(0)}% of your budget
                            </p>
                          </div>
                        )}
                        
                        {progress >= 100 && (
                          <div className="flex items-center space-x-2 mt-3">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="text-sm text-destructive">
                              Budget exceeded by {formatCurrency(Math.abs(remaining))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </main>

      <ManageBudgetsDialog 
        open={isManageBudgetsOpen} 
        onOpenChange={setIsManageBudgetsOpen} 
      />
    </div>
  );
}