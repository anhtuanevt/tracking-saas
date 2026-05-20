import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

export const revalidate = 0

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const { data: conversions } = await supabase
    .from('conversions')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Click Events</h1>
        <Badge variant="secondary" className="animate-pulse">Live</Badge>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Platform</th>
              <th className="text-left px-4 py-2.5">Transaction ID</th>
              <th className="text-right px-4 py-2.5">Amount</th>
              <th className="text-center px-4 py-2.5">FB</th>
              <th className="text-right px-4 py-2.5">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(conversions ?? []).length === 0 && (
              <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">Chưa có conversion nào</td></tr>
            )}
            {(conversions ?? []).map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="capitalize text-xs">{c.platform}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{c.transaction_id || '—'}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {c.amount > 0 ? `$${Number(c.amount).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {c.fb_sent
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                    : <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
