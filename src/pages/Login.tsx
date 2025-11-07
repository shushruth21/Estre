import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Eye, EyeOff, Shield } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Check roles and redirect appropriately
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data: roles, error }) => {
          if (error) {
            console.error("❌ Error fetching roles in useEffect:", error);
          }
          if (roles && roles.length > 0) {
            const userRole = roles[0].role;
            if (isAdmin() || userRole === 'admin' || userRole === 'store_manager' || userRole === 'production_manager') {
              navigate("/admin/dashboard", { replace: true });
            } else if (userRole === 'factory_staff') {
              navigate("/staff/job-cards", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          } else {
            navigate("/", { replace: true });
          }
        });
    }
  }, [user, authLoading, navigate, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }

      // Fetch user roles to determine redirect
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (rolesError) {
        console.warn("Error fetching roles:", rolesError);
      }

      // Log roles for debugging
      if (import.meta.env.DEV) {
        console.log("🔐 Login successful - User roles:", roles);
      }

      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Re-fetch roles to ensure they're loaded
      let rolesData = null;
      let rolesFetchError = null;

      // Try direct query first
      const directQuery = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      rolesData = directQuery.data;
      rolesFetchError = directQuery.error;

      // Log for debugging
      console.log("🔍 User ID:", data.user.id);
      console.log("🔍 Roles fetched:", rolesData);
      console.log("🔍 Roles fetch error:", rolesFetchError);

      // If direct query fails or returns empty, try alternative methods
      if (rolesFetchError || !rolesData || rolesData.length === 0) {
        console.log("⚠️ Direct query failed or empty, trying alternative methods...");
        
        // Method 1: Try using the security definer function
        try {
          const { data: adminCheck, error: adminError } = await supabase
            .rpc('is_admin_or_manager', { _user_id: data.user.id });
          
          if (!adminError && adminCheck) {
            console.log("✅ Admin role confirmed via security definer function");
            rolesData = [{ role: 'admin' }];
            rolesFetchError = null;
          } else {
            // Method 2: Try checking for staff role
            const { data: staffCheck, error: staffError } = await supabase
              .rpc('has_role', { 
                _user_id: data.user.id,
                _role: 'factory_staff'
              });
            
            if (!staffError && staffCheck) {
              console.log("✅ Staff role confirmed via security definer function");
              rolesData = [{ role: 'factory_staff' }];
              rolesFetchError = null;
            }
          }
        } catch (functionError) {
          console.error("❌ Security definer function error:", functionError);
        }

        // If still no roles, show detailed error
        if (rolesFetchError) {
          console.error("❌ RLS Policy Error Details:", {
            message: rolesFetchError.message,
            details: rolesFetchError.details,
            hint: rolesFetchError.hint,
            code: rolesFetchError.code
          });
          
          toast({
            title: "Role Query Error",
            description: `Error: ${rolesFetchError.message}. Please check RLS policies or contact administrator.`,
            variant: "destructive",
          });
        }
      }

      // Determine redirect path based on roles
      let redirectPath = "/"; // Default to home
      
      if (rolesData && rolesData.length > 0) {
        const userRole = rolesData[0].role;
        
        console.log("🎯 User role found:", userRole);
        console.log("🎯 All roles:", rolesData.map(r => r.role));
        
        if (userRole === 'admin' || userRole === 'store_manager' || userRole === 'production_manager') {
          redirectPath = "/admin/dashboard";
          console.log("✅ Admin role detected, redirecting to:", redirectPath);
        } else if (userRole === 'factory_staff') {
          redirectPath = "/staff/job-cards";
          console.log("✅ Staff role detected, redirecting to:", redirectPath);
        } else {
          console.log("ℹ️ Customer role, staying on homepage");
        }
      } else if (!rolesFetchError) {
        // Only show "no role" message if there's no error (error already shown above)
        console.warn("⚠️ No roles found for user:", data.user.email);
        toast({
          title: "No Role Assigned",
          description: "Your account doesn't have a role assigned. Please contact an administrator.",
          variant: "destructive",
        });
      }

      // Force navigation with replace to prevent back button issues
      console.log("🚀 Final redirect path:", redirectPath);
      
      // If admin mode is enabled, bypass role checks and go directly to admin
      if (adminMode) {
        console.log("🔓 Admin Mode: Bypassing role checks, redirecting to admin dashboard");
        window.location.href = "/admin/dashboard";
        return;
      }
      
      // Always redirect immediately (use window.location for reliability)
      window.location.href = redirectPath;
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide user-friendly error messages
      let errorMessage = "Invalid email or password";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before logging in.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin-mode"
                    checked={adminMode}
                    onCheckedChange={(checked) => setAdminMode(checked as boolean)}
                  />
                  <Label
                    htmlFor="admin-mode"
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Mode (Bypass Role Check)
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
