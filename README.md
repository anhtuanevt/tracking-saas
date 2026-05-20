# Tracking SaaS

Affiliate postback tracking platform — Next.js + Supabase + shadcn/ui.

Track clicks từ landing page, nhận postbacks từ affiliate platforms, gửi conversion lên Facebook Conversions API. Có auth, multi-tenant workspace, analytics.

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — PostgreSQL + Auth
- **shadcn/ui** (@base-ui/react)
- **Recharts** — analytics charts
- **Vercel** — deploy target

---

## Chạy localhost

```bash
# 1. Clone và install
git clone https://github.com/anhtuanevt/tracking-saas
cd tracking-saas
npm install

# 2. Tạo Supabase project tại supabase.com (free)
#    Vào SQL Editor → chạy toàn bộ file supabase/schema.sql

# 3. Tạo .env.local từ template
cp .env.local.example .env.local
# Điền 3 keys từ Supabase Dashboard → Settings → API

# 4. Chạy dev server
npm run dev
# → http://localhost:3000
```

---

## Cấu trúc

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          → Đăng nhập
│   │   └── register/       → Đăng ký (tự tạo workspace)
│   ├── dashboard/
│   │   ├── page.tsx        → Overview + stats cards + revenue chart
│   │   ├── campaigns/      → Quản lý campaigns
│   │   ├── brands/         → Xem affiliate platforms
│   │   ├── links/          → Tạo tracking links (/t/:code)
│   │   ├── events/         → Click events feed (live)
│   │   ├── analytics/      → Charts 30 ngày
│   │   ├── settings/       → FB Pixel projects + workspace info
│   │   └── support/        → Form liên hệ
│   ├── api/
│   │   ├── click/          → POST /api/click
│   │   ├── postback/[platform]/ → POST /api/postback/:platform
│   │   ├── stats/          → GET /api/stats
│   │   └── logs/           → GET /api/logs
│   └── t/[code]/           → Redirect tracking link + log click
├── lib/
│   ├── supabase/           → Browser + server Supabase clients
│   └── tracking/
│       ├── platforms.ts    → PLATFORM_CONFIG (5 platforms)
│       └── facebook.ts     → sendToFacebook() — FB CAPI
└── middleware.ts            → Auth protection
```

---

## Postback URL

Sau khi đăng nhập, lấy `workspace_id` tại **Settings** → copy và dùng:

```
POST https://your-app.vercel.app/api/postback/{platform}?workspace_id={id}
```

Platforms hỗ trợ: `firstpromoter`, `impact`, `partnerstack`, `awin`, `shareasale`

---

## Deploy

1. Push code lên GitHub (đã có)
2. Vào **vercel.com** → Import repo `tracking-saas`
3. Thêm env vars:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy — xong

---

## Database

Xem toàn bộ schema tại `supabase/schema.sql`.

Tables chính: `workspaces`, `projects`, `campaigns`, `tracking_links`, `clicks`, `conversions`, `platforms`, `notifications`

Row Level Security bật trên tất cả tables — mỗi user chỉ thấy data của workspace mình.
