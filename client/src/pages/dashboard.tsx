import Header from "@/components/header";
import FinancialOverview from "@/components/financial-overview";
import BudgetTracking from "@/components/budget-tracking";
import SpendingAnalytics from "@/components/spending-analytics";
import RecentTransactions from "@/components/recent-transactions";
import AddTransactionModal from "@/components/add-transaction-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startNewFiscalMonth } from "@/lib/supabase-direct";
import { useToast } from "@/hooks/use-toast";

// Helper function to get current salary cycle month
const getCurrentSalaryCycleMonth = () => {
  const today = new Date();
  const currentDay = today.getDate();
  
  let targetDate: Date;
  if (currentDay >= 27) {
    // We're in the next month's salary cycle (starts on 27th)
    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else {
    // We're still in the current month's salary cycle
    targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  
  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate current salary cycle month as default (YYYY-MM format)
  const currentMonth = getCurrentSalaryCycleMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Mutation for starting a new fiscal month
  const startNewMonthMutation = useMutation({
    mutationFn: startNewFiscalMonth,
    onSuccess: () => {
      toast({
        title: "New month started!",
        description: "All new transactions will be recorded in the new fiscal month.",
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start new month",
        variant: "destructive",
      });
    },
  });
  
  // Generate month options (current salary cycle month + 11 previous months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    const currentDay = today.getDate();
    
    // Start from the current salary cycle month
    let startMonth = today.getMonth();
    let startYear = today.getFullYear();
    
    // If we're past the 27th, we're in the next month's salary cycle
    if (currentDay >= 27) {
      startMonth += 1;
      if (startMonth > 11) {
        startMonth = 0;
        startYear += 1;
      }
    }
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(startYear, startMonth - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();

  return (
    <div className="min-h-screen bg-background">
      <Header onAddTransaction={() => setIsAddTransactionOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Filter */}
        <Card className="mb-6 animate-fadeIn" style={{animationDelay: '0ms'}}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">View Data For:</h3>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => startNewMonthMutation.mutate()}
                  disabled={startNewMonthMutation.isPending}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>Start New Month</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <FinancialOverview selectedMonth={selectedMonth} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BudgetTracking selectedMonth={selectedMonth} />
            <SpendingAnalytics selectedMonth={selectedMonth} />
          </div>
          
          <div className="space-y-8">
            <RecentTransactions selectedMonth={selectedMonth} />
          </div>
        </div>
      </main>

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
    </div>
  );
}
