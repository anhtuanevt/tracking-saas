import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('owner_id', user.id).single()

  // system platforms (workspace_id is null) + user's custom platforms
  const { data } = await supabase
    .from('platforms')
    .select('*')
    .or(`workspace_id.is.null,workspace_id.eq.${workspace?.id ?? ''}`)
    .order('is_system', { ascending: false })
    .order('name')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase.from('platforms').insert({
    workspace_id: workspace.id,
    name: body.name,
    click_id_field: body.click_id_field,
    event_type_field: body.event_type_field || 'event_type',
    amount_field: body.amount_field,
    currency_field: body.currency_field || 'currency',
    transaction_id_field: body.transaction_id_field || 'id',
    email_field: body.email_field || 'email',
    is_system: false,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('platforms').delete()
    .eq('id', id).eq('is_system', false)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
