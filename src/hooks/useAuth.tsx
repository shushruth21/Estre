import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user roles when session changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("❌ Error fetching user roles:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        
        // Try fallback using security definer function
        try {
          const { data: adminCheck } = await supabase
            .rpc('is_admin_or_manager', { _user_id: userId });
          
          if (adminCheck) {
            if (import.meta.env.DEV) {
              console.log("✅ Admin role confirmed via security definer function");
            }
            setUserRoles(['admin']);
            setLoading(false);
            return;
          }
          
          const { data: staffCheck } = await supabase
            .rpc('has_role', { 
              _user_id: userId,
              _role: 'factory_staff'
            });
          
          if (staffCheck) {
            if (import.meta.env.DEV) {
              console.log("✅ Staff role confirmed via security definer function");
            }
            setUserRoles(['factory_staff']);
            setLoading(false);
            return;
          }
        } catch (functionError) {
          if (import.meta.env.DEV) {
            console.error("❌ Security definer function also failed:", functionError);
          }
        }
        
        return;
      }

      if (data) {
        const roles = data.map((r: any) => r.role);
        setUserRoles(roles);
        if (import.meta.env.DEV) {
          console.log("✅ User roles loaded:", roles);
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn("⚠️ No roles data returned for user:", userId);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("❌ Error in fetchUserRoles:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  const isAdmin = () => {
    return hasRole('admin') || hasRole('store_manager') || hasRole('production_manager');
  };

  return {
    user,
    session,
    loading,
    userRoles,
    hasRole,
    isAdmin,
  };
}
