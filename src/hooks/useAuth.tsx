/**
 * useAuth Hook - Compatibility wrapper
 * 
 * Provides normalized auth context with role helpers
 */
import { useAuth as useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const authContext = useAuthContext();
  
  return {
    ...authContext,
    user: authContext.user,
    session: authContext.session,
    loading: authContext.loading,
    role: authContext.role, // normalized role
    userRoles: authContext.role ? [authContext.role] : [], // legacy compatibility
    hasRole: authContext.hasRole,
    isAdmin: authContext.isAdmin,
    isStaff: authContext.isStaff,
    isCustomer: authContext.isCustomer,
    profile: authContext.profile,
  };
}
