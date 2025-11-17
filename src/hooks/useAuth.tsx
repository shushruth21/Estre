/**
 * useAuth Hook - Legacy compatibility wrapper
 * 
 * This hook is maintained for backward compatibility.
 * New code should use the AuthContext directly via useAuth from @/context/AuthContext
 * 
 * @deprecated Use useAuth from @/context/AuthContext instead
 */
import { useAuth as useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const authContext = useAuthContext();
  
  // Map new context to old interface for backward compatibility
  return {
    user: authContext.user,
    session: authContext.session,
    loading: authContext.loading,
    userRoles: authContext.role ? [authContext.role] : [],
    hasRole: (role: string) => authContext.hasRole(role as "customer" | "staff" | "admin"),
    isAdmin: () => authContext.isAdmin(),
    // New properties available
    profile: authContext.profile,
    role: authContext.role,
    isCustomer: authContext.isCustomer,
    isStaff: authContext.isStaff,
  };
}
