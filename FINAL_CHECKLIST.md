# Checklist — Setup & Deploy

Trạng thái hiện tại của dự án và các bước cần làm để production-ready.

---

## Những gì đã có

```
tracking-saas/          ✅ Next.js SaaS — build pass, code trên GitHub
                           Auth, DB, Dashboard, Analytics, API
                           public/affiliate-click-tracking.js (script nhúng landing page)
                           GitHub: anhtuanevt/tracking-saas
```

---

## Để chạy tracking-saas trên localhost

```
□ 1. Tạo Supabase project tại supabase.com (free)
□ 2. Chạy supabase/schema.sql trong SQL Editor
□ 3. Copy 3 keys vào .env.local (xem .env.local.example)
□ 4. npm run dev
□ 5. Mở http://localhost:3000 → đăng nhập (register đã bị tắt, dùng Supabase Auth dashboard để tạo user)
□ 6. Chạy supabase/create_user.sql để tạo workspace cho user mới
□ 7. Vào Projects tab → tạo Project với FB Pixel + Token
□ 8. Copy workspace_id ở Settings tab → dùng làm postback URL
```

---

## Để deploy production (miễn phí)

### Supabase (Database + Auth)
```
□ 1. Tạo project tại supabase.com
□ 2. SQL Editor → paste toàn bộ nội dung supabase/schema.sql → Run
□ 3. Settings → API → copy 3 keys
```

### Vercel (Hosting)
```
□ 1. Vào vercel.com → Import from GitHub → chọn tracking-saas
□ 2. Thêm Environment Variables:
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SUPABASE_SERVICE_ROLE_KEY
□ 3. Deploy
□ 4. Vercel tự tạo domain: https://tracking-saas-xxx.vercel.app
```

---

## Postback URL sau khi deploy

```
POST https://your-app.vercel.app/api/postback/{platform}?workspace_id={id}
```

`workspace_id` lấy tại: Dashboard → tab Settings (cuối trang).

Ví dụ:
```
POST https://tracking-saas-xxx.vercel.app/api/postback/firstpromoter?workspace_id=550e8400-...
```

---

## Tính năng hiện có

### Main Dashboard (`/dashboard`) — tabs trong DashboardClient

| Tab | Nội dung |
|-----|---------|
| dashboard | Stats cards, revenue chart (14 ngày), by-platform breakdown, postback URLs |
| logs | Bảng conversions (200 gần nhất) |
| clicks | Bảng clicks (200 gần nhất) |
| projects | Quản lý FB Pixel projects |
| platforms | Quản lý platforms, thêm custom platform, tracking script |
| settings | Workspace info, logout |

### Sub-pages (tồn tại nhưng sidebar đã bị xóa — không navigate được từ UI)

| Route | Nội dung |
|-------|---------|
| /dashboard/analytics | Analytics charts |
| /dashboard/campaigns | Campaigns CRUD |
| /dashboard/links | Tracking links (short /t/:code) |
| /dashboard/brands | Brands/platforms list |
| /dashboard/events | Events feed |
| /dashboard/settings | Settings cũ |
| /dashboard/support | Support page |

### API & Backend

| Tính năng | Trạng thái |
|-----------|-----------|
| Đăng nhập | ✅ |
| Multi-tenant workspace | ✅ (tạo thủ công qua create_user.sql) |
| Postback API (6 platforms incl. TikTok) | ✅ |
| Click tracking API | ✅ |
| Facebook CAPI (ViewContent + Purchase) | ✅ |
| Platforms API (CRUD) | ✅ |
| Projects API (CRUD) | ✅ |
| Tracking link redirect (/t/:code) | ✅ |
| Billing / Upgrade | ⬜ Chưa làm |
| Email notifications | ⬜ Chưa làm |
| Team members | ⬜ Chưa làm |

---

## GitHub repos

| Repo | URL |
|------|-----|
| Next.js SaaS | https://github.com/anhtuanevt/tracking-saas |
