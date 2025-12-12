# Email Testing Guide

## Test Scenarios

### 1. OTP Email Test
- Trigger: Customer confirms order with OTP
- Expected: Email with 6-digit OTP code
- Verify: Code works, email renders correctly

### 2. Sale Order PDF Email Test
- Trigger: After OTP verification or manual resend
- Expected: Email with PDF attachment
- Verify: PDF opens, contains correct order details

### 3. Email Logging Test
- Check `email_logs` table after sending
- Verify: Entry created with correct status

## Testing Checklist

- [ ] Email received within 30 seconds
- [ ] Sender shows as "Estre <no-reply@estre.app>"
- [ ] Subject line is correct
- [ ] HTML renders correctly (Gmail, Outlook, mobile)
- [ ] PDF attachment opens correctly
- [ ] Email logged in `email_logs` table
- [ ] No errors in Edge Function logs
- [ ] Email not in spam folder

## Monitoring

Check `email_logs` table:
```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Check Resend dashboard for delivery rates and bounces.

## Email Logs Query Examples

### View all sent emails
```sql
SELECT 
  recipient_email,
  subject,
  email_type,
  status,
  created_at,
  sent_at
FROM email_logs
ORDER BY created_at DESC;
```

### Check failed emails
```sql
SELECT 
  recipient_email,
  subject,
  error_message,
  failed_at
FROM email_logs
WHERE status = 'failed'
ORDER BY failed_at DESC;
```

### Email delivery rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_logs
GROUP BY status;
```








