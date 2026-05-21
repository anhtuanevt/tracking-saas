export async function sendToKlaviyo({
  apiKey, email, firstName, lastName, mapped, clickData,
}: {
  apiKey: string
  email: string | undefined
  firstName?: string
  lastName?: string
  mapped: Record<string, unknown>
  clickData: Record<string, unknown>
}) {
  if (!apiKey || !email) return null

  const body = {
    data: {
      type: 'event',
      attributes: {
        metric: { data: { type: 'metric', attributes: { name: 'Placed Order' } } },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email,
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
            },
          },
        },
        properties: {
          OrderId: mapped.transactionId,
          Value: mapped.amount,
          Currency: mapped.currency,
          Platform: mapped.platform,
          BrandName: clickData.brand_name,
          ClickId: clickData.id,
        },
        value: Number(mapped.amount) || 0,
        time: new Date().toISOString(),
      },
    },
  }

  const res = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'revision': '2023-12-15',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok && res.status !== 202) {
    const err = await res.text()
    throw new Error(err)
  }
  return { sent: true, status: res.status }
}
