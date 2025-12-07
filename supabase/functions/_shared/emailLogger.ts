/**
 * Email Logger Utility
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
