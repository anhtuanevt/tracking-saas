-- Chạy file này SAU KHI tạo user trong Supabase Auth dashboard
-- Authentication → Users → Add user → Create new user (chọn "Auto Confirm User")
-- Copy user ID từ cột "UID" rồi paste vào bên dưới

-- Thay YOUR_USER_ID và your@email.com bằng giá trị thật
INSERT INTO workspaces (name, slug, owner_id)
VALUES (
  'workspace',
  'workspace',
  'YOUR_USER_ID'   -- paste UID từ Authentication → Users
);
