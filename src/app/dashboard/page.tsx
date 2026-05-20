import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/dashboard/overview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) redirect('/login')

  const [{ count: clicksCount }, { count: conversionsCount }, { data: revenueData }, { count: linksCount }, { count: campaignsCount }] = await Promise.all([
    supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('conversions').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('conversions').select('amount').eq('workspace_id', workspace.id),
    supabase.from('tracking_links').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
  ])

  const totalRevenue = (revenueData ?? []).reduce((s, r) => s + Number(r.amount), 0)

  return (
    <DashboardOverview
      workspace={workspace}
      stats={{
        clicks: clicksCount ?? 0,
        conversions: conversionsCount ?? 0,
        revenue: totalRevenue,
        links: linksCount ?? 0,
        campaigns: campaignsCount ?? 0,
      }}
      userEmail={user.email ?? ''}
    />
  )
}
