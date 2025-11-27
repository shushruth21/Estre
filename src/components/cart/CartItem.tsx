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
    <Card className="bg-white border border-gold/20 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-lg bg-ivory border border-gold/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-10 w-10 text-gold/40" />
          </div>

          <div className="flex-1">
            <h3 className="font-serif font-bold text-xl mb-1 text-walnut">
              {item.product_type?.toUpperCase()} Configuration
            </h3>
            <p className="text-sm text-walnut/60 mb-4 font-sans">
              Product ID: {item.product_id}
            </p>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3 border border-gold/20 rounded-md p-1 bg-ivory/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gold/10 hover:text-gold"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || updateQuantity.isPending}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium text-walnut">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gold/10 hover:text-gold"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={updateQuantity.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-2xl font-serif font-bold text-gold">
                ₹{Math.round(item.calculated_price || 0).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-gold/20 text-walnut/80 hover:text-gold hover:border-gold hover:bg-gold/5"
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
            className="text-walnut/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={() => deleteItem.mutate()}
            disabled={deleteItem.isPending}
          >
            {deleteItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
