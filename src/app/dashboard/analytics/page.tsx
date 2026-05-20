import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const from = new Date(); from.setDate(from.getDate() - 29)

  const [{ data: convRows }, { data: clickRows }] = await Promise.all([
    supabase.from('conversions').select('amount, platform, created_at').eq('workspace_id', workspace.id).gte('created_at', from.toISOString()),
    supabase.from('clicks').select('created_at').eq('workspace_id', workspace.id).gte('created_at', from.toISOString()),
  ])

  return <AnalyticsClient conversions={convRows ?? []} clicks={clickRows ?? []} />
}
