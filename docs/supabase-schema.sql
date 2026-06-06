-- Supabase/Postgres schema for the sponsorship management app.
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  display_name text not null default '',
  role text not null default 'sales' check (role in ('sales', 'manager', 'ops', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  display_name text not null,
  category_large text not null,
  category_middle text not null default '',
  category_small text not null default '',
  category_detail text not null default '',
  inventory_type text not null,
  standard_price integer not null default 0,
  standard_cost integer not null default 0,
  standard_spec text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  industry text not null default '',
  owner text not null default '',
  status text not null default '提案先',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists inventory_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  slot_name text not null,
  slot_number text not null default '',
  season text not null default '2026-27',
  target_match text not null default '',
  location text not null default '',
  status text not null default '未販売',
  company text not null default '',
  owner text not null default '',
  list_price integer not null default 0,
  sales_price integer not null default 0,
  cost integer not null default 0,
  production_due text not null default '',
  production_status text not null default '未着手',
  spec_detail text not null default '',
  inspection_status text not null default '未対応',
  evidence_urls text not null default '',
  inspection_note text not null default '',
  inspected_at text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  slot_id uuid not null references inventory_slots(id) on delete cascade,
  company_name text not null,
  proposed_date text not null default '',
  status text not null default '提案中',
  proposed_price integer not null default 0,
  owner text not null default '',
  lost_reason text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  company_name text not null,
  name text not null,
  season text not null default '2026-27',
  start_date text not null default '',
  end_date text not null default '',
  total_amount integer not null default 0,
  status text not null default '契約済み',
  billing_status text not null default '未請求',
  owner text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contract_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  contract_id uuid not null references contracts(id) on delete cascade,
  slot_id uuid not null references inventory_slots(id) on delete cascade,
  item_name text not null,
  allocated_amount integer not null default 0,
  cost integer not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  review_key text not null,
  review_type text not null,
  status text not null default '未確認',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, review_key)
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on organizations for each row execute function set_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger products_updated_at before update on products for each row execute function set_updated_at();
create trigger companies_updated_at before update on companies for each row execute function set_updated_at();
create trigger inventory_slots_updated_at before update on inventory_slots for each row execute function set_updated_at();
create trigger proposals_updated_at before update on proposals for each row execute function set_updated_at();
create trigger contracts_updated_at before update on contracts for each row execute function set_updated_at();
create trigger contract_items_updated_at before update on contract_items for each row execute function set_updated_at();
create trigger review_states_updated_at before update on review_states for each row execute function set_updated_at();

create index if not exists products_org_category_idx on products (organization_id, category_large, category_middle, category_small);
create index if not exists slots_org_status_idx on inventory_slots (organization_id, status);
create index if not exists slots_org_product_idx on inventory_slots (organization_id, product_id);
create index if not exists slots_org_company_idx on inventory_slots (organization_id, company);
create index if not exists proposals_org_slot_idx on proposals (organization_id, slot_id);
create index if not exists proposals_org_company_idx on proposals (organization_id, company_name);
create index if not exists contracts_org_company_idx on contracts (organization_id, company_name);
create index if not exists contract_items_org_contract_idx on contract_items (organization_id, contract_id);

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table companies enable row level security;
alter table inventory_slots enable row level security;
alter table proposals enable row level security;
alter table contracts enable row level security;
alter table contract_items enable row level security;
alter table review_states enable row level security;

-- Policies are intentionally left for the application-auth step.
-- The first deployed version can use server-side access with DATABASE_URL.
-- Once Supabase Auth is wired, add RLS policies scoped by profiles.organization_id.
