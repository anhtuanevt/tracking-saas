'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    toast.success('Yêu cầu đã gửi! Chúng tôi sẽ phản hồi qua email trong 24h.')
    setSubject(''); setMessage('')
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground text-sm">Liên hệ hỗ trợ kỹ thuật</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Email</p>
              <p className="text-xs text-muted-foreground">support@trackingsaas.app</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Response time</p>
              <p className="text-xs text-muted-foreground">Thường trong 24 giờ làm việc</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" />Gửi yêu cầu hỗ trợ</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>Tiêu đề</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Mô tả ngắn vấn đề..." required />
            </div>
            <div className="space-y-1">
              <Label>Nội dung</Label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                required
                className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <Button type="submit" className="w-full">Gửi yêu cầu</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
