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
        <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-1 gap-8">
          {/* Enhanced Donut Chart */}
          <Card className="rounded-xl animate-fadeIn hover-lift transition-all xl:col-span-2 lg:col-span-1 bg-gradient-to-br from-background to-muted/30" style={{animationDelay: '500ms'}}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground">Budget Distribution</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-4">
                    <PieChart className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                    <p>No budget data available</p>
                  </div>
                </div>
              ) : (
                <div className="h-96 relative animate-chartFadeIn">
                  <ResponsiveContainer width="100%" height="100%" className="animate-donutPulse">
                    <RechartsChart>
                      {/* Background ring */}
                      <Pie
                        data={[{ value: 100 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={85}
                        dataKey="value"
                        stroke="none"
                        fill="hsl(var(--muted))"
                        className="opacity-20"
                      />
                      {/* Main chart */}
                      <Pie
                        data={budgets.map((budget: any) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
                          return {
                            name: budget.category,
                            value: parseFloat(budget.monthlyLimit),
                            spent: parseFloat(budget.currentSpent),
                            spentPercentage: Math.min(spentPercentage, 100),
                            color: category?.color || "#3b82f6",
                            isOverBudget: spentPercentage > 100
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={150}
                        paddingAngle={1}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {budgets.map((budget: any, index: number) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
                          const isOverBudget = spentPercentage > 100;
                          
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#gradient-${index})`}
                              stroke={isOverBudget ? "#ef4444" : "hsl(var(--background))"}
                              strokeWidth={isOverBudget ? 2 : 1}
                              className="chart-segment hover:brightness-110 transition-all duration-300 cursor-pointer drop-shadow-sm"
                              style={{
                                filter: isOverBudget ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))' : 'none',
                                animationDelay: `${index * 200}ms`
                              }}
                            />
                          );
                        })}
                      </Pie>
                      {/* Spent indicators */}
                      <Pie
                        data={budgets.map((budget: any) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
                          return {
                            name: `${budget.category} Spent`,
                            value: Math.min(parseFloat(budget.currentSpent), parseFloat(budget.monthlyLimit)),
                            color: category?.color || "#3b82f6"
                          };
                        })}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={150}
                        paddingAngle={1}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {budgets.map((budget: any, index: number) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          const baseColor = category?.color || "#3b82f6";
                          
                          return (
                            <Cell 
                              key={`spent-cell-${index}`} 
                              fill={`url(#spent-gradient-${index})`}
                              stroke="none"
                              className="opacity-60"
                            />
                          );
                        })}
                      </Pie>
                      <defs>
                        {budgets.map((budget: any, index: number) => {
                          const category = categories?.find((c: any) => c.name === budget.category);
                          const baseColor = category?.color || "#3b82f6";
                          
                          return (
                            <g key={`gradients-${index}`}>
                              <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={baseColor} stopOpacity="0.9" />
                                <stop offset="100%" stopColor={baseColor} stopOpacity="0.6" />
                              </linearGradient>
                              <linearGradient id={`spent-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
                                <stop offset="100%" stopColor={baseColor} stopOpacity="0.8" />
                              </linearGradient>
                            </g>
                          );
                        })}
                      </defs>
                      <Tooltip 
                        formatter={(value: any, name: any, props: any) => {
                          if (name.includes('Spent')) return null;
                          const budget = budgets.find((b: any) => b.category === name);
                          const spentPercentage = ((parseFloat(budget?.currentSpent || 0) / parseFloat(budget?.monthlyLimit || 1)) * 100).toFixed(1);
                          return [
                            <div key="tooltip-content" className="space-y-1">
                              <div className="font-semibold text-sm">{formatCurrency(value)} budgeted</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(budget?.currentSpent || 0)} spent ({spentPercentage}%)
                              </div>
                            </div>
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          backdropFilter: 'blur(8px)'
                        }}
                        labelStyle={{ display: 'none' }}
                      />
                    </RechartsChart>
                  </ResponsiveContainer>
                  
                  {/* Enhanced center content */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center space-y-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Budget</p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(totals.totalBudget)}</p>
                      </div>
                      <div className="w-12 h-0.5 bg-primary/30 mx-auto rounded-full"></div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Spent</p>
                        <p className="text-lg font-semibold text-primary">{formatCurrency(totals.totalSpent)}</p>
                        <p className="text-xs text-muted-foreground">
                          {overallProgress.toFixed(1)}% used
                        </p>
                      </div>
                      {totals.budgetsOverLimit > 0 && (
                        <div className="flex items-center justify-center space-x-1 pt-2">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive font-medium">
                            {totals.budgetsOverLimit} over budget
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated legend */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-3 pointer-events-none">
                    {budgets.slice(0, 4).map((budget: any, index: number) => {
                      const category = categories?.find((c: any) => c.name === budget.category);
                      const percentage = ((parseFloat(budget.monthlyLimit) / totals.totalBudget) * 100).toFixed(0);
                      const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
                      
                      return (
                        <div 
                          key={budget.id} 
                          className="flex items-center space-x-2 text-xs animate-fadeIn"
                          style={{animationDelay: `${600 + index * 100}ms`}}
                        >
                          <div 
                            className="w-2 h-2 rounded-full border border-white/20" 
                            style={{
                              backgroundColor: category?.color || "#3b82f6",
                              boxShadow: spentPercentage > 100 ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none'
                            }}
                          />
                          <span className="font-medium text-foreground">{budget.category}</span>
                          <span className="text-muted-foreground">({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budgets List */}
          <Card className="rounded-xl animate-fadeIn xl:col-span-3 lg:col-span-1" style={{animationDelay: '600ms'}}>
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