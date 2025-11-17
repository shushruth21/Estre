/**
 * ProtectedRoute Component
 * 
 * Protects routes based on authentication and role requirements.
 * Supports 'customer', 'staff', 'admin' roles.
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute requiredRole="customer">
 *   <CustomerDashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requiredRole="staff">
 *   <StaffDashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requiredRole="admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'staff' | 'admin';
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  redirectTo = "/login" 
}: ProtectedRouteProps) => {
  const { user, loading, role, isCustomer, isStaff, isAdmin } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    let hasAccess = false;
    let errorMessage = "";

    switch (requiredRole) {
      case 'customer':
        hasAccess = isCustomer();
        errorMessage = "You don't have permission to access this page. Customer access is required.";
        break;
      case 'staff':
        hasAccess = isStaff() || isAdmin(); // Admins can access staff routes
        errorMessage = "You don't have permission to access this page. Staff or admin access is required.";
        break;
      case 'admin':
        hasAccess = isAdmin();
        errorMessage = "You don't have permission to access this page. Admin access is required.";
        break;
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

/**
 * RequireAuth Component
 * 
 * Simple wrapper that only requires authentication (no role check).
 * 
 * Usage:
 * ```tsx
 * <RequireAuth>
 *   <SomePage />
 * </RequireAuth>
 * ```
 */
export const RequireAuth = ({ 
  children, 
  redirectTo = "/login" 
}: { 
  children: ReactNode; 
  redirectTo?: string;
}) => {
  return (
    <ProtectedRoute redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * RequireRole Component
 * 
 * Alias for ProtectedRoute with requiredRole.
 * 
 * Usage:
 * ```tsx
 * <RequireRole role="admin">
 *   <AdminPage />
 * </RequireRole>
 * ```
 */
export const RequireRole = ({ 
  role, 
  children, 
  redirectTo = "/login" 
}: { 
  role: 'customer' | 'staff' | 'admin';
  children: ReactNode;
  redirectTo?: string;
}) => {
  return (
    <ProtectedRoute requiredRole={role} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
};
