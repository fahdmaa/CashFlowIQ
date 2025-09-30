import { Plus, User, Moon, Sun, LogOut, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getCurrentUser, logout } from "@/lib/supabase-auth";
import { getUserProfile } from "@/lib/supabase-direct";
import Logo from "@/components/logo";
import ProfilePictureUpload from "@/components/profile-picture-upload";
import { PillDropdownMenu } from "@/components/ui/pill-dropdown-menu";

interface HeaderProps {
  onAddTransaction: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [location, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [showProfileUpload, setShowProfileUpload] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }

    // Load current user and profile
    const loadUserProfile = async () => {
      const user = getCurrentUser();
      setCurrentUser(user?.username || null);
      
      if (user) {
        try {
          const profile = await getUserProfile();
          setProfilePictureUrl(profile?.profile_picture_url || null);
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };

    loadUserProfile();
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
            <PillDropdownMenu
              trigger={
                <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center transition-all hover:scale-105 overflow-hidden">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-background" />
                  )}
                </div>
              }
              items={[
                {
                  label: currentUser || 'User',
                  icon: <UserCircle className="h-4 w-4" />,
                  disabled: true
                },
                { separator: true },
                {
                  label: 'Profile Settings',
                  icon: <Settings className="h-4 w-4" />,
                  onClick: () => setShowProfileUpload(true)
                },
                { separator: true },
                {
                  label: 'Logout',
                  icon: <LogOut className="h-4 w-4" />,
                  onClick: handleLogout,
                  destructive: true
                }
              ]}
              triggerClassName="avatar-trigger"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
