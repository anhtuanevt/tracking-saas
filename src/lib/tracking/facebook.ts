import crypto from 'crypto'

function sha256(v: string | undefined) {
  if (!v) return undefined
  return crypto.createHash('sha256').update(String(v).toLowerCase().trim()).digest('hex')
}

export async function sendToFacebook({
  pixelId, accessToken, eventName, clickData, mapped, clientIP, userAgent,
}: {
  pixelId: string; accessToken: string; eventName: string
  clickData: Record<string, unknown>; mapped: Record<string, unknown>
  clientIP: string; userAgent: string
}) {
  if (!pixelId || !accessToken) return null

  const eventTime = Math.floor(Date.now() / 1000)
  const userData: Record<string, unknown> = {
    client_ip_address: clientIP,
    client_user_agent: userAgent,
    fbc: clickData.fbc,
    fbp: clickData.fbp,
    em: sha256(String(mapped.email || clickData.email || '')),
  }
  Object.keys(userData).forEach(k => userData[k] === undefined && delete userData[k])

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime,
    event_id: `${mapped.transactionId || crypto.randomUUID()}_${eventTime}`,
    action_source: 'website',
    user_data: userData,
  }

  if (eventName === 'Purchase' || eventName === 'AddToCart') {
    if (clickData.referrer) event.event_source_url = clickData.referrer
    event.custom_data = {
      content_name: clickData.brand_name || mapped.platform,
      content_type: 'product',
      num_items: 1,
      ...(eventName === 'Purchase' && {
        value: mapped.amount,
        currency: mapped.currency,
        order_id: mapped.transactionId,
      }),
    }
  }

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${pixelId}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event], access_token: accessToken }),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}
