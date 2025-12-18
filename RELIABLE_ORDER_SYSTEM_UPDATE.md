# Reliable Order System Update & Current Flow

**Date:** December 16, 2025
**Status:** Implemented & Deployed

## Overview
This document outlines the recent critical updates to the Estre Configurator order processing system. The primary goal was to ensure **100% data reliability** by decoupling data saving from PDF generation and reorganizing the storage structure.

## Key Changes

### 1. Reliable Order Saving (Frontend)
Previously, order data might have been lost if the PDF generation (Edge Function) failed or timed out.
**Now:**
-   Immediately after the order record is created in the database, the **Frontend (`Checkout.tsx`)** constructs a full JSON backup of the order.
-   This JSON object (containing order details, items, customer info, and job cards) is uploaded directly to **Supabase Storage** by the client.
-   **Benefit:** Even if the PDF generator fails, the Edge Function crashes, or the network flakes out later, we have a pristine JSON record of the order.

### 2. Storage Reorganization
We have moved away from the generic `final` folder to a more explicit structure.
-   **Old Path:** `documents/sale-orders/final/<ORDER_ID>.pdf`
-   **New Path:** `documents/sale-orders/confirmed_orders/`
    -   Contains `<ORDER_NUMBER>.json` (The reliable data backup)
    -   Contains `<ORDER_NUMBER>.pdf` (The generated sale order)

### 3. Fault-Tolerant Cleanup
A robust SQL script (`CLEAR_ALL_ORDERS.sql`) was created to safely wipe all order data during testing. It handles:
-   Dependent tables (Quality Reports, Email Logs, Job Cards).
-   Missing tables (checks existence before deleting).
-   Permission overrides (avoids system trigger errors).

---

## Current Order Flow (Step-by-Step)

1.  **User Confirms Order** (Checkout Page):
    -   User clicks "Pay / Confirm".
    -   **DB Insert:** Application records `orders`, `order_items`, `sale_orders`, and `job_cards` in Supabase Database.
    -   **DB Status:** Order status set to `confirmed`.

2.  **JSON Backup (Critical Step)**:
    -   **Action:** Client constructs a JSON payload with all order data.
    -   **Upload:** Uploads to `documents/sale-orders/confirmed_orders/<ORDER_NO>.json`.
    -   **Reliability:** This happens *before* PDF generation is triggered.

3.  **PDF Generation**:
    -   **Trigger:** Client calls `generate-sale-order-pdf` Edge Function.
    -   **Generation:** Function fetches data, renders HTML, and creates PDF.
    -   **Upload:** Function saves PDF to `documents/sale-orders/confirmed_orders/<ORDER_NO>.pdf`.
    -   **Email:** Function sends the PDF to the customer via Resend.

4.  **Completion**:
    -   User is redirected to the Dashboard.
    -   Both JSON and PDF files are available in Storage.

## Verification
To verify any order:
1.  Go to **Supabase Dashboard > Storage > documents**.
2.  Navigate to `sale-orders/confirmed_orders/`.
3.  Look for the Order Number (e.g., `ORD-1765803811847`).
    -   You should see `.json` file (Data source of truth).
    -   You should see `.pdf` file (Customer document).
