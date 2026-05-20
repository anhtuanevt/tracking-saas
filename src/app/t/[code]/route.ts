import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: link } = await supabase
    .from('tracking_links')
    .select('destination_url, workspace_id, id')
    .eq('short_code', code)
    .single()

  if (!link) return NextResponse.redirect(new URL('/', req.url))

  // Increment click count
  supabase.from('tracking_links').update({ clicks_count: supabase.rpc('increment' as never) })
    .eq('id', link.id).then(() => {})

  // Log click
  supabase.from('clicks').insert({
    workspace_id: link.workspace_id,
    tracking_link_id: link.id,
    client_ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0',
    user_agent: req.headers.get('user-agent'),
    referrer: req.headers.get('referer'),
  }).then(() => {})

  return NextResponse.redirect(link.destination_url)
}
