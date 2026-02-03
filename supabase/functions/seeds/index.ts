import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as hexEncode } from 'https://deno.land/std@0.168.0/encoding/hex.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return new TextDecoder().decode(hexEncode(new Uint8Array(hashBuffer)))
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const userId = claimsData.claims.sub as string
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // GET current seeds
    if (action === 'current' && req.method === 'GET') {
      const { data: seeds, error } = await adminClient
        .from('provably_fair_seeds')
        .select('server_seed_hash, client_seed, nonce')
        .eq('user_id', userId)
        .single()

      if (error || !seeds) {
        return new Response(JSON.stringify({ error: 'Seeds not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify(seeds), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST update client seed
    if (action === 'client-seed' && req.method === 'POST') {
      const { clientSeed } = await req.json()

      if (!clientSeed || clientSeed.length < 1 || clientSeed.length > 64) {
        return new Response(JSON.stringify({ error: 'Client seed must be 1-64 characters' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const { error } = await adminClient
        .from('provably_fair_seeds')
        .update({ 
          client_seed: clientSeed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Client seed update error:', error)
        return new Response(JSON.stringify({ error: 'Failed to update client seed' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      console.log(`Client seed updated for user ${userId}`)

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST rotate server seed (reveals old, generates new)
    if (action === 'rotate' && req.method === 'POST') {
      const { data: currentSeeds, error: fetchError } = await adminClient
        .from('provably_fair_seeds')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError || !currentSeeds) {
        return new Response(JSON.stringify({ error: 'Seeds not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Generate new server seed
      const newServerSeed = crypto.randomUUID() + crypto.randomUUID()
      const newServerSeedHash = await sha256(newServerSeed)

      // Update with new seed and reset nonce
      const { error: updateError } = await adminClient
        .from('provably_fair_seeds')
        .update({
          server_seed: newServerSeed,
          server_seed_hash: newServerSeedHash,
          nonce: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Seed rotation error:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to rotate seeds' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      console.log(`Seeds rotated for user ${userId}`)

      return new Response(JSON.stringify({
        success: true,
        previousServerSeed: currentSeeds.server_seed,
        previousServerSeedHash: currentSeeds.server_seed_hash,
        previousNonce: currentSeeds.nonce,
        newServerSeedHash: newServerSeedHash
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET game history for verification
    if (action === 'history' && req.method === 'GET') {
      const { data: coinflips } = await adminClient
        .from('coinflip_games')
        .select('id, bet_amount, chosen_side, result, won, payout, server_seed_hash, client_seed, nonce, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: mines } = await adminClient
        .from('mines_games')
        .select('id, bet_amount, mines_count, current_multiplier, status, payout, server_seed_hash, client_seed, nonce, created_at')
        .eq('user_id', userId)
        .neq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)

      return new Response(JSON.stringify({ coinflips, mines }), { 
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
