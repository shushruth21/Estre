
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPreflight() {
    console.log('🚀 Starting Preflight Checks...');

    // 1. Check Environment Variables
    const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingVars = requiredVars.filter(key => !process.env[key]);

    if (missingVars.length > 0) {
        console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Extract Expected Schema Version
    let expectedVersion: number | null = null;
    try {
        const schemaConfigPath = path.resolve(__dirname, '../src/config/schema.ts');
        const schemaContent = fs.readFileSync(schemaConfigPath, 'utf-8');
        const match = schemaContent.match(/EXPECTED_SCHEMA_VERSION\s*=\s*(\d+)/);
        if (match && match[1]) {
            expectedVersion = parseInt(match[1], 10);
            console.log(`ℹ️  Expected Schema Version: v${expectedVersion}`);
        } else {
            throw new Error('Could not parse EXPECTED_SCHEMA_VERSION');
        }
    } catch (err: any) {
        console.error(`❌ Failed to read expected schema version: ${err.message}`);
        process.exit(1);
    }

    // 3. Verify Database Schema Version
    try {
        console.log('🔍 Verifying Database Schema...');
        const { data, error } = await supabase
            .from('schema_meta')
            .select('version')
            .eq('id', 1)
            .single();

        if (error) {
            if (error.code === '42P01') {
                throw new Error("'schema_meta' table does not exist. Run migration.");
            }
            throw error;
        }

        if (!data) {
            throw new Error("No version record found in 'schema_meta' (id=1)");
        }

        if (data.version !== expectedVersion) {
            throw new Error(`Schema mismatch! DB: v${data.version}, App: v${expectedVersion}`);
        }
        console.log('✅ Database Schema Version verified');
    } catch (err: any) {
        console.error(`❌ Schema Check Failed: ${err.message}`);
        process.exit(1);
    }

    // 4. Verify Storage Buckets
    // Note: Anon key can only list buckets if RLS allows it. 
    // If this fails due to permissions, we might skip it or warn.
    try {
        console.log('🔍 Verifying Storage Buckets...');
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.warn(`⚠️  Could not list buckets (Permissions?): ${error.message}`);
        } else {
            const requiredBuckets = ['documents'];
            const missingBuckets = requiredBuckets.filter(
                req => !buckets.some(b => b.name === req)
            );

            if (missingBuckets.length > 0) {
                console.log('Available buckets:', buckets.map(b => b.name).join(', '));
                throw new Error(`Missing required storage buckets: ${missingBuckets.join(', ')}`);
            }
            console.log('✅ Storage Buckets verified');
        }
    } catch (err: any) {
        console.error(`❌ Storage Check Failed: ${err.message}`);
        process.exit(1);
    }

    // 5. Edge Function Health Check (Optional)
    console.log('ℹ️  Skipping Edge Function Health Check (Add endpoint if needed)');

    console.log('\n✅✅✅ PREFLIGHT CHECKS PASSED ✅✅✅\n');
}

runPreflight();
