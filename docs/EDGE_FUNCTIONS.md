# Edge Functions Documentation

This document describes the Supabase Edge Functions used in the Estre Configurator Pro application.

## Overview
Edge functions are server-side Typescript functions that run on the Edge. They are used for:
*   Generating PDFs
*   Sending Emails
*   Verifying OTPs
*   Complex business logic not suitable for Database Triggers

## Idempotency Guarantees
To ensure reliability and prevent duplicate actions (like sending the same email twice or regenerating a PDF unnecessarily), we have implemented **Idempotency** and **Race Condition Protection** across critical functions.

### Strategy
We use a two-pronged approach:
1.  **Logic-Based Idempotency**: Functions check the current state of the resource (Database) before proceeding.
2.  **Request Deduplication** (Planned/System): Unique keys track execution status.

### Guarantees by Function

#### 1. `generate-sale-order-pdf`
*   **Goal**: Prevent regenerating the `final` PDF if it already exists, and prevent spamming the "Order Ready" email.
*   **Mechanism**:
    *   **Check**: If `mode='final'` and `sale_order.final_pdf_url` is already present.
    *   **Check**: If an email of type `sale_order` was sent to this customer for this order within the last **5 minutes** (via `email_logs`).
    *   **Result**: If PDF exists AND (email skipped OR recently sent), the function immediately returns success with the existing PDF URL. It does **not** call the PDF generator API or Resend API.

#### 2. `verify-sale-order-otp`
*   **Goal**: Prevent "double-spending" an OTP or creating duplicate Job Cards for the same order.
*   **Mechanism**:
    *   **Check**: If `sale_order.status` is *already* `confirmed_by_customer`, return success immediately.
    *   **Check**: Before creating `job_cards`, count existing job cards for this `sale_order_id` in the DB.
    *   **Result**: If job cards exist, creation is skipped, and success is returned. This allows safe retries if the client network fails after the request was processed but before the response was received.

#### 3. `send-sale-order-pdf-after-otp`
*   **Goal**: Prevent duplicate confirmation emails.
*   **Mechanism**:
    *   **Check**: Query `email_logs` for a sent email of type `sale_order` for this order ID.
    *   **Check**: Verify `sale_order.metadata.pdf_sent_to_customer_at` timestamp.
    *   **Result**: If an email was sent within the last **5 minutes**, the function returns success without sending another email.

## Function Reference

### `generate-sale-order-pdf`
Generates a PDF for a Sale Order.
*   **Inputs**: `saleOrderId`, `mode` ('draft' | 'final'), `requireOTP`, `skipEmail`.
*   **Outputs**: JSON with `pdfUrl`.

### `verify-sale-order-otp`
Verifies the OTP provided by the customer for a Sale Order.
*   **Inputs**: `saleOrderId`, `otpCode`.
*   **Effects**: Updates status to `confirmed_by_customer`, generates `Job Cards`, generates `QIRs`.

### `send-sale-order-pdf-after-otp`
Sends the final confirmation email with PDF to the customer.
*   **Inputs**: `saleOrderId`.
*   **Effects**: Sends email via Resend, updates `pdf_sent_to_customer_at`.
