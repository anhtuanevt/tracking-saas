'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Megaphone, Link2, MousePointerClick, RefreshCw, Plus } from 'lucide-react'
import { RevenueChart } from './revenue-chart'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  workspace: { id: string; name: string; slug: string; plan: string }
  stats: { clicks: number; conversions: number; revenue: number; links: number; campaigns: number }
  userEmail: string
}

export function DashboardOverview({ workspace, stats, userEmail }: Props) {
  const router = useRouter()

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor affiliate performance and workspace activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button size="sm" render={<Link href="/dashboard/links" />}>
            <Plus className="h-4 w-4 mr-2" />New link
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} icon={DollarSign} iconColor="text-green-500" />
        <StatCard title="Campaigns" value={stats.campaigns} icon={Megaphone} iconColor="text-blue-500" sub={`${stats.campaigns} in workspace`} />
        <StatCard title="Tracking Links" value={stats.links} icon={Link2} iconColor="text-purple-500" sub={`${stats.links} visible links`} />
        <StatCard title="Click Events" value={stats.clicks} icon={MousePointerClick} iconColor="text-orange-500" sub="Latest 100 events" live />
      </div>

      {/* Chart + Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart workspaceId={workspace.id} />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value={workspace.name} />
            <Row label="Slug" value={workspace.slug} mono />
            <Row label="Plan" value={<Badge variant="outline" className="capitalize">{workspace.plan}</Badge>} />
            <Row label="User" value={userEmail} />
            <Row label="Conversions" value={stats.conversions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, iconColor, sub, live }: {
  title: string; value: string | number; icon: React.ElementType
  iconColor: string; sub?: string; live?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          {live && <Badge variant="secondary" className="text-xs">Live</Badge>}
        </div>
        <div className={`p-2 rounded-lg w-fit mb-3 bg-muted`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  )
}
