import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id, name, slug, plan').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const { data: projects } = await supabase.from('projects').select('*').eq('workspace_id', workspace.id).order('created_at')

  return <SettingsClient workspace={workspace} projects={projects ?? []} userEmail={user.email ?? ''} />
}
