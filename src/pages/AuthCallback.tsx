import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

type MinimalProfile = {
  role: string | null;
  full_name: string | null;
};

const normalizeRole = (role: unknown) =>
  typeof role === "string" ? role.toLowerCase().trim() : "customer";

// Retry profile fetch (trigger may be delayed; avoids guessing with setTimeout(1000))
const fetchProfileWithRetry = async (
  userId: string,
  attempts = 6,
  delayMs = 250
): Promise<MinimalProfile | null> => {
  let lastError: any = null;

  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", userId)
      .single();

    if (!error && data) return data as MinimalProfile;

    lastError = error;
    // PGRST116 = "No rows found" (expected for brand new users)
    // For other errors (RLS, network), we still retry a few times
    await new Promise((r) => setTimeout(r, delayMs));
  }

  console.warn("Profile fetch retry exhausted:", lastError);
  return null;
};

const ensureProfileExists = async (session: any): Promise<MinimalProfile> => {
  const userId = session.user.id;

  // 1) Try fetch first (in case trigger already created profile)
  const existing = await fetchProfileWithRetry(userId);
  if (existing) return existing;

  // 2) Create/Upsert profile fallback (safe even if trigger eventually creates it)
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split("@")[0] ||
    "User";

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: userName,
        role: "customer",
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.warn("Profile upsert failed (will continue with fallback):", upsertError);
  }

  // 3) Re-fetch after upsert to avoid stale role
  const afterUpsert = await fetchProfileWithRetry(userId);
  if (afterUpsert) return afterUpsert;

  // 4) Ultimate fallback (still deterministic)
  return { role: "customer", full_name: userName };
};

/**
 * OAuth Callback Handler
 *
 * Handles redirect after OAuth authentication (Google, Microsoft, Apple).
 * Retrieves session, ensures profile exists, then redirects based on role.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        // 1) Get session after OAuth redirect
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("No session found after OAuth");

        console.log("✅ OAuth session retrieved:", {
          userEmail: session.user.email,
          provider: session.user.app_metadata?.provider,
        });

        // 2) Ensure profile exists + get fresh role (no stale variables)
        const ensuredProfile = await ensureProfileExists(session);
        const role = normalizeRole(ensuredProfile?.role);

        console.log("🔐 OAuth redirect check:", {
          role,
          userEmail: session.user.email,
          profileExists: !!ensuredProfile,
        });

        if (cancelled) return;

        // 3) Redirect based on role buckets (consistent + easy to expand)
        const adminRoles = new Set(["admin", "super_admin"]);
        const staffRoles = new Set([
          "staff",
          "factory_staff",
          "production_manager",
          "store_manager",
          "ops_team",
        ]);

        if (adminRoles.has(role)) {
          toast({
            title: "Welcome back!",
            description: "Logged in with OAuth successfully",
          });
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        if (staffRoles.has(role)) {
          toast({
            title: "Welcome back!",
            description: "Logged in with OAuth successfully",
          });
          navigate("/staff/dashboard", { replace: true });
          return;
        }

        toast({
          title: "Welcome!",
          description: "Account created successfully",
        });
        navigate("/dashboard", { replace: true });
      } catch (error: any) {
        console.error("Auth callback error:", error);

        if (cancelled) return;

        toast({
          title: "Authentication Error",
          description: error?.message || "Failed to complete sign in. Please try again.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      }
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-walnut">Completing Sign In</h2>
          <p className="text-walnut/60">Please wait while we verify your account...</p>
        </div>
      </div>
    </div>
  );
}
