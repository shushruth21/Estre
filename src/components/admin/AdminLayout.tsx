import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Settings,
  DollarSign,
  Shirt,
  Wrench,
  ShoppingCart,
  ClipboardList,
  Users,
  BarChart3,
  Menu,
  LogOut,
  Home,
  Search,
  Bell,
  ChevronRight,
  Database,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  group?: string;
}

// Organized navigation with groups
const navigationGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Product Management",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Dropdowns", href: "/admin/dropdowns", icon: Settings },
      { name: "Pricing Formulas", href: "/admin/pricing", icon: DollarSign },
      { name: "Fabrics", href: "/admin/fabrics", icon: Shirt },
      { name: "Accessories", href: "/admin/accessories", icon: Wrench },
    ],
  },
  {
    title: "Orders & Production",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Job Cards", href: "/admin/job-cards", icon: ClipboardList },
    ],
  },
  {
    title: "Team & Analytics",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Staff", href: "/admin/staff", icon: Users },
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "System Settings",
    items: [
      { name: "Discount Codes", href: "/admin/discount-codes", icon: Tag },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading, role } = useAuth();
  const { toast } = useToast();

  // Fetch quick stats for badges/notifications
  const { data: pendingOrders } = useQuery({
    queryKey: ["pending-orders-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activeJobCards } = useQuery({
    queryKey: ["active-job-cards-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("job_cards")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "fabric_cutting", "upholstery", "finishing", "quality_check", "frame_assembly"]);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Role checking is handled by ProtectedRoute, but we can verify here
  // This component only renders if user is admin (via ProtectedRoute guard)

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "A";
    const parts = user.email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  // Get current page title from location
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    const allItems = navigationGroups.flatMap((group) => group.items);
    const currentItem = allItems.find((item) => item.href === currentPath);
    return currentItem?.name || "Admin Panel";
  };

  // Show loading state while checking authentication and roles
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  // ProtectedRoute ensures only admins can access this component
  // If we reach here, user is authenticated and has admin role

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r bg-card">
        {/* Logo/Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Estre Admin</h1>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-6 px-4">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    const badgeCount =
                      item.href === "/admin/orders" && pendingOrders
                        ? pendingOrders
                        : item.href === "/admin/job-cards" && activeJobCards
                        ? activeJobCards
                        : undefined;

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </div>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">
                {role || "Admin"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Estre Admin</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">Estre Admin</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {role || "Admin"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="space-y-6 px-4">
                    {navigationGroups.map((group) => (
                      <div key={group.title}>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {group.title}
                        </h3>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            const badgeCount =
                              item.href === "/admin/orders" && pendingOrders
                                ? pendingOrders
                                : item.href === "/admin/job-cards" &&
                                  activeJobCards
                                ? activeJobCards
                                : undefined;

                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                  "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5" />
                                  <span>{item.name}</span>
                                </div>
                                {badgeCount !== undefined && badgeCount > 0 && (
                                  <Badge
                                    variant={isActive ? "secondary" : "default"}
                                    className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                                  >
                                    {badgeCount}
                                  </Badge>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>
                <div className="p-4 border-t space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="lg:pl-72">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 flex-1">
              <Link
                to="/admin/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {getCurrentPageTitle()}
              </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 mr-4">
                {pendingOrders !== undefined && pendingOrders > 0 && (
                  <Link
                    to="/admin/orders?status=pending"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {pendingOrders} Pending
                    </span>
                  </Link>
                )}
                {activeJobCards !== undefined && activeJobCards > 0 && (
                  <Link
                    to="/admin/job-cards?status=in_progress"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {activeJobCards} Active
                    </span>
                  </Link>
                )}
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {role || "Admin"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/")}>
                    <Home className="mr-2 h-4 w-4" />
                    Go to Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
