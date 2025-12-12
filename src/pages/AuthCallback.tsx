import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

/**
 * OAuth Callback Handler
 * 
 * This page handles the redirect after OAuth authentication (Google, Microsoft, Apple).
 * It retrieves the session, checks the user's role, and redirects to the appropriate dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          throw new Error('No session found after OAuth');
        }

        console.log('✅ OAuth session retrieved:', {
          userEmail: session.user.email,
          provider: session.user.app_metadata?.provider
        });

        // Wait a moment for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if profile exists and get role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileError) {
          console.warn('Profile fetch error:', profileError);
          // Profile might not exist yet, create it
          const userName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User';

          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: session.user.id,
              full_name: userName,
              role: 'customer',
            });

          if (createError) {
            console.error('Failed to create profile:', createError);
          }
        }

        const role = profile?.role?.toLowerCase().trim() || 'customer';

        console.log('🔐 OAuth redirect check:', {
          role,
          userEmail: session.user.email,
          profileExists: !!profile
        });

        // Redirect based on role
        if (role === 'admin' || role === 'super_admin') {
          console.log('✅ Redirecting to admin dashboard');
          toast({
            title: "Welcome back!",
            description: "Logged in with OAuth successfully",
          });
          navigate('/admin/dashboard', { replace: true });
        } else if (['staff', 'factory_staff', 'production_manager', 'store_manager', 'ops_team'].includes(role)) {
          console.log('✅ Redirecting to staff dashboard');
          toast({
            title: "Welcome back!",
            description: "Logged in with OAuth successfully",
          });
          navigate('/staff/dashboard', { replace: true });
        } else {
          console.log('✅ Redirecting to customer dashboard');
          toast({
            title: "Welcome!",
            description: "Account created successfully",
          });
          navigate('/dashboard', { replace: true });
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to complete sign in. Please try again.",
          variant: "destructive",
        });
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-walnut">Completing Sign In</h2>
          <p className="text-walnut/60">Please wait while we verify your account...</p>
        </div>
      </div>
    </div>
  );
}

