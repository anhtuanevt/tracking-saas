# Prompt gốc và context dự án

File này lưu lại context để tiếp tục làm việc với Claude Code trong các session sau.

---

## Tóm tắt dự án

Affiliate postback tracking system gồm 2 phần:

**tracking-saas/** — Next.js SaaS (dự án duy nhất)
- Full-featured: auth, database, dashboard, analytics
- Stack: Next.js 16 + Supabase + shadcn/ui + Recharts
- Cần `.env.local` với 3 Supabase keys để chạy
- Deploy target: Vercel (free) + Supabase (free)

---

## Files quan trọng

```
tracking-saas/
├── supabase/schema.sql           → Toàn bộ DB schema (chạy trong Supabase SQL Editor)
├── .env.local.example            → Template env vars
├── src/
│   ├── middleware.ts             → Auth protection (Next.js proxy)
│   ├── lib/supabase/             → Supabase client (browser + server)
│   ├── lib/tracking/
│   │   ├── platforms.ts          → PLATFORM_CONFIG cho 5 platforms
│   │   └── facebook.ts           → sendToFacebook() — FB CAPI logic
│   ├── app/api/
│   │   ├── click/route.ts        → POST /api/click
│   │   ├── postback/[platform]/  → POST /api/postback/:platform
│   │   ├── stats/route.ts        → GET /api/stats
│   │   └── logs/route.ts         → GET /api/logs
│   ├── app/t/[code]/route.ts     → Tracking link redirect
│   └── app/dashboard/            → Dashboard pages

affiliate-postback/
├── server.js                     → Express server (~620 lines, all-in-one)
└── public/
    ├── index.html                → Dashboard UI (Tailwind dark)
    └── affiliate-click-tracking.js → Frontend script nhúng vào landing page
```

---

## Để tiếp tục build

Những việc chưa làm (P3):

```
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
cd tracking-saas && npm run build

# Push code
git add -A && git commit -m "feat: ..." && git push
```

---

## Postback test nhanh (Express)

```bash
curl -X POST http://localhost:3000/postback/firstpromoter \
  -H "Content-Type: application/json" \
  -d '{"sub_id":"test-uuid","event_type":"new_customer","conversion_amount":99.99,"currency":"USD","id":"txn_001"}'
```

## Postback test nhanh (SaaS)

```bash
curl -X POST http://localhost:3000/api/postback/firstpromoter?workspace_id=YOUR_WS_ID \
  -H "Content-Type: application/json" \
  -d '{"sub_id":"test-uuid","event_type":"new_customer","conversion_amount":99.99,"currency":"USD","id":"txn_001"}'
```
