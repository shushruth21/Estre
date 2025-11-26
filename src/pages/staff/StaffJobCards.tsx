/**
 * StaffJobCards Page
 * 
 * Staff dashboard for viewing and managing job cards.
 * Features:
 * - View all assigned job cards
 * - Update status workflow: pending → cutting → stitching → upholstery → QC → ready → dispatched → delivered
 * - Realtime updates visible to customers
 * - Customer context panel
 * 
 * Route: /staff/job-cards
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Package, FileText, Loader2, User } from "lucide-react";

// Job card status workflow: pending → cutting → stitching → upholstery → QC → ready → dispatched → delivered
const JOB_CARD_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "cutting", label: "Cutting" },
  { value: "stitching", label: "Stitching" },
  { value: "upholstery", label: "Upholstery" },
  { value: "quality_check", label: "Quality Check" },
  { value: "ready", label: "Ready" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

export default function StaffJobCards() {
  const { user, isStaff, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all job cards (staff can see all job cards)
  const { data: jobCards, isLoading } = useQuery({
    queryKey: ["staff-job-cards"],
    queryFn: async () => {
      const query = supabase
        .from("job_cards")
        .select(
          "*, order:orders(id, order_number, customer_name, customer_email, customer_phone, status, expected_delivery_date), order_item:order_items(id, product_title, product_category)"
        )
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: (isStaff() || isAdmin()) && !!user,
  });

  // Get order IDs for realtime subscriptions
  const orderIds = useMemo(() => {
    return Array.from(
      new Set(
        jobCards
          ?.map((jc) => jc.order_id)
          .filter(Boolean) as string[]
      )
    );
  }, [jobCards]);

  // Set up realtime subscriptions
  useRealtimeOrders({ orderIds, enabled: orderIds.length > 0 });

  // Update job card status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      jobCardId,
      newStatus,
    }: {
      jobCardId: string;
      newStatus: string;
    }) => {
      const updates: any = { status: newStatus };

      // Set actual start date if starting production
      if (
        ["cutting", "stitching", "upholstery"].includes(newStatus) &&
        !jobCards?.find((jc) => jc.id === jobCardId)?.actual_start_date
      ) {
        updates.actual_start_date = new Date().toISOString().split("T")[0];
      }

      // Set completion date
      if (newStatus === "delivered") {
        updates.actual_completion_date = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("job_cards")
        .update(updates)
        .eq("id", jobCardId)
        .select()
        .single();

      if (error) throw error;

      // Add timeline entry to order
      if (data.order_id) {
        await supabase.from("order_timeline").insert({
          order_id: data.order_id,
          status: data.status,
          title: "Job Card Status Updated",
          description: `Job card ${data.job_card_number} status changed to ${newStatus.replace(/_/g, " ")}`,
          created_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-job-cards"] });
      toast({
        title: "Status Updated",
        description: "Job card status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update job card status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (jobCardId: string, newStatus: string) => {
    updateStatusMutation.mutate({ jobCardId, newStatus });
  };

  const filterJobCards = (status: string) => {
    if (status === "all") return jobCards || [];
    if (status === "in_progress") {
      return (jobCards || []).filter((j) =>
        ["cutting", "stitching", "upholstery", "quality_check"].includes(
          j.status || ""
        )
      );
    }
    return (jobCards || []).filter((j) => j.status === status);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      quality_check: "outline",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      normal: "bg-blue-100 text-blue-800",
      low: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[priority] || colors.normal}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const JobCardsList = ({ cards }: { cards: any[] }) => (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No job cards found.</p>
      ) : (
        cards.map((jobCard) => (
          <Card key={jobCard.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{jobCard.job_card_number}</CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(jobCard.status)}
                    {getPriorityBadge(jobCard.priority)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={jobCard.status || "pending"}
                    onValueChange={(value) => handleStatusChange(jobCard.id, value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_CARD_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link to={`/staff/job-cards/${jobCard.id}`}>
                    <Button>View Details</Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Customer Context Panel */}
              {jobCard.order && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Customer Information</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{jobCard.order.customer_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{jobCard.order.customer_email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{jobCard.order.customer_phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order Status</p>
                      <p className="font-medium">
                        {jobCard.order.status?.replace(/_/g, " ") || "PENDING"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm text-muted-foreground">
                    {jobCard.product_title || jobCard.order_item?.product_title} ({jobCard.product_category || jobCard.order_item?.product_category})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p className="text-sm text-muted-foreground">
                    {jobCard.order?.order_number || jobCard.order_number || "N/A"}
                  </p>
                </div>
                {jobCard.order?.expected_delivery_date && (
                  <div>
                    <p className="text-sm font-medium">Expected Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(jobCard.order.expected_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <Separator className="my-3" />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-dashed border-muted/60 p-3">
                  <p className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Fabric Plan
                  </p>
                  <p className="text-sm font-medium">
                    {jobCard.fabric_meters?.planType || "Not set"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total:{" "}
                    {jobCard.fabric_meters?.totalMeters
                      ? `${jobCard.fabric_meters.totalMeters.toFixed(2)} m`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-dashed border-muted/60 p-3">
                  <p className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Sections
                  </p>
                  {jobCard.accessories?.sections?.length ? (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {jobCard.accessories.sections.map((section: any) => (
                        <li key={`${jobCard.id}-${section.section}`}>
                          {section.section}: {section.seater} × {section.quantity} •{" "}
                          {section.fabricMeters?.toFixed(2) ?? "0.00"}m
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No section data</p>
                  )}
                </div>
                {jobCard.order && (
                  <div className="rounded-lg border border-dashed border-muted/60 p-3">
                    <p className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Sale Order
                    </p>
                    <p className="text-sm font-medium">{jobCard.order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {jobCard.order.status?.replace(/_/g, " ") || "PENDING"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: ₹{Math.round(jobCard.order.net_total_rs || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground ml-2">Loading job cards...</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Job Cards</h1>
          <p className="text-muted-foreground">View and manage your assigned job cards.</p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({jobCards?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterJobCards("pending").length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({filterJobCards("in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready ({filterJobCards("ready").length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered ({filterJobCards("delivered").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <JobCardsList cards={jobCards || []} />
          </TabsContent>
          <TabsContent value="pending">
            <JobCardsList cards={filterJobCards("pending")} />
          </TabsContent>
          <TabsContent value="in_progress">
            <JobCardsList cards={filterJobCards("in_progress")} />
          </TabsContent>
          <TabsContent value="ready">
            <JobCardsList cards={filterJobCards("ready")} />
          </TabsContent>
          <TabsContent value="delivered">
            <JobCardsList cards={filterJobCards("delivered")} />
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
}
