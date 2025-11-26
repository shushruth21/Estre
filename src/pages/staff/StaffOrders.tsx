/**
 * StaffOrders Page
 * 
 * Staff dashboard for viewing and managing all sale orders.
 * Features:
 * - Search and filter orders by customer name, status, date, dispatch method
 * - View consolidated sale order information
 * - Apply discount codes via dropdown selector
 * - Update order status (admin-approved statuses only)
 * 
 * Route: /staff/orders
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DiscountCodeSelector } from "@/components/DiscountCodeSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StaffLayout } from "@/components/staff/StaffLayout";
import {
  Search,
  Eye,
  Tag,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const StaffOrders = () => {
  const { user, isStaff, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dispatchFilter, setDispatchFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);

  // Fetch all orders (staff can see all orders)
  const { data: orders, isLoading } = useQuery({
    queryKey: ["staff-orders", searchTerm, statusFilter, dateFilter, dispatchFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(
          "id, order_number, status, customer_name, customer_email, customer_phone, net_total_rs, discount_code, discount_amount_rs, subtotal_rs, expected_delivery_date, created_at, payment_status"
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (dispatchFilter !== "all") {
        query = query.eq("delivery_method", dispatchFilter);
      }

      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter in memory (for customer name, email, order number)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          data?.filter(
            (order) =>
              order.customer_name?.toLowerCase().includes(searchLower) ||
              order.customer_email?.toLowerCase().includes(searchLower) ||
              order.order_number?.toLowerCase().includes(searchLower)
          ) || []
        );
      }

      return data || [];
    },
    enabled: isStaff() || isAdmin(),
  });

  // Apply discount code mutation
  const applyDiscountMutation = useMutation({
    mutationFn: async ({
      orderId,
      discountCode,
    }: {
      orderId: string;
      discountCode: string;
    }) => {
      // Fetch discount code details
      const { data: discountData, error: discountError } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode)
        .eq("is_active", true)
        .single();

      if (discountError || !discountData) {
        throw new Error("Invalid or inactive discount code");
      }

      // Get current order
      const { data: currentOrder, error: orderError } = await supabase
        .from("orders")
        .select("subtotal_rs, net_total_rs, advance_amount_rs")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Calculate discount amount
      const subtotal = currentOrder.subtotal_rs || currentOrder.net_total_rs;
      let discountAmount = 0;

      if (discountData.type === "percent") {
        discountAmount = (subtotal * discountData.percent) / 100;
      } else {
        discountAmount = discountData.value || 0;
      }

      const newTotal = subtotal - discountAmount;

      // Update order
      const { data, error } = await supabase
        .from("orders")
        .update({
          discount_code: discountCode,
          discount_amount_rs: discountAmount,
          net_total_rs: newTotal,
          balance_amount_rs: newTotal - (currentOrder.advance_amount_rs || 0),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Add timeline entry
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        status: data.status,
        title: "Discount Applied by Staff",
        description: `Discount code ${discountCode} applied. Discount: ${formatCurrency(discountAmount)}`,
        created_by: user?.id,
      });

      // Update usage count
      await supabase
        .from("discount_codes")
        .update({ usage_count: (discountData.usage_count || 0) + 1 })
        .eq("code", discountCode);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-orders"] });
      setIsDiscountDialogOpen(false);
      toast({
        title: "Discount Applied",
        description: "Discount code has been successfully applied to the order.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Applying Discount",
        description: error.message || "Failed to apply discount code",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: {
      orderId: string;
      newStatus: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Add timeline entry
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        status: newStatus,
        title: "Status Updated",
        description: `Order status changed to ${newStatus.replace(/_/g, " ")}`,
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-orders"] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleApplyDiscount = (code: string) => {
    if (selectedOrder) {
      applyDiscountMutation.mutate({
        orderId: selectedOrder.id,
        discountCode: code,
      });
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "production", label: "In Production" },
    { value: "quality_check", label: "Quality Check" },
    { value: "ready_for_delivery", label: "Ready for Delivery" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const dateOptions = [
    { value: "all", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
  ];

  if (!isStaff() && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">
            View and manage all customer orders
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Customer name, email, or order number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dispatch Method</Label>
                <Select value={dispatchFilter} onValueChange={setDispatchFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="Safe Express">Safe Express</SelectItem>
                    <SelectItem value="Self Pickup">Self Pickup</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders ({orders?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.order_number || `SO-${order.id.slice(0, 8).toUpperCase()}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.customer_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              order.status === "delivered"
                                ? "bg-green-500/10 text-green-600"
                                : order.status === "shipped"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : order.status === "production"
                                    ? "bg-orange-500/10 text-orange-600"
                                    : ""
                            }
                          >
                            {order.status?.replace(/_/g, " ") || "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(order.net_total_rs)}
                        </TableCell>
                        <TableCell>
                          {order.discount_code ? (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span className="text-xs">{order.discount_code}</span>
                              <span className="text-xs text-green-600">
                                (-{formatCurrency(order.discount_amount_rs)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{order.delivery_method || "TBD"}</p>
                            {order.expected_delivery_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.expected_delivery_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog
                              open={isDetailDialogOpen && selectedOrder?.id === order.id}
                              onOpenChange={(open) => {
                                setIsDetailDialogOpen(open);
                                if (open) {
                                  setSelectedOrder(order);
                                } else {
                                  setSelectedOrder(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription>
                                    Order: {order.order_number}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-semibold">Customer Information</Label>
                                    <div className="mt-2 space-y-1 text-sm">
                                      <p>
                                        <span className="font-medium">Name:</span> {order.customer_name}
                                      </p>
                                      <p>
                                        <span className="font-medium">Email:</span> {order.customer_email}
                                      </p>
                                      <p>
                                        <span className="font-medium">Phone:</span> {order.customer_phone}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Pricing</Label>
                                    <div className="mt-2 space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(order.subtotal_rs || order.net_total_rs)}</span>
                                      </div>
                                      {order.discount_code && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Discount ({order.discount_code}):</span>
                                          <span>-{formatCurrency(order.discount_amount_rs)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Net Total:</span>
                                        <span>{formatCurrency(order.net_total_rs)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Update Status</Label>
                                    <Select
                                      value={order.status}
                                      onValueChange={(value) =>
                                        handleStatusChange(order.id, value)
                                      }
                                    >
                                      <SelectTrigger className="mt-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {statusOptions
                                          .filter((opt) => opt.value !== "all")
                                          .map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isDiscountDialogOpen && selectedOrder?.id === order.id}
                              onOpenChange={(open) => {
                                setIsDiscountDialogOpen(open);
                                if (open) {
                                  setSelectedOrder(order);
                                } else {
                                  setSelectedOrder(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Apply Discount Code</DialogTitle>
                                  <DialogDescription>
                                    Apply a discount code to order {order.order_number}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <DiscountCodeSelector
                                    onApply={handleApplyDiscount}
                                    disabled={applyDiscountMutation.isPending}
                                    selectedCode={order.discount_code}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Link to={`/staff/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                View Full
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No orders found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffOrders;

