import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { SavedForLater } from "@/components/cart/SavedForLater";

const Cart = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: allItems, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("status", "draft")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const cartItems = allItems?.filter(item => !item.saved_for_later) || [];
  const savedItems = allItems?.filter(item => item.saved_for_later) || [];

  const totalAmount = cartItems?.reduce((sum, item) => sum + (item.calculated_price || 0), 0) || 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please login to view your cart</p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-muted-foreground">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/products">
            <Button variant="ghost" size="sm" className="hover:text-gold transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-8 tracking-tight">Shopping Cart</h1>

        {cartItems.length === 0 && savedItems.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md border border-gold/20 shadow-sm">
            <CardContent className="py-16 text-center">
              <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-gold/60" />
              <h2 className="text-3xl font-serif font-bold mb-3">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Start configuring products to add them to your cart
              </p>
              <Link to="/products">
                <Button variant="luxury" size="lg" className="mt-4">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Your cart is empty. Check your saved items below or continue shopping.
                    </p>
                  </CardContent>
                </Card>
              )}

              {savedItems.length > 0 && (
                <>
                  <Separator className="my-8" />
                  <SavedForLater items={savedItems} />
                </>
              )}
            </div>

            {cartItems.length > 0 && (
              <CartSummary
                subtotal={totalAmount}
                onCheckout={() => navigate("/checkout")}
                checkoutDisabled={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
