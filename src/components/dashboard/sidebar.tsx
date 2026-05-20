'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Megaphone, Building2, Link2, MousePointerClick,
  BarChart3, CreditCard, Settings, HelpCircle, LogOut, Zap
} from 'lucide-react'

const nav = [
  { label: 'PLATFORM', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
    { href: '/dashboard/brands', icon: Building2, label: 'Brands / Platforms' },
  ]},
  { label: 'TRACKING', items: [
    { href: '/dashboard/links', icon: Link2, label: 'Tracking Links' },
    { href: '/dashboard/events', icon: MousePointerClick, label: 'Click Events' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { label: 'ACCOUNT', items: [
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
  ]},
]

export function Sidebar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r bg-background px-3 py-4 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Tracking SaaS</span>
        <span className="ml-auto text-xs text-muted-foreground truncate">{workspaceName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5">
        {nav.map(section => (
          <div key={section.label}>
            <p className="px-2 mb-1 text-xs font-medium text-muted-foreground tracking-wider">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade + Logout */}
      <div className="space-y-2">
        <div className="rounded-lg border bg-accent/30 p-3 space-y-2">
          <p className="text-xs font-medium">Upgrade plan</p>
          <p className="text-xs text-muted-foreground">Mở khoá advanced attribution, CAPI delivery và quota cao hơn.</p>
          <Button size="sm" className="w-full text-xs">Upgrade now</Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  )
}
