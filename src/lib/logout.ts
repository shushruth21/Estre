/**
 * Centralized logout utility
 * 
 * Provides a consistent, INSTANT logout experience across the application.
 * Uses optimistic logout pattern for best UX:
 * - Clears auth state immediately (no waiting)
 * - Redirects instantly
 * - Signs out from Supabase in background
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Logout the current user INSTANTLY
 * 
 * Optimistic logout pattern:
 * 1. Clear auth tokens immediately (no network wait)
 * 2. Redirect to login page instantly
 * 3. Sign out from Supabase in background (fire-and-forget)
 * 
 * This provides sub-100ms logout experience!
 */
export function logout(): void {
    // 1. Clear auth-related localStorage IMMEDIATELY (instant)
    const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('sb-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 2. Also clear session storage
    sessionStorage.clear();
    
    // 3. Redirect IMMEDIATELY (don't wait for signOut)
    window.location.href = "/";
    
    // 4. Sign out from Supabase in background (fire-and-forget)
    // This invalidates the session on the server
    supabase.auth.signOut().catch(err => {
        console.error("Background signout error:", err);
    });
}
