-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Workspaces ───────────────────────────────────────────────────────────────
create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  owner_id    uuid references auth.users(id) on delete cascade,
  plan        text not null default 'free',
  created_at  timestamptz not null default now()
);

-- ─── Projects (FB Pixel per workspace) ───────────────────────────────────────
create table projects (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  name             text not null,
  fb_pixel_id      text,
  fb_access_token  text,
  webhook_secret   text,
  created_at       timestamptz not null default now()
);

-- ─── Platforms (affiliate platform configs) ───────────────────────────────────
create table platforms (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid references workspaces(id) on delete cascade,
  name                 text not null,
  click_id_field       text not null,
  event_type_field     text default 'event_type',
  amount_field         text not null,
  currency_field       text default 'currency',
  transaction_id_field text default 'id',
  email_field          text default 'email',
  is_system            boolean default false,
  created_at           timestamptz not null default now()
);

-- ─── Campaigns ────────────────────────────────────────────────────────────────
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

-- ─── Tracking Links ───────────────────────────────────────────────────────────
create table tracking_links (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  campaign_id     uuid references campaigns(id) on delete set null,
  project_id      uuid references projects(id) on delete set null,
  name            text,
  destination_url text not null,
  short_code      text unique not null,
  clicks_count    integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── Clicks ───────────────────────────────────────────────────────────────────
create table clicks (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  project_id       uuid references projects(id) on delete set null,
  tracking_link_id uuid references tracking_links(id) on delete set null,
  client_ip        text,
  user_agent       text,
  fbc              text,
  fbp              text,
  ttclid           text,
  referrer         text,
  brand_id         text,
  brand_name       text,
  email            text,
  phone            text,
  first_name       text,
  last_name        text,
  city             text,
  country          text,
  zip              text,
  aff_url          text,
  created_at       timestamptz not null default now()
);

-- ─── Conversions (postbacks) ──────────────────────────────────────────────────
create table conversions (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  click_id        uuid references clicks(id) on delete set null,
  platform        text not null,
  transaction_id  text,
  amount          numeric not null default 0,
  currency        text not null default 'USD',
  fb_sent         boolean not null default false,
  fb_result       jsonb,
  fb_error        text,
  raw_payload     jsonb,
  created_at      timestamptz not null default now(),
  unique (workspace_id, platform, transaction_id)
);

-- ─── Notifications ────────────────────────────────────────────────────────────
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  type          text not null,
  title         text not null,
  body          text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index on clicks (workspace_id, created_at desc);
create index on conversions (workspace_id, created_at desc);
create index on conversions (workspace_id, platform, transaction_id);
create index on tracking_links (short_code);
create index on notifications (workspace_id, user_id, read);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table workspaces      enable row level security;
alter table projects        enable row level security;
alter table platforms       enable row level security;
alter table campaigns       enable row level security;
alter table tracking_links  enable row level security;
alter table clicks          enable row level security;
alter table conversions     enable row level security;
alter table notifications   enable row level security;

-- Helper: check workspace membership
create or replace function is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from workspaces where id = ws_id and owner_id = auth.uid()
  );
$$;

-- Workspaces: owner only
create policy "workspace owner" on workspaces
  for all using (owner_id = auth.uid());

-- All other tables: must belong to a workspace the user owns
create policy "workspace member" on projects
  for all using (is_workspace_member(workspace_id));

create policy "workspace member" on platforms
  for all using (workspace_id is null or is_workspace_member(workspace_id));

create policy "workspace member" on campaigns
  for all using (is_workspace_member(workspace_id));

create policy "workspace member" on tracking_links
  for all using (is_workspace_member(workspace_id));

create policy "workspace member" on clicks
  for all using (is_workspace_member(workspace_id));

create policy "workspace member" on conversions
  for all using (is_workspace_member(workspace_id));

create policy "workspace member" on notifications
  for all using (is_workspace_member(workspace_id));

-- ─── Seed system platforms (available to all workspaces) ─────────────────────
insert into platforms (workspace_id, name, click_id_field, event_type_field, amount_field, currency_field, transaction_id_field, email_field, is_system) values
  (null, 'FirstPromoter',  'sub_id',        'event_type',     'conversion_amount', 'currency', 'id',             'customer_email', true),
  (null, 'Impact',         'clickId',        'eventName',      'amount',            'currency', 'transactionId',  'customerEmail',  true),
  (null, 'PartnerStack',   'affiliateLink',  'conversionType', 'revenue',           'currency', 'key',            'customerEmail',  true),
  (null, 'AWIN',           'transactionId',  'eventType',      'saleAmount',        'currency', 'transactionId',  'customerEmail',  true),
  (null, 'ShareASale',     'cookieId',       'conversionType', 'commissionAmount',  'currency', 'transactionId',  'customerEmail',  true),
  (null, 'TikTok',        'ttclid',         'event',          'value',             'currency', 'order_id',       'email',          true);

-- ─── Auto-create workspace on signup ─────────────────────────────────────────
-- Chạy thủ công sau khi tạo user trong Supabase Auth dashboard:
--
-- INSERT INTO workspaces (name, slug, owner_id)
-- VALUES ('my-workspace', 'my-workspace', '<user-id-from-auth-dashboard>');
--
-- Hoặc dùng script: supabase/create_user.sql
