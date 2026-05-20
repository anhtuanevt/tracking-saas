#!/bin/bash
# Test script cho tracking-saas (Next.js)
# Cần truyền WORKSPACE_ID: ./test-all-platforms.sh <workspace_id>
#
# Lấy workspace_id tại: Dashboard → Settings → Postback URL format

BASE="http://localhost:3000"
WS="${1:-}"

if [ -z "$WS" ]; then
  echo "Usage: ./test-all-platforms.sh <workspace_id>"
  echo ""
  echo "Lấy workspace_id tại: Dashboard → Settings"
  exit 1
fi

echo "=== Tracking SaaS — Platform Tests ==="
echo "Base: $BASE"
echo "Workspace: $WS"
echo ""

echo "1. Health check"
curl -s "$BASE/api/stats" \
  -H "Cookie: $(curl -sc /tmp/cookies $BASE/login -o /dev/null; cat /tmp/cookies 2>/dev/null)" \
  | python3 -m json.tool 2>/dev/null || echo "(cần đăng nhập để xem stats)"
echo ""

echo "2. Track click"
CLICK_ID=$(curl -s -X POST "$BASE/api/click" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WS\",
    \"fbc\": \"fb.1.1234567890.AbCdEfGhIjKlMnOp\",
    \"fbp\": \"fb.1.1234567890.0987654321\",
    \"email\": \"test@example.com\",
    \"brand_name\": \"test-brand\"
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('click_id','ERROR'))" 2>/dev/null)
echo "Click ID: $CLICK_ID"
echo ""

echo "3. Postback: FirstPromoter"
curl -s -X POST "$BASE/api/postback/firstpromoter?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"sub_id\":\"$CLICK_ID\",\"event_type\":\"sale\",\"conversion_amount\":99.99,\"currency\":\"USD\",\"id\":\"fp-txn-001\",\"customer_email\":\"buyer@example.com\"}" \
  | python3 -m json.tool
echo ""

echo "4. Postback: Impact"
curl -s -X POST "$BASE/api/postback/impact?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"clickId\":\"$CLICK_ID\",\"eventName\":\"Purchase\",\"amount\":150.00,\"currency\":\"USD\",\"transactionId\":\"impact-txn-002\",\"customerEmail\":\"buyer@example.com\"}" \
  | python3 -m json.tool
echo ""

echo "5. Postback: PartnerStack"
curl -s -X POST "$BASE/api/postback/partnerstack?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"affiliateLink\":\"$CLICK_ID\",\"conversionType\":\"sale\",\"revenue\":200.00,\"currency\":\"USD\",\"key\":\"ps-txn-003\"}" \
  | python3 -m json.tool
echo ""

echo "6. Postback: AWIN"
curl -s -X POST "$BASE/api/postback/awin?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"transactionId\":\"awin-txn-004\",\"eventType\":\"sale\",\"saleAmount\":75.50,\"currency\":\"GBP\"}" \
  | python3 -m json.tool
echo ""

echo "7. Postback: ShareASale"
curl -s -X POST "$BASE/api/postback/shareasale?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"cookieId\":\"$CLICK_ID\",\"conversionType\":\"sale\",\"commissionAmount\":30.00,\"currency\":\"USD\",\"transactionId\":\"sas-txn-005\"}" \
  | python3 -m json.tool
echo ""

echo "8. Duplicate detection (repeat fp-txn-001)"
curl -s -X POST "$BASE/api/postback/firstpromoter?workspace_id=$WS" \
  -H "Content-Type: application/json" \
  -d "{\"sub_id\":\"$CLICK_ID\",\"event_type\":\"sale\",\"conversion_amount\":99.99,\"id\":\"fp-txn-001\"}" \
  | python3 -m json.tool
echo ""

echo "=== All tests complete ==="
echo "Xem kết quả tại: $BASE/dashboard/events"
