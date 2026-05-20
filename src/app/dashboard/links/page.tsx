import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LinksClient } from './links-client'

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const [{ data: links }, { data: campaigns }] = await Promise.all([
    supabase.from('tracking_links').select('*, campaigns(name)').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
    supabase.from('campaigns').select('id, name').eq('workspace_id', workspace.id).eq('status', 'active'),
  ])

  return <LinksClient workspaceId={workspace.id} links={links ?? []} campaigns={campaigns ?? []} />
}
