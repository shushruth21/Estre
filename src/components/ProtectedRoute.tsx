/**
 * ProtectedRoute Component
 * 
 * Strict route protection based on normalized roles.
 * Uses normalized role helpers from AuthContext.
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
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole: "admin" | "staff" | "customer";
}

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { loading, role, isAdmin, isStaff, isCustomer } = useAuth();

  // Show loading while checking auth
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

  // No session present → redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Staff-level: staff + admin allowed
  if (requiredRole === "staff") {
    if (!isStaff()) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Admin-only
  if (requiredRole === "admin") {
    if (!isAdmin()) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Customer-only
  if (requiredRole === "customer") {
    if (!isCustomer()) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  return children;
}

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
  children 
}: { 
  children: JSX.Element;
}) => {
  const { loading, role } = useAuth();
  
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
  
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
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
  children 
}: { 
  role: 'customer' | 'staff' | 'admin';
  children: JSX.Element;
}) => {
  return (
    <ProtectedRoute requiredRole={role}>
      {children}
    </ProtectedRoute>
  );
};
