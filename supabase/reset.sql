-- Reset toàn bộ schema — chạy trước khi chạy lại schema.sql
-- Xoá theo thứ tự ngược để tránh lỗi foreign key

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop function if exists is_workspace_member(uuid);

drop table if exists notifications   cascade;
drop table if exists conversions     cascade;
drop table if exists clicks          cascade;
drop table if exists tracking_links  cascade;
drop table if exists campaigns       cascade;
drop table if exists platforms       cascade;
drop table if exists projects        cascade;
drop table if exists workspaces      cascade;
