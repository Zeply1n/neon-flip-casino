import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    // Seed admin - only works once (checks if admin already exists)
    if (action === 'seed-admin' && req.method === 'POST') {
      const { email, password, username } = await req.json()

      if (!email || !password || !username) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check if any admin exists
      const { data: existingAdmins } = await adminClient
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (existingAdmins && existingAdmins.length > 0) {
        return new Response(JSON.stringify({ error: 'Admin already exists. Use admin panel to create more admins.' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Create user - the trigger will create profile, user_roles (as 'user'), provably_fair_seeds, and initial balance
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
      })

      if (createError) {
        console.error('User creation error:', createError)
        return new Response(JSON.stringify({ error: createError.message }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Upgrade to admin role
      await adminClient
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', newUser.user.id)

      // Add extra balance for admin
      await adminClient
        .from('ledger_entries')
        .insert({
          user_id: newUser.user.id,
          type: 'DEPOSIT',
          amount: 9000,
          ref_id: `admin_seed_${newUser.user.id}`,
          description: 'Admin initial balance'
        })

      console.log(`Seed admin created: ${email}`)

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user: { id: newUser.user.id, email, username }
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})