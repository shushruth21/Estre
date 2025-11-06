import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Eye, Search, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

const AdminJobCards = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all job cards
  const { data: jobCards, isLoading } = useQuery({
    queryKey: ["admin-job-cards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all orders (for job card creation)
  const { data: orders } = useQuery({
    queryKey: ["admin-orders-for-job-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, net_total_rs")
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch order items for selected order
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: orderItems } = useQuery({
    queryKey: ["order-items", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrderId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrderId,
  });

  // Fetch staff members
  const { data: staffMembers } = useQuery({
    queryKey: ["admin-staff-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "factory_staff");

      if (error) throw error;

      // Get user details
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
  });

  // Create job card mutation
  const createJobCardMutation = useMutation({
    mutationFn: async (data: any) => {
      // Generate job card number
      const jobCardNumber = `JC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", data.order_id)
        .single();

      const { data: orderItem } = await supabase
        .from("order_items")
        .select("*")
        .eq("id", data.order_item_id)
        .single();

      const jobCardData = {
        job_card_number: jobCardNumber,
        order_id: data.order_id,
        order_item_id: data.order_item_id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        product_category: orderItem.product_category,
        product_title: orderItem.product_title,
        configuration: orderItem.configuration,
        fabric_codes: data.fabric_codes || {},
        fabric_meters: data.fabric_meters || {},
        accessories: data.accessories || {},
        dimensions: data.dimensions || {},
        status: "pending",
        priority: data.priority || "normal",
        expected_completion_date: data.expected_completion_date || null,
        admin_notes: data.admin_notes || null,
      };

      const { error } = await supabase.from("job_cards").insert(jobCardData);

      if (error) throw error;

      // Create default tasks
      const defaultTasks = [
        { task_name: "Fabric Cutting", task_type: "fabric_cutting", sort_order: 1 },
        { task_name: "Frame Work", task_type: "frame_work", sort_order: 2 },
        { task_name: "Upholstery", task_type: "upholstery", sort_order: 3 },
        { task_name: "Assembly", task_type: "assembly", sort_order: 4 },
        { task_name: "Finishing", task_type: "finishing", sort_order: 5 },
        { task_name: "Quality Check", task_type: "quality_check", sort_order: 6 },
      ];

      // Get the created job card ID
      const { data: createdJobCard } = await supabase
        .from("job_cards")
        .select("id")
        .eq("job_card_number", jobCardNumber)
        .single();

      if (createdJobCard) {
        const tasksToInsert = defaultTasks.map((task) => ({
          job_card_id: createdJobCard.id,
          ...task,
        }));

        await supabase.from("job_card_tasks").insert(tasksToInsert);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-job-cards"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Job card created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job card",
        variant: "destructive",
      });
    },
  });

  // Assign staff mutation
  const assignStaffMutation = useMutation({
    mutationFn: async ({ jobCardId, staffId }: { jobCardId: string; staffId: string }) => {
      const { error } = await supabase
        .from("job_cards")
        .update({
          assigned_to: staffId,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", jobCardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-job-cards"] });
      setIsAssignDialogOpen(false);
      setSelectedJobCard(null);
      toast({
        title: "Success",
        description: "Staff assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign staff",
        variant: "destructive",
      });
    },
  });

  const handleCreateJobCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createJobCardMutation.mutate({
      order_id: formData.get("order_id") as string,
      order_item_id: formData.get("order_item_id") as string,
      priority: formData.get("priority") as string,
      expected_completion_date: formData.get("expected_completion_date") as string,
      admin_notes: formData.get("admin_notes") as string,
      fabric_codes: {},
      fabric_meters: {},
      accessories: {},
      dimensions: {},
    });
  };

  const handleAssignStaff = (jobCard: any) => {
    setSelectedJobCard(jobCard);
    setIsAssignDialogOpen(true);
  };

  const handleConfirmAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const staffId = formData.get("staff_id") as string;

    if (selectedJobCard) {
      assignStaffMutation.mutate({
        jobCardId: selectedJobCard.id,
        staffId,
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      fabric_cutting: "bg-blue-100 text-blue-800",
      frame_assembly: "bg-purple-100 text-purple-800",
      upholstery: "bg-indigo-100 text-indigo-800",
      finishing: "bg-pink-100 text-pink-800",
      quality_check: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredJobCards = jobCards?.filter((jc: any) =>
    jc.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jc.product_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Cards Management</h1>
            <p className="text-muted-foreground">
              Create and manage production job cards
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Job Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Card</DialogTitle>
                <DialogDescription>
                  Create a job card from an approved order
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateJobCard}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_id">Order *</Label>
                    <Select
                      name="order_id"
                      required
                      onValueChange={(value) => setSelectedOrderId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders?.map((order: any) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.order_number} - {order.customer_name} (₹{order.net_total_rs?.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedOrderId && orderItems && orderItems.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="order_item_id">Order Item *</Label>
                      <Select name="order_item_id" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an order item" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderItems.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.product_title} ({item.product_category}) - Qty: {item.quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_completion_date">
                      Expected Completion Date
                    </Label>
                    <Input
                      id="expected_completion_date"
                      name="expected_completion_date"
                      type="date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_notes">Admin Notes</Label>
                    <Textarea
                      id="admin_notes"
                      name="admin_notes"
                      placeholder="Add any special instructions..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createJobCardMutation.isPending}
                  >
                    {createJobCardMutation.isPending ? "Creating..." : "Create Job Card"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fabric_cutting">Fabric Cutting</SelectItem>
                  <SelectItem value="frame_assembly">Frame Assembly</SelectItem>
                  <SelectItem value="upholstery">Upholstery</SelectItem>
                  <SelectItem value="finishing">Finishing</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Cards Table */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : !filteredJobCards || filteredJobCards.length === 0 ? (
          <Alert>
            <AlertDescription>
              No job cards found. Create your first job card above.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {filteredJobCards.length} Job Card(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Card #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobCards.map((jobCard: any) => (
                    <TableRow key={jobCard.id}>
                      <TableCell className="font-medium">
                        {jobCard.job_card_number}
                      </TableCell>
                      <TableCell>{jobCard.order_number}</TableCell>
                      <TableCell>{jobCard.customer_name}</TableCell>
                      <TableCell>
                        {jobCard.product_title}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {jobCard.product_category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(jobCard.status || "pending")}>
                          {(jobCard.status || "pending").replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(jobCard.priority || "normal").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {jobCard.assigned_to ? (
                          <span className="text-sm">Assigned</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!jobCard.assigned_to && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignStaff(jobCard)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Assign Staff Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Staff</DialogTitle>
              <DialogDescription>
                Assign a staff member to job card: {selectedJobCard?.job_card_number}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmAssign}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="staff_id">Staff Member *</Label>
                  <Select name="staff_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers?.map((staff: any) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.full_name || staff.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAssignDialogOpen(false);
                    setSelectedJobCard(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignStaffMutation.isPending}
                >
                  {assignStaffMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminJobCards;

