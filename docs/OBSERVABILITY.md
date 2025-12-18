# Observability & Error Handling

## Overview
This document outlines the observability strategy for Estre Configurator Pro. The goal is to make failures diagnosable in production within 60 seconds.

## Frontend Logging
A central logger utility is available at `src/lib/logger.ts`.

### Usage
```typescript
import { logger } from "@/lib/logger";

// Info
logger.info("Order placed", { orderId: "123" });

// Error
try {
  // ... dangerous code
} catch (error) {
  logger.error(error, { context: "value" }, "ERROR_CODE");
}
```

### Log Levels
- **INFO**: Functional events (e.g., "Page loaded", "Order confirmed").
- **WARN**: Non-fatal issues (e.g., "API retry", "Deprecated feature used").
- **ERROR**: Fatal or captured exceptions. Requires `errorCode`.

### Global Error Boundary
The application is wrapped in a global `ErrorBoundary` that captures UI crashes. It logs the error with `UI_CRASH` code and displays a user-friendly fallback UI.

## Edge Function Logging
Edge functions (in `supabase/functions/`) follow a structured logging pattern using local helpers `log` and `logError`.

### Format
Logs are structured JSON lines.
```json
{ "event": "START_OTP_VERIFICATION", "timestamp": "...", "requestId": "...", ... }
{ "event": "ERROR", "level": "error", "error": { "message": "..." }, ... }
```

### Standard Events
- `START_[ACTION_NAME]`
- `[ENTITY]_CREATED` (e.g., `JOB_CARDS_CREATED`)
- `ERROR` (with `level: 'error'`)

## Debugging Guide

### Common Scenarios

#### 1. "Something went wrong" generic page
- **Cause**: React component threw an uncaught exception.
- **Debug**: Check console logs for `[ERROR] [UI_CRASH]`. The log context contains the `componentStack`.

#### 2. Order placement failed silently
- **Cause**: Exception swallowed in `try/catch`.
- **Debug**: We have removed silent catches. Check console for `[ERROR] [ORDER_PLACEMENT_FAILED]` or `[ERROR] [SALE_ORDER_CREATION_FAILED]`.

#### 3. Edge function failed
- **Cause**: Server-side error.
- **Debug**: Check Supabase Dashboard > Edge Functions > Logs. Look for `{ "level": "error" }` or specific error events like `CONFIG_PARSE_ERROR`. Search by `request_id` if available.
