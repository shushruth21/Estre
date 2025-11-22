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

import { ReactNode, useEffect, useState } from "react";
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
  const { loading, role, isAdmin, isStaff, isCustomer, user } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);

  // Wait for role to load (especially for staff/admin routes)
  useEffect(() => {
    if (!loading && user) {
      // For staff/admin routes, wait up to 2 seconds for role to load
      if (requiredRole === "staff" || requiredRole === "admin") {
        let attempts = 0;
        const maxAttempts = 10; // 10 attempts * 200ms = 2 seconds
        
        const checkRole = async () => {
          while (attempts < maxAttempts) {
            if (role) {
              setRoleLoading(false);
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
          setRoleLoading(false);
        };
        
        checkRole();
      } else {
        setRoleLoading(false);
      }
    } else if (!loading && !user) {
      setRoleLoading(false);
    }
  }, [loading, user, role, requiredRole]);

  // Show loading while checking auth or waiting for role
  if (loading || roleLoading) {
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
  if (!role || !user) {
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
