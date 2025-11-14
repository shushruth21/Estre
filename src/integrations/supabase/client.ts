import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ljgmqwnamffvvrwgprsd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('⚠️ Missing Supabase environment variables');
  if (import.meta.env.PROD) {
    throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
}

// Log connection status in development
if (import.meta.env.DEV) {
  console.log('🔌 Supabase Client Initialized:', {
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  });
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  // Production optimizations
  global: {
    headers: {
      'x-client-info': 'estre-configurator@1.0.0',
    },
  },
});

// Test connection on initialization (non-blocking)
if (typeof window !== 'undefined') {
  supabase
    .from('dropdown_options')
    .select('id')
    .limit(1)
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn('⚠️ Supabase connection test failed:', error.message);
      } else if (import.meta.env.DEV) {
        console.log('✅ Supabase connection successful');
      }
    }, () => {
      // Silently fail - connection will be tested when needed
    });
}