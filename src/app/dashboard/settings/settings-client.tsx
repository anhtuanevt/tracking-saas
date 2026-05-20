'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Project { id: string; name: string; fb_pixel_id: string | null; fb_access_token: string | null; webhook_secret: string | null }
interface Workspace { id: string; name: string; slug: string; plan: string }

export function SettingsClient({ workspace, projects: init, userEmail }: {
  workspace: Workspace; projects: Project[]; userEmail: string
}) {
  const [projects, setProjects] = useState(init)
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPixel, setNewPixel] = useState('')
  const [newToken, setNewToken] = useState('')
  const [saving, setSaving] = useState(false)

  async function createProject() {
    if (!newName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('projects').insert({
      workspace_id: workspace.id, name: newName, fb_pixel_id: newPixel || null, fb_access_token: newToken || null,
    }).select('*').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setProjects(prev => [...prev, data])
    setOpen(false); setNewName(''); setNewPixel(''); setNewToken('')
    toast.success('Project created')
  }

  async function deleteProject(id: string) {
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    toast.success('Project deleted')
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={workspace.name} />
          <Row label="Slug" value={<code className="font-mono text-xs">{workspace.slug}</code>} />
          <Row label="Plan" value={<Badge variant="outline" className="capitalize">{workspace.plan}</Badge>} />
          <Row label="Email" value={userEmail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">FB Pixel Projects</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My Store" /></div>
                <div className="space-y-1"><Label>FB Pixel ID</Label><Input value={newPixel} onChange={e => setNewPixel(e.target.value)} placeholder="1234567890" /></div>
                <div className="space-y-1"><Label>Access Token</Label><Input value={newToken} onChange={e => setNewToken(e.target.value)} placeholder="EAAB..." type="password" /></div>
                <Button className="w-full" onClick={createProject} disabled={saving || !newName}>{saving ? 'Đang tạo...' : 'Tạo'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 && <p className="text-sm text-muted-foreground">Chưa có project nào.</p>}
          {projects.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Pixel: {p.fb_pixel_id || '—'} · Token: {p.fb_access_token ? '***' : '—'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteProject(p.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Postback URL format</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs font-mono text-muted-foreground">
          <p>POST /api/postback/<span className="text-foreground">&#123;platform&#125;</span>?workspace_id=<span className="text-foreground">&#123;your-workspace-id&#125;</span></p>
          <Separator />
          <p className="text-foreground font-semibold">Workspace ID của bạn:</p>
          <code className="text-primary text-sm">{workspace.id}</code>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
