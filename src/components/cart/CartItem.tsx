import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Minus, Plus, Package, Bookmark } from "lucide-react";

interface CartItemProps {
  item: any;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(item.quantity || 1);

  const updateQuantity = useMutation({
    mutationFn: async (newQuantity: number) => {
      const { error } = await supabase
        .from("customer_orders")
        .update({ 
          quantity: newQuantity,
          calculated_price: (item.calculated_price / quantity) * newQuantity
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const saveForLater = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("customer_orders")
        .update({ saved_for_later: true })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item saved for later" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("customer_orders")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed from cart" });
    },
  });

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    updateQuantity.mutate(newQuantity);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {item.product_type?.toUpperCase()} Configuration
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Product ID: {item.product_id}
            </p>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || updateQuantity.isPending}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={updateQuantity.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-2xl font-bold text-primary">
                ₹{Math.round(item.calculated_price || 0).toLocaleString()}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveForLater.mutate()}
                disabled={saveForLater.isPending}
              >
                {saveForLater.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                Save for Later
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteItem.mutate()}
            disabled={deleteItem.isPending}
          >
            {deleteItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
