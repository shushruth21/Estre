import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Ruler,
  Shirt,
  Wrench
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function StaffJobCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobCard, setJobCard] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [staffNotes, setStaffNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobCard();
    fetchTasks();
  }, [id, user]);

  const fetchJobCard = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from("job_cards")
      .select("*")
      .eq("id", id)
      .eq("assigned_to", user.id)
      .single();

    if (error) {
      console.error("Error fetching job card:", error);
      toast({
        title: "Error",
        description: "Failed to load job card",
        variant: "destructive",
      });
      navigate("/staff/job-cards");
      return;
    }

    setJobCard(data);
    setStaffNotes(data.staff_notes || "");
    setLoading(false);
  };

  const fetchTasks = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("job_card_tasks")
      .select("*")
      .eq("job_card_id", id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }

    setTasks(data || []);
  };

  const updateJobCardStatus = async (newStatus: string) => {
    if (!id) return;

    const updates: any = { status: newStatus };
    
    if (["fabric_cutting", "frame_assembly", "upholstery", "finishing"].includes(newStatus) && !jobCard.actual_start_date) {
      updates.actual_start_date = new Date().toISOString().split("T")[0];
    }
    
    if (newStatus === "completed") {
      updates.actual_completion_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("job_cards")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      return;
    }

    // Log activity
    await supabase.from("staff_activity_log").insert({
      staff_name: user?.email || "Unknown",
      action: `Updated job card ${jobCard.job_card_number} status to ${newStatus}`,
      details: { job_card_id: id, new_status: newStatus },
    });

    toast({
      title: "Success",
      description: "Job card status updated",
    });

    fetchJobCard();
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (["in_progress"].includes(newStatus) && !tasks.find(t => t.id === taskId)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    
    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user?.id;
    }

    const { error } = await supabase
      .from("job_card_tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Task updated",
    });

    fetchTasks();
  };

  const saveStaffNotes = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("job_cards")
      .update({ staff_notes: staffNotes })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
      return;
    }

    await supabase.from("staff_activity_log").insert({
      staff_name: user?.email || "Unknown",
      action: `Added notes to job card ${jobCard.job_card_number}`,
      details: { job_card_id: id },
    });

    toast({
      title: "Success",
      description: "Notes saved",
    });
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading job card...</p>
        </div>
      </StaffLayout>
    );
  }

  if (!jobCard) {
    return (
      <StaffLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job card not found</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/staff/job-cards")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{jobCard.job_card_number}</h1>
              <p className="text-muted-foreground">{jobCard.product_title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {jobCard.status === "pending" && (
              <Button onClick={() => updateJobCardStatus("fabric_cutting")}>
                <Play className="mr-2 h-4 w-4" />
                Start Job
              </Button>
            )}
            {["fabric_cutting", "frame_assembly", "upholstery", "finishing"].includes(jobCard.status) && (
              <Button onClick={() => updateJobCardStatus("quality_check")} variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Ready for Quality Check
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 space-y-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <p className="text-muted-foreground">{jobCard.product_category}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Dimensions
                </h3>
                <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {JSON.stringify(jobCard.dimensions, null, 2)}
                </pre>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Fabric Requirements
                </h3>
                <div className="space-y-2">
                  {Object.entries(jobCard.fabric_codes as Record<string, string>).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Total Meters Required</p>
                  {Object.entries(jobCard.fabric_meters as Record<string, number>).map(([key, value]) => (
                    <p key={key} className="text-sm text-muted-foreground">
                      {key}: {value}m
                    </p>
                  ))}
                </div>
              </div>

              {jobCard.accessories && Object.keys(jobCard.accessories).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Accessories
                    </h3>
                    <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {JSON.stringify(jobCard.accessories, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {jobCard.admin_notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Assembly Instructions
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {jobCard.admin_notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{jobCard.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{jobCard.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p className="text-sm text-muted-foreground">{jobCard.order_number}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {jobCard.expected_completion_date && (
                  <div>
                    <p className="font-medium">Expected Completion</p>
                    <p className="text-muted-foreground">
                      {new Date(jobCard.expected_completion_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {jobCard.actual_start_date && (
                  <div>
                    <p className="font-medium">Started</p>
                    <p className="text-muted-foreground">
                      {new Date(jobCard.actual_start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No tasks assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={(checked) =>
                        updateTaskStatus(task.id, checked ? "completed" : "pending")
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.task_name}
                        </p>
                        {task.status === "in_progress" && (
                          <Badge variant="default">In Progress</Badge>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                      )}
                    </div>
                    {task.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Add production notes, report issues, or material shortages..."
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              rows={6}
            />
            <Button onClick={saveStaffNotes}>Save Notes</Button>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
