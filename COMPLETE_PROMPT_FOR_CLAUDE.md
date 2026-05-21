# Prompt gốc và context dự án

File này lưu lại context để tiếp tục làm việc với Claude Code trong các session sau.

---

## Tóm tắt dự án

Affiliate postback tracking system — 1 repo duy nhất:

**tracking-saas/** — Next.js SaaS
- Full-featured: auth, database, dashboard, analytics
- Stack: Next.js 16 + Supabase + shadcn/ui + Recharts
- Cần `.env.local` với 3 Supabase keys để chạy
- Deploy target: Vercel (free) + Supabase (free)
- GitHub: https://github.com/anhtuanevt/tracking-saas

---

## Files quan trọng

```
tracking-saas/
├── supabase/schema.sql           → Toàn bộ DB schema (chạy trong Supabase SQL Editor)
├── supabase/create_user.sql      → Tạo workspace thủ công sau khi tạo user
├── supabase/reset.sql            → Reset toàn bộ schema
├── .env.local.example            → Template env vars
├── public/
│   └── affiliate-click-tracking.js → Script nhúng vào landing page
├── src/
│   ├── proxy.ts                  → Auth logic (không phải middleware — auth xử lý ở layout/page)
│   ├── lib/supabase/             → Supabase client (browser + server)
│   ├── lib/tracking/
│   │   ├── platforms.ts          → SYSTEM_PLATFORMS config (6 platforms: FirstPromoter, Impact, PartnerStack, AWIN, ShareASale, TikTok)
│   │   └── facebook.ts           → sendToFacebook() — FB CAPI logic
│   ├── app/api/
│   │   ├── click/route.ts        → POST /api/click
│   │   ├── postback/[platform]/  → POST /api/postback/:platform
│   │   ├── platforms/route.ts    → GET/POST/DELETE /api/platforms
│   │   ├── projects/route.ts     → POST/DELETE /api/projects
│   │   ├── stats/route.ts        → GET /api/stats
│   │   └── logs/route.ts         → GET /api/logs
│   ├── app/t/[code]/route.ts     → Tracking link redirect
│   └── app/dashboard/
│       ├── page.tsx              → Server component, load data → DashboardClient
│       ├── dashboard-client.tsx  → Client UI (tabs: dashboard/logs/clicks/projects/platforms/settings)
│       ├── analytics/            → Analytics page (orphaned — sidebar đã bị xóa)
│       ├── campaigns/            → Campaigns page (orphaned)
│       ├── links/                → Tracking links page (orphaned)
│       ├── brands/               → Brands page (orphaned)
│       ├── events/               → Events feed (orphaned)
│       ├── settings/             → Settings page (orphaned)
│       └── support/              → Support page (orphaned)
```

> **Lưu ý:** Các sub-pages (analytics, campaigns, links...) vẫn còn code nhưng sidebar đã bị xóa khỏi `dashboard/layout.tsx` nên không navigate được từ UI. Main dashboard hiện dùng DashboardClient (single-page với tabs).

---

## Để tiếp tục build

Những việc chưa làm (P3):

```
□ Khôi phục sidebar hoặc thêm navigation links vào DashboardClient
□ Billing / Subscription (Stripe)
□ Email notifications (conversion alert)
□ Team members (invite to workspace)
□ Custom domain cho tracking links
□ Webhook outbound (notify khi có conversion)
□ API key management (thay vì workspace_id ở query param)
```

---

## Commands hay dùng

```bash
# Chạy Next.js SaaS
cd /Users/bruce/Desktop/eventhandle/tracking-saas && npm run dev

# Build check
npm run build

# Push code
git add -A && git commit -m "feat: ..." && git push
```

---

## Postback test nhanh (SaaS)

```bash
curl -X POST http://localhost:3000/api/postback/firstpromoter?workspace_id=YOUR_WS_ID \
  -H "Content-Type: application/json" \
  -d '{"sub_id":"test-uuid","event_type":"new_customer","conversion_amount":99.99,"currency":"USD","id":"txn_001"}'
```
