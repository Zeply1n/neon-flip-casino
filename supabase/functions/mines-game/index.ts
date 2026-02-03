import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Fisher-Yates shuffle with seed
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return function() {
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
    hash ^= hash >>> 16
    return (hash >>> 0) / 4294967296
  }
}

function generateMinePositions(serverSeed: string, clientSeed: string, nonce: number, minesCount: number): number[] {
  const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`
  const rng = seededRandom(combinedSeed)
  
  const positions = Array.from({ length: 25 }, (_, i) => i)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }
  
  return positions.slice(0, minesCount)
}

// Calculate multiplier based on probability
function calculateMultiplier(minesCount: number, revealedCount: number, houseEdge: number): number {
  if (revealedCount === 0) return 1
  
  const totalTiles = 25
  const safeTiles = totalTiles - minesCount
  
  // Calculate probability of surviving k reveals
  // P(k) = C(safeTiles, k) / C(totalTiles, k)
  let probability = 1
  for (let i = 0; i < revealedCount; i++) {
    probability *= (safeTiles - i) / (totalTiles - i)
  }
  
  // Fair multiplier = 1 / probability
  // Apply house edge: multiplier = (1 / p) * (1 - houseEdge)
  const fairMultiplier = 1 / probability
  const adjustedMultiplier = fairMultiplier * (1 - houseEdge)
  
  return Math.max(1, adjustedMultiplier)
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

    if (action === 'start' && req.method === 'POST') {
      const { betAmount, minesCount } = await req.json()

      // Validate inputs
      if (!betAmount || betAmount <= 0 || betAmount > 10000) {
        return new Response(JSON.stringify({ error: 'Invalid bet amount (0-10000)' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
      if (!minesCount || minesCount < 1 || minesCount > 24) {
        return new Response(JSON.stringify({ error: 'Invalid mines count (1-24)' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check for active game
      const { data: activeGame } = await adminClient
        .from('mines_games')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (activeGame) {
        return new Response(JSON.stringify({ error: 'You have an active game. Finish it first.' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

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
      const { data: houseEdgeData } = await adminClient.rpc('get_house_edge', { _game_key: 'MINES' })
      const houseEdge = houseEdgeData || 0.015

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
      const minePositions = generateMinePositions(seeds.server_seed, seeds.client_seed, nonce, minesCount)
      const refId = `mines_bet_${userId}_${Date.now()}`

      // Debit bet amount
      const { error: ledgerError } = await adminClient
        .from('ledger_entries')
        .insert({
          user_id: userId,
          type: 'BET',
          amount: -betAmount,
          ref_id: refId,
          description: `Mines bet: ${minesCount} mines`
        })

      if (ledgerError) {
        console.error('Ledger error:', ledgerError)
        return new Response(JSON.stringify({ error: 'Failed to place bet' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Create game
      const { data: game, error: gameError } = await adminClient
        .from('mines_games')
        .insert({
          user_id: userId,
          bet_amount: betAmount,
          mines_count: minesCount,
          mine_positions: minePositions,
          server_seed_hash: seeds.server_seed_hash,
          client_seed: seeds.client_seed,
          nonce: nonce,
          house_edge: houseEdge,
          current_multiplier: 1.0
        })
        .select()
        .single()

      if (gameError) {
        console.error('Game error:', gameError)
        return new Response(JSON.stringify({ error: 'Failed to start game' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Increment nonce
      await adminClient
        .from('provably_fair_seeds')
        .update({ nonce: nonce })
        .eq('user_id', userId)

      console.log(`Game started: ${game.id}, mines: ${minesCount}, bet: ${betAmount}`)

      return new Response(JSON.stringify({
        gameId: game.id,
        minesCount,
        betAmount,
        multiplier: 1.0,
        serverSeedHash: seeds.server_seed_hash,
        revealedCount: 0
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'reveal' && req.method === 'POST') {
      const { gameId, tileIndex } = await req.json()

      if (tileIndex < 0 || tileIndex > 24) {
        return new Response(JSON.stringify({ error: 'Invalid tile index (0-24)' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const { data: game, error: gameError } = await adminClient
        .from('mines_games')
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

      if (game.revealed_positions.includes(tileIndex)) {
        return new Response(JSON.stringify({ error: 'Tile already revealed' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const isMine = game.mine_positions.includes(tileIndex)
      const newRevealed = [...game.revealed_positions, tileIndex]

      if (isMine) {
        // Game lost
        await adminClient
          .from('mines_games')
          .update({
            status: 'lost',
            revealed_positions: newRevealed,
            payout: 0,
            ended_at: new Date().toISOString()
          })
          .eq('id', gameId)

        console.log(`Game ${gameId} lost at tile ${tileIndex}`)

        return new Response(JSON.stringify({
          gameId,
          tileIndex,
          isMine: true,
          status: 'lost',
          multiplier: 0,
          payout: 0,
          revealedCount: newRevealed.length,
          minePositions: game.mine_positions // Reveal all mines on loss
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Safe tile - calculate new multiplier
      const safeReveals = newRevealed.length
      const newMultiplier = calculateMultiplier(game.mines_count, safeReveals, game.house_edge)

      await adminClient
        .from('mines_games')
        .update({
          revealed_positions: newRevealed,
          current_multiplier: newMultiplier
        })
        .eq('id', gameId)

      const potentialPayout = game.bet_amount * newMultiplier
      const maxSafeTiles = 25 - game.mines_count

      console.log(`Game ${gameId} reveal ${tileIndex}, safe: ${safeReveals}/${maxSafeTiles}, multiplier: ${newMultiplier.toFixed(4)}`)

      // Check if all safe tiles revealed (auto-win)
      if (safeReveals >= maxSafeTiles) {
        const refId = `mines_win_${gameId}`
        await adminClient
          .from('ledger_entries')
          .insert({
            user_id: userId,
            type: 'WIN',
            amount: potentialPayout,
            ref_id: refId,
            description: `Mines win: ${newMultiplier.toFixed(2)}x`
          })

        await adminClient
          .from('mines_games')
          .update({
            status: 'won',
            payout: potentialPayout,
            ended_at: new Date().toISOString()
          })
          .eq('id', gameId)

        return new Response(JSON.stringify({
          gameId,
          tileIndex,
          isMine: false,
          status: 'won',
          multiplier: newMultiplier,
          payout: potentialPayout,
          revealedCount: safeReveals,
          autoWin: true
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({
        gameId,
        tileIndex,
        isMine: false,
        status: 'active',
        multiplier: newMultiplier,
        potentialPayout,
        revealedCount: safeReveals
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'cashout' && req.method === 'POST') {
      const { gameId } = await req.json()

      const { data: game, error: gameError } = await adminClient
        .from('mines_games')
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

      if (game.revealed_positions.length === 0) {
        return new Response(JSON.stringify({ error: 'Must reveal at least one tile' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const payout = game.bet_amount * game.current_multiplier
      const refId = `mines_win_${gameId}`

      // Credit winnings (idempotent)
      const { error: ledgerError } = await adminClient
        .from('ledger_entries')
        .insert({
          user_id: userId,
          type: 'WIN',
          amount: payout,
          ref_id: refId,
          description: `Mines cashout: ${game.current_multiplier.toFixed(2)}x`
        })

      if (ledgerError && !ledgerError.message.includes('duplicate')) {
        console.error('Ledger error:', ledgerError)
        return new Response(JSON.stringify({ error: 'Failed to process cashout' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      await adminClient
        .from('mines_games')
        .update({
          status: 'won',
          payout: payout,
          ended_at: new Date().toISOString()
        })
        .eq('id', gameId)

      console.log(`Game ${gameId} cashed out: ${payout} F$ at ${game.current_multiplier.toFixed(4)}x`)

      return new Response(JSON.stringify({
        gameId,
        status: 'won',
        multiplier: game.current_multiplier,
        payout,
        profit: payout - game.bet_amount
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
