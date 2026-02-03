import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
  hash ^= hash >>> 16
  return (hash >>> 0) / 4294967296
}

function determineResult(serverSeed: string, clientSeed: string, nonce: number): 'heads' | 'tails' {
  const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`
  const value = seededRandom(combinedSeed)
  return value < 0.5 ? 'heads' : 'tails'
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

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { betAmount, chosenSide } = await req.json()

    // Validate inputs
    if (!betAmount || betAmount <= 0 || betAmount > 10000) {
      return new Response(JSON.stringify({ error: 'Invalid bet amount (0-10000)' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    if (!chosenSide || !['heads', 'tails'].includes(chosenSide)) {
      return new Response(JSON.stringify({ error: 'Invalid side (heads/tails)' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user balance
    const { data: balanceData } = await adminClient.rpc('get_user_balance', { _user_id: userId })
    const balance = balanceData || 0

    if (balance < betAmount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Get house edge
    const { data: houseEdgeData } = await adminClient.rpc('get_house_edge', { _game_key: 'COINFLIP' })
    const houseEdge = houseEdgeData || 0.02

    // Get user seeds
    const { data: seeds } = await adminClient
      .from('provably_fair_seeds')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!seeds) {
      return new Response(JSON.stringify({ error: 'Seeds not found' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const nonce = seeds.nonce + 1
    const result = determineResult(seeds.server_seed, seeds.client_seed, nonce)
    const won = result === chosenSide

    // Calculate payout: 2x minus house edge for wins
    const payoutMultiplier = 2 * (1 - houseEdge)
    const payout = won ? betAmount * payoutMultiplier : 0
    const profit = won ? payout - betAmount : -betAmount

    const gameRefId = `coinflip_${userId}_${Date.now()}`
    const betRefId = `${gameRefId}_bet`
    const winRefId = `${gameRefId}_win`

    // Debit bet
    const { error: betError } = await adminClient
      .from('ledger_entries')
      .insert({
        user_id: userId,
        type: 'BET',
        amount: -betAmount,
        ref_id: betRefId,
        description: `Coinflip bet: ${chosenSide}`
      })

    if (betError) {
      console.error('Bet ledger error:', betError)
      return new Response(JSON.stringify({ error: 'Failed to place bet' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Credit win if applicable
    if (won) {
      const { error: winError } = await adminClient
        .from('ledger_entries')
        .insert({
          user_id: userId,
          type: 'WIN',
          amount: payout,
          ref_id: winRefId,
          description: `Coinflip win: ${payoutMultiplier.toFixed(2)}x`
        })

      if (winError) {
        console.error('Win ledger error:', winError)
      }
    }

    // Record game
    const { data: game, error: gameError } = await adminClient
      .from('coinflip_games')
      .insert({
        user_id: userId,
        bet_amount: betAmount,
        chosen_side: chosenSide,
        result: result,
        won: won,
        payout: payout,
        server_seed_hash: seeds.server_seed_hash,
        client_seed: seeds.client_seed,
        nonce: nonce,
        house_edge: houseEdge
      })
      .select()
      .single()

    if (gameError) {
      console.error('Game record error:', gameError)
    }

    // Increment nonce
    await adminClient
      .from('provably_fair_seeds')
      .update({ nonce: nonce })
      .eq('user_id', userId)

    // Get new balance
    const { data: newBalance } = await adminClient.rpc('get_user_balance', { _user_id: userId })

    console.log(`Coinflip: ${chosenSide} vs ${result}, won: ${won}, payout: ${payout}`)

    return new Response(JSON.stringify({
      gameId: game?.id,
      chosenSide,
      result,
      won,
      payout,
      profit,
      newBalance: newBalance || 0,
      multiplier: won ? payoutMultiplier : 0,
      serverSeedHash: seeds.server_seed_hash,
      nonce
    }), { 
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
