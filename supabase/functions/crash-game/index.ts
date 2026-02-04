import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Generate crash point using provably fair system
function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number, houseEdge: number): number {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${serverSeed}:${clientSeed}:${nonce}`)
  
  // Simple hash-based crash point generation
  let hash = 0
  const str = `${serverSeed}${clientSeed}${nonce}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // Convert to positive number between 0 and 1
  const normalized = Math.abs(hash) / 2147483647
  
  // Generate crash point with house edge
  // Formula: 0.99 / (1 - R) where R is random [0, 1)
  // This creates a distribution where lower values are more common
  const e = (1 - houseEdge)
  
  // Clamp normalized to avoid division by zero and extreme values
  const clampedNorm = Math.min(normalized, 0.99)
  
  // Calculate crash point
  let crashPoint = e / (1 - clampedNorm)
  
  // Minimum crash point is 1.00
  crashPoint = Math.max(1.00, crashPoint)
  
  // Cap at 100x for reasonable gameplay
  crashPoint = Math.min(100, crashPoint)
  
  return Math.floor(crashPoint * 100) / 100
}

// Hash function for server seed
async function hashSeed(seed: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(seed)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()
    const body = req.method !== 'GET' ? await req.json() : {}

    // START GAME
    if (action === 'start' && req.method === 'POST') {
      const { betAmount } = body

      if (!betAmount || betAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid bet amount' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Get user balance
      const { data: balance } = await adminClient.rpc('get_user_balance', { _user_id: userId })
      if ((balance || 0) < betAmount) {
        return new Response(JSON.stringify({ error: 'Insufficient balance' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Get house edge
      const { data: houseEdge } = await adminClient.rpc('get_house_edge', { _game_key: 'CRASH' })
      const edge = houseEdge || 0.04

      // Get user's provably fair seeds
      const { data: seeds, error: seedsError } = await adminClient
        .from('provably_fair_seeds')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (seedsError || !seeds) {
        return new Response(JSON.stringify({ error: 'Provably fair seeds not found' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const newNonce = seeds.nonce + 1

      // Generate crash point
      const crashPoint = generateCrashPoint(seeds.server_seed, seeds.client_seed, newNonce, edge)

      // Create unique ref for idempotency
      const gameId = crypto.randomUUID()
      const refId = `crash_bet_${gameId}`

      // Debit bet amount
      const { error: ledgerError } = await adminClient
        .from('ledger_entries')
        .insert({
          user_id: userId,
          type: 'BET',
          amount: -betAmount,
          ref_id: refId,
          description: 'Crash game bet'
        })

      if (ledgerError) {
        console.error('Ledger error:', ledgerError)
        return new Response(JSON.stringify({ error: 'Failed to process bet' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Create game record (store crash point server-side only)
      const { error: gameError } = await adminClient
        .from('crash_games')
        .insert({
          id: gameId,
          user_id: userId,
          bet_amount: betAmount,
          crash_point: crashPoint,
          server_seed_hash: seeds.server_seed_hash,
          client_seed: seeds.client_seed,
          nonce: newNonce,
          house_edge: edge,
          status: 'active'
        })

      if (gameError) {
        console.error('Game insert error:', gameError)
        return new Response(JSON.stringify({ error: 'Failed to create game' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Increment nonce
      await adminClient
        .from('provably_fair_seeds')
        .update({ nonce: newNonce, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      console.log(`Crash game started: ${gameId}, bet: ${betAmount}, crashPoint: ${crashPoint}`)

      return new Response(JSON.stringify({
        gameId,
        serverSeedHash: seeds.server_seed_hash,
        crashPoint, // In production, don't expose this - handle server-side
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // CASHOUT
    if (action === 'cashout' && req.method === 'POST') {
      const { gameId, multiplier } = body

      if (!gameId || !multiplier) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Get game
      const { data: game, error: gameError } = await adminClient
        .from('crash_games')
        .select('*')
        .eq('id', gameId)
        .eq('user_id', userId)
        .single()

      if (gameError || !game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      if (game.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Game already ended' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check if cashout is valid (before crash)
      if (multiplier > game.crash_point) {
        // They tried to cashout after crash - no payout
        await adminClient
          .from('crash_games')
          .update({
            status: 'crashed',
            payout: 0,
            ended_at: new Date().toISOString()
          })
          .eq('id', gameId)

        return new Response(JSON.stringify({ 
          success: false, 
          crashed: true,
          crashPoint: game.crash_point,
          payout: 0 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Valid cashout
      const payout = Math.floor(game.bet_amount * multiplier * 100) / 100
      const refId = `crash_win_${gameId}`

      // Credit winnings
      await adminClient
        .from('ledger_entries')
        .insert({
          user_id: userId,
          type: 'WIN',
          amount: payout,
          ref_id: refId,
          description: `Crash cashout at ${multiplier.toFixed(2)}x`
        })

      // Update game
      await adminClient
        .from('crash_games')
        .update({
          status: 'cashedout',
          cashout_multiplier: multiplier,
          payout,
          ended_at: new Date().toISOString()
        })
        .eq('id', gameId)

      console.log(`Crash cashout: ${gameId}, multiplier: ${multiplier}, payout: ${payout}`)

      return new Response(JSON.stringify({
        success: true,
        multiplier,
        payout
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