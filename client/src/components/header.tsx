import { Plus, User, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getCurrentUser, logout } from "@/lib/supabase-auth";
import Logo from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onAddTransaction: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [location, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }

    // Load current user
    const user = getCurrentUser();
    setCurrentUser(user?.username || null);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Logo 
              size="lg" 
              showText={false} 
              className="animate-fadeIn"
            />
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/" 
                className={`font-medium pb-1 transition-all ${
                  location === "/" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-muted-foreground"
                }`} 
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              <Link 
                href="/transactions" 
                className={`font-medium pb-1 transition-all ${
                  location === "/transactions" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-muted-foreground"
                }`} 
                data-testid="nav-transactions"
              >
                Transactions
              </Link>
              <Link 
                href="/budgets" 
                className={`font-medium pb-1 transition-all ${
                  location === "/budgets" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-muted-foreground"
                }`} 
                data-testid="nav-budgets"
              >
                Budgets
              </Link>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-all hover:border-b-2 hover:border-muted-foreground pb-1 font-medium" 
                data-testid="nav-reports"
              >
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {currentUser}
                </div>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
