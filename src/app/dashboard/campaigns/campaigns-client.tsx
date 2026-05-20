'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Megaphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Campaign { id: string; name: string; description: string | null; status: string; created_at: string }

export function CampaignsClient({ workspaceId, campaigns: init }: { workspaceId: string; campaigns: Campaign[] }) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(init)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  async function create() {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('campaigns').insert({
      workspace_id: workspaceId, name: name.trim(), description: desc.trim() || null,
    }).select('*').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setCampaigns(prev => [data, ...prev])
    setOpen(false); setName(''); setDesc('')
    toast.success('Campaign created')
  }

  async function remove(id: string) {
    const supabase = createClient()
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    toast.success('Campaign deleted')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-sm">Nhóm tracking links theo chiến dịch</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-2" />New campaign
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo campaign mới</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Tên campaign</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale 2025" />
              </div>
              <div className="space-y-1">
                <Label>Mô tả (tuỳ chọn)</Label>
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="..." />
              </div>
              <Button className="w-full" onClick={create} disabled={saving}>
                {saving ? 'Đang tạo...' : 'Tạo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Megaphone className="h-10 w-10 opacity-30" />
          <p>Chưa có campaign nào. Tạo campaign đầu tiên!</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{c.name}</CardTitle>
                  <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => remove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
