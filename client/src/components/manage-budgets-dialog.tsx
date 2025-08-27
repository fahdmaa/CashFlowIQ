import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AddCategoryModal from "./add-category-modal";
import { directApiRequest } from "@/lib/direct-query-client";
import { useToast } from "@/hooks/use-toast";

interface ManageBudgetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ManageBudgetsDialog({ open, onOpenChange }: ManageBudgetsDialogProps) {
  const { data: budgets } = useQuery<any[]>({ queryKey: ["/api/budgets"] });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (budgets) {
      const initial: Record<string, string> = {};
      budgets.forEach((b) => {
        initial[b.category] = b.monthlyLimit;
      });
      setValues(initial);
    }
  }, [budgets]);

  const updateBudget = useMutation({
    mutationFn: async ({ category, monthlyLimit }: { category: string; monthlyLimit: string }) => {
      console.log(`Updating budget API call for "${category}" with limit: ${monthlyLimit}`);
      // Pass category and monthlyLimit directly in the data object
      const result = await directApiRequest("PUT", "/api/budgets", { 
        category: category,
        monthlyLimit: parseFloat(monthlyLimit) 
      });
      console.log(`Update result for "${category}":`, result);
      return result;
    },
    onError: (error, variables) => {
      console.error(`Failed to update budget for "${variables.category}":`, error);
    }
  });

  const deleteBudget = useMutation({
    mutationFn: async (budgetId: string) => {
      console.log(`Deleting budget with ID: ${budgetId}`);
      const result = await directApiRequest("DELETE", "/api/budgets", { budgetId });
      console.log(`Delete result:`, result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    },
    onError: (error) => {
      console.error(`Failed to delete budget:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete budget",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    if (isSaving) return; // Prevent double-clicking
    
    setIsSaving(true);
    try {
      console.log('Saving budget values:', values);
      
      await Promise.all(
        Object.entries(values).map(([category, monthlyLimit]) => {
          console.log(`Updating budget for ${category}: ${monthlyLimit}`);
          return updateBudget.mutateAsync({ category, monthlyLimit });
        })
      );
      
      console.log('All budget updates completed');
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      
      toast({
        title: "Success",
        description: "Budgets updated successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save budgets",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changeValue = (category: string, delta: number) => {
    setValues((prev) => ({
      ...prev,
      [category]: (Math.max(0, parseFloat(prev[category] || "0") + delta)).toFixed(2),
    }));
  };

  const handleInputChange = (category: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Budgets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {budgets?.map((budget) => (
            <div key={budget.id} className="flex items-center justify-between">
              <span className="flex-1">{budget.category}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeValue(budget.category, -10)}
                  data-testid={`decrease-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={values[budget.category] || ""}
                  onChange={(e) => handleInputChange(budget.category, e.target.value)}
                  className="w-24 text-right"
                  data-testid={`input-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeValue(budget.category, 10)}
                  data-testid={`increase-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteBudget.mutate(budget.id)}
                  disabled={deleteBudget.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid={`delete-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                  title="Delete budget"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t mt-4">
            <h3 className="mb-2 text-lg font-semibold">Add a custom budget</h3>
            <Button
              variant="outline"
              onClick={() => setAddCategoryOpen(true)}
              data-testid="button-add-category"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-budgets">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AddCategoryModal open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </Dialog>
  );
}

export default ManageBudgetsDialog;
