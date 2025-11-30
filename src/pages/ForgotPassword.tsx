import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");

    if (!email || !email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send reset link. Please try again.";
      if (error.message?.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a few minutes and try again.";
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
            <div className="mx-auto mb-6 flex justify-center">
              <img src="/estre-logo.png" alt="Estre" className="h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-3xl font-serif">Reset Password</CardTitle>
            <CardDescription className="text-base">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-6">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-400">
                    <strong>Check your email!</strong>
                    <br />
                    We've sent password reset instructions to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Next steps:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the reset link in the email</li>
                    <li>Enter your new password</li>
                    <li>Sign in with your new credentials</li>
                  </ol>
                  <p className="text-xs">
                    The reset link will expire in 1 hour for security reasons.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => setIsSuccess(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Link
                  </Button>
                  <Link to="/login" className="w-full">
                    <Button variant="luxury" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6" aria-label="Password reset form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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

                <Button
                  type="submit"
                  className="w-full py-6 text-base"
                  variant="luxury"
                  disabled={isLoading}
                  aria-label="Send password reset email"
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />}
                  {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <span className="text-muted-foreground">Remember your password? </span>
                  <Link to="/login" className="text-gold hover:text-gold-dark underline-offset-4 hover:underline font-semibold transition-colors">
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
