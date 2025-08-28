import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { directApiRequest } from "@/lib/direct-query-client";
import { useToast } from "@/hooks/use-toast";
import { categorizeTransaction } from "@/lib/categorization";
import { useState, useEffect } from "react";

const transactionFormSchema = insertTransactionSchema.extend({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["income", "expense", "savings"]),
});

type TransactionForm = z.infer<typeof transactionFormSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suggestedCategory, setSuggestedCategory] = useState<string>("");
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  
  // Debug logging for categories
  useEffect(() => {
    console.log('AddTransactionModal: Categories data updated:', categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedDescription = watch("description");
  const watchedType = watch("type");

  // Auto-categorization when description changes
  useEffect(() => {
    if (watchedType === "expense" && watchedDescription && watchedDescription.length > 2) {
      const suggested = categorizeTransaction(watchedDescription);
      setSuggestedCategory(suggested);
      setValue("category", suggested);
    }
  }, [watchedDescription, watchedType, setValue]);

  useEffect(() => {
    if (watchedType === "income") {
      setValue("category", "Income");
      setSuggestedCategory("");
    } else if (watchedType === "savings") {
      setValue("category", "Savings");
      setSuggestedCategory("");
    }
  }, [watchedType, setValue]);

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionForm) => {
      return await directApiRequest("POST", "/api/transactions", {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionForm) => {
    createTransactionMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setSuggestedCategory("");
    onClose();
  };

  // Get filtered categories based on transaction type
  const getFilteredCategories = () => {
    console.log('AddTransactionModal: getFilteredCategories called', {
      categories: categories?.length || 0,
      watchedType,
      categoriesData: categories
    });
    
    if (!categories) {
      console.log('AddTransactionModal: No categories data, returning empty array');
      return [];
    }
    
    if (watchedType === "income") {
      const filtered = categories.filter(c => c.type === "income" || c.name === "Income");
      console.log('AddTransactionModal: Filtered income categories:', filtered);
      return filtered;
    } else {
      const filtered = categories.filter(c => c.type === "expense");
      console.log('AddTransactionModal: Filtered expense categories:', filtered);
      return filtered;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Type</Label>
            <RadioGroup defaultValue="expense" onValueChange={(value) => setValue("type", value as "income" | "expense" | "savings")}>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" data-testid="radio-expense" />
                  <Label htmlFor="expense" className="text-sm">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" data-testid="radio-income" />
                  <Label htmlFor="income" className="text-sm">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="savings" id="savings" data-testid="radio-savings" />
                  <Label htmlFor="savings" className="text-sm">Savings</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-foreground mb-2 block">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">DH</span>
              <Input
                {...register("amount")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                data-testid="input-amount"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-foreground mb-2 block">Description</Label>
            <Input
              {...register("description")}
              placeholder="What was this transaction for?"
              data-testid="input-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {watchedType === "expense" && (
            <div>
              <Label htmlFor="category" className="text-sm font-medium text-foreground mb-2 block">Category</Label>
              <Select onValueChange={(value) => setValue("category", value)} value={getValues("category")}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredCategories().map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  {/* Fallback options if categories API fails */}
                  {(!categories || categories.length === 0) && (
                    <>
                      <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Bills & Utilities">Bills & Utilities</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {suggestedCategory && (
                <p className="text-sm text-primary mt-1">Suggested: {suggestedCategory}</p>
              )}
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="date" className="text-sm font-medium text-foreground mb-2 block">Date</Label>
            <Input
              {...register("date")}
              type="date"
              data-testid="input-date"
            />
            {errors.date && (
              <p className="text-sm text-descriptive mt-1">{errors.date.message}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              disabled={createTransactionMutation.isPending}
              data-testid="button-submit"
            >
              {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}