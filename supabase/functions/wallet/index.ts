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
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // lookup-email is public (no auth required) - used for username login
    if (action === 'lookup-email' && req.method === 'POST') {
      const { userId: targetUserId } = await req.json()
      
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(targetUserId)
      
      if (userError || !userData?.user?.email) {
        return new Response(JSON.stringify({ error: 'User not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ email: userData.user.email }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // All other endpoints require auth
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

    // GET balance and stats
    if (action === 'balance' && req.method === 'GET') {
      const { data: balance } = await adminClient.rpc('get_user_balance', { _user_id: userId })
      
      // Get lifetime stats
      const { data: entries } = await adminClient
        .from('ledger_entries')
        .select('type, amount')
        .eq('user_id', userId)

      let totalWagered = 0
      let totalWon = 0
      for (const entry of entries || []) {
        if (entry.type === 'BET') {
          totalWagered += Math.abs(entry.amount)
        } else if (entry.type === 'WIN') {
          totalWon += entry.amount
        }
      }

      return new Response(JSON.stringify({
        balance: balance || 0,
        totalWagered,
        totalWon,
        profit: totalWon - totalWagered
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET transactions
    if (action === 'transactions' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20')
      
      const { data: transactions, error } = await adminClient
        .from('ledger_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Transactions fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ transactions }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST deposit request
    if (action === 'deposit' && req.method === 'POST') {
      const { method, amount, reference, voucherCode } = await req.json()

      if (!['crypto', 'voucher', 'manual'].includes(method)) {
        return new Response(JSON.stringify({ error: 'Invalid deposit method' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Handle voucher redemption directly
      if (method === 'voucher' && voucherCode) {
        const { data: voucher, error: voucherError } = await adminClient
          .from('vouchers')
          .select('*')
          .eq('code', voucherCode)
          .is('redeemed_by', null)
          .single()

        if (voucherError || !voucher) {
          return new Response(JSON.stringify({ error: 'Invalid or already used voucher code' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        // Mark voucher as redeemed
        await adminClient
          .from('vouchers')
          .update({
            redeemed_by: userId,
            redeemed_at: new Date().toISOString()
          })
          .eq('id', voucher.id)

        // Credit wallet
        const refId = `voucher_${voucher.id}`
        await adminClient
          .from('ledger_entries')
          .insert({
            user_id: userId,
            type: 'DEPOSIT',
            amount: voucher.amount,
            ref_id: refId,
            description: `Voucher redeemed: ${voucherCode.slice(0, 4)}****`
          })

        // Record deposit as approved
        await adminClient
          .from('deposit_requests')
          .insert({
            user_id: userId,
            method: 'voucher',
            amount: voucher.amount,
            voucher_code: voucherCode,
            status: 'approved'
          })

        const { data: newBalance } = await adminClient.rpc('get_user_balance', { _user_id: userId })

        console.log(`Voucher ${voucherCode} redeemed for ${voucher.amount} F$`)

        return new Response(JSON.stringify({
          success: true,
          amount: voucher.amount,
          newBalance: newBalance || 0
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Create pending deposit request for other methods
      const { data: deposit, error: depositError } = await adminClient
        .from('deposit_requests')
        .insert({
          user_id: userId,
          method,
          amount: amount || null,
          reference: reference || null
        })
        .select()
        .single()

      if (depositError) {
        console.error('Deposit request error:', depositError)
        return new Response(JSON.stringify({ error: 'Failed to create deposit request' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      console.log(`Deposit request created: ${deposit.id}, method: ${method}`)

      return new Response(JSON.stringify({
        success: true,
        depositId: deposit.id,
        status: 'pending',
        message: 'Deposit request submitted for review'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST withdrawal request
    if (action === 'withdraw' && req.method === 'POST') {
      const { amount, method, destination } = await req.json()

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid withdrawal amount' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      if (!method || !destination) {
        return new Response(JSON.stringify({ error: 'Method and destination required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check if user has promotional account (can't withdraw)
      const { data: profile } = await adminClient
        .from('profiles')
        .select('account_type')
        .eq('user_id', userId)
        .single()

      if (profile?.account_type === 'promotional') {
        return new Response(JSON.stringify({ error: 'Promotional accounts cannot withdraw funds' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check balance
      const { data: balance } = await adminClient.rpc('get_user_balance', { _user_id: userId })
      if ((balance || 0) < amount) {
        return new Response(JSON.stringify({ error: 'Insufficient balance' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check for recent pending withdrawal (rate limit)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentWithdrawal } = await adminClient
        .from('withdrawal_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', oneHourAgo)
        .single()

      if (recentWithdrawal) {
        return new Response(JSON.stringify({ error: 'Please wait 1 hour between withdrawal requests' }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Create withdrawal request
      const { data: withdrawal, error: withdrawError } = await adminClient
        .from('withdrawal_requests')
        .insert({
          user_id: userId,
          amount,
          method,
          destination
        })
        .select()
        .single()

      if (withdrawError) {
        console.error('Withdrawal request error:', withdrawError)
        return new Response(JSON.stringify({ error: 'Failed to create withdrawal request' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      console.log(`Withdrawal request created: ${withdrawal.id}, amount: ${amount}`)

      return new Response(JSON.stringify({
        success: true,
        withdrawalId: withdrawal.id,
        status: 'pending',
        message: 'Withdrawal request submitted for review'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET deposit/withdrawal history
    if (action === 'requests' && req.method === 'GET') {
      const { data: deposits } = await adminClient
        .from('deposit_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: withdrawals } = await adminClient
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      return new Response(JSON.stringify({ deposits, withdrawals }), { 
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