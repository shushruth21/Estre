import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, ShoppingCart, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SavedForLaterProps {
  items: any[];
}

export const SavedForLater = ({ items }: SavedForLaterProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveToCart = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_orders")
        .update({ saved_for_later: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item moved to cart" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_orders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed" });
    },
  });

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved for Later</h2>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">
                    {item.product_type?.toUpperCase()} Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 truncate">
                    Product ID: {item.product_id}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-xl font-bold text-primary">
                      ₹{Math.round(item.calculated_price || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity || 1}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveToCart.mutate(item.id)}
                    disabled={moveToCart.isPending}
                  >
                    {moveToCart.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Move to Cart
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem.mutate(item.id)}
                    disabled={deleteItem.isPending}
                  >
                    {deleteItem.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive mr-2" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
