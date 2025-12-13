/**
 * Email Delivery Monitor Component
 *
 * Displays email delivery status and history for a sale order.
 * Shows automatic email sending status with timestamps and retry options.
 * Staff can monitor but not manually trigger - emails are sent automatically.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useAutoRefreshSettings } from "@/hooks/useAutoRefreshSettings";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Download,
  ExternalLink,
  Pause,
  Play
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface EmailDeliveryMonitorProps {
  saleOrderId: string;
  saleOrderNumber: string;
  customerEmail: string;
}

export const EmailDeliveryMonitor = ({
  saleOrderId,
  saleOrderNumber,
  customerEmail
}: EmailDeliveryMonitorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();
  const { settings, updateSettings } = useAutoRefreshSettings();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isPaused, setIsPaused] = useState(false);

  const shouldRefetch = settings.enabled && !isPaused && (settings.pauseOnInactive ? isVisible : true);

  // Fetch email logs for this sale order
  const { data: emailLogs, isLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["email-logs", saleOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("sale_order_id", saleOrderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLastRefresh(new Date());
      return data || [];
    },
    refetchInterval: shouldRefetch ? settings.interval : false,
    refetchIntervalInBackground: false,
  });

  // Fetch sale order metadata
  const { data: saleOrder, refetch: refetchOrder } = useQuery({
    queryKey: ["sale-order-email-status", saleOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_orders")
        .select("status, metadata, final_pdf_url, created_at, updated_at")
        .eq("id", saleOrderId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: shouldRefetch ? settings.interval : false,
    refetchIntervalInBackground: false,
  });

  const handleManualRefresh = () => {
    refetchLogs();
    refetchOrder();
    setLastRefresh(new Date());
  };

  // Resend email mutation (only for failed deliveries)
  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "send-sale-order-pdf-after-otp",
        {
          body: { saleOrderId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-logs", saleOrderId] });
      queryClient.invalidateQueries({ queryKey: ["sale-order-email-status", saleOrderId] });
      toast({
        title: "Email Resent",
        description: "Confirmation email has been resent to the customer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    },
  });

  const latestEmail = emailLogs?.[0];
  const failedEmails = emailLogs?.filter(log => log.status === 'failed') || [];
  const successfulEmails = emailLogs?.filter(log => log.status === 'sent') || [];

  // Determine overall email status
  const getEmailStatus = () => {
    if (isLoading) return { label: "Loading...", variant: "secondary" as const, icon: Clock };

    if (!emailLogs || emailLogs.length === 0) {
      // Check if email trigger has fired
      const triggerFired = saleOrder?.metadata?.email_trigger_fired_at;
      if (triggerFired) {
        return {
          label: "Email Sending...",
          variant: "secondary" as const,
          icon: Clock,
          description: "Automatic email is being sent"
        };
      }
      return {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock,
        description: "Waiting for automatic email trigger"
      };
    }

    if (latestEmail?.status === 'sent') {
      return {
        label: "Delivered",
        variant: "default" as const,
        icon: CheckCircle2,
        description: "Email successfully sent to customer"
      };
    }

    if (latestEmail?.status === 'failed') {
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
        description: "Email delivery failed - action required"
      };
    }

    return {
      label: "Unknown",
      variant: "secondary" as const,
      icon: AlertCircle,
      description: "Email status unknown"
    };
  };

  const emailStatus = getEmailStatus();
  const StatusIcon = emailStatus.icon;

  const timeSinceRefresh = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Delivery Status
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant={emailStatus.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {emailStatus.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Recipient</p>
              <p className="text-sm text-muted-foreground">{customerEmail}</p>
            </div>
            {saleOrder?.final_pdf_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(saleOrder.final_pdf_url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View PDF
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{emailStatus.description}</p>
        </div>

        {/* Automated Email Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <strong>Automated Email System:</strong> Emails are sent automatically when orders are confirmed. No manual action required.
          </p>
        </div>

        {/* Email History */}
        {emailLogs && emailLogs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Email History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{log.subject}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {log.error_message}
                      </p>
                    )}
                    {log.resend_email_id && (
                      <p className="text-xs text-muted-foreground">
                        ID: {log.resend_email_id}
                      </p>
                    )}
                  </div>
                  <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retry Button (only show if latest email failed) */}
        {latestEmail?.status === 'failed' && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => resendEmailMutation.mutate()}
              disabled={resendEmailMutation.isPending}
              className="w-full"
            >
              {resendEmailMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Email Delivery
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will attempt to resend the email to the customer
            </p>
          </div>
        )}

        {/* Statistics */}
        {emailLogs && emailLogs.length > 0 && (
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{successfulEmails.length}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{failedEmails.length}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span>
            {isPaused ? (
              "Auto-refresh paused"
            ) : !isVisible ? (
              "Auto-refresh paused (tab not visible)"
            ) : !settings.enabled ? (
              "Auto-refresh disabled"
            ) : (
              `Refreshes every ${settings.interval / 1000}s`
            )}
          </span>
          <span>
            Last updated: {timeSinceRefresh}s ago
          </span>
        </div>
      </CardContent>
    </Card>
  );
};