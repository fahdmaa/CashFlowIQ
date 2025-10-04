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

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any | null;
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suggestedCategory, setSuggestedCategory] = useState<string>("");
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  
  // Debug logging for categories
  useEffect(() => {
    console.log('EditTransactionModal: Categories data updated:', categories);
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

  // Pre-populate form when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      console.log('EditTransactionModal: Populating form with transaction:', transaction);
      setValue("description", transaction.description || "");
      setValue("amount", transaction.amount?.toString() || "");
      setValue("category", transaction.category || "");
      setValue("type", transaction.type || "expense");
      
      // Format date for input field (YYYY-MM-DD)
      if (transaction.date) {
        const date = new Date(transaction.date);
        const formattedDate = date.toISOString().split('T')[0];
        setValue("date", formattedDate);
      }
    }
  }, [transaction, isOpen, setValue]);

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: TransactionForm) => {
      if (!transaction?.id) {
        throw new Error('Transaction ID is required for update');
      }
      
      console.log('EditTransactionModal: Updating transaction with data:', data);
      const result = await directApiRequest("PUT", "/api/transactions", {
        transactionId: transaction.id,
        ...data
      });
      console.log('EditTransactionModal: Update result:', result);
      return result;
    },
    onSuccess: () => {
      console.log('EditTransactionModal: Update successful');
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      handleClose();
    },
    onError: (error) => {
      console.error('EditTransactionModal: Update failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  // Auto-categorization
  const description = watch("description");
  const currentType = watch("type");

  useEffect(() => {
    if (currentType === "income") {
      setValue("category", "Income");
      setSuggestedCategory("");
    } else if (currentType === "savings") {
      setValue("category", "Savings");
      setSuggestedCategory("");
    } else if (currentType === "expense" && description && description.length > 2) {
      const suggested = categorizeTransaction(description);
      if (suggested && suggested !== getValues("category")) {
        setSuggestedCategory(suggested);
      } else {
        setSuggestedCategory("");
      }
    } else {
      setSuggestedCategory("");
    }
  }, [description, currentType, setValue, getValues]);

  const handleClose = () => {
    reset();
    setSuggestedCategory("");
    onClose();
  };

  const onSubmit = (data: TransactionForm) => {
    console.log('EditTransactionModal: Form submitted with data:', data);
    updateTransactionMutation.mutate(data);
  };

  const acceptSuggestion = () => {
    setValue("category", suggestedCategory);
    setSuggestedCategory("");
  };

  // Filter categories by type
  const filteredCategories = categories?.filter(cat => 
    currentType === 'income' ? cat.type === 'income' : cat.type === 'expense'
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <Label className="text-base font-medium">Transaction Type</Label>
            <RadioGroup
              value={watch("type")}
              onValueChange={(value) => setValue("type", value as "income" | "expense" | "savings")}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="text-sm">
                  Expense
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="text-sm">
                  Income
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="savings" id="savings" />
                <Label htmlFor="savings" className="text-sm">
                  Savings
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter transaction description"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pr-12"
                {...register("amount")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">DH</span>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Category - only show for expenses */}
          {currentType === "expense" && (
            <div>
              <Label htmlFor="category">Category</Label>
              {suggestedCategory && (
                <div className="mb-2 p-2 bg-accent rounded-md border">
                  <p className="text-sm text-muted-foreground mb-1">
                    Suggested category based on description:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={acceptSuggestion}
                    className="text-xs"
                  >
                    Use "{suggestedCategory}"
                  </Button>
                </div>
              )}
              <PillSelect
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
                options={filteredCategories.map((category) => ({
                  value: category.name,
                  label: category.name
                }))}
                placeholder="Select category"
                error={errors.category?.message}
              />
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-sm text-destructive mt-1">
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              onClick={handleClose}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTransactionMutation.isPending}
              className="bg-gradient-to-r from-green-500/20 to-blue-600/20 backdrop-blur-md border border-white/30 text-foreground hover:from-green-500/30 hover:to-blue-600/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
            >
              {updateTransactionMutation.isPending ? "Updating..." : "Update Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}