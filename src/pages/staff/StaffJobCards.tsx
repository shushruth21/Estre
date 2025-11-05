import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffJobCards() {
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobCards();
  }, [user]);

  const fetchJobCards = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("job_cards")
      .select("*")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching job cards:", error);
    } else {
      setJobCards(data || []);
    }
    setLoading(false);
  };

  const filterJobCards = (status: string) => {
    if (status === "all") return jobCards;
    if (status === "in_progress") {
      return jobCards.filter((j) => 
        ["fabric_cutting", "frame_assembly", "upholstery", "finishing"].includes(j.status || "")
      );
    }
    return jobCards.filter((j) => j.status === status);
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
                <Link to={`/staff/job-cards/${jobCard.id}`}>
                  <Button>View Details</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm text-muted-foreground">
                    {jobCard.product_title} ({jobCard.product_category})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">{jobCard.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p className="text-sm text-muted-foreground">{jobCard.order_number}</p>
                </div>
                {jobCard.expected_completion_date && (
                  <div>
                    <p className="text-sm font-medium">Expected Completion</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(jobCard.expected_completion_date).toLocaleDateString()}
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

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading job cards...</p>
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
              All ({jobCards.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterJobCards("pending").length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({filterJobCards("in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterJobCards("completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <JobCardsList cards={jobCards} />
          </TabsContent>
          <TabsContent value="pending">
            <JobCardsList cards={filterJobCards("pending")} />
          </TabsContent>
          <TabsContent value="in_progress">
            <JobCardsList cards={filterJobCards("in_progress")} />
          </TabsContent>
          <TabsContent value="completed">
            <JobCardsList cards={filterJobCards("completed")} />
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
}
