import { ChartLine, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAddTransaction: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <ChartLine className="text-white h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">BudgetWise</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-1" data-testid="nav-dashboard">
                Dashboard
              </a>
              <a href="#" className="text-gray-500 hover:text-foreground transition-colors" data-testid="nav-transactions">
                Transactions
              </a>
              <a href="#" className="text-gray-500 hover:text-foreground transition-colors" data-testid="nav-budgets">
                Budgets
              </a>
              <a href="#" className="text-gray-500 hover:text-foreground transition-colors" data-testid="nav-reports">
                Reports
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={onAddTransaction}
              className="bg-primary text-white hover:bg-primary/90"
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
