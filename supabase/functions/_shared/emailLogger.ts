/**
 * Email Logger Utility
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








