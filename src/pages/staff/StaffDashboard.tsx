import { useQuery } from "@tanstack/react-query";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Clock, CheckCircle2, AlertCircle, ShoppingCart, FileText, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StaffDashboard() {
  const navigate = useNavigate();

  // Fetch ALL job cards (not just assigned to user)
  const { data: jobCards, isLoading: jobCardsLoading } = useQuery({
    queryKey: ["staff-dashboard-job-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_cards")
        .select(`
          *,
          sale_order:sale_orders(order_number)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sale orders statistics
  const { data: saleOrders } = useQuery({
    queryKey: ["staff-dashboard-sale-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_orders")
        .select("id, status, base_price, final_price, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = {
    totalJobs: jobCards?.length || 0,
    pending: jobCards?.filter((j) => j.status === "pending").length || 0,
    inProgress: jobCards?.filter((j) =>
      ["in_progress", "fabric_cutting", "frame_assembly", "upholstery", "finishing"].includes(j.status || "")
    ).length || 0,
    qualityCheck: jobCards?.filter((j) => j.status === "quality_check").length || 0,
    completed: jobCards?.filter((j) => j.status === "completed").length || 0,

    totalSaleOrders: saleOrders?.length || 0,
    pendingReview: saleOrders?.filter((so) => so.status === "pending_review").length || 0,
    approved: saleOrders?.filter((so) => so.status === "staff_approved").length || 0,

    totalRevenue: saleOrders?.reduce((sum, so) => sum + (so.final_price || 0), 0) || 0,
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600";
      case "completed":
        return "bg-green-500/10 text-green-600";
      case "quality_check":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your work overview.</p>
        </div>

        {/* Job Cards Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Production Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link to="/staff/job-cards">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalJobs}</div>
                  <p className="text-xs text-muted-foreground mt-1">All job cards</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/staff/job-cards')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/staff/job-cards')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground mt-1">Being manufactured</p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/staff/job-cards')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Check</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.qualityCheck}</div>
                <p className="text-xs text-muted-foreground mt-1">Under inspection</p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/staff/job-cards')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for delivery</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sale Orders & Revenue Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Sales Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/staff/sale-orders">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sale Orders</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSaleOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total orders</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/staff/sale-orders">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div>
                  <p className="text-xs text-muted-foreground mt-1">Needs approval</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/staff/sale-orders">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ready for production</p>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">All sale orders</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Job Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Job Cards</CardTitle>
            <Link to="/staff/job-cards">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobCardsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : jobCards && jobCards.length > 0 ? (
              <div className="space-y-3">
                {jobCards.slice(0, 5).map((jobCard) => (
                  <div
                    key={jobCard.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold font-mono text-sm">{jobCard.job_card_number}</p>
                        <Badge className={getStatusColor(jobCard.status || "pending")}>
                          {jobCard.status?.replace(/_/g, " ").toUpperCase() || "PENDING"}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        {jobCard.product_title || jobCard.product_category || "Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        S.O. #{jobCard.sale_order?.order_number || "—"}
                      </p>
                    </div>
                    <Link to={`/staff/job-cards/${jobCard.id}`}>
                      <Button size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Job Cards Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Job cards are created automatically when sale orders are approved.
                </p>
                <Link to="/staff/sale-orders">
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Review Sale Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
