# Hệ thống hoạt động như thế nào

Affiliate postback tracking — track click → conversion → gửi lên Facebook CAPI.

---

## Cấu trúc dự án

```
eventhandle/
└── tracking-saas/          ← Toàn bộ dự án (Next.js + Supabase)
    ├── public/
    │   └── affiliate-click-tracking.js  ← Nhúng vào landing page
    ├── src/
    │   ├── proxy.ts         ← Auth logic (không dùng làm Next.js middleware)
    │   ├── app/api/         ← Tracking API (postback, click, platforms, projects, stats)
    │   └── app/dashboard/   ← Dashboard UI
    ├── supabase/schema.sql  ← DB schema
    ├── supabase/create_user.sql ← Tạo workspace thủ công
    └── supabase/reset.sql   ← Reset schema
    GitHub: anhtuanevt/tracking-saas
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend + API | Next.js 16 App Router |
| UI components | shadcn/ui |
| Charts | Recharts |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Deploy | Vercel (free) |

---

## Luồng hoạt động

### Tạo tài khoản

```
Admin tạo user trong Supabase Auth dashboard
  → Chạy create_user.sql để tạo Workspace trong DB
  → User đăng nhập tại /login → vào Dashboard
```

> Trigger tự động tạo workspace đã bị xóa. Workspace phải tạo thủ công qua `create_user.sql`,
> hoặc tự động khi user vào `/dashboard` lần đầu (page.tsx sẽ INSERT nếu chưa có).

### Dashboard

```
/dashboard (DashboardClient — single-page với tabs)
├── Tab: dashboard  → Stats + Revenue chart (14 ngày) + by-platform
├── Tab: logs       → Conversions feed
├── Tab: clicks     → Clicks feed
├── Tab: projects   → Quản lý FB Pixel (POST/DELETE /api/projects)
├── Tab: platforms  → Quản lý platforms (GET/POST/DELETE /api/platforms)
└── Tab: settings   → Workspace info

Sub-pages (có code, không có navigation link — sidebar đã bị xóa):
  /dashboard/analytics, /dashboard/campaigns, /dashboard/links,
  /dashboard/brands, /dashboard/events, /dashboard/settings, /dashboard/support
```

### Tracking flow

```
1. Nhúng script vào landing page:
   <script src="https://yourdomain.com/affiliate-click-tracking.js?workspace_id=..."></script>

2. User click affiliate link
   → Script detect fbclid → tạo fbc, đọc fbp cookie
   → POST /api/click → server lưu click vào DB, trả UUID
   → Redirect: affiliate.com?subId1={uuid}

3. User mua → affiliate platform gửi postback:
   POST /api/postback/{platform}?workspace_id={id}
   → Parse payload theo platform config
   → Tìm click record theo UUID
   → Gửi Purchase event lên Facebook CAPI
   → Lưu vào bảng conversions
```

---

## Chạy localhost

```bash
cd tracking-saas

# 1. Copy env
cp .env.local.example .env.local
# Điền Supabase keys vào .env.local

# 2. Chạy
npm install
npm run dev
# → http://localhost:3000
```

---

## Postback URL format

```
POST https://your-app.vercel.app/api/postback/{platform}?workspace_id={uuid}
```

Lấy `workspace_id` từ: Dashboard → tab Settings

---

## Dữ liệu gửi lên Facebook

### ViewContent (khi click)
```json
{
  "event_name": "ViewContent",
  "user_data": {
    "client_ip_address": "...",
    "fbc": "fb.1.xxx.yyy",
    "fbp": "fb.1.xxx.zzz"
  }
}
```

### Purchase (khi có conversion)
```json
{
  "event_name": "Purchase",
  "user_data": {
    "em": "sha256(email)",
    "client_ip_address": "...",
    "fbc": "fb.1.xxx.yyy"
  },
  "custom_data": {
    "value": 99.99,
    "currency": "USD",
    "order_id": "transaction_id"
  }
}
```

PII (email, phone, name, address) luôn được hash SHA-256 trước khi gửi.
