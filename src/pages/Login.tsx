import { useState, useEffect, useCallback } from "react";
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
  const [loginMode, setLoginMode] = useState<"auto" | "admin" | "staff">("auto");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, role, isAdmin, isStaff, isCustomer, refreshProfile } = useAuth();

  const redirectByRole = useCallback(() => {
    // Manual overrides take precedence (bypass mode)
    if (loginMode === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (loginMode === "staff") {
      navigate("/staff/dashboard", { replace: true });
      return;
    }

    // Use normalized role helpers
    if (isAdmin()) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (isStaff()) {
      navigate("/staff/dashboard", { replace: true });
      return;
    }
    if (isCustomer()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // Fallback to customer dashboard
    navigate("/dashboard", { replace: true });
  }, [loginMode, isAdmin, isStaff, isCustomer, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading || !user) return;

    // Wait for role to be available before redirecting
    const checkAndRedirect = async () => {
      // If role is already available, redirect immediately
      if (role) {
        redirectByRole();
        return;
      }

      // Otherwise wait a bit for profile to load
      const timer = setTimeout(() => {
        redirectByRole();
      }, 500);

      return () => clearTimeout(timer);
    };

    checkAndRedirect();
  }, [user, authLoading, role, loginMode, redirectByRole]);

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

      // Fetch user role from profiles table to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        if (import.meta.env.DEV) {
          console.warn("Error fetching profile:", profileError);
        }
      }

      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });

      // Force refresh profile in AuthContext to ensure role is loaded
      if (refreshProfile) {
        await refreshProfile();
      }

      // Wait for AuthContext to update with new profile/role
      // Poll for role to be available (max 3 seconds)
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts * 200ms = 3 seconds max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if role is now available
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", currentUser.id)
            .single();
          
          if (profile?.role) {
            // Role is loaded, break and redirect
            break;
          }
        }
        attempts++;
      }

      // Use normalized role helpers for redirect
      redirectByRole();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Login error:", error);
      }
      
      // Provide user-friendly error messages
      let errorMessage = "Invalid email or password";
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes("Email not confirmed")) {
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

      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="w-full max-w-md shadow-xl border-gold/20">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-lg mb-2">
              <span className="text-white font-bold text-2xl font-luxury">E</span>
            </div>
            <CardTitle className="text-3xl font-serif">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label className="mb-4 block text-sm font-semibold">
                Choose your access type
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "auto" as const, label: "Customer" },
                  { value: "staff" as const, label: "Staff" },
                  { value: "admin" as const, label: "Admin" },
                ]).map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      loginMode === value
                        ? "border-gold bg-gold/10 text-gold font-semibold shadow-md scale-105"
                        : "border-muted-foreground/20 hover:border-gold/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="loginMode"
                      value={value}
                      checked={loginMode === value}
                      onChange={() => setLoginMode(value)}
                      disabled={isLoading || authLoading}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {loginMode !== "auto" && (
                <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-400 text-center font-medium">
                    ⚠️ Bypass mode: Will redirect to {loginMode} dashboard regardless of actual role
                  </p>
                </div>
              )}
            </div>
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
                <Button
                  type="submit"
                  className="w-full luxury-button bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium text-base py-6"
                  disabled={isLoading || authLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-gold hover:text-gold-dark underline-offset-4 hover:underline font-semibold transition-colors">
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
