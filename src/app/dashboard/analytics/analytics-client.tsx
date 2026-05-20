'use client'

import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface ConvRow { amount: string | number; platform: string; created_at: string }
interface ClickRow { created_at: string }

export function AnalyticsClient({ conversions, clicks }: { conversions: ConvRow[]; clicks: ClickRow[] }) {
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; conversions: number; clicks: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map[key] = { date: key.slice(5), revenue: 0, conversions: 0, clicks: 0 }
    }
    for (const r of conversions) {
      const key = r.created_at.slice(0, 10)
      if (map[key]) { map[key].revenue += Number(r.amount); map[key].conversions++ }
    }
    for (const r of clicks) {
      const key = r.created_at.slice(0, 10)
      if (map[key]) map[key].clicks++
    }
    return Object.values(map)
  }, [conversions, clicks])

  const byPlatform = useMemo(() => {
    const map: Record<string, { name: string; value: number; revenue: number }> = {}
    for (const r of conversions) {
      if (!map[r.platform]) map[r.platform] = { name: r.platform, value: 0, revenue: 0 }
      map[r.platform].value++
      map[r.platform].revenue += Number(r.amount)
    }
    return Object.values(map)
  }, [conversions])

  const totalRevenue = conversions.reduce((s, r) => s + Number(r.amount), 0)
  const convRate = clicks.length > 0 ? ((conversions.length / clicks.length) * 100).toFixed(1) : '0'

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
          { label: 'Conversions', value: conversions.length },
          { label: 'Conv. Rate', value: `${convRate}%` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue (30 ngày)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Clicks vs Conversions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="clicks" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[2, 2, 0, 0]} />
                <Bar dataKey="conversions" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {byPlatform.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Revenue theo platform</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byPlatform} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {byPlatform.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
