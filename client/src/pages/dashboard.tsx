import Header from "@/components/header";
import FinancialOverview from "@/components/financial-overview";
import BudgetTracking from "@/components/budget-tracking";
import SpendingAnalytics from "@/components/spending-analytics";
import RecentTransactions from "@/components/recent-transactions";
import AddTransactionModal from "@/components/add-transaction-modal";
import PillMonthFilter from "@/components/pill-month-filter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
        {/* Month Filter with Pill Nav Style */}
        <div className="mb-6 animate-fadeIn" style={{animationDelay: '0ms'}}>
          <PillMonthFilter
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            monthOptions={monthOptions}
          />
        </div>

        <FinancialOverview selectedMonth={selectedMonth} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <BudgetTracking selectedMonth={selectedMonth} />
            <SpendingAnalytics selectedMonth={selectedMonth} />
          </div>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
