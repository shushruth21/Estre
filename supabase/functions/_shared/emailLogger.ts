/**
 * Email Logger Utility
 * 
 * Logs all email sending attempts to the email_logs table
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CanonicalEmailLog } from "./email.types.ts";
import { logError } from "./logger.ts";


export async function logEmail(
  supabase: SupabaseClient,
  params: CanonicalEmailLog
): Promise<void> {
  try {
    const logData: CanonicalEmailLog = {
      recipient_email: params.recipient_email,
      recipient_name: params.recipient_name || undefined,
      subject: params.subject,
      email_type: params.email_type,
      order_id: params.order_id || undefined,
      sale_order_id: params.sale_order_id || undefined,
      job_card_id: params.job_card_id || undefined,
      status: params.status,
      error_message: params.error_message || undefined,
      provider_message_id: params.provider_message_id || undefined,
      provider_response: params.provider_response || undefined,
      metadata: params.metadata || {},
      sent_at: params.status === 'sent' && !params.sent_at ? new Date().toISOString() : params.sent_at,
      failed_at: (params.status === 'failed' || params.status === 'bounced') && !params.failed_at ? new Date().toISOString() : params.failed_at,
    };

    // We can't type check the database insert perfectly without generated types, 
    // but we can ensure our object is clean.
    const { error } = await supabase
      .from('email_logs')
      .insert(logData);

    if (error) {
      logError('Failed to log email', error, { logData });
      // Don't throw - email logging failure shouldn't break email sending
    }
  } catch (error) {
    logError('Error in email logger', error);
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
    const updateData: Partial<CanonicalEmailLog> = {
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : undefined,
      failed_at: status === 'failed' || status === 'bounced' ? new Date().toISOString() : undefined,
      error_message: errorMessage,
    };

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('provider_message_id', providerMessageId);

    if (error) {
      logError('Failed to update email log', error, { providerMessageId, status });
    }
  } catch (error) {
    logError('Error updating email log', error, { providerMessageId });
  }
}
