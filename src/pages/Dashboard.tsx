import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import {
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  ClipboardList,
  Clock,
  Truck,
  Tag,
  Eye,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const emptyOrderState = {
  orders: [] as any[],
  isLoading: true,
};

const Dashboard = () => {
  const { user, profile, loading: authLoading, isAdmin, isStaff } = useAuth();
  const [ordersState, setOrdersState] = useState(emptyOrderState);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get order IDs for realtime subscriptions
  const orderIds = useMemo(() => {
    return ordersState.orders.map((order) => order.id);
  }, [ordersState.orders]);

  // Define fetchOrders BEFORE useEffect to avoid initialization error
  const fetchOrders = useCallback(async (currentUser: any) => {
    setOrdersState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Add timeout to prevent hanging (10 seconds)
      const ordersPromise = supabase
        .from("orders")
        .select(
          "id, order_number, status, expected_delivery_date, net_total_rs, advance_amount_rs, balance_amount_rs, discount_code, discount_amount_rs, subtotal_rs, created_at, metadata, delivery_method, delivery_date"
        )
        .eq("customer_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50); // Limit to 50 most recent orders for performance

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Orders fetch timeout")), 10000)
      );

      const { data: orders, error } = await Promise.race([ordersPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      const orderIds = orders?.map((order) => order.id) ?? [];
      let jobCardsByOrder: Record<string, any[]> = {};
      let timelineByOrder: Record<string, any[]> = {};

      if (orderIds.length > 0) {
        // Add timeout to job cards and timeline queries (5 seconds each)
        const jobCardsPromise = supabase
          .from("job_cards")
          .select(
            "id, order_id, order_item_id, job_card_number, status, priority, product_title, product_category, created_at, updated_at, fabric_meters, accessories, dimensions"
          )
          .in("order_id", orderIds);

        const timelinePromise = supabase
          .from("order_timeline")
          .select("id, order_id, status, title, description, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Related data fetch timeout")), 5000)
        );

        const [{ data: jobCards }, { data: timeline }] = await Promise.race([
          Promise.all([jobCardsPromise, timelinePromise]),
          timeoutPromise.then(() => [{ data: null, error: null }, { data: null, error: null }] as any)
        ]).catch(() => [{ data: null, error: null }, { data: null, error: null }] as any);

        jobCardsByOrder =
          jobCards?.reduce((acc: Record<string, any[]>, card) => {
            const key = card.order_id || '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(card);
            return acc;
          }, {}) ?? {};

        timelineByOrder =
          timeline?.reduce((acc: Record<string, any[]>, entry) => {
            const key = entry.order_id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(entry);
            return acc;
          }, {}) ?? {};
      }

      const enrichedOrders =
        orders?.map((order) => ({
          ...order,
          jobCards: jobCardsByOrder[order.id] ?? [],
          timeline: timelineByOrder[order.id] ?? [],
        })) ?? [];

      setOrdersState({
        orders: enrichedOrders,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      
      // Always set loading to false, even on error
      setOrdersState({
        orders: [],
        isLoading: false,
      });

      // Only show toast for non-timeout errors
      if (!error?.message?.includes("timeout")) {
        toast({
          title: "Unable to load orders",
          description: error?.message || "Please try again in a moment.",
          variant: "destructive",
        });
      }
    }
  }, [toast, navigate]);

  // Set up realtime subscriptions
  useRealtimeOrders({ orderIds, enabled: orderIds.length > 0 });

  // Fetch sale orders for customer (orders needing action)
  const { data: saleOrders } = useQuery({
    queryKey: ["customer-sale-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from("sale_orders")
          .select(`
            *,
            order:orders(
              id,
              order_number,
              customer_name,
              customer_email
            )
          `)
          .eq("customer_id", user.id)
          .in("status", ["awaiting_customer_otp", "confirmed_by_customer", "pending_staff_review"])
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Sale orders error:", error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.error("Error fetching sale orders:", error);
        return [];
      }
    },
    enabled: !!user && !isAdmin() && !isStaff(),
    refetchOnWindowFocus: true,
  });

  // Redirect admin/staff users to their respective dashboards
  // Quick check (max 1 second) - customers don't need to wait
  useEffect(() => {
    if (!authLoading && user) {
      // Quick check for admin/staff (customers stay on dashboard)
      const checkRole = async () => {
        let attempts = 0;
        const maxAttempts = 5; // 5 attempts * 200ms = 1 second max
        
        while (attempts < maxAttempts) {
          // Check if admin/staff role is available
          if (isAdmin()) {
            console.log('🔄 Dashboard: Redirecting admin to admin dashboard');
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          if (isStaff()) {
            console.log('🔄 Dashboard: Redirecting staff to staff dashboard');
            navigate("/staff/dashboard", { replace: true });
            return;
          }
          
          // Quick profile check (only if profile not loaded yet)
          if (attempts === 2 && !profile) {
            try {
              const { data: directProfile } = await supabase
                .from("profiles")
                .select("role")
                .eq("user_id", user.id)
                .single();
              
              if (directProfile?.role) {
                const roleLower = directProfile.role.toLowerCase().trim();
                if (roleLower === "admin" || roleLower === "super_admin") {
                  navigate("/admin/dashboard", { replace: true });
                  return;
                }
                if (["staff", "production_manager", "store_manager", "factory_staff", "ops_team"].includes(roleLower)) {
                  navigate("/staff/dashboard", { replace: true });
                  return;
                }
              }
            } catch (err) {
              // Ignore errors - user is likely a customer
            }
          }
          
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
        
        // If we get here, user is a customer - no redirect needed
      };
      
      checkRole();
    }
  }, [authLoading, user, isAdmin, isStaff, navigate, profile]);

  // Fetch orders when user is available
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      // Only fetch orders for customer users (admin/staff are redirected above)
      if (!isAdmin() && !isStaff()) {
        fetchOrders(user);
      }
    }
  }, [user, authLoading, navigate, fetchOrders, isAdmin, isStaff]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  // Add timeout for authLoading (max 5 seconds)
  const [authLoadingTimeout, setAuthLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        setAuthLoadingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  const isLoading = (authLoading && !authLoadingTimeout) || ordersState.isLoading;

  const dashboardHeader = useMemo(() => {
    if (!user) return null;
    // Safely access profile with optional chaining
    const displayName = profile?.full_name || user.email || 'User';
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">
            Welcome back, {displayName}!
          </h2>
          <p className="text-muted-foreground text-lg mt-2">
            Track your orders and monitor production updates in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/products")} className="border-gold/30 hover:border-gold hover:text-gold transition-colors">
            <Package className="mr-2 h-4 w-4" />
            Browse Products
          </Button>
          <Button onClick={handleLogout} variant="outline" className="border-gold/30 hover:border-gold hover:text-gold transition-colors">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    );
  }, [navigate, user, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">Customer Dashboard</h1>
            <Button variant="ghost" onClick={() => navigate("/orders")} className="hover:text-gold transition-colors">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 space-y-10">
        {dashboardHeader}

        {/* Sale Orders Needing Action */}
        {saleOrders && saleOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif">Orders Needing Your Action</h2>
            {saleOrders.map((saleOrder: any) => (
              <Card key={saleOrder.id} className="luxury-card-glass border-yellow-500/30 hover:border-yellow-500/50 transition-premium">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl font-serif">
                        Sale Order: {saleOrder.order?.order_number || `SO-${saleOrder.id.slice(0, 8).toUpperCase()}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created on{" "}
                        {saleOrder.created_at
                          ? new Date(saleOrder.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <Badge 
                      className={`uppercase tracking-wide ${
                        saleOrder.status === 'confirmed_by_customer' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        saleOrder.status === 'awaiting_customer_otp' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                        'bg-blue-500/10 text-blue-600 border-blue-500/30'
                      }`}
                    >
                      {saleOrder.status?.replace(/_/g, " ") || "PENDING"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Base Price
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(saleOrder.base_price)}
                      </p>
                    </div>
                    {saleOrder.discount > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Discount
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          -{formatCurrency(saleOrder.discount)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Final Price
                      </p>
                      <p className="text-lg font-semibold text-gold">
                        {formatCurrency(saleOrder.final_price)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {saleOrder.status === "awaiting_customer_otp" && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-600 mb-1">
                            OTP Verification Required
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please check your email for the OTP code to confirm your order. The OTP is valid for 10 minutes.
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate(`/order-confirmation/${saleOrder.id}`)}
                        className="w-full bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium"
                        size="lg"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Enter OTP to Confirm Order
                      </Button>
                    </div>
                  )}

                  {saleOrder.status === "confirmed_by_customer" && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-600 mb-1">
                            Order Confirmed
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your order has been confirmed. Please proceed to payment to start production.
                          </p>
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Advance Payment (50%)</span>
                          <span className="font-semibold">{formatCurrency((saleOrder.final_price || 0) * 0.5)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance on Delivery</span>
                          <span className="font-semibold">{formatCurrency((saleOrder.final_price || 0) * 0.5)}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate(`/payment/${saleOrder.id}`)}
                        className="w-full bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium"
                        size="lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Payment (50% Advance)
                      </Button>
                    </div>
                  )}

                  {saleOrder.status === "pending_staff_review" && (
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-600 mb-1">
                          Under Review
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your order is being reviewed by Estre Staff. You'll receive a confirmation email with PDF and OTP shortly.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Existing Orders Section */}
        {ordersState.orders.length === 0 && (!saleOrders || saleOrders.length === 0) ? (
          <Card className="luxury-card-glass border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <ClipboardList className="h-6 w-6 text-gold" />
                No orders yet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              <p className="text-muted-foreground text-lg">
                Configure your first product to see live production updates and
                delivery timelines here.
              </p>
              <Button 
                onClick={() => navigate("/products")}
                className="bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium"
                size="lg"
              >
                Start Configuring
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {ordersState.orders.map((order) => (
              <Card key={order.id} className="luxury-card-glass border-gold/20 hover:border-gold/40 transition-premium">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-2xl font-serif">
                        Order {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Placed on{" "}
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <Badge 
                        className={`uppercase tracking-wide ${
                          order.status === 'delivered' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                          order.status === 'shipped' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                          order.status === 'ready_for_delivery' ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' :
                          order.status === 'production' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                          order.status === 'confirmed' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' :
                          'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                        }`}
                      >
                        {order.status?.replace(/_/g, " ") || "PENDING"}
                      </Badge>
                      <div className="text-right">
                        {order.discount_code && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Tag className="h-3 w-3" />
                            <span>Code: {order.discount_code}</span>
                            {order.discount_amount_rs > 0 && (
                              <span className="text-green-600">
                                (-{formatCurrency(order.discount_amount_rs)})
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm font-semibold text-gold">
                          Total: {formatCurrency(order.net_total_rs)}
                        </p>
                        {order.subtotal_rs && order.subtotal_rs !== order.net_total_rs && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(order.subtotal_rs)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Sale Order Number
                      </p>
                      <p className="text-lg font-semibold font-mono">
                        {order.order_number || `SO-${order.id.slice(0, 8).toUpperCase()}`}
                      </p>
                    </div>
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Advance Paid
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(order.advance_amount_rs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Balance Due
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(order.balance_amount_rs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Expected Delivery
                      </p>
                      <p className="text-lg font-semibold">
                        {order.expected_delivery_date || order.delivery_date
                          ? new Date(
                              order.expected_delivery_date || order.delivery_date
                            ).toLocaleDateString()
                          : "TBD"}
                      </p>
                      {order.delivery_method && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Via {order.delivery_method}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Production Job Cards
                    </h3>
                    {order.jobCards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Job cards are being generated. Check back soon.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {order.jobCards.map((jobCard) => {
                          const fabricPlan = jobCard.fabric_meters || {};
                          const sections =
                            jobCard.accessories?.sections || [];
                          return (
                            <div
                              key={jobCard.id}
                              className="rounded-lg border border-muted/60 bg-muted/30 p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {jobCard.job_card_number}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {jobCard.product_title} (
                                    {jobCard.product_category})
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {jobCard.status?.replace(/_/g, " ") ||
                                      "PENDING"}
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {jobCard.priority?.toUpperCase() ||
                                      "NORMAL"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Fabric Plan
                                  </p>
                                  <p className="text-sm font-medium">
                                    {fabricPlan.planType || "Not set"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Total Fabric:{" "}
                                    {fabricPlan.totalMeters
                                      ? `${fabricPlan.totalMeters.toFixed(2)} m`
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Structure / Seat
                                  </p>
                                  <p className="text-sm">
                                    {fabricPlan.structureMeters
                                      ? `${fabricPlan.structureMeters.toFixed(
                                          2
                                        )} m`
                                      : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Armrest
                                  </p>
                                  <p className="text-sm">
                                    {fabricPlan.armrestMeters
                                      ? `${fabricPlan.armrestMeters.toFixed(
                                          2
                                        )} m`
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                              {sections.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs uppercase font-semibold text-muted-foreground">
                                    Sections
                                  </p>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {sections.map((section: any) => (
                                      <div
                                        key={`${jobCard.id}-${section.section}`}
                                        className="rounded-md border border-dashed border-muted px-3 py-2"
                                      >
                                        <p className="text-sm font-semibold">
                                          {section.section} —{" "}
                                          {section.seater} ×{" "}
                                          {section.quantity}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Fabric:{" "}
                                          {section.fabricMeters?.toFixed(2) ??
                                            "0.00"}{" "}
                                          m
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {order.timeline.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Order Timeline
                        </h3>
                        <div className="space-y-2">
                          {order.timeline.map((entry: any) => (
                            <div
                              key={entry.id}
                              className="rounded-md border border-muted/40 bg-muted/20 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">
                                  {entry.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {entry.created_at
                                    ? new Date(
                                        entry.created_at
                                      ).toLocaleString()
                                    : "-"}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
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

export default Dashboard;
