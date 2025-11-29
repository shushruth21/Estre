import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Package, Eye, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const Orders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale_orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Real-time update received:', payload);
          queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
          queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          sale_orders(*),
          order_items(
            id,
            quantity,
            unit_price_rs,
            total_price_rs,
            product_title,
            product_category,
            configuration
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      production: "bg-purple-500",
      quality_check: "bg-indigo-500",
      ready_for_delivery: "bg-green-500",
      shipped: "bg-cyan-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please login to view your orders</p>
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
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here
              </p>
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="mb-2">
                        Order {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {format(new Date(order.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Order Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Items: {order.order_items?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: ₹{Math.round(order.net_total_rs).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Advance Paid: ₹
                        {Math.round(order.advance_amount_rs || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Delivery Address</h4>
                      <p className="text-sm text-muted-foreground">
                        {(order.delivery_address as any).street}
                        <br />
                        {(order.delivery_address as any).city},{" "}
                        {(order.delivery_address as any).state}
                        <br />
                        {(order.delivery_address as any).pincode}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.product_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.product_category}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ₹{Math.round(item.total_price_rs).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.payment_status === "pending" && (
                    <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                      <p className="text-sm font-semibold text-warning-foreground">
                        Pending Payment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance Amount: ₹
                        {Math.round(order.balance_amount_rs || 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Sale Order Actions */}
                  {/* @ts-ignore */}
                  {order.sale_orders && order.sale_orders.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Sale Order Status</h4>
                      {/* @ts-ignore */}
                      {order.sale_orders.map((so: any) => (
                        <div key={so.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Status: <Badge variant="outline">{so.status.replace(/_/g, ' ')}</Badge>
                            </span>
                            <span className="text-sm font-medium">
                              Final Price: {so.final_price ? `₹${so.final_price.toLocaleString()}` : 'Pending'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/sale-order/${so.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Sale Order
                              </Link>
                            </Button>

                            {so.status === 'awaiting_customer_confirmation' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirm & Pay Advance
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
