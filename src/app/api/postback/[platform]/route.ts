import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SYSTEM_PLATFORMS, mapPayload } from '@/lib/tracking/platforms'
import { sendToFacebook } from '@/lib/tracking/facebook'
import { sendToKlaviyo } from '@/lib/tracking/klaviyo'

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

  // Get project credentials and fire FB CAPI + Klaviyo in parallel
  let fbResult = null
  let fbError: string | null = null
  let klaviyoResult = null
  let klaviyoError: string | null = null
  if (projectId) {
    const { data: proj } = await supabase.from('projects')
      .select('fb_pixel_id, fb_access_token, content_ids, content_category, klaviyo_api_key')
      .eq('id', projectId).single()

    const email = String(mapped.email || clickData.email || '')

    await Promise.all([
      proj?.fb_pixel_id && proj?.fb_access_token
        ? sendToFacebook({
            pixelId: proj.fb_pixel_id, accessToken: proj.fb_access_token,
            eventName: 'Purchase', clickData, mapped,
            clientIP: getClientIP(req),
            userAgent: req.headers.get('user-agent') || String(clickData.user_agent || ''),
            contentIds: proj.content_ids ?? undefined,
            contentCategory: proj.content_category ?? undefined,
          }).then(r => { fbResult = r }).catch(e => { fbError = String(e) })
        : Promise.resolve(),

      proj?.klaviyo_api_key && email
        ? sendToKlaviyo({
            apiKey: proj.klaviyo_api_key, email,
            firstName: String(clickData.first_name || ''),
            lastName: String(clickData.last_name || ''),
            mapped, clickData,
          }).then(r => { klaviyoResult = r }).catch(e => { klaviyoError = String(e) })
        : Promise.resolve(),
    ])
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
    klaviyo_sent: !!klaviyoResult,
    klaviyo_error: klaviyoError,
    raw_payload: body,
  })

  return NextResponse.json({
    success: true, platform: platformKey,
    transactionId: mapped.transactionId,
    amount: mapped.amount, currency: mapped.currency,
    fbSent: !!fbResult, fbError: fbError || undefined,
    klaviyoSent: !!klaviyoResult, klaviyoError: klaviyoError || undefined,
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
