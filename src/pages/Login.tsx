import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
            if (import.meta.env.DEV) {
              console.error("❌ Error fetching roles in useEffect:", error);
            }
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
        if (import.meta.env.DEV) {
          console.warn("Error fetching roles:", rolesError);
        }
      }

      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 300));

      // Fetch roles using the security definer function for reliability
      let rolesData = null;

      try {
        const { data: adminCheck } = await supabase
          .rpc('is_admin_or_manager', { _user_id: data.user.id });
        
        if (adminCheck) {
          rolesData = [{ role: 'admin' }];
        } else {
          const { data: staffCheck } = await supabase
            .rpc('has_role', { 
              _user_id: data.user.id,
              _role: 'factory_staff'
            });
          
          if (staffCheck) {
            rolesData = [{ role: 'factory_staff' }];
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error checking roles:", error);
        }
      }

      // Determine redirect path based on roles
      let redirectPath = "/";
      
      if (rolesData && rolesData.length > 0) {
        const userRole = rolesData[0].role;
        
        if (userRole === 'admin' || userRole === 'store_manager' || userRole === 'production_manager') {
          redirectPath = "/admin/dashboard";
        } else if (userRole === 'factory_staff') {
          redirectPath = "/staff/job-cards";
        }
      } else {
        toast({
          title: "No Role Assigned",
          description: "Your account doesn't have a role assigned. Please contact an administrator.",
          variant: "destructive",
        });
      }
      
      // Redirect to appropriate dashboard
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
