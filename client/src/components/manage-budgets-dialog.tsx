import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AddCategoryModal from "./add-category-modal";

interface ManageBudgetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageBudgetsDialog({ open, onOpenChange }: ManageBudgetsDialogProps) {
  const { data: budgets } = useQuery<any[]>({ queryKey: ["/api/budgets"] });
  const [values, setValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

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
      const res = await fetch(`/api/budgets/${encodeURIComponent(category)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyLimit }),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      return res.json();
    },
  });

  const handleSave = async () => {
    await Promise.all(
      Object.entries(values).map(([category, monthlyLimit]) =>
        updateBudget.mutateAsync({ category, monthlyLimit })
      )
    );
    queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    onOpenChange(false);
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
          <div className="flex items-center justify-between">
            <DialogTitle>Manage Budgets</DialogTitle>
            <Button size="icon" variant="outline" onClick={() => setAddCategoryOpen(true)} data-testid="button-add-category">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} data-testid="button-save-budgets">Save</Button>
        </DialogFooter>
      </DialogContent>
      <AddCategoryModal open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </Dialog>
  );
}
