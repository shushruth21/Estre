/**
 * AuthContext - Global authentication and role management
 * 
 * This context provides:
 * - User session management
 * - Profile and role information
 * - Role-based helper functions (isCustomer, isStaff, isAdmin)
 * - Automatic profile fetching on login
 * 
 * Usage:
 * ```tsx
 * const { user, profile, role, isCustomer, isStaff, isAdmin } = useAuth();
 * ```
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  department: string | null;
  role: string | null; // Raw role from Supabase (can be any string)
  created_at: string;
  updated_at: string;
}

/**
 * Normalize Supabase roles into standardized buckets
 * Maps various Supabase roles to: admin, staff, or customer
 */
function normalizeRole(role: string | null | undefined): "admin" | "staff" | "customer" {
  if (!role) return "customer";

  const adminRoles = ["admin", "super_admin"];
  const staffRoles = [
    "staff",
    "production_manager",
    "store_manager",
    "factory_staff",
    "ops_team",
  ];

  const normalized = role.toLowerCase().trim();
  
  if (adminRoles.includes(normalized)) return "admin";
  if (staffRoles.includes(normalized)) return "staff";
  return "customer";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: "customer" | "staff" | "admin" | null; // Normalized role
  loading: boolean;
  // Role helper functions (based on normalized role)
  isCustomer: () => boolean;
  isStaff: () => boolean; // Returns true for staff OR admin
  isAdmin: () => boolean;
  hasRole: (role: "customer" | "staff" | "admin") => boolean;
  // Refresh profile
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one with customer role
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              role: "customer",
            })
            .select()
            .single();

          if (createError) {
            if (import.meta.env.DEV) {
              console.error("Error creating profile:", createError);
            }
            setProfile(null);
            return;
          }

          setProfile(newProfile as Profile);
          return;
        }

        if (import.meta.env.DEV) {
          console.error("Error fetching profile:", error);
        }
        setProfile(null);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error in fetchProfile:", error);
      }
      setProfile(null);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Normalize role from profile
  const normalizedRole = normalizeRole(profile?.role ?? null);

  // Role helper functions (based on normalized role)
  const isCustomer = () => {
    return normalizedRole === "customer";
  };

  const isStaff = () => {
    // Staff includes both staff and admin (admin can access staff routes)
    return normalizedRole === "staff" || normalizedRole === "admin";
  };

  const isAdmin = () => {
    return normalizedRole === "admin";
  };

  const hasRole = (roleToCheck: "customer" | "staff" | "admin") => {
    if (roleToCheck === "staff") {
      // Staff requirement: admin OR staff
      return normalizedRole === "staff" || normalizedRole === "admin";
    }
    return normalizedRole === roleToCheck;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role: normalizedRole,
    loading,
    isCustomer,
    isStaff,
    isAdmin,
    hasRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * 
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

