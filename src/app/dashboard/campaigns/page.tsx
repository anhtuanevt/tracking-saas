import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignsClient } from './campaigns-client'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return <CampaignsClient workspaceId={workspace.id} campaigns={campaigns ?? []} />
}
