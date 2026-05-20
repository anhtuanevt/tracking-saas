import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100')
  const platform = req.nextUrl.searchParams.get('platform')
  const type = req.nextUrl.searchParams.get('type') // 'click' | 'conversion'

  if (type === 'click' || !type) {
    let q = supabase.from('clicks').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(limit)
    if (platform) q = q.eq('brand_name', platform)
    const { data } = await q
    if (type === 'click') return NextResponse.json({ logs: data ?? [] })
  }

  let q = supabase.from('conversions').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(limit)
  if (platform) q = q.eq('platform', platform)
  const { data } = await q

  return NextResponse.json({ logs: data ?? [] })
}
