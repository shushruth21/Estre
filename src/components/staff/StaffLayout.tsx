import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/logout";
import {
  LayoutDashboard,
  ClipboardList,
  ShoppingCart,
  LogOut,
  Loader2,
  FileCheck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StaffLayoutProps {
  children: ReactNode;
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const location = useLocation();
  const { user, profile, isStaff, isAdmin, loading } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/staff/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Sale Orders",
      href: "/staff/sale-orders",
      icon: ShoppingCart,
    },
    {
      name: "Orders",
      href: "/staff/orders",
      icon: ShoppingCart,
    },
    {
      name: "Job Cards",
      href: "/staff/job-cards",
      icon: ClipboardList,
    },
    {
      name: "Quality Reports",
      href: "/staff/quality-reports",
      icon: FileCheck,
    },
  ];

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show layout if user is staff or admin
  if (!user || (!isStaff() && !isAdmin())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Staff access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold">Staff Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin() && (
                <Link to="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
