export interface PlatformConfig {
  clickIdField: string
  eventTypeField: string
  amountField: string
  currencyField: string
  transactionIdField: string
  emailField: string
}

export const SYSTEM_PLATFORMS: Record<string, PlatformConfig> = {
  firstpromoter: {
    clickIdField: 'sub_id', eventTypeField: 'event_type', amountField: 'conversion_amount',
    currencyField: 'currency', transactionIdField: 'id', emailField: 'customer_email',
  },
  impact: {
    clickIdField: 'clickId', eventTypeField: 'eventName', amountField: 'amount',
    currencyField: 'currency', transactionIdField: 'transactionId', emailField: 'customerEmail',
  },
  partnerstack: {
    clickIdField: 'affiliateLink', eventTypeField: 'conversionType', amountField: 'revenue',
    currencyField: 'currency', transactionIdField: 'key', emailField: 'customerEmail',
  },
  awin: {
    clickIdField: 'transactionId', eventTypeField: 'eventType', amountField: 'saleAmount',
    currencyField: 'currency', transactionIdField: 'transactionId', emailField: 'customerEmail',
  },
  shareasale: {
    clickIdField: 'cookieId', eventTypeField: 'conversionType', amountField: 'commissionAmount',
    currencyField: 'currency', transactionIdField: 'transactionId', emailField: 'customerEmail',
  },
  tiktok: {
    clickIdField: 'ttclid', eventTypeField: 'event', amountField: 'value',
    currencyField: 'currency', transactionIdField: 'order_id', emailField: 'email',
  },
}

export function mapPayload(cfg: PlatformConfig, body: Record<string, unknown>) {
  return {
    clickId: String(body[cfg.clickIdField] ?? ''),
    eventType: String(body[cfg.eventTypeField] ?? 'Purchase'),
    amount: parseFloat(String(body[cfg.amountField] ?? '0')) || 0,
    currency: String(body[cfg.currencyField] ?? 'USD').toUpperCase(),
    transactionId: String(body[cfg.transactionIdField] ?? ''),
    email: String(body[cfg.emailField] ?? ''),
  }
}
