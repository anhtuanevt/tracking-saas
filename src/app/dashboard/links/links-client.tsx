'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Link2, Copy, Trash2, MousePointerClick } from 'lucide-react'
import { toast } from 'sonner'
import crypto from 'crypto'

interface Link {
  id: string; name: string | null; destination_url: string; short_code: string
  clicks_count: number; created_at: string; campaigns: { name: string } | null
}
interface Campaign { id: string; name: string }

export function LinksClient({ workspaceId, links: init, campaigns }: {
  workspaceId: string; links: Link[]; campaigns: Campaign[]
}) {
  const [links, setLinks] = useState(init)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [saving, setSaving] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function create() {
    if (!url.trim()) return
    setSaving(true)
    const supabase = createClient()
    const shortCode = crypto.randomBytes(4).toString('hex')
    const { data, error } = await supabase.from('tracking_links').insert({
      workspace_id: workspaceId,
      campaign_id: campaignId || null,
      name: name.trim() || null,
      destination_url: url.trim(),
      short_code: shortCode,
    }).select('*, campaigns(name)').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setLinks(prev => [data, ...prev])
    setOpen(false); setName(''); setUrl(''); setCampaignId('')
    toast.success('Link created')
  }

  async function remove(id: string) {
    const supabase = createClient()
    await supabase.from('tracking_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
    toast.success('Link deleted')
  }

  function copy(code: string) {
    navigator.clipboard.writeText(`${baseUrl}/t/${code}`)
    toast.success('Đã copy link')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tracking Links</h1>
          <p className="text-muted-foreground text-sm">Short links với click tracking tự động</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-2" />New link
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo tracking link</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Tên (tuỳ chọn)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Campaign Link" />
              </div>
              <div className="space-y-1">
                <Label>Destination URL *</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://affiliate.com/ref/xyz" />
              </div>
              <div className="space-y-1">
                <Label>Campaign (tuỳ chọn)</Label>
                <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Chọn campaign..." /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={create} disabled={saving || !url}>
                {saving ? 'Đang tạo...' : 'Tạo link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Link2 className="h-10 w-10 opacity-30" />
          <p>Chưa có tracking link nào.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Tên / Link</th>
                <th className="text-left px-4 py-2.5">Campaign</th>
                <th className="text-right px-4 py-2.5">Clicks</th>
                <th className="text-right px-4 py-2.5">Ngày tạo</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map(l => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.name || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{baseUrl}/t/{l.short_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    {l.campaigns ? <Badge variant="outline" className="text-xs">{l.campaigns.name}</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />{l.clicks_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(l.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copy(l.short_code)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => remove(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
