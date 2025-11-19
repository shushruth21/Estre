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
  const [loginMode, setLoginMode] = useState<"auto" | "admin" | "staff">("auto");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, role } = useAuth();

  const redirectByRole = (userRole: string | null | undefined) => {
    // Manual overrides take precedence
    if (loginMode === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return true;
    }
    if (loginMode === "staff") {
      navigate("/staff/job-cards", { replace: true });
      return true;
    }

    if (userRole === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return true;
    }
    if (userRole === "staff" || userRole === "factory_staff") {
      navigate("/staff/job-cards", { replace: true });
      return true;
    }
    navigate("/dashboard", { replace: true });
    return true;
  };

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading || !user) return;

    if (loginMode !== "auto") {
      redirectByRole(loginMode);
      return;
    }

    if (redirectByRole(role)) {
      return;
    }

    const resolveRole = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (profile?.role && redirectByRole(profile.role)) {
          return;
        }

        const { data: legacyRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const legacyRole = legacyRoles?.[0]?.role;
        if (legacyRole) {
          redirectByRole(legacyRole);
          return;
        }

        redirectByRole("customer");
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("❌ Error determining role during login redirect:", error);
        }
        redirectByRole("customer");
      }
    };

    resolveRole();
  }, [user, authLoading, navigate, role, loginMode]);

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

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 300));

      // Determine redirect based on role from profile
      let userRole = profile?.role || role;

      if (!userRole && loginMode === "auto") {
        const { data: legacyRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        userRole = legacyRoles?.[0]?.role || "customer";
      }

      redirectByRole(loginMode === "auto" ? userRole : loginMode);
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

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="mb-2 block text-sm font-medium">
                Login Mode
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["auto", "admin", "staff"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={loginMode === mode ? "default" : "outline"}
                    onClick={() => setLoginMode(mode)}
                    disabled={isLoading || authLoading}
                  >
                    {mode === "auto"
                      ? "Auto"
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Auto detects your role from Supabase profiles. Choose Admin or
                Staff to bypass directly to that dashboard after login.
              </p>
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
