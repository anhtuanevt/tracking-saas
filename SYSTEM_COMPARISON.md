# So sánh: tracking-saas vs n8n Workflow

---

## Flow tracking-saas (hệ thống hiện tại)

### Workflow 1 — Click Tracking

```mermaid
flowchart TD
    LP["🖥️ Landing Page\naffiliate-click-tracking.js"]
    LP -->|"detect fbclid → tạo fbc\nread fbp cookie"| LP
    LP -->|"POST /api/click\n{fbc, fbp, brand_id, ua, referrer}"| CK["⚙️ /api/click\n(Next.js)"]
    CK -->|"INSERT"| DB[("🗄️ Supabase\nbảng: clicks")]
    DB -->|"click_id (UUID)"| CK
    CK -->|"🔥 AddToCart event\n{fbc, fbp, content_name}"| FB["📘 Facebook CAPI"]
    CK -->|"trả về click_id"| LP
    LP -->|"Redirect\naffiliate.com?subId1={uuid}"| AFF["🤝 Affiliate Platform"]
```

### Workflow 2 — Postback & Conversion

```mermaid
flowchart TD
    AFF["🤝 Affiliate Platform\n(Impact / FirstPromoter /\nTikTok / AWIN / ShareASale)"]
    AFF -->|"POST /api/postback/{platform}\n?workspace_id=&secret="| SEC{"🔐 Verify\nwebhook_secret"}
    SEC -->|"❌ sai/thiếu secret"| R401["401 Unauthorized"]
    SEC -->|"✅ đúng"| DEDUP{"♻️ Dedup check\ntransaction_id?"}
    DEDUP -->|"đã có"| SKIP["skip — trả duplicate:true"]
    DEDUP -->|"chưa có"| MAP["Map payload\ntheo platform config"]
    MAP -->|"SELECT by UUID"| DB[("🗄️ Supabase\nbảng: clicks")]
    DB -->|"fbc, fbp, ip, email..."| MAP
    MAP -->|"🔥 Purchase event\n{fbc, fbp, sha256(email),\nvalue, currency, order_id}"| FB["📘 Facebook CAPI"]
    MAP -->|"INSERT"| CV[("🗄️ Supabase\nbảng: conversions")]
```

---

## Flow n8n (workflow tham chiếu)

### Workflow 1 — Click

```mermaid
flowchart TD
    WH["⚡ Click ShortLink\n(POST webhook)"]
    WH --> DS2["📊 Get Dataset2\n(Google Sheet / catalog)"]
    WH --> PG["🐘 Lưu Click Data\n(Postgres INSERT)"]
    DS2 --> MG["✏️ Merge Data AddToCart"]
    MG --> LP["🔁 Loop Over Items"]
    LP -->|loop| LP
    LP --> CAPI["→] Gửi AddToCart\n(CAPI sub-workflow)"]
```

### Workflow 2 — Postback

```mermaid
flowchart TD
    PB["⚡ Postback_Impact\n(GET webhook)"]
    PB -->|"1 item"| PG["🐘 Tìm Click Data\n(Postgres SELECT)"]
    PG --> DS4["📊 Get Dataset4\n(Google Sheet / catalog)"]
    DS4 --> MG["✏️ Merge Click Data"]
    MG --> LP["🔁 Loop Over Items"]
    LP -->|loop| LP
    LP --> CAPI["→] Gửi CAPI/EAPI\n(sub-workflow)"]
```

---

## So sánh trực tiếp

| Tiêu chí | tracking-saas | n8n |
|----------|--------------|-----|
| **Trigger click** | POST `/api/click` | POST webhook |
| **Lưu click** | Supabase (managed, có RLS) | Postgres tự host |
| **Event khi click** | ✅ AddToCart CAPI | ✅ AddToCart CAPI |
| **Trigger postback** | POST/GET `/api/postback/:platform` | GET webhook |
| **Match click ↔ conversion** | UUID trong `subId1` → lookup `clicks.id` | UUID trong Postgres |
| **Bảo vệ postback** | ✅ `webhook_secret` verify | ❌ không có |
| **Dedup conversion** | ✅ check `transaction_id` | ❌ không rõ |
| **Dataset merge** | ❌ không có | ✅ Get Dataset2/4 (catalog) |
| **Event khi conversion** | ✅ Purchase CAPI | ✅ CAPI |
| **EAPI (email platform)** | ❌ chưa có | ✅ CAPI + EAPI |
| **Multi-tenant** | ✅ workspace per user | ❌ 1 workspace cố định |
| **Auth dashboard** | ✅ Supabase Auth | ❌ không có |
| **Platform config** | ✅ 6 platforms + custom | ✅ Impact (cố định) |
| **Deploy** | Vercel (serverless) | Self-hosted / cloud |

---

## Điểm còn thiếu so với n8n

### 1. Dataset merge (Get Dataset2 / Dataset4)

n8n merge thêm data từ nguồn ngoài (Google Sheet hoặc catalog) vào event trước khi gửi CAPI — thường là `content_ids`, `contents` array với product SKU, giá, category.

**Ảnh hưởng:** Facebook CAPI nhận event thiếu `content_ids` nên khó match với catalog, ROAS tracking kém chính xác hơn.

**Fix nếu cần:** Thêm bảng `products` trong Supabase, lookup theo `brand_id` khi gửi CAPI.

### 2. EAPI (Email API)

n8n gửi thêm event sang email platform (Klaviyo / Mailchimp) song song với Facebook CAPI.

**Fix nếu cần:** Thêm call đến Klaviyo API trong `/api/postback/:platform` sau khi gửi Facebook.

---

## Kết luận

Hệ thống **tracking-saas bao phủ đầy đủ core flow** giống n8n:

```
click → lưu UUID → affiliate → postback → match UUID → Purchase CAPI
```

Và **vượt trội hơn** n8n ở: bảo mật (webhook_secret), dedup, multi-tenant, 6 platform configs, dashboard có auth.

Còn thiếu 2 tính năng phụ: **dataset merge** (content_ids cho catalog) và **EAPI** (email platform).
