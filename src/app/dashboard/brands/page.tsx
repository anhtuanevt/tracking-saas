import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SYSTEM_PLATFORMS } from '@/lib/tracking/platforms'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) redirect('/login')

  const { data: custom } = await supabase.from('platforms').select('*').eq('workspace_id', workspace.id)

  const systemPlatforms = Object.entries(SYSTEM_PLATFORMS).map(([key, cfg]) => ({
    id: key, name: key, is_system: true, ...cfg
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brands / Platforms</h1>
        <p className="text-muted-foreground text-sm">Affiliate platforms được hỗ trợ</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">System Platforms</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {systemPlatforms.map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm capitalize">{p.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">System</Badge>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <div>Click ID: <code className="text-foreground">{p.clickIdField}</code></div>
                <div>Amount: <code className="text-foreground">{p.amountField}</code></div>
                <div>Postback: <code className="text-foreground">POST /api/postback/{p.name.toLowerCase()}</code></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {(custom ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Custom Platforms</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(custom ?? []).map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm capitalize">{p.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">Custom</Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>Click ID: <code className="text-foreground">{p.click_id_field}</code></div>
                  <div>Amount: <code className="text-foreground">{p.amount_field}</code></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
