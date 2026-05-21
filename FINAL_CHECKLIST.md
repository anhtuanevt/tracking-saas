# Checklist — Setup & Deploy

Trạng thái hiện tại của dự án và các bước cần làm để production-ready.

---

## Những gì đã có

```
tracking-saas/          ✅ Next.js SaaS — build pass, code trên GitHub
                           Auth, DB, Dashboard, Analytics, API
                           affiliate-click-tracking.js (script nhúng landing page)
                           test-all-platforms.sh (test 5 platforms)
                           GitHub: anhtuanevt/tracking-saas
```

> affiliate-postback (Express cũ) đã được gộp vào tracking-saas.

---

## Để chạy tracking-saas trên localhost

```
□ 1. Tạo Supabase project tại supabase.com (free)
□ 2. Chạy supabase/schema.sql trong SQL Editor
□ 3. Copy 3 keys vào .env.local (xem .env.local.example)
□ 4. npm run dev
□ 5. Mở http://localhost:3000 → đăng ký tài khoản
□ 6. Vào Settings → tạo Project với FB Pixel + Token
□ 7. Copy workspace_id → dùng làm postback URL
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

`workspace_id` lấy tại: Dashboard → Settings (section cuối).

Ví dụ:
```
POST https://tracking-saas-xxx.vercel.app/api/postback/firstpromoter?workspace_id=550e8400-...
```

---

## Tính năng hiện có (tracking-saas)

| Tính năng | Trạng thái |
|-----------|-----------|
| Đăng ký / Đăng nhập | ✅ |
| Multi-tenant workspace | ✅ |
| Dashboard + Stats cards | ✅ |
| Revenue chart (30 ngày) | ✅ |
| Campaigns (CRUD) | ✅ |
| Tracking Links (short /t/:code) | ✅ |
| Click Events feed | ✅ |
| Analytics (area + bar + pie chart) | ✅ |
| Brands / Platforms page | ✅ |
| Settings (FB Pixel projects) | ✅ |
| Support page | ✅ |
| Postback API (5 platforms) | ✅ |
| Click tracking API | ✅ |
| Facebook CAPI (ViewContent + Purchase) | ✅ |
| Billing / Upgrade | ⬜ Chưa làm |
| Email notifications | ⬜ Chưa làm |
| Team members | ⬜ Chưa làm |

---

## GitHub repos

| Repo | URL |
|------|-----|
| Express server | https://github.com/anhtuanevt/affiliate-postback-tracker |
| Next.js SaaS | https://github.com/anhtuanevt/tracking-saas |
