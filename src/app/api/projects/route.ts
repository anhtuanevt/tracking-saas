import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 403 })

  const body = await req.json()
  const rawIds = body.content_ids as string | undefined
  const contentIds = rawIds ? rawIds.split(',').map((s: string) => s.trim()).filter(Boolean) : null

  const { data, error } = await supabase.from('projects').insert({
    workspace_id: workspace.id,
    name: body.name,
    fb_pixel_id: body.fb_pixel_id || null,
    fb_access_token: body.fb_access_token || null,
    content_ids: contentIds,
    content_category: body.content_category || null,
    klaviyo_api_key: body.klaviyo_api_key || null,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
