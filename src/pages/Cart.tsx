import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: cartItems, isLoading } = useQuery({
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
      toast({ title: "Item removed from cart" });
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems || cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = cartItems.reduce((sum, item) => sum + (item.calculated_price || 0), 0);

      // Create main order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          customer_name: user.user_metadata?.full_name || user.email,
          customer_email: user.email || "",
          customer_phone: user.user_metadata?.phone || "",
          delivery_address: deliveryAddress,
          subtotal_rs: subtotal,
          net_total_rs: subtotal,
          status: "pending",
          payment_status: "pending",
          advance_percent: 50,
          advance_amount_rs: subtotal * 0.5,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_category: item.product_type,
        product_title: (item.configuration as any)?.productTitle || "Custom Product",
        configuration: item.configuration,
        unit_price_rs: item.calculated_price,
        total_price_rs: item.calculated_price,
        quantity: 1,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Delete draft cart items
      const { error: deleteError } = await supabase
        .from("customer_orders")
        .delete()
        .eq("status", "draft")
        .eq("customer_email", user.email);

      if (deleteError) throw deleteError;

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: "Order Placed!",
        description: `Order ${order.order_number} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalAmount = cartItems?.reduce((sum, item) => sum + (item.calculated_price || 0), 0) || 0;
  const advanceAmount = totalAmount * 0.5;

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {!cartItems || cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start configuring products to add them to your cart
              </p>
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">
                          {item.product_type?.toUpperCase()} Configuration
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Product ID: {item.product_id}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{Math.round(item.calculated_price || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem.mutate(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        {deleteItem.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary & Delivery Address */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{Math.round(totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{Math.round(totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Advance (50%)</span>
                    <span>₹{Math.round(advanceAmount).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Street Address</Label>
                    <Input
                      value={deliveryAddress.street}
                      onChange={(e) =>
                        setDeliveryAddress({ ...deliveryAddress, street: e.target.value })
                      }
                      placeholder="House no., Street"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          setDeliveryAddress({ ...deliveryAddress, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={deliveryAddress.state}
                        onChange={(e) =>
                          setDeliveryAddress({ ...deliveryAddress, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={deliveryAddress.pincode}
                      onChange={(e) =>
                        setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Landmark (Optional)</Label>
                    <Input
                      value={deliveryAddress.landmark}
                      onChange={(e) =>
                        setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    onClick={() => placeOrder.mutate()}
                    disabled={placeOrder.isPending || !deliveryAddress.street || !deliveryAddress.city}
                    className="w-full"
                    size="lg"
                  >
                    {placeOrder.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
