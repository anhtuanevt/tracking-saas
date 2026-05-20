'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface DayData { date: string; revenue: number; conversions: number }

export function RevenueChart({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const from = new Date(); from.setDate(from.getDate() - 29)
      const { data: rows } = await supabase
        .from('conversions')
        .select('amount, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', from.toISOString())

      const map: Record<string, DayData> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        map[key] = { date: key.slice(5), revenue: 0, conversions: 0 }
      }
      for (const r of rows ?? []) {
        const key = r.created_at.slice(0, 10)
        if (map[key]) { map[key].revenue += Number(r.amount); map[key].conversions++ }
      }
      setData(Object.values(map))
    }
    load()
  }, [workspaceId])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Performance overview</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue trend — last 30 days</p>
        </div>
        <span className="text-xs text-muted-foreground border rounded px-2 py-0.5">Last 30 days</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
