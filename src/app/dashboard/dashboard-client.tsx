'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Conversion {
  id: string; platform: string; transaction_id: string | null
  amount: number; currency: string; fb_sent: boolean; fb_error: string | null
  click_id: string | null; created_at: string; raw_payload: Record<string, unknown> | null
}
interface Click {
  id: string; client_ip: string | null; user_agent: string | null
  fbc: string | null; fbp: string | null; brand_name: string | null
  referrer: string | null; created_at: string
}
interface Project {
  id: string; name: string; fb_pixel_id: string | null
  fb_access_token: string | null; webhook_secret: string | null
}
interface Platform {
  id: string; name: string; is_system: boolean
  click_id_field: string; event_type_field: string
  amount_field: string; currency_field: string
  transaction_id_field: string; email_field: string
  workspace_id: string | null
}
interface Workspace { id: string; name: string; slug: string; plan: string; webhook_secret: string }

type Tab = 'dashboard' | 'logs' | 'clicks' | 'projects' | 'platforms' | 'settings'

export function DashboardClient({ workspace, userEmail, conversions, clicks, projects: initProjects, platforms: initPlatforms }: {
  workspace: Workspace
  userEmail: string
  conversions: Conversion[]
  clicks: Click[]
  projects: Project[]
  platforms: Platform[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [projects, setProjects] = useState(initProjects)
  const [platforms, setPlatforms] = useState(initPlatforms)

  // Stats
  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const hourAgo = now - 3_600_000
  const totalRevenue = conversions.reduce((s, c) => s + Number(c.amount), 0)
  const todayConv = conversions.filter(c => new Date(c.created_at).getTime() >= todayStart).length
  const hourConv = conversions.filter(c => new Date(c.created_at).getTime() >= hourAgo).length
  const failedFB = conversions.filter(c => c.fb_error).length
  const successFB = conversions.filter(c => c.fb_sent).length
  const convRate = clicks.length > 0 ? ((conversions.length / clicks.length) * 100).toFixed(1) + '%' : 'N/A'

  // Chart data — last 14 days
  const chartData = (() => {
    const map: Record<string, { date: string; revenue: number; conversions: number }> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map[key] = { date: key.slice(5), revenue: 0, conversions: 0 }
    }
    for (const c of conversions) {
      const key = c.created_at.slice(0, 10)
      if (map[key]) { map[key].revenue += Number(c.amount); map[key].conversions++ }
    }
    return Object.values(map)
  })()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Project form state
  const [projName, setProjName] = useState('')
  const [projPixel, setProjPixel] = useState('')
  const [projToken, setProjToken] = useState('')
  const [projSaving, setProjSaving] = useState(false)
  const [projMsg, setProjMsg] = useState('')

  // Platform form state
  const emptyPlat = { name: '', click_id_field: '', event_type_field: 'event_type', amount_field: '', currency_field: 'currency', transaction_id_field: 'id', email_field: 'email' }
  const [platForm, setPlatForm] = useState(emptyPlat)
  const [platSaving, setPlatSaving] = useState(false)
  const [platMsg, setPlatMsg] = useState('')

  async function savePlatform(e: React.FormEvent) {
    e.preventDefault()
    setPlatSaving(true); setPlatMsg('')
    const res = await fetch('/api/platforms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(platForm),
    })
    const data = await res.json()
    setPlatSaving(false)
    if (!res.ok) { setPlatMsg('Lỗi: ' + data.error); return }
    setPlatforms(prev => [...prev, data])
    setPlatForm(emptyPlat)
    setPlatMsg('Đã thêm platform!')
  }

  async function deletePlatform(id: string) {
    await fetch('/api/platforms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPlatforms(prev => prev.filter(p => p.id !== id))
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault()
    setProjSaving(true)
    setProjMsg('')
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projName, fb_pixel_id: projPixel, fb_access_token: projToken }),
    })
    const data = await res.json()
    setProjSaving(false)
    if (!res.ok) { setProjMsg('Lỗi: ' + data.error); return }
    setProjects(prev => [...prev, data])
    setProjName(''); setProjPixel(''); setProjToken('')
    setProjMsg('Đã lưu project!')
  }

  async function deleteProject(id: string) {
    await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 text-sm">
      {/* Header */}
      <header className="border-b border-gray-800 px-5 py-2.5 flex items-center gap-3">
        <span className="text-base">📡</span>
        <span className="font-semibold text-white">Affiliate Postback</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-500 text-sm">{userEmail}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm px-2.5 py-1 rounded border border-gray-700 hover:border-gray-500 transition">Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-800 px-5 flex gap-5">
        {(['dashboard', 'logs', 'clicks', 'projects', 'platforms', 'settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2.5 text-sm font-medium transition capitalize ${tab === t ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </nav>

      <main className="p-5 max-w-6xl mx-auto space-y-4">

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Clicks', value: clicks.length, color: 'text-white' },
                { label: 'Conversions', value: conversions.length, color: 'text-indigo-400' },
                { label: 'Revenue', value: '$' + totalRevenue.toFixed(2), color: 'text-green-400' },
                { label: 'Conv. Rate', value: convRate, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-gray-500 text-sm mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-3">Revenue — Last 14 days</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6 }} labelStyle={{ color: '#9ca3af' }} formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Today', value: todayConv },
                { label: 'Last Hour', value: hourConv },
                { label: 'FB Sent', value: successFB },
                { label: 'Failed FB', value: failedFB, warn: failedFB > 0 },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <div className="text-gray-500 text-sm mb-1">{s.label}</div>
                  <div className={`text-xl font-bold ${s.warn ? 'text-red-400' : 'text-white'}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* By platform */}
            {conversions.length > 0 && (() => {
              const byPlatform: Record<string, { count: number; revenue: number }> = {}
              for (const c of conversions) {
                if (!byPlatform[c.platform]) byPlatform[c.platform] = { count: 0, revenue: 0 }
                byPlatform[c.platform].count++
                byPlatform[c.platform].revenue += Number(c.amount)
              }
              return (
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-800 text-gray-400 text-sm">By Platform</div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-gray-500">
                      <th className="text-left px-4 py-2">Platform</th>
                      <th className="text-right px-4 py-2">Conversions</th>
                      <th className="text-right px-4 py-2">Revenue</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-800">
                      {Object.entries(byPlatform).map(([p, d]) => (
                        <tr key={p} className="hover:bg-gray-800/50">
                          <td className="px-4 py-2 capitalize">{p}</td>
                          <td className="px-4 py-2 text-right text-indigo-400">{d.count}</td>
                          <td className="px-4 py-2 text-right text-green-400">${d.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}

            {/* Postback URL */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-1">
              <div className="text-gray-500 text-sm mb-2">Postback URL</div>
              {platforms.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm w-28">{p.name}</span>
                  <code className="text-indigo-300 text-sm break-all">
                    POST /api/postback/{p.name.toLowerCase()}?workspace_id={workspace.id}&secret={workspace.webhook_secret}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Logs (conversions) ── */}
        {tab === 'logs' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Conversions ({conversions.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-4 py-2">Platform</th>
                  <th className="text-left px-4 py-2">Transaction ID</th>
                  <th className="text-right px-4 py-2">Amount</th>
                  <th className="text-center px-4 py-2">FB</th>
                  <th className="text-right px-4 py-2">Time</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-800/50">
                  {conversions.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-600">Chưa có conversion nào</td></tr>
                  )}
                  {conversions.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded text-sm bg-indigo-900/40 text-indigo-300 capitalize">{c.platform}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-400 font-mono">{c.transaction_id || '—'}</td>
                      <td className="px-4 py-2 text-right text-green-400">{c.amount > 0 ? `$${Number(c.amount).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2 text-center">{c.fb_sent ? '✅' : c.fb_error ? '❌' : '—'}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{new Date(c.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Clicks ── */}
        {tab === 'clicks' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Clicks ({clicks.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-4 py-2">Click ID</th>
                  <th className="text-left px-4 py-2">Brand</th>
                  <th className="text-left px-4 py-2">IP</th>
                  <th className="text-left px-4 py-2">fbc</th>
                  <th className="text-right px-4 py-2">Time</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-800/50">
                  {clicks.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-600">Chưa có click nào</td></tr>
                  )}
                  {clicks.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-2 text-gray-400 font-mono text-sm">{c.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-gray-300">{c.brand_name || '—'}</td>
                      <td className="px-4 py-2 text-gray-400">{c.client_ip || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{c.fbc ? c.fbc.slice(0, 20) + '...' : '—'}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{new Date(c.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Projects ── */}
        {tab === 'projects' && (
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.id} className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-gray-500 text-sm">Pixel: {p.fb_pixel_id || '—'}</div>
                  <div className="text-gray-500 text-sm">Token: {p.fb_access_token ? '***configured***' : '—'}</div>
                  <div className="text-gray-600 text-sm mt-2">ID: {p.id}</div>
                </div>
                <button onClick={() => deleteProject(p.id)} className="text-red-500 hover:text-red-400 text-sm border border-red-900 hover:border-red-700 px-2 py-1 rounded transition">Delete</button>
              </div>
            ))}

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-3">New Project</div>
              <form onSubmit={saveProject} className="space-y-3">
                {[
                  { label: 'Name', val: projName, set: setProjName, ph: 'My Store', req: true },
                  { label: 'FB Pixel ID', val: projPixel, set: setProjPixel, ph: '1234567890' },
                  { label: 'Access Token', val: projToken, set: setProjToken, ph: 'EAAB...', type: 'password' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <label className="text-gray-500 text-sm w-24 shrink-0">{f.label}</label>
                    <input
                      type={(f as {type?: string}).type || 'text'}
                      value={f.val} onChange={e => f.set(e.target.value)}
                      placeholder={f.ph} required={f.req}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
                {projMsg && <p className={`text-sm ${projMsg.startsWith('Lỗi') ? 'text-red-400' : 'text-green-400'}`}>{projMsg}</p>}
                <button type="submit" disabled={projSaving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded transition">
                  {projSaving ? 'Saving...' : 'Save Project'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Platforms ── */}
        {tab === 'platforms' && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-4">Platform Postback Config</div>
              <div className="text-gray-500 text-sm mb-4">
                Postback URL format: <code className="text-indigo-300 font-mono text-sm">https://yourdomain.com/api/postback/{'{'}{'{'}platform{'}'}{'}'}?workspace_id={'{'}id{'}'}&secret={'{'}webhook_secret{'}'}</code>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-3 py-2 text-gray-400">Platform</th>
                    <th className="text-left px-3 py-2 text-gray-400">Click ID Field</th>
                    <th className="text-left px-3 py-2 text-gray-400">Amount Field</th>
                    <th className="text-left px-3 py-2 text-gray-400">Transaction ID</th>
                    <th className="text-left px-3 py-2 text-gray-400">Postback URL</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map(p => (
                    <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-sm bg-indigo-900/40 text-indigo-300">{p.name}</span>
                        {p.is_system && <span className="ml-2 text-gray-600 text-sm">system</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 font-mono text-sm">{p.click_id_field}</td>
                      <td className="px-3 py-2.5 text-gray-400 font-mono text-sm">{p.amount_field}</td>
                      <td className="px-3 py-2.5 text-gray-400 font-mono text-sm">{p.transaction_id_field}</td>
                      <td className="px-3 py-2.5">
                        <code className="text-indigo-300 font-mono text-sm break-all">
                          /api/postback/{p.name.toLowerCase()}?workspace_id={workspace.id}&secret={workspace.webhook_secret}
                        </code>
                      </td>
                      <td className="px-3 py-2.5">
                        {!p.is_system && (
                          <button onClick={() => deletePlatform(p.id)} className="text-red-500 hover:text-red-400 text-sm">×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add custom platform */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-3">Thêm Custom Platform</div>
              <form onSubmit={savePlatform} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Tên platform *', key: 'name', placeholder: 'vd: MyAffiliate' },
                    { label: 'Click ID field *', key: 'click_id_field', placeholder: 'vd: click_id' },
                    { label: 'Amount field *', key: 'amount_field', placeholder: 'vd: amount' },
                    { label: 'Event type field', key: 'event_type_field', placeholder: 'vd: event_type' },
                    { label: 'Currency field', key: 'currency_field', placeholder: 'vd: currency' },
                    { label: 'Transaction ID field', key: 'transaction_id_field', placeholder: 'vd: transaction_id' },
                    { label: 'Email field', key: 'email_field', placeholder: 'vd: email' },
                  ].map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-gray-500 text-sm">{f.label}</label>
                      <input
                        value={platForm[f.key as keyof typeof platForm]}
                        onChange={ev => setPlatForm(prev => ({ ...prev, [f.key]: ev.target.value }))}
                        placeholder={f.placeholder}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required={['name', 'click_id_field', 'amount_field'].includes(f.key)}
                      />
                    </div>
                  ))}
                </div>
                {platMsg && <p className={`text-sm ${platMsg.startsWith('Lỗi') ? 'text-red-400' : 'text-green-400'}`}>{platMsg}</p>}
                <button type="submit" disabled={platSaving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded transition">
                  {platSaving ? 'Saving...' : 'Add Platform'}
                </button>
              </form>
            </div>

            {/* Tracking script */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-3">Click Tracking Script</div>
              <p className="text-gray-500 text-sm mb-2">Nhúng đoạn script này vào landing page để track click:</p>
              <code className="block bg-gray-950 border border-gray-700 rounded p-3 text-indigo-300 font-mono text-sm break-all">
                {`<script src="https://yourdomain.com/affiliate-click-tracking.js?workspace_id=${workspace.id}"></script>`}
              </code>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <div className="text-gray-400 text-sm mb-2">Workspace Info</div>
            {[
              { label: 'Name', value: workspace.name },
              { label: 'Slug', value: workspace.slug },
              { label: 'Plan', value: workspace.plan },
              { label: 'User', value: userEmail },
              { label: 'Workspace ID', value: workspace.id },
              { label: 'Webhook Secret', value: workspace.webhook_secret },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 text-sm w-28 shrink-0">{r.label}</span>
                <span className="text-gray-200 text-sm font-mono break-all">{r.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition">
                Logout
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
