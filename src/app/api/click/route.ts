import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendToFacebook } from '@/lib/tracking/facebook'

function getClientIP(req: NextRequest) {
  return req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') || '0.0.0.0'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // Resolve workspace from project key or API key header
    const projectId = body.project_id || null
    let workspaceId = body.workspace_id || null

    if (projectId && !workspaceId) {
      const { data: proj } = await supabase.from('projects').select('workspace_id').eq('id', projectId).single()
      workspaceId = proj?.workspace_id
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    }

    const clientIP = getClientIP(req)
    const { data: click } = await supabase.from('clicks').insert({
      workspace_id: workspaceId,
      project_id: projectId,
      client_ip: clientIP,
      user_agent: body.ua || req.headers.get('user-agent'),
      fbc: body.fbc,
      fbp: body.fbp,
      ttclid: body.ttclid,
      referrer: body.referrer || req.headers.get('referer'),
      brand_id: body.brand_id,
      brand_name: body.brand_name,
      email: body.email,
      phone: body.phone,
      first_name: body.firstName,
      last_name: body.lastName,
      city: body.city,
      country: body.country,
      zip: body.zip,
      aff_url: body.aff_url,
    }).select('id').single()

    if (!click) return NextResponse.json({ error: 'Failed to save click' }, { status: 500 })

    // Fire ViewContent to Facebook if configured
    if (projectId) {
      const { data: proj } = await supabase.from('projects')
        .select('fb_pixel_id, fb_access_token').eq('id', projectId).single()
      if (proj?.fb_pixel_id && proj?.fb_access_token) {
        sendToFacebook({
          pixelId: proj.fb_pixel_id, accessToken: proj.fb_access_token,
          eventName: 'ViewContent', clickData: body,
          mapped: { platform: body.brand_name || 'direct', transactionId: click.id },
          clientIP, userAgent: body.ua || req.headers.get('user-agent') || '',
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, click_id: click.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
