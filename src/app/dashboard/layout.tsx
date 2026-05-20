import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, slug')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar workspaceName={workspace?.name ?? 'workspace'} />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
