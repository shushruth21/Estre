# Schema Drift & DB Contract

## Overview
To prevent schema drift (where the application code expects a database structure different from what is deployed), we enforce a **strict schema version contract**.

The application checks the database version on startup. If the version in `schema_meta` does not match the `EXPECTED_SCHEMA_VERSION` in the code, the application **refuses to start**.

## The Contract
1. **Source of Truth**: The Supabase migration history is the source of truth.
2. **Meta Table**: A table `schema_meta` exists with a single row `id=1` containing the current `version`.
3. **Frontend Guard**: The frontend queries `schema_meta` before rendering the app.
4. **No Conditional Logic**: The code must NOT check "if column exists". It must assume the schema version is correct and therefore all columns defined in that version are present.

## How to Make Schema Changes

### 1. Create Migration
Create a new migration file in `supabase/migrations/` using the standard Supabase workflow.
```bash
supabase migration new my_new_feature
```

### 2. Update Schema Version
Inside your migration file, you MUST include an update to the `schema_meta` table.
```sql
-- Your schema changes...
ALTER TABLE orders ADD COLUMN new_field text;

-- Bump version
UPDATE schema_meta SET version = version + 1 WHERE id = 1;
```
*Note: Alternatively, you can explicitly set it to the new expected integer value if you are coordinating strict release numbers.*

### 3. Update Application Code
Update `src/config/schema.ts` to match the new version number.
```typescript
// src/config/schema.ts
export const EXPECTED_SCHEMA_VERSION = 2; // Incremented
```

### 4. Deploy
When the code is deployed and the migration is applied to the database:
1. Database version becomes `2`.
2. App code expects `2`.
3. App starts successfully.

If the app is deployed BUT migration failed or didn't run:
1. Database version is `1`.
2. App code expects `2`.
3. **App halts with a Critical Error**, preventing undefined behavior.

## Troubleshooting
**"System Startup Error: Schema Version Mismatch"**
*   **Cause**: You have new code but an old database, or vice versa.
*   **Fix**: Run `supabase migration up` (local) or deploy pending migrations (production) so the `schema_meta` version matches the code expectation.

## Important Rules
*   Never write code that conditionally selects columns to "avoid errors" if they are missing.
*   Always include `buyer_gst`, `dispatch_method`, and other core fields in your types and queries.
*   If a field is optional in functionality, it must still be present in the schema (nullable).
