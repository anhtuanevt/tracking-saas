# Data Flow — Tracking SaaS

Chi tiết luồng dữ liệu từ click → conversion → Facebook, áp dụng cho cả Express lẫn Next.js SaaS.

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
[Server — Express hoặc Next.js API]
  POST /api/postback/{platform}?workspace_id={id}
  1. Parse payload theo platform config
  2. Tìm click record theo click_id
  3. Gửi Purchase → Facebook CAPI
  4. Lưu conversion vào DB (SaaS) hoặc in-memory (Express)
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

---

## Database schema (SaaS — Supabase)

```
workspaces          → multi-tenant, mỗi user có 1 workspace
  └── projects      → FB Pixel configs (pixel_id + access_token)
  └── campaigns     → nhóm tracking links
  └── tracking_links→ short links /t/{code}, đếm clicks
  └── clicks        → log mỗi click (ip, fbc, fbp, referrer...)
  └── conversions   → log mỗi postback (amount, fb_sent, fb_error...)
  └── platforms     → custom platform configs
  └── notifications → in-app alerts
```

---

## API Endpoints

### Express (affiliate-postback)

```
POST /click                        → track click, trả click UUID
POST /postback/:platform           → nhận postback (default project)
POST /postback/:project/:platform  → nhận postback (project cụ thể)
GET  /postback/:platform           → AWIN (query params)
GET  /api/stats                    → tổng hợp số liệu
GET  /api/logs                     → event logs
GET  /api/clicks                   → danh sách clicks
GET  /api/projects                 → danh sách projects
GET  /api/platforms                → danh sách platforms
GET  /health                       → health check
```

### Next.js SaaS (tracking-saas)

```
POST /api/click                    → track click (yêu cầu workspace_id)
POST /api/postback/:platform       → nhận postback (?workspace_id=...)
GET  /api/stats                    → stats của workspace (cần auth)
GET  /api/logs                     → logs (cần auth)
GET  /t/:code                      → redirect tracking link + log click
```

---

## Ví dụ test postback (curl)

### Express
```bash
curl -X POST http://localhost:3000/postback/firstpromoter \
  -H "Content-Type: application/json" \
  -d '{
    "sub_id": "abc-123-uuid",
    "event_type": "new_customer",
    "conversion_amount": 99.99,
    "currency": "USD",
    "id": "txn_001"
  }'
```

### SaaS (Next.js)
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
