import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'factory_staff';
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  redirectTo = "/login" 
}: ProtectedRouteProps) => {
  const { user, loading, userRoles, isAdmin, hasRole } = useAuth();

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
    if (requiredRole === 'admin' && !isAdmin()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. Admin access is required.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }

    if (requiredRole === 'factory_staff' && !hasRole('factory_staff')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. Factory staff access is required.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};
