import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillSelect } from "@/components/ui/pill-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directApiRequest } from "@/lib/direct-query-client";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1),
  icon: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

const iconOptions = ["Utensils", "Car", "Gamepad2", "ShoppingBag", "Home", "Coffee", "Wallet", "PiggyBank"];

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCategoryModal({ open, onOpenChange }: AddCategoryModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "expense", color: "#3b82f6", icon: "Utensils" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('AddCategoryModal: Creating category with data:', data);
      setErrorMessage(null);
      const result = await directApiRequest("POST", "/api/categories", data);
      console.log('AddCategoryModal: Category creation result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('AddCategoryModal: Category creation successful', data);
      console.log('AddCategoryModal: Invalidating category queries...');
      
      // More aggressive query invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.removeQueries({ queryKey: ["/api/categories"] }); // Force refetch
      
      // Also refresh all related queries
      queryClient.invalidateQueries();
      
      setTimeout(() => {
        console.log('AddCategoryModal: Delayed query invalidation...');
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }, 100);
      
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('AddCategoryModal: Category creation failed:', error);
      const errorMsg = error.message || 'Failed to create category';
      setErrorMessage(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Add Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")}/>
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label>Type</Label>
            <RadioGroup defaultValue="expense" onValueChange={(v) => setValue("type", v as "income" | "expense")}> 
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="type-expense" />
                  <Label htmlFor="type-expense">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="type-income" />
                  <Label htmlFor="type-income">Income</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input type="color" id="color" {...register("color")}/>
            {errors.color && (
              <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
            )}
          </div>
          <div>
            <PillSelect
              label="Icon"
              value="Utensils"
              onValueChange={(v) => setValue("icon", v)}
              options={iconOptions.map((icon) => {
                const IconComponent = (Icons as any)[icon];
                return {
                  value: icon,
                  label: icon,
                  icon: <IconComponent className="h-4 w-4" />
                };
              })}
              placeholder="Select an icon"
            />
            {errors.icon && (
              <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>
            )}
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

