import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const serviceSupabase = createServiceClient()

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

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${member.household_id}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await serviceSupabase.storage
    .from('receipts')
    .upload(fileName, file)

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: receipt, error: insertError } = await supabase
    .from('receipts')
    .insert({
      household_id: member.household_id,
      storage_path: fileName,
      uploaded_by: user.id,
      parse_status: 'pending',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data: receipt })
}

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

  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data, error, count } = await supabase
    .from('receipts')
    .select('*', { count: 'exact' })
    .eq('household_id', member.household_id)
    .order('uploaded_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count })
}
