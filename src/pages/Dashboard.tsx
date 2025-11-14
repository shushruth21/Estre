import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  ClipboardList,
  Clock,
  Truck,
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
  const [user, setUser] = useState<any>(null);
  const [ordersState, setOrdersState] = useState(emptyOrderState);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Authentication Error",
          description: "We could not verify your session. Please log in again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);
      setIsAuthenticating(false);
      await fetchOrders(user);
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchOrders = async (currentUser: any) => {
    setOrdersState((prev) => ({ ...prev, isLoading: true }));

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, expected_delivery_date, net_total_rs, advance_amount_rs, balance_amount_rs, created_at, metadata"
      )
      .eq("customer_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Unable to load orders",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setOrdersState(emptyOrderState);
      return;
    }

    const orderIds = orders?.map((order) => order.id) ?? [];
    let jobCardsByOrder: Record<string, any[]> = {};
    let timelineByOrder: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const jobCardsPromise = supabase
        .from("job_cards")
        .select(
          "id, order_id, line_item_id, job_card_number, status, priority, product_title, product_category, created_at, updated_at, fabric_meters, accessories, dimensions"
        )
        .in("order_id", orderIds);

      const timelinePromise = supabase
        .from("order_timeline")
        .select("id, order_id, status, title, description, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      const [{ data: jobCards }, { data: timeline }] = await Promise.all([
        jobCardsPromise,
        timelinePromise,
      ]);

      jobCardsByOrder =
        jobCards?.reduce((acc: Record<string, any[]>, card) => {
          const key = card.order_id;
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const isLoading = isAuthenticating || ordersState.isLoading;

  const dashboardHeader = useMemo(() => {
    if (!user) return null;
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome back, {user.user_metadata?.full_name || user.email}!
          </h2>
          <p className="text-muted-foreground">
            Track your orders and monitor production updates in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/products")}>
            <Package className="mr-2 h-4 w-4" />
            Browse Products
          </Button>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    );
  }, [navigate, user]);

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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
            <Button variant="ghost" onClick={() => navigate("/orders")}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 space-y-10">
        {dashboardHeader}

        {ordersState.orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                No orders yet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Configure your first product to see live production updates and
                delivery timelines here.
              </p>
              <Button onClick={() => navigate("/products")}>
                Start Configuring
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {ordersState.orders.map((order) => (
              <Card key={order.id} className="border-muted/60 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Order {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <Badge className="uppercase tracking-wide">
                        {order.status?.replace(/_/g, " ") || "PENDING"}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(order.net_total_rs)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        {order.expected_delivery_date
                          ? new Date(
                              order.expected_delivery_date
                            ).toLocaleDateString()
                          : "TBD"}
                      </p>
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
