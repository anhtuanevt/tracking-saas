# Data Flow — Tracking SaaS

Chi tiết luồng dữ liệu từ click → conversion → Facebook.

---

## Sơ đồ đầy đủ

```
[Landing Page]
  affiliate-click-tracking.js
  1. Detect fbclid từ URL → tạo fbc
  2. Read fbp cookie
  3. POST /api/click { fbc, fbp, brand_id, brand_name, referrer, ua }
  4. Nhận click_id (UUID) từ server
  5. Redirect: affiliate.com?subId1={click_id}
        │
        ▼
[Affiliate Platform]
  User mua → platform ghi conversion
  Gửi postback kèm click_id về server
        │
        ▼
[Next.js API]
  POST /api/postback/{platform}?workspace_id={id}
  1. Parse payload theo platform config
  2. Tìm click record theo click_id
  3. Gửi Purchase → Facebook CAPI
  4. Lưu conversion vào bảng conversions
        │
        ▼
[Facebook Conversions API]
  Attribution: fbc/fbp link ViewContent → Purchase
  Dashboard: ROAS, conversion rate, revenue
```

---

## Payload mỗi platform

| Platform | Click ID field | Amount field | Transaction field |
|----------|----------------|--------------|-------------------|
| FirstPromoter | `sub_id` | `conversion_amount` | `id` |
| Impact | `clickId` | `amount` | `transactionId` |
| PartnerStack | `affiliateLink` | `revenue` | `key` |
| AWIN | `transactionId` | `saleAmount` | `transactionId` |
| ShareASale | `cookieId` | `commissionAmount` | `transactionId` |
| TikTok | `ttclid` | `value` | `order_id` |

---

## Database schema (Supabase)

```
workspaces          → multi-tenant, mỗi user có 1 workspace
  └── projects      → FB Pixel configs (pixel_id + access_token)
  └── campaigns     → nhóm tracking links
  └── tracking_links→ short links /t/{code}, đếm clicks
  └── clicks        → log mỗi click (ip, fbc, fbp, referrer...)
  └── conversions   → log mỗi postback (amount, fb_sent, fb_error...)
  └── platforms     → custom platform configs (system + per-workspace)
  └── notifications → in-app alerts
```

---

## API Endpoints (Next.js SaaS)

```
POST /api/click                    → track click, trả click UUID (yêu cầu workspace_id)
POST /api/postback/:platform       → nhận postback (?workspace_id=...)
GET  /api/platforms                → danh sách platforms (system + custom)
POST /api/platforms                → tạo custom platform
DELETE /api/platforms              → xóa custom platform
POST /api/projects                 → tạo project (FB Pixel config)
DELETE /api/projects               → xóa project
GET  /api/stats                    → stats của workspace (cần auth)
GET  /api/logs                     → logs (cần auth)
GET  /t/:code                      → redirect tracking link + log click
```

---

## Ví dụ test postback (curl)

```bash
curl -X POST https://your-app.vercel.app/api/postback/firstpromoter?workspace_id=YOUR_WS_ID \
  -H "Content-Type: application/json" \
  -d '{
    "sub_id": "abc-123-uuid",
    "event_type": "new_customer",
    "conversion_amount": 99.99,
    "currency": "USD",
    "id": "txn_001"
  }'
```

---

## Metrics ý nghĩa

| Metric | Ý nghĩa |
|--------|---------|
| total_clicks | Số người click affiliate link |
| total_conversions | Số người hoàn thành mua |
| conversion_rate | conversions ÷ clicks × 100 |
| total_revenue | Tổng giá trị đơn hàng tracked |
| fb_sent | Số conversion đã gửi lên Facebook thành công |
| failed_fb | Số conversion Facebook từ chối (cần kiểm tra) |
