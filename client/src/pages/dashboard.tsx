import Header from "@/components/header";
import FinancialOverview from "@/components/financial-overview";
import BudgetTracking from "@/components/budget-tracking";
import SpendingAnalytics from "@/components/spending-analytics";
import RecentTransactions from "@/components/recent-transactions";
import AddTransactionModal from "@/components/add-transaction-modal";
import { useState } from "react";

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cool-gray">
      <Header onAddTransaction={() => setIsAddTransactionOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FinancialOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BudgetTracking />
            <SpendingAnalytics />
          </div>
          
          <div className="space-y-8">
            <RecentTransactions />
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
