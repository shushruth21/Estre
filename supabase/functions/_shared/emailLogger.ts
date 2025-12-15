/**
 * Email Logger Utility
<<<<<<< HEAD
 * 
 * Logs all email sending attempts to the email_logs table
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EmailLogParams {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  emailType: 'otp' | 'sale_order' | 'job_card' | 'custom';
  orderId?: string;
  saleOrderId?: string;
  jobCardId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  errorMessage?: string;
  providerMessageId?: string;
  providerResponse?: any;
  metadata?: Record<string, any>;
}

export async function logEmail(
  supabase: SupabaseClient,
  params: EmailLogParams
): Promise<void> {
  try {
    const logData: any = {
      recipient_email: params.recipientEmail,
      recipient_name: params.recipientName || null,
      subject: params.subject,
      email_type: params.emailType,
      order_id: params.orderId || null,
      sale_order_id: params.saleOrderId || null,
      job_card_id: params.jobCardId || null,
      status: params.status,
      error_message: params.errorMessage || null,
      provider_message_id: params.providerMessageId || null,
      provider_response: params.providerResponse || null,
      metadata: params.metadata || {},
      sent_at: params.status === 'sent' || params.status === 'delivered' ? new Date().toISOString() : null,
      failed_at: params.status === 'failed' || params.status === 'bounced' ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('email_logs')
      .insert(logData);

    if (error) {
      console.error('Failed to log email:', error);
      // Don't throw - email logging failure shouldn't break email sending
    }
  } catch (error) {
    console.error('Error in email logger:', error);
    // Silently fail - logging is non-critical
  }
}

export async function updateEmailLogStatus(
  supabase: SupabaseClient,
  providerMessageId: string,
  status: 'delivered' | 'failed' | 'bounced',
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: any = {
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      failed_at: status === 'failed' || status === 'bounced' ? new Date().toISOString() : null,
      error_message: errorMessage || null,
    };

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('provider_message_id', providerMessageId);

    if (error) {
      console.error('Failed to update email log:', error);
    }
  } catch (error) {
    console.error('Error updating email log:', error);
  }
}








=======
 *
 * Centralized logging for all email sending operations.
 * Logs email metadata to the email_logs table for monitoring and analytics.
 */

export interface EmailLogData {
  emailType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  resendEmailId?: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  orderNumber?: string;
  saleOrderId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Log email send to database
 */
export async function logEmail(
  supabaseClient: any,
  data: EmailLogData
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('email_logs')
      .insert({
        email_type: data.emailType,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: data.subject,
        resend_email_id: data.resendEmailId,
        status: data.status,
        order_number: data.orderNumber,
        sale_order_id: data.saleOrderId,
        metadata: data.metadata || {},
        error_message: data.errorMessage,
        sent_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log email:', error);
    }
  } catch (err) {
    console.error('Error logging email:', err);
  }
}

/**
 * Update email status (e.g., from webhook)
 */
export async function updateEmailStatus(
  supabaseClient: any,
  resendEmailId: string,
  status: 'delivered' | 'bounced' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('email_logs')
      .update({
        status,
        error_message: errorMessage,
      })
      .eq('resend_email_id', resendEmailId);

    if (error) {
      console.error('Failed to update email status:', error);
    }
  } catch (err) {
    console.error('Error updating email status:', err);
  }
}

/**
 * Get email statistics for monitoring
 */
export async function getEmailStats(
  supabaseClient: any,
  timeRange: 'day' | 'week' | 'month' = 'day'
): Promise<{
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
}> {
  try {
    let startDate: Date;
    const now = new Date();

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data, error } = await supabaseClient
      .from('email_logs')
      .select('status')
      .gte('sent_at', startDate.toISOString());

    if (error) {
      console.error('Failed to get email stats:', error);
      return { total: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 };
    }

    const stats = {
      total: data.length,
      sent: data.filter((log: any) => log.status === 'sent').length,
      delivered: data.filter((log: any) => log.status === 'delivered').length,
      bounced: data.filter((log: any) => log.status === 'bounced').length,
      failed: data.filter((log: any) => log.status === 'failed').length,
    };

    return stats;
  } catch (err) {
    console.error('Error getting email stats:', err);
    return { total: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 };
  }
}
>>>>>>> d520fc30438a01daeac4e67708effef2a75a7d09





