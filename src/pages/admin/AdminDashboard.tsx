import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Package, ShoppingCart, ClipboardList, Users, DollarSign, TrendingUp, Shield, CheckCircle2, XCircle } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ordersRes, jobCardsRes, productsRes, qcRes] = await Promise.all([
        supabase.from("orders").select("id, net_total_rs, status", { count: "exact" }),
        supabase.from("job_cards").select("id, status", { count: "exact" }),
        supabase.from("sofa_database").select("id", { count: "exact" }),
        supabase.from("quality_inspections").select("id, qc_status", { count: "exact" }),
      ]);

      const totalOrders = ordersRes.count || 0;
      const pendingOrders = ordersRes.data?.filter((o: any) => o.status === "pending").length || 0;
      const totalRevenue = ordersRes.data?.reduce((sum: number, o: any) => sum + (o.net_total_rs || 0), 0) || 0;
      const totalJobCards = jobCardsRes.count || 0;
      const activeJobCards = jobCardsRes.data?.filter((j: any) =>
        !["completed", "cancelled"].includes(j.status)
      ).length || 0;
      const totalProducts = productsRes.count || 0;
      const totalQCReports = qcRes.count || 0;
      const passedQC = qcRes.data?.filter((q: any) => q.qc_status === "pass").length || 0;
      const failedQC = qcRes.data?.filter((q: any) => q.qc_status === "fail").length || 0;
      const pendingQC = qcRes.data?.filter((q: any) => q.qc_status === "pending").length || 0;

      return {
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalJobCards,
        activeJobCards,
        totalProducts,
        totalQCReports,
        passedQC,
        failedQC,
        pendingQC,
      };
    },
  });

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      description: `${stats?.pendingOrders || 0} pending`,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`,
      description: "All time",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Job Cards",
      value: stats?.totalJobCards || 0,
      description: `${stats?.activeJobCards || 0} active`,
      icon: ClipboardList,
      color: "text-orange-600",
    },
    {
      title: "Products",
      value: stats?.totalProducts || 0,
      description: "Active products",
      icon: Package,
      color: "text-slate-600",
    },
  ];

  const qcCards = [
    {
      title: "QC Reports",
      value: stats?.totalQCReports || 0,
      description: "Total inspections",
      icon: Shield,
      color: "text-blue-600",
    },
    {
      title: "Passed",
      value: stats?.passedQC || 0,
      description: "Quality approved",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Failed",
      value: stats?.failedQC || 0,
      description: "Requires rework",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Pending",
      value: stats?.pendingQC || 0,
      description: "Awaiting inspection",
      icon: ClipboardList,
      color: "text-yellow-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Estre Admin Panel</p>
        </div>

        {/* Business Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Business Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quality Control Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quality Control</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {qcCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage recent customer orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Job Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor production status and assignments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
