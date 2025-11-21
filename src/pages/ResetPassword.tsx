import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setHasValidToken(!!session);
      } catch (error) {
        console.error("Session check error:", error);
        setHasValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) return "Password is required";
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError("");
    setConfirmError("");

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error("Password update error:", error);

      let errorMessage = "Failed to reset password. Please try again.";
      if (error.message?.includes("token")) {
        errorMessage = "Reset link has expired. Please request a new one.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { strength: string; color: string; width: string } => {
    if (!pwd) return { strength: "", color: "", width: "0%" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { strength: "Weak", color: "bg-destructive", width: "33%" };
    if (score <= 4) return { strength: "Medium", color: "bg-amber-500", width: "66%" };
    return { strength: "Strong", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link to="/forgot-password">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Request New Link
              </Button>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-gold/20">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Invalid or Expired Link</strong>
                  <br />
                  This password reset link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex flex-col gap-3">
                <Link to="/forgot-password" className="w-full">
                  <Button className="w-full luxury-button bg-gradient-gold text-white">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <Link to="/login">
            <Button variant="ghost" size="sm" aria-label="Go back to login page">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Login
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="w-full max-w-md shadow-xl border-gold/20" id="main-content" role="main">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-lg mb-2" aria-hidden="true">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-serif">Set New Password</CardTitle>
            <CardDescription className="text-base">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4" aria-label="New password form">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    disabled={isLoading}
                    autoComplete="new-password"
                    autoFocus
                    className={`pr-10 ${passwordError ? "border-destructive" : ""}`}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "password-error" : "password-requirements"}
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
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
                {passwordError && (
                  <p id="password-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
                {!passwordError && (
                  <p id="password-requirements" className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmError) setConfirmError("");
                    }}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className={`pr-10 ${confirmError ? "border-destructive" : ""}`}
                    aria-invalid={!!confirmError}
                    aria-describedby={confirmError ? "confirm-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {confirmError && (
                  <p id="confirm-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3" />
                    {confirmError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full luxury-button bg-gradient-gold text-white border-gold hover:shadow-gold-glow transition-premium text-base py-6"
                disabled={isLoading}
                aria-label="Reset password"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
                {isLoading ? "Updating Password..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
