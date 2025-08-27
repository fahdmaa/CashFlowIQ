import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";

interface RecentTransactionsProps {
  selectedMonth: string;
}

export default function RecentTransactions({ selectedMonth }: RecentTransactionsProps) {
  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions", { selectedMonth }],
  });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });

  if (isLoading) {
    return (
      <Card className="rounded-xl">
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
      currency: "MAD",
    })
      .format(parseFloat(amount))
      .replace("MAD", "DH");
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
    <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '400ms'}}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Recent Transactions</CardTitle>
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 font-medium text-sm transition-all hover:scale-105" 
            data-testid="button-view-all-transactions"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground animate-fadeIn" data-testid="text-no-transactions">
              No transactions yet. Add your first transaction to get started!
            </div>
          ) : (
            recentTransactions.map((transaction: any, index: number) => {
              const category = categories?.find((c: any) => c.name === transaction.category);
              const IconComponent = (Icons as any)[category?.icon] || (Icons as any)["Circle"];
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-all hover:scale-[1.01] animate-slideInLeft"
                  style={{animationDelay: `${500 + index * 50}ms`}}
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: `${category?.color || "#3b82f6"}20`, color: category?.color || "#3b82f6" }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-description-${transaction.id}`}>
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-category-${transaction.id}`}>
                        {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === "income" ? "text-secondary" : "text-destructive"}`} data-testid={`text-amount-${transaction.id}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-date-${transaction.id}`}>
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