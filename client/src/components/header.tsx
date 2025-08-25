import { Plus, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  onAddTransaction: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 animate-fadeIn">
              <img 
                src="/budgetwise-logo.png" 
                alt="BudgetWise Logo" 
                className="w-10 h-10 object-contain transition-transform hover:scale-110"
              />
              <h1 className="text-2xl font-bold text-foreground">BudgetWise</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-1 transition-all hover:text-primary/80" data-testid="nav-dashboard">
                Dashboard
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-all hover:border-b-2 hover:border-muted-foreground pb-1" data-testid="nav-transactions">
                Transactions
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-all hover:border-b-2 hover:border-muted-foreground pb-1" data-testid="nav-budgets">
                Budgets
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-all hover:border-b-2 hover:border-muted-foreground pb-1" data-testid="nav-reports">
                Reports
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-all hover:scale-110"
              data-testid="button-toggle-theme"
            >
              {isDark ? <Sun className="h-5 w-5 transition-transform" /> : <Moon className="h-5 w-5 transition-transform" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              onClick={onAddTransaction}
              className="bg-primary text-white hover:bg-primary/90 transition-all hover-lift"
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
