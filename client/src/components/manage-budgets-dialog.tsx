import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Plus, Trash2, Edit, Check, X } from "lucide-react";
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
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const { toast } = useToast();
  
  const cleanupOrphanedCategories = useMutation({
    mutationFn: async () => {
      console.log('UI: Starting orphaned categories cleanup');
      const result = await directApiRequest("POST", "/api/categories/cleanup", {});
      console.log('UI: Cleanup result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('UI: Cleanup successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Cleanup Complete",
        description: `Removed ${data.cleanedUp} orphaned categories`,
      });
    },
    onError: (error) => {
      console.error('UI: Cleanup failed:', error);
      toast({
        title: "Cleanup Failed", 
        description: error instanceof Error ? error.message : "Failed to cleanup categories",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (budgets) {
      console.log('UI: Budgets data received:', budgets);
      const initial: Record<string, string> = {};
      budgets.forEach((b) => {
        console.log(`UI: Processing budget - ID: ${b.id}, Category: ${b.category}, Limit: ${b.monthlyLimit}`);
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
      console.log(`UI: Starting budget deletion for ID: ${budgetId}`);
      console.log(`UI: Budget ID type: ${typeof budgetId}`);
      const result = await directApiRequest("DELETE", "/api/budgets", { budgetId });
      console.log(`UI: Delete result:`, result);
      return result;
    },
    onSuccess: (data) => {
      console.log('UI: Delete mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Category and budget deleted successfully",
      });
    },
    onError: (error) => {
      console.error(`UI: Failed to delete budget:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete budget",
        variant: "destructive",
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, newName }: { categoryId: string; newName: string }) => {
      console.log(`UI: Starting category name update for ID: ${categoryId} to ${newName}`);
      const result = await directApiRequest("PUT", "/api/categories", { categoryId, newName });
      console.log(`UI: Update result:`, result);
      return result;
    },
    onSuccess: (data) => {
      console.log('UI: Category update succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); // Refresh transactions as they may reference this category
      setEditingBudgetId(null);
      setEditingCategoryName("");
      toast({
        title: "Success",
        description: `Category renamed from "${data.oldName}" to "${data.newName}"`,
      });
    },
    onError: (error) => {
      console.error(`UI: Failed to update category:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category name",
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

  const startEditingCategoryName = (budget: any) => {
    const category = categories?.find(c => c.name === budget.category);
    if (category) {
      setEditingBudgetId(budget.id);
      setEditingCategoryName(budget.category);
    }
  };

  const cancelEditingCategoryName = () => {
    setEditingBudgetId(null);
    setEditingCategoryName("");
  };

  const saveEditingCategoryName = () => {
    if (!editingCategoryName.trim() || editingBudgetId === null) return;
    
    const budget = budgets?.find(b => b.id === editingBudgetId);
    const category = categories?.find(c => c.name === budget?.category);
    
    if (category && editingCategoryName.trim() !== category.name) {
      updateCategoryMutation.mutate({
        categoryId: category.id,
        newName: editingCategoryName.trim()
      });
    } else {
      // No change, just cancel
      cancelEditingCategoryName();
    }
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
              <div className="flex items-center space-x-2 flex-1">
                {editingBudgetId === budget.id ? (
                  <div className="flex items-center space-x-1 flex-1">
                    <Input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="flex-1"
                      placeholder="Category name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEditingCategoryName();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditingCategoryName();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={saveEditingCategoryName}
                      disabled={updateCategoryMutation.isPending}
                      className="h-8 w-8 text-secondary hover:text-secondary hover:bg-secondary/10"
                      title="Save changes"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEditingCategoryName}
                      disabled={updateCategoryMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="flex-1">{budget.category}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingCategoryName(budget)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Edit category name"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
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
                  onClick={() => {
                    console.log(`UI: Delete button clicked for budget:`, budget);
                    console.log(`UI: About to call deleteBudget.mutate with ID: ${budget.id}`);
                    deleteBudget.mutate(budget.id);
                  }}
                  disabled={deleteBudget.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid={`delete-${budget.category.toLowerCase().replace(/\s+/g, '-')}`}
                  title="Delete category and budget"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t mt-4">
            <h3 className="mb-2 text-lg font-semibold">Add a custom budget</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAddCategoryOpen(true)}
                data-testid="button-add-category"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
              <Button
                variant="outline"
                onClick={() => cleanupOrphanedCategories.mutate()}
                disabled={cleanupOrphanedCategories.isPending}
                className="text-xs"
                title="Remove unused categories from database"
              >
                {cleanupOrphanedCategories.isPending ? "Cleaning..." : "Cleanup"}
              </Button>
            </div>
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
