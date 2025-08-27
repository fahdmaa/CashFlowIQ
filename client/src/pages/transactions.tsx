import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { Search, Calendar, Filter, Download, Plus, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import AddTransactionModal from "@/components/add-transaction-modal";
import EditTransactionModal from "@/components/edit-transaction-modal";
import Header from "@/components/header";
import { directApiRequest } from "@/lib/direct-query-client";
import { useToast } from "@/hooks/use-toast";

export default function Transactions() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  
  // Month filter
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Generate month options
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();

  const { data: transactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions", { selectedMonth }],
  });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
    })
      .format(parseFloat(amount))
      .replace("MAD", "DH");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    ?.filter((transaction) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || transaction.type === filterType;
      const matchesCategory =
        filterCategory === "all" || transaction.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return parseFloat(b.amount) - parseFloat(a.amount);
        case "amount-asc":
          return parseFloat(a.amount) - parseFloat(b.amount);
        default:
          return 0;
      }
    }) || [];

  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === "income") {
        acc.income += amount;
      } else {
        acc.expenses += amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const netAmount = totals.income - totals.expenses;

  // Handle edit transaction
  const handleEditTransaction = (transaction: any) => {
    console.log('Opening edit modal for transaction:', transaction);
    setEditingTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditTransactionOpen(false);
    setEditingTransaction(null);
  };

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      console.log('Deleting transaction:', transactionId);
      return await directApiRequest("DELETE", "/api/transactions", { transactionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Delete transaction failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTransaction = (transaction: any) => {
    if (window.confirm(`Are you sure you want to delete this transaction: "${transaction.description}"?`)) {
      deleteTransactionMutation.mutate(transaction.id);
    }
  };

  if (transactionsLoading) {
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
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredTransactions.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <Calendar className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '100ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-secondary">
                    +{formatCurrency(totals.income.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <TrendingUp className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '200ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">
                    -{formatCurrency(totals.expenses.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                  <TrendingDown className="text-destructive h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl animate-fadeIn hover-lift transition-all" style={{animationDelay: '300ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Amount</p>
                  <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount.toString())}
                  </p>
                </div>
                <div className={`w-12 h-12 ${netAmount >= 0 ? 'bg-secondary/10' : 'bg-destructive/10'} rounded-lg flex items-center justify-center transition-transform hover:scale-110`}>
                  {netAmount >= 0 ? (
                    <TrendingUp className="text-secondary h-6 w-6" />
                  ) : (
                    <TrendingDown className="text-destructive h-6 w-6" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card className="rounded-xl animate-fadeIn" style={{animationDelay: '400ms'}}>
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-foreground">All Transactions</CardTitle>
              
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>
                
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon" className="transition-all hover:scale-105">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No transactions found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction: any, index: number) => {
                      const category = categories?.find((c: any) => c.name === transaction.category);
                      const IconComponent = (Icons as any)[category?.icon] || (Icons as any)["Circle"];
                      
                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-border hover:bg-accent transition-all animate-slideInLeft"
                          style={{animationDelay: `${500 + index * 30}ms`}}
                        >
                          <td className="p-3 text-foreground">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                                style={{ 
                                  backgroundColor: `${category?.color || "#3b82f6"}20`, 
                                  color: category?.color || "#3b82f6" 
                                }}
                              >
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <span className="font-medium text-foreground">
                                {transaction.description}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {transaction.category}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === "income" 
                                ? "bg-secondary/10 text-secondary" 
                                : "bg-destructive/10 text-destructive"
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-semibold ${
                            transaction.type === "income" ? "text-secondary" : "text-destructive"
                          }`}>
                            {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTransaction(transaction)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit transaction"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTransaction(transaction)}
                                disabled={deleteTransactionMutation.isPending}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
      />
      
      <EditTransactionModal
        isOpen={isEditTransactionOpen}
        onClose={handleCloseEditModal}
        transaction={editingTransaction}
      />
    </div>
  );
}