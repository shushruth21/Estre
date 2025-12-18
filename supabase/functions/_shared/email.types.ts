export interface CanonicalEmailLog {
    email_type: 'otp' | 'sale_order' | 'job_card' | 'custom' | 'order_confirmation';
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    order_id?: string;
    sale_order_id?: string;
    job_card_id?: string;
    provider_message_id?: string;
    // We keep provider_response for full debuggability if needed, but typed strictly might be hard as providers vary.
    // Using Record<string, any> or unknown is safer than 'any', but given the plan said remove any, let's use unknown or a specific type if possible. 
    // The plan said "accept ONLY this interface... remove any".
    provider_response?: Record<string, unknown> | null;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
    error_message?: string;
    metadata?: Record<string, unknown>;
    sent_at?: string;
    failed_at?: string;
    delivered_at?: string;
}
