/**
 * QC Inspection Form Component
 *
 * Allows staff to perform quality inspections on job cards
 * Features:
 * - Rate multiple quality aspects (1-5 stars)
 * - Add notes and images
 * - Submit and approve inspections
 * - Real-time overall rating calculation
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle2, XCircle, Upload, Loader2 } from "lucide-react";

interface QCInspectionFormProps {
  jobCardId: string;
  orderId?: string;
  existingInspection?: any;
  onSuccess?: () => void;
}

interface RatingFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
}

const RatingField = ({ label, value, onChange, description }: RatingFieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`p-1 rounded transition-colors ${
                rating <= value
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-300 hover:text-gray-400"
              }`}
            >
              <Star className="h-5 w-5" fill={rating <= value ? "currentColor" : "none"} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium w-12">{value}/5</span>
        </div>
      </div>
    </div>
  );
};

export const QCInspectionForm = ({
  jobCardId,
  orderId,
  existingInspection,
  onSuccess,
}: QCInspectionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [stitchingRating, setStitchingRating] = useState(
    existingInspection?.stitching_rating || 0
  );
  const [frameAlignmentRating, setFrameAlignmentRating] = useState(
    existingInspection?.frame_alignment_rating || 0
  );
  const [loungerTestRating, setLoungerTestRating] = useState(
    existingInspection?.lounger_test_rating || 0
  );
  const [consoleAlignmentRating, setConsoleAlignmentRating] = useState(
    existingInspection?.console_alignment_rating || 0
  );
  const [electricalTestRating, setElectricalTestRating] = useState(
    existingInspection?.electrical_test_rating || 0
  );
  const [qcNotes, setQcNotes] = useState(existingInspection?.qc_notes || "");
  const [qcStatus, setQcStatus] = useState(existingInspection?.qc_status || "pending");

  // Calculate overall rating
  const calculateOverallRating = () => {
    const ratings = [
      stitchingRating,
      frameAlignmentRating,
      loungerTestRating,
      consoleAlignmentRating,
      electricalTestRating,
    ].filter((r) => r > 0);

    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  const overallRating = calculateOverallRating();

  // Submit QC inspection mutation
  const submitInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (existingInspection) {
        // Update existing inspection
        const { error } = await supabase
          .from("quality_inspections")
          .update({
            stitching_rating: data.stitchingRating || null,
            frame_alignment_rating: data.frameAlignmentRating || null,
            lounger_test_rating: data.loungerTestRating || null,
            console_alignment_rating: data.consoleAlignmentRating || null,
            electrical_test_rating: data.electricalTestRating || null,
            qc_notes: data.qcNotes,
            qc_status: data.qcStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingInspection.id);

        if (error) throw error;
      } else {
        // Create new inspection
        const { error } = await supabase.from("quality_inspections").insert({
          job_card_id: jobCardId,
          order_id: orderId || null,
          stitching_rating: data.stitchingRating || null,
          frame_alignment_rating: data.frameAlignmentRating || null,
          lounger_test_rating: data.loungerTestRating || null,
          console_alignment_rating: data.consoleAlignmentRating || null,
          electrical_test_rating: data.electricalTestRating || null,
          qc_notes: data.qcNotes,
          qc_status: data.qcStatus,
          inspected_by: user?.id,
          inspected_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Update job card status if QC is approved
      if (data.qcStatus === "pass") {
        await supabase
          .from("job_cards")
          .update({
            status: "ready",
            quality_approved: true,
            quality_approved_by: user?.id,
            quality_approved_at: new Date().toISOString(),
          })
          .eq("id", jobCardId);

        // Add timeline entry
        if (orderId) {
          await supabase.from("order_timeline").insert({
            order_id: orderId,
            status: "quality_check_completed",
            title: "Quality Check Completed",
            description: `Quality inspection passed with overall rating: ${overallRating}/5`,
            created_by: user?.id,
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["quality-inspections"] });
      toast({
        title: "Success",
        description: "Quality inspection saved successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save quality inspection",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one rating is provided
    if (
      stitchingRating === 0 &&
      frameAlignmentRating === 0 &&
      loungerTestRating === 0 &&
      consoleAlignmentRating === 0 &&
      electricalTestRating === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one quality rating",
        variant: "destructive",
      });
      return;
    }

    submitInspectionMutation.mutate({
      stitchingRating,
      frameAlignmentRating,
      loungerTestRating,
      consoleAlignmentRating,
      electricalTestRating,
      qcNotes,
      qcStatus,
    });
  };

  const approveInspection = () => {
    submitInspectionMutation.mutate({
      stitchingRating,
      frameAlignmentRating,
      loungerTestRating,
      consoleAlignmentRating,
      electricalTestRating,
      qcNotes,
      qcStatus: "pass",
    });
  };

  const failInspection = () => {
    submitInspectionMutation.mutate({
      stitchingRating,
      frameAlignmentRating,
      loungerTestRating,
      consoleAlignmentRating,
      electricalTestRating,
      qcNotes,
      qcStatus: "fail",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quality Inspection Report (QIR)</span>
          {existingInspection && (
            <Badge
              variant={
                existingInspection.qc_status === "pass"
                  ? "default"
                  : existingInspection.qc_status === "fail"
                  ? "destructive"
                  : "secondary"
              }
            >
              {existingInspection.qc_status.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating Display */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overall Rating</p>
                <p className="text-xs text-muted-foreground">
                  Average of all rated components
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{overallRating}</p>
                <p className="text-xs text-muted-foreground">out of 5.0</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rating Fields */}
          <div className="space-y-4">
            <RatingField
              label="Stitching Quality"
              value={stitchingRating}
              onChange={setStitchingRating}
              description="Check seam quality, thread tension, and fabric alignment"
            />

            <Separator className="my-3" />

            <RatingField
              label="Frame Alignment"
              value={frameAlignmentRating}
              onChange={setFrameAlignmentRating}
              description="Verify structural integrity and proper frame assembly"
            />

            <Separator className="my-3" />

            <RatingField
              label="Lounger Test"
              value={loungerTestRating}
              onChange={setLoungerTestRating}
              description="Test lounger mechanism, storage, and positioning"
            />

            <Separator className="my-3" />

            <RatingField
              label="Console Alignment"
              value={consoleAlignmentRating}
              onChange={setConsoleAlignmentRating}
              description="Check console fit, alignment, and functionality"
            />

            <Separator className="my-3" />

            <RatingField
              label="Electrical Accessories"
              value={electricalTestRating}
              onChange={setElectricalTestRating}
              description="Test electrical components, USB ports, and power outlets"
            />
          </div>

          <Separator />

          {/* QC Notes */}
          <div className="space-y-2">
            <Label>QC Notes</Label>
            <Textarea
              placeholder="Add detailed notes about quality issues, concerns, or recommendations..."
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* QC Status */}
          <div className="space-y-2">
            <Label>Inspection Status</Label>
            <Select value={qcStatus} onValueChange={setQcStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={submitInspectionMutation.isPending}
              className="flex-1"
            >
              {submitInspectionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Inspection"
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={approveInspection}
              disabled={submitInspectionMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Pass
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={failInspection}
              disabled={submitInspectionMutation.isPending}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Fail Inspection
            </Button>
          </div>

          {/* Image Upload Section - Placeholder for future implementation */}
          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground">
              Image Upload (Coming Soon)
            </Label>
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload QC Images
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Image upload functionality will be added in the next update
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
