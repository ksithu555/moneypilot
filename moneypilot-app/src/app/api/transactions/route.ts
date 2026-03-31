import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('profile_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 })
  }

  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const categoryId = searchParams.get('categoryId')
  const accountId = searchParams.get('accountId')
  const type = searchParams.get('type')

  let query = supabase
    .from('transactions')
    .select('*, categories(*), accounts!inner(*)', { count: 'exact' })
    .eq('accounts.household_id', member.household_id)
    .order('txn_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (startDate) query = query.gte('txn_date', startDate)
  if (endDate) query = query.lte('txn_date', endDate)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (accountId) query = query.eq('account_id', accountId)
  if (type) query = query.eq('type', type)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select('*, categories(*), accounts(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
