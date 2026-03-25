-- Migration 001: Initial schema for portal.psgweb.me v2
-- Creates all core entities for the PSG Portal backend

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES
-- ============================================================
create table public.companies (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  address        text,
  phone          text,
  email          text,
  logo_url       text,
  service_area   text,
  specialties    text[],
  -- Field mapping templates for CSV import (keyed by template name)
  field_mappings jsonb default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
create type public.employee_role as enum ('estimator', 'tech', 'painter', 'manager', 'owner');

create table public.employees (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  email      text,
  role       public.employee_role not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_employees_company_id on public.employees(company_id);

-- ============================================================
-- VEHICLES
-- ============================================================
create table public.vehicles (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  customer_id uuid, -- FK added after repair_customers table
  year        smallint,
  make        text,
  model       text,
  vin         text,
  created_at  timestamptz not null default now()
);

create index idx_vehicles_company_id on public.vehicles(company_id);

-- ============================================================
-- REPAIR CUSTOMERS
-- ============================================================
create table public.repair_customers (
  id             uuid primary key default uuid_generate_v4(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  name           text not null,
  phone          text,
  email          text,
  -- Populated by trigger when 2+ ROs match name/phone/email within same company
  is_repeat      boolean not null default false,
  first_order_id uuid, -- FK to repair_orders added after that table is created
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_repair_customers_company_id on public.repair_customers(company_id);
-- Index for repeat detection lookups
create index idx_repair_customers_lookup on public.repair_customers(company_id, lower(phone), lower(email));

-- Add FK from vehicles to repair_customers now that it exists
alter table public.vehicles
  add constraint fk_vehicles_customer
  foreign key (customer_id) references public.repair_customers(id) on delete set null;

create index idx_vehicles_customer_id on public.vehicles(customer_id);

-- ============================================================
-- REPAIR ORDERS
-- ============================================================
create type public.ro_status as enum (
  'open', 'in_progress', 'waiting_parts', 'waiting_supplements',
  'ready', 'delivered', 'completed', 'cancelled'
);

create type public.pay_type as enum (
  'insurance', 'customer_pay', 'warranty', 'fleet', 'other'
);

create table public.repair_orders (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  customer_id  uuid references public.repair_customers(id) on delete set null,
  ro_number    text not null,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  status       public.ro_status not null default 'open',
  completed_at timestamptz,
  revenue      numeric(10,2),
  pay_type     public.pay_type,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique(company_id, ro_number)
);

create index idx_repair_orders_company_id on public.repair_orders(company_id);
create index idx_repair_orders_customer_id on public.repair_orders(customer_id);
create index idx_repair_orders_status on public.repair_orders(company_id, status);
create index idx_repair_orders_completed_at on public.repair_orders(company_id, completed_at);

-- Back-fill FK from repair_customers to repair_orders
alter table public.repair_customers
  add constraint fk_first_order
  foreign key (first_order_id) references public.repair_orders(id) on delete set null;

-- ============================================================
-- ESTIMATES
-- ============================================================
create table public.estimates (
  id          uuid primary key default uuid_generate_v4(),
  ro_id       uuid not null references public.repair_orders(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  amount      numeric(10,2) not null,
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_estimates_ro_id on public.estimates(ro_id);
create index idx_estimates_company_id on public.estimates(company_id);

-- ============================================================
-- SURVEYS
-- ============================================================
create table public.surveys (
  id           uuid primary key default uuid_generate_v4(),
  ro_id        uuid not null references public.repair_orders(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  csi_score    smallint check (csi_score between 0 and 10),
  responses    jsonb default '{}'::jsonb,
  completed_at timestamptz,
  alerts       jsonb default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_surveys_ro_id on public.surveys(ro_id);
create index idx_surveys_company_id on public.surveys(company_id);
create index idx_surveys_csi_score on public.surveys(company_id, csi_score);

-- ============================================================
-- INSURANCE ENTITIES
-- ============================================================
create table public.insurance_entities (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  carrier_name text not null,
  agent_name   text,
  claim_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_insurance_entities_company_id on public.insurance_entities(company_id);

-- ============================================================
-- REFERRAL SOURCES
-- ============================================================
create table public.referral_sources (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  source_type text not null, -- e.g. 'insurance', 'customer', 'dealer', 'fleet'
  source_name text not null,
  ro_count    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_referral_sources_company_id on public.referral_sources(company_id);

-- ============================================================
-- IMPORT LOG (for structured failure tracking)
-- ============================================================
create type public.import_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.import_logs (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  filename     text,
  row_count    integer,
  success_count integer,
  failure_count integer,
  status       public.import_status not null default 'pending',
  errors       jsonb default '[]'::jsonb, -- array of {row, field, message}
  sentry_event_id text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_import_logs_company_id on public.import_logs(company_id);

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

create trigger trg_repair_customers_updated_at
  before update on public.repair_customers
  for each row execute function public.set_updated_at();

create trigger trg_repair_orders_updated_at
  before update on public.repair_orders
  for each row execute function public.set_updated_at();

create trigger trg_estimates_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

create trigger trg_surveys_updated_at
  before update on public.surveys
  for each row execute function public.set_updated_at();

create trigger trg_insurance_entities_updated_at
  before update on public.insurance_entities
  for each row execute function public.set_updated_at();

create trigger trg_referral_sources_updated_at
  before update on public.referral_sources
  for each row execute function public.set_updated_at();

create trigger trg_import_logs_updated_at
  before update on public.import_logs
  for each row execute function public.set_updated_at();
