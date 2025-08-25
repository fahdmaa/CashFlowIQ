import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Coffee, Building, Car, ShoppingCart, Film, Utensils, Gamepad2, ShoppingBag, Zap } from "lucide-react";

const categoryIcons = {
  "Food & Dining": Utensils,
  "Transportation": Car,
  "Entertainment": Gamepad2,
  "Shopping": ShoppingBag,
  "Bills & Utilities": Zap,
  "Income": Building,
};

const categoryColors = {
  "Food & Dining": "bg-blue-100 text-blue-600",
  "Transportation": "bg-purple-100 text-purple-600",
  "Entertainment": "bg-green-100 text-green-600",
  "Shopping": "bg-red-100 text-red-600",
  "Bills & Utilities": "bg-yellow-100 text-yellow-600",
  "Income": "bg-green-100 text-green-600",
};

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
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
      currency: "USD",
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (transactionDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days ago`;
    }
  };

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium text-sm" data-testid="button-view-all-transactions">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500" data-testid="text-no-transactions">
              No transactions yet. Add your first transaction to get started!
            </div>
          ) : (
            recentTransactions.map((transaction: any) => {
              const IconComponent = categoryIcons[transaction.category as keyof typeof categoryIcons] || Coffee;
              const iconColor = categoryColors[transaction.category as keyof typeof categoryColors] || "bg-blue-100 text-blue-600";
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-description-${transaction.id}`}>
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500" data-testid={`text-category-${transaction.id}`}>
                        {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === "income" ? "text-secondary" : "text-destructive"}`} data-testid={`text-amount-${transaction.id}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500" data-testid={`text-date-${transaction.id}`}>
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
