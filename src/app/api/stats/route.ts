import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const hourAgo = new Date(Date.now() - 3_600_000)

  const [{ count: totalClicks }, { count: totalConv }, { data: revenueRows },
    { count: todayConv }, { count: hourConv }, { count: failedFB }] = await Promise.all([
    supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('conversions').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('conversions').select('amount').eq('workspace_id', workspace.id),
    supabase.from('conversions').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('created_at', todayStart.toISOString()),
    supabase.from('conversions').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).gte('created_at', hourAgo.toISOString()),
    supabase.from('conversions').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).not('fb_error', 'is', null),
  ])

  const totalRevenue = (revenueRows ?? []).reduce((s, r) => s + Number(r.amount), 0)

  return NextResponse.json({
    total_clicks: totalClicks ?? 0,
    total_conversions: totalConv ?? 0,
    total_revenue: totalRevenue,
    today_conversions: todayConv ?? 0,
    last_hour_conversions: hourConv ?? 0,
    failed_fb: failedFB ?? 0,
    conversion_rate: totalClicks ? ((totalConv! / totalClicks) * 100).toFixed(2) + '%' : 'N/A',
  })
}
