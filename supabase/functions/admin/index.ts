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

    // Check if user is admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()
    const body = req.method !== 'GET' ? await req.json() : {}

    // Log admin action helper
    async function logAction(targetType: string, targetId: string | null, actionName: string, details: object) {
      await adminClient.from('audit_logs').insert({
        admin_id: userId,
        action: actionName,
        target_type: targetType,
        target_id: targetId,
        details
      })
    }

    // GET users list
    if (action === 'users' && req.method === 'GET') {
      const search = url.searchParams.get('search') || ''
      
      let query = adminClient
        .from('profiles')
        .select(`
          id,
          user_id,
          username,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (search) {
        query = query.ilike('username', `%${search}%`)
      }

      const { data: users, error } = await query

      if (error) {
        console.error('Users fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Get balances for each user
      const usersWithBalance = await Promise.all(users.map(async (user) => {
        const { data: balance } = await adminClient.rpc('get_user_balance', { _user_id: user.user_id })
        const { data: roles } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.user_id)
        
        return {
          ...user,
          balance: balance || 0,
          roles: roles?.map(r => r.role) || []
        }
      }))

      return new Response(JSON.stringify({ users: usersWithBalance }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET deposit requests
    if (action === 'deposits' && req.method === 'GET') {
      const status = url.searchParams.get('status') || 'pending'
      
      const { data: deposits, error } = await adminClient
        .from('deposit_requests')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Deposits fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch deposits' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ deposits }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST approve/deny deposit
    if (action === 'review-deposit' && req.method === 'POST') {
      const { depositId, approved, note, amount } = body

      const { data: deposit, error: fetchError } = await adminClient
        .from('deposit_requests')
        .select('*')
        .eq('id', depositId)
        .single()

      if (fetchError || !deposit) {
        return new Response(JSON.stringify({ error: 'Deposit not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      if (deposit.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Deposit already reviewed' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const finalAmount = amount || deposit.amount
      const newStatus = approved ? 'approved' : 'denied'

      // Update deposit
      await adminClient
        .from('deposit_requests')
        .update({
          status: newStatus,
          amount: finalAmount,
          admin_note: note,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', depositId)

      // Credit wallet if approved
      if (approved && finalAmount > 0) {
        const refId = `deposit_${depositId}`
        await adminClient
          .from('ledger_entries')
          .insert({
            user_id: deposit.user_id,
            type: 'DEPOSIT',
            amount: finalAmount,
            ref_id: refId,
            description: `Deposit approved: ${deposit.method}`
          })
      }

      await logAction('deposit', depositId, approved ? 'DEPOSIT_APPROVED' : 'DEPOSIT_DENIED', {
        amount: finalAmount,
        method: deposit.method,
        note
      })

      console.log(`Deposit ${depositId} ${newStatus} by admin ${userId}`)

      return new Response(JSON.stringify({ success: true, status: newStatus }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET withdrawal requests
    if (action === 'withdrawals' && req.method === 'GET') {
      const status = url.searchParams.get('status') || 'pending'
      
      const { data: withdrawals, error } = await adminClient
        .from('withdrawal_requests')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Withdrawals fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch withdrawals' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ withdrawals }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST approve/deny withdrawal
    if (action === 'review-withdrawal' && req.method === 'POST') {
      const { withdrawalId, approved, note } = body

      const { data: withdrawal, error: fetchError } = await adminClient
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawalId)
        .single()

      if (fetchError || !withdrawal) {
        return new Response(JSON.stringify({ error: 'Withdrawal not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      if (withdrawal.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Withdrawal already reviewed' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const newStatus = approved ? 'approved' : 'denied'

      if (approved) {
        // Check user has sufficient balance
        const { data: balance } = await adminClient.rpc('get_user_balance', { _user_id: withdrawal.user_id })
        if ((balance || 0) < withdrawal.amount) {
          return new Response(JSON.stringify({ error: 'User has insufficient balance' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        // Debit wallet
        const refId = `withdrawal_${withdrawalId}`
        await adminClient
          .from('ledger_entries')
          .insert({
            user_id: withdrawal.user_id,
            type: 'WITHDRAWAL',
            amount: -withdrawal.amount,
            ref_id: refId,
            description: `Withdrawal approved: ${withdrawal.method}`
          })
      }

      // Update withdrawal
      await adminClient
        .from('withdrawal_requests')
        .update({
          status: newStatus,
          admin_note: note,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)

      await logAction('withdrawal', withdrawalId, approved ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_DENIED', {
        amount: withdrawal.amount,
        method: withdrawal.method,
        destination: withdrawal.destination,
        note
      })

      console.log(`Withdrawal ${withdrawalId} ${newStatus} by admin ${userId}`)

      return new Response(JSON.stringify({ success: true, status: newStatus }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET house edge settings
    if (action === 'house-edge' && req.method === 'GET') {
      const { data: settings, error } = await adminClient
        .from('house_edge_settings')
        .select('*')
        .order('effective_from', { ascending: false })

      if (error) {
        console.error('House edge fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Get current effective settings
      const current: Record<string, number> = {}
      for (const key of ['GLOBAL', 'COINFLIP', 'MINES']) {
        const { data } = await adminClient.rpc('get_house_edge', { _game_key: key })
        current[key] = data || 0.015
      }

      return new Response(JSON.stringify({ settings, current }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST update house edge
    if (action === 'house-edge' && req.method === 'POST') {
      const { gameKey, edgePercent, effectiveFrom } = body

      if (!['GLOBAL', 'COINFLIP', 'MINES'].includes(gameKey)) {
        return new Response(JSON.stringify({ error: 'Invalid game key' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      if (edgePercent < 0 || edgePercent > 0.5) {
        return new Response(JSON.stringify({ error: 'Edge must be 0-50%' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const { data: setting, error } = await adminClient
        .from('house_edge_settings')
        .insert({
          game_key: gameKey,
          edge_percent: edgePercent,
          effective_from: effectiveFrom || new Date().toISOString(),
          created_by_admin_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('House edge update error:', error)
        return new Response(JSON.stringify({ error: 'Failed to update setting' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      await logAction('house_edge', setting.id, 'HOUSE_EDGE_UPDATED', {
        gameKey,
        edgePercent,
        effectiveFrom
      })

      console.log(`House edge updated: ${gameKey} = ${edgePercent * 100}%`)

      return new Response(JSON.stringify({ success: true, setting }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // GET audit logs
    if (action === 'audit-logs' && req.method === 'GET') {
      const { data: logs, error } = await adminClient
        .from('audit_logs')
        .select(`
          *,
          profiles:admin_id (username)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('Audit logs fetch error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      return new Response(JSON.stringify({ logs }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST promote user to admin
    if (action === 'promote-admin' && req.method === 'POST') {
      const { targetUserId } = body

      // Check if already admin
      const { data: existing } = await adminClient
        .from('user_roles')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('role', 'admin')
        .single()

      if (existing) {
        return new Response(JSON.stringify({ error: 'User is already admin' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      await adminClient
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role: 'admin'
        })

      await logAction('user', targetUserId, 'USER_PROMOTED_ADMIN', {})

      console.log(`User ${targetUserId} promoted to admin by ${userId}`)

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST create user (admin only)
    if (action === 'create-user' && req.method === 'POST') {
      const { email, password, username, accountType } = body

      if (!email || !password || !username) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const validAccountTypes = ['standard', 'promotional', 'vip']
      const finalAccountType = validAccountTypes.includes(accountType) ? accountType : 'standard'

      // Create user using admin API
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

      // Create profile with account type
      await adminClient
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          username,
          account_type: finalAccountType
        })

      // Give user role
      await adminClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'user'
        })

      // Initialize provably fair seeds
      const serverSeed = crypto.randomUUID() + crypto.randomUUID()
      const encoder = new TextEncoder()
      const data = encoder.encode(serverSeed)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const serverSeedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      await adminClient
        .from('provably_fair_seeds')
        .insert({
          user_id: newUser.user.id,
          server_seed: serverSeed,
          server_seed_hash: serverSeedHash,
          client_seed: 'default_client_seed',
          nonce: 0
        })

      // For promotional accounts, give them starting balance
      if (finalAccountType === 'promotional') {
        await adminClient
          .from('ledger_entries')
          .insert({
            user_id: newUser.user.id,
            type: 'DEPOSIT',
            amount: 1000,
            ref_id: `promo_initial_${newUser.user.id}`,
            description: 'Promotional account initial balance'
          })
      }

      await logAction('user', newUser.user.id, 'USER_CREATED', {
        email,
        username,
        accountType: finalAccountType
      })

      console.log(`User created by admin: ${email} (${finalAccountType})`)

      return new Response(JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email, 
          username, 
          accountType: finalAccountType 
        } 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // POST update user account type
    if (action === 'update-account-type' && req.method === 'POST') {
      const { targetUserId, accountType } = body

      const validAccountTypes = ['standard', 'promotional', 'vip']
      if (!validAccountTypes.includes(accountType)) {
        return new Response(JSON.stringify({ error: 'Invalid account type' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      await adminClient
        .from('profiles')
        .update({ account_type: accountType })
        .eq('user_id', targetUserId)

      await logAction('user', targetUserId, 'ACCOUNT_TYPE_CHANGED', { accountType })

      return new Response(JSON.stringify({ success: true }), { 
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
