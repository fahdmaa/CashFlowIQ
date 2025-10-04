import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillSelect } from "@/components/ui/pill-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { directApiRequest } from "@/lib/direct-query-client";
import { normalizeAmount, normalizeDateToISO } from "@/lib/normalize";
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
  const watchedCategory = watch("category");

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
      const amountStr = normalizeAmount(data.amount);
      if (!amountStr) {
        throw new Error('Amount must be a valid number (e.g., 28 or 28.00).');
      }

      return await directApiRequest("POST", "/api/transactions", {
        ...data,
        amount: amountStr,
        date: normalizeDateToISO(data.date),
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
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full rounded-2xl border-border/50 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">Transaction Type</Label>
            <RadioGroup defaultValue="expense" onValueChange={(value) => setValue("type", value as "income" | "expense" | "savings")}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="radio"
                    value="expense"
                    id="expense"
                    className="peer sr-only"
                    {...register("type")}
                  />
                  <Label
                    htmlFor="expense"
                    className="flex items-center justify-center rounded-xl border-2 border-border bg-background px-4 py-3 hover:bg-accent cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary font-medium"
                    data-testid="radio-expense"
                  >
                    Expense
                  </Label>
                </div>
                <div className="flex-1">
                  <input
                    type="radio"
                    value="income"
                    id="income"
                    className="peer sr-only"
                    {...register("type")}
                  />
                  <Label
                    htmlFor="income"
                    className="flex items-center justify-center rounded-xl border-2 border-border bg-background px-4 py-3 hover:bg-accent cursor-pointer transition-all peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-600 font-medium"
                    data-testid="radio-income"
                  >
                    Income
                  </Label>
                </div>
                <div className="flex-1">
                  <input
                    type="radio"
                    value="savings"
                    id="savings"
                    className="peer sr-only"
                    {...register("type")}
                  />
                  <Label
                    htmlFor="savings"
                    className="flex items-center justify-center rounded-xl border-2 border-border bg-background px-4 py-3 hover:bg-accent cursor-pointer transition-all peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-600 font-medium"
                    data-testid="radio-savings"
                  >
                    Savings
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="amount" className="text-sm font-semibold text-foreground mb-2 block">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">DH</span>
              <Input
                {...register("amount")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-14 pr-4 h-12 text-lg font-semibold rounded-xl border-2 focus:border-primary transition-all"
                data-testid="input-amount"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive mt-1.5">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-foreground mb-2 block">Description</Label>
            <Input
              {...register("description")}
              placeholder="What was this transaction for?"
              className="h-11 rounded-xl border-2 focus:border-primary transition-all"
              data-testid="input-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1.5">
                {errors.description.message}
              </p>
            )}
          </div>

          {watchedType === "expense" && (
            <div>
              <PillSelect
                label="Category"
                value={watchedCategory}
                onValueChange={(value) => {
                  setValue("category", value);
                  setSuggestedCategory("");
                }}
                options={[
                  ...getFilteredCategories().map(c => ({
                    value: c.name,
                    label: c.name
                  })),
                  // Fallback options if categories API fails
                  ...(!categories || categories.length === 0 ? [
                    { value: "Food & Dining", label: "Food & Dining" },
                    { value: "Transportation", label: "Transportation" },
                    { value: "Entertainment", label: "Entertainment" },
                    { value: "Shopping", label: "Shopping" },
                    { value: "Bills & Utilities", label: "Bills & Utilities" }
                  ] : [])
                ]}
                placeholder="Select category"
                error={errors.category?.message}
                required
              />
              {suggestedCategory && (
                <p className="text-sm text-primary mt-1">Suggested: {suggestedCategory}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="date" className="text-sm font-semibold text-foreground mb-2 block">Date</Label>
            <Input
              {...register("date")}
              type="date"
              className="h-11 rounded-xl border-2 focus:border-primary transition-all"
              data-testid="input-date"
            />
            {errors.date && (
              <p className="text-sm text-destructive mt-1.5">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 font-semibold hover:bg-accent transition-all"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
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
