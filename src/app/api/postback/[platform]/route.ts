import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SYSTEM_PLATFORMS, mapPayload } from '@/lib/tracking/platforms'
import { sendToFacebook } from '@/lib/tracking/facebook'

function getClientIP(req: NextRequest) {
  return req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0'
}

async function handle(req: NextRequest, platform: string, body: Record<string, unknown>) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Resolve workspace via workspace_id query param or header
  const workspaceId = String(body.workspace_id || req.nextUrl.searchParams.get('workspace_id') || '')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  // Verify webhook secret
  const secret = String(body.secret || req.nextUrl.searchParams.get('secret') || '')
  const { data: workspace } = await supabase
    .from('workspaces').select('webhook_secret').eq('id', workspaceId).single()
  if (!workspace || workspace.webhook_secret !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  // Resolve platform config
  const platformKey = platform.toLowerCase()
  let cfg = SYSTEM_PLATFORMS[platformKey]
  if (!cfg) {
    const { data: customPlatform } = await supabase
      .from('platforms')
      .select('*')
      .eq('workspace_id', workspaceId)
      .ilike('name', platform)
      .single()
    if (!customPlatform) {
      return NextResponse.json({ error: `Unknown platform: ${platform}`, supported: Object.keys(SYSTEM_PLATFORMS) }, { status: 400 })
    }
    cfg = {
      clickIdField: customPlatform.click_id_field,
      eventTypeField: customPlatform.event_type_field,
      amountField: customPlatform.amount_field,
      currencyField: customPlatform.currency_field,
      transactionIdField: customPlatform.transaction_id_field,
      emailField: customPlatform.email_field,
    }
  }

  const mapped = mapPayload(cfg, body)

  // Dedup check
  if (mapped.transactionId) {
    const { data: existing } = await supabase.from('conversions')
      .select('id').eq('workspace_id', workspaceId)
      .eq('platform', platformKey).eq('transaction_id', mapped.transactionId).single()
    if (existing) return NextResponse.json({ success: true, duplicate: true })
  }

  // Find click by click_id (UUID stored in clicks.id)
  let clickData: Record<string, unknown> = {}
  let projectId: string | null = null
  if (mapped.clickId) {
    const { data: click } = await supabase.from('clicks').select('*').eq('id', mapped.clickId).single()
    if (click) { clickData = click; projectId = click.project_id }
  }

  // Get project FB credentials
  let fbResult = null
  let fbError: string | null = null
  if (projectId) {
    const { data: proj } = await supabase.from('projects')
      .select('fb_pixel_id, fb_access_token').eq('id', projectId).single()
    if (proj?.fb_pixel_id && proj?.fb_access_token) {
      try {
        fbResult = await sendToFacebook({
          pixelId: proj.fb_pixel_id, accessToken: proj.fb_access_token,
          eventName: 'Purchase', clickData, mapped,
          clientIP: getClientIP(req),
          userAgent: req.headers.get('user-agent') || String(clickData.user_agent || ''),
        })
      } catch (err: unknown) {
        fbError = String(err)
      }
    }
  }

  // Save conversion
  await supabase.from('conversions').insert({
    workspace_id: workspaceId,
    project_id: projectId,
    click_id: mapped.clickId || null,
    platform: platformKey,
    transaction_id: mapped.transactionId || null,
    amount: mapped.amount,
    currency: mapped.currency,
    fb_sent: !!fbResult,
    fb_result: fbResult,
    fb_error: fbError,
    raw_payload: body,
  })

  return NextResponse.json({
    success: true, platform: platformKey,
    transactionId: mapped.transactionId,
    amount: mapped.amount, currency: mapped.currency,
    fbSent: !!fbResult, fbError: fbError || undefined,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params
  const body = await req.json()
  return handle(req, platform, body)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params
  const body = Object.fromEntries(req.nextUrl.searchParams.entries())
  return handle(req, platform, body)
}
