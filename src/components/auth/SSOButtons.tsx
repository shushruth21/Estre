import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SSOButtonsProps {
  disabled?: boolean;
}

export const SSOButtons = ({ disabled = false }: SSOButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSSOLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    setLoadingProvider(provider);

    try {
      const supabaseProvider = provider === 'microsoft' ? 'azure' : provider;

      // Use a more robust redirect URL that works in all environments
      const getRedirectUrl = () => {
        // In production, use the actual origin
        if (import.meta.env.PROD) {
          return `${window.location.origin}/auth/callback`;
        }
        // In development, use localhost to avoid webcontainer URL issues
        return 'http://localhost:5173/auth/callback';
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      });

      if (error) throw error;

      // No need to clear loading state here as we'll be redirecting
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast({
        title: "Sign In Failed",
        description: error.message || `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOLogin('google')}
          disabled={disabled || loadingProvider !== null}
          className="w-full relative group hover:border-[#4285F4] hover:bg-[#4285F4]/5 transition-all duration-200"
          aria-label="Sign in with Google"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden sm:inline">Google</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOLogin('microsoft')}
          disabled={disabled || loadingProvider !== null}
          className="w-full relative group hover:border-[#00A4EF] hover:bg-[#00A4EF]/5 transition-all duration-200"
          aria-label="Sign in with Microsoft"
        >
          {loadingProvider === 'microsoft' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M13 1h10v10H13z" />
                <path fill="#7FBA00" d="M1 13h10v10H1z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              <span className="hidden sm:inline">Microsoft</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOLogin('apple')}
          disabled={disabled || loadingProvider !== null}
          className="w-full relative group hover:border-foreground hover:bg-foreground/5 transition-all duration-200"
          aria-label="Sign in with Apple"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="hidden sm:inline">Apple</span>
            </>
          )}
        </Button>
      </div>


    </div>
  );
};
