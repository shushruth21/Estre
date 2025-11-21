import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, role, isAdmin, isStaff, isCustomer, refreshProfile } = useAuth();

  const redirectByRole = useCallback(() => {
    // Use normalized role helpers for secure redirect
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
  }, [isAdmin, isStaff, isCustomer, navigate]);

  // Add timeout for authLoading to prevent infinite spinner
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        setAuthTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [authLoading]);

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

      // Otherwise wait a bit for profile to load (max 1 second)
      const timer = setTimeout(() => {
        redirectByRole();
      }, 1000);

      return () => clearTimeout(timer);
    };

    checkAndRedirect();
  }, [user, authLoading, role, redirectByRole]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Comprehensive validation
    let hasError = false;

    if (!email || !email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) {
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

      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });

      // Force refresh profile in AuthContext to ensure role is loaded
      if (refreshProfile) {
        await refreshProfile();
      }

      // Single role fetch with timeout (optimized - no polling)
      const fetchRoleWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Role fetch timeout')), 2000)
        );

        const rolePromise = supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        try {
          await Promise.race([rolePromise, timeoutPromise]);
        } catch (error) {
          // Role fetch failed or timed out, but continue with redirect
          if (import.meta.env.DEV) {
            console.warn("Role fetch timeout, continuing with default redirect:", error);
          }
        }
      };

      await fetchRoleWithTimeout();

      // Brief delay to allow AuthContext to update
      await new Promise(resolve => setTimeout(resolve, 300));

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" aria-label="Go back to home page">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="w-full max-w-md shadow-xl border-gold/20" id="main-content" role="main">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-lg mb-2" aria-hidden="true">
              <span className="text-white font-bold text-2xl font-luxury">E</span>
            </div>
            <CardTitle className="text-3xl font-serif" id="login-title">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authTimeout && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Authentication is taking longer than expected. The form is available below.
                </AlertDescription>
              </Alert>
            )}
            {authLoading && !authTimeout ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4" role="status" aria-live="polite">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Checking authentication status...</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <p id="email-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-gold hover:text-gold-dark underline-offset-4 hover:underline transition-colors"
                      tabIndex={isLoading ? -1 : 0}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className={`pr-10 ${passwordError ? "border-destructive" : ""}`}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p id="password-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full luxury-button bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium text-base py-6"
                  disabled={isLoading}
                  aria-label="Sign in to your account"
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
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
