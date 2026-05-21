# Hệ thống hoạt động như thế nào

Dự án gồm 2 phần riêng biệt, cùng phục vụ một mục tiêu: track affiliate conversion → gửi lên Facebook.

---

## Cấu trúc dự án

```
eventhandle/
└── tracking-saas/          ← Toàn bộ dự án (Next.js + Supabase)
    ├── public/
    │   └── affiliate-click-tracking.js  ← Nhúng vào landing page
    ├── src/app/api/         ← Tracking API (postback, click, stats)
    ├── supabase/schema.sql  ← DB schema
    └── test-all-platforms.sh            ← Test script
    GitHub: anhtuanevt/tracking-saas
```

Express server cũ đã được gộp vào. Mọi logic tracking đã có trong Next.js API routes.

---

## tracking-saas (Next.js SaaS)

App production với đầy đủ tính năng: auth, database PostgreSQL, multi-tenant workspace.

### Stack

| Layer | Tech |
|-------|------|
| Frontend + API | Next.js 16 App Router |
| UI components | shadcn/ui (@base-ui/react) |
| Charts | Recharts |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Deploy | Vercel (free) |

### Luồng hoạt động

```
User đăng ký → Supabase Auth tạo tài khoản
                 → Trigger tự động tạo Workspace trong DB
                 → User vào Dashboard

Dashboard
├── Tạo Campaign
├── Tạo Tracking Link (short code /t/{code})
├── Cấu hình Project (FB Pixel ID + Access Token)
└── Xem Analytics (30-day chart, conversion rate)

Tracking Link (/t/{code})
  → Redirect đến affiliate URL
  → Log click vào bảng clicks

Postback từ affiliate platform
  POST /api/postback/{platform}?workspace_id={id}
  → Map payload → tìm click → gửi Facebook CAPI → lưu vào bảng conversions
```

### Chạy localhost

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

### Postback URL format (SaaS)

```
POST https://your-app.vercel.app/api/postback/{platform}?workspace_id={uuid}
```

Lấy `workspace_id` từ: Dashboard → Settings → Postback URL format

---

## UUID / Click ID linking

Cơ chế quan trọng nhất — cùng ID xuyên suốt toàn bộ flow:

```
1. User click affiliate link
   → Frontend script generate UUID / click_id
   → Gửi POST /click hoặc /api/click → server lưu vào DB

2. UUID được gắn vào URL: ...?subId1={uuid}

3. User mua → Platform gửi postback kèm UUID

4. Server nhận postback:
   → Tìm click record theo UUID
   → Ghép thêm fbc, fbp, email... từ click gốc
   → Gửi Purchase event lên Facebook với đầy đủ data
```

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
