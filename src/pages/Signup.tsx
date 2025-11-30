import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";

// Strong password validation schema
const signupSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input with zod
    try {
      signupSchema.parse({ email, password, confirmPassword, fullName });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Get the current origin, fallback to localhost:8080 for development
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'http://localhost:8080/';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Create profile with customer role (trigger will also handle this, but explicit is better)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              user_id: data.user.id,
              full_name: fullName.trim(),
              role: "customer",
            }, {
              onConflict: "user_id"
            });

          if (profileError) {
            if (import.meta.env.DEV) {
              console.error("Error creating/updating profile:", profileError);
            }
            // Don't throw - trigger should handle it, but log for debugging
          }
        } catch (profileErr) {
          if (import.meta.env.DEV) {
            console.error("Error creating profile:", profileErr);
          }
          // Continue anyway - trigger should handle it
        }
      }

      toast({
        title: "Success",
        description: "Account created! Please check your email to verify.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

      <div className="flex-1 flex items-center justify-center p-4 bg-ivory">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-gold/20 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <img src="/estre-logo.png" alt="Estre" className="h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-3xl font-serif text-walnut">Sign Up</CardTitle>
            <CardDescription className="text-walnut/60">
              Create a new account to start configuring furniture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-walnut">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-walnut">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-walnut">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gold/20 focus:border-gold"
                />
                <p className="text-xs text-walnut/50">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-walnut">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <Button type="submit" variant="luxury" className="w-full py-6 text-base" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-walnut/60">Already have an account? </span>
              <Link to="/login" className="text-gold hover:text-gold-dark hover:underline font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
