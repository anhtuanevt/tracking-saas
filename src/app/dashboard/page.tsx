import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan, webhook_secret')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) {
    const { data: created } = await supabase
      .from('workspaces')
      .insert({ name: 'My Workspace', slug: user.id.slice(0, 8), owner_id: user.id })
      .select('id, name, slug, plan, webhook_secret')
      .single()
    if (!created) redirect('/login')
    return (
      <DashboardClient
        workspace={created}
        userEmail={user.email ?? ''}
        conversions={[]}
        clicks={[]}
        projects={[]}
        platforms={[]}
      />
    )
  }

  const [
    { data: conversions },
    { data: clicks },
    { data: projects },
    { data: platforms },
  ] = await Promise.all([
    supabase.from('conversions').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(200),
    supabase.from('clicks').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(200),
    supabase.from('projects').select('*').eq('workspace_id', workspace.id).order('created_at'),
    supabase.from('platforms').select('*').or(`workspace_id.is.null,workspace_id.eq.${workspace.id}`).order('is_system', { ascending: false }).order('name'),
  ])

  return (
    <DashboardClient
      workspace={workspace}
      userEmail={user.email ?? ''}
      conversions={conversions ?? []}
      clicks={clicks ?? []}
      projects={projects ?? []}
      platforms={platforms ?? []}
    />
  )
}
