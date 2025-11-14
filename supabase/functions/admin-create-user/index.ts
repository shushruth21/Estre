import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { email, password, role } = await req.json();

    // Validate inputs
    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role key to create user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    if (!newUser?.user) {
      throw new Error('User creation failed');
    }

    // Assign role if not customer (customer is default via trigger)
    if (role !== 'customer') {
      // Delete default customer role
      const { error: deleteError } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', newUser.user.id);

      if (deleteError) {
        console.error('Error deleting default role:', deleteError);
      }

      // Insert specified role
      const { error: roleInsertError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role,
        });

      if (roleInsertError) {
        console.error('Error assigning role:', roleInsertError);
        // Try to delete the user if role assignment fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw roleInsertError;
      }
    }

    console.log(`Successfully created user ${email} with role ${role}`);

    return new Response(JSON.stringify({ user: newUser.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-create-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
