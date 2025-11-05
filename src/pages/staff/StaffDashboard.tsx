import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    qualityCheck: 0,
    total: 0,
  });
  const [recentJobCards, setRecentJobCards] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentJobCards();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("job_cards")
      .select("status")
      .eq("assigned_to", user.id);

    if (error) {
      console.error("Error fetching stats:", error);
      return;
    }

    const pending = data?.filter((j) => j.status === "pending").length || 0;
    const inProgress = data?.filter((j) => 
      ["fabric_cutting", "frame_assembly", "upholstery", "finishing"].includes(j.status || "")
    ).length || 0;
    const completed = data?.filter((j) => j.status === "completed").length || 0;
    const qualityCheck = data?.filter((j) => j.status === "quality_check").length || 0;

    setStats({
      pending,
      inProgress,
      completed,
      qualityCheck,
      total: data?.length || 0,
    });
  };

  const fetchRecentJobCards = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("job_cards")
      .select("*")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching job cards:", error);
      return;
    }

    setRecentJobCards(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "in_progress":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "quality_check":
        return "text-purple-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your work overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Check</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualityCheck}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobCards.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No job cards assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {recentJobCards.map((jobCard) => (
                  <div
                    key={jobCard.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{jobCard.job_card_number}</p>
                        <span className={`text-sm ${getStatusColor(jobCard.status)}`}>
                          {jobCard.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {jobCard.product_title} - {jobCard.product_category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {jobCard.customer_name}
                      </p>
                    </div>
                    <Link to={`/staff/job-cards/${jobCard.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
