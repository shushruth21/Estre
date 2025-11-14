import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ROLES = ['admin', 'store_manager', 'production_manager', 'sales_executive', 'factory_staff', 'customer'];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the caller is an admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('is_admin_or_manager', { _user_id: user.id });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { userId, role } = await req.json();

    // Validate inputs
    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'userId and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate role is a valid enum value
    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (role === 'customer') {
      // Remove all roles (customer is default)
      const { error: deleteError } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing roles:', deleteError);
        throw deleteError;
      }
    } else {
      // Remove existing roles and add new one
      const { error: deleteError } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing old roles:', deleteError);
        throw deleteError;
      }

      const { error: insertError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
        });

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully updated role for user ${userId} to ${role}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-update-user-role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
