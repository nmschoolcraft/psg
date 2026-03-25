-- Migration 002: Row-Level Security policies
-- Company isolation + role-based access (owner/manager/staff)
--
-- JWT expected claims:
--   auth.jwt()->>'company_id'  (uuid as text)
--   auth.jwt()->>'role'        ('owner' | 'manager' | 'staff')

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Returns the calling user's company_id from the JWT
create or replace function public.jwt_company_id()
returns uuid language sql stable as $$
  select (auth.jwt()->>'company_id')::uuid;
$$;

-- Returns the calling user's role from the JWT
create or replace function public.jwt_role()
returns text language sql stable as $$
  select auth.jwt()->>'role';
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
alter table public.companies          enable row level security;
alter table public.employees          enable row level security;
alter table public.vehicles           enable row level security;
alter table public.repair_customers   enable row level security;
alter table public.repair_orders      enable row level security;
alter table public.estimates          enable row level security;
alter table public.surveys            enable row level security;
alter table public.insurance_entities enable row level security;
alter table public.referral_sources   enable row level security;
alter table public.import_logs        enable row level security;

-- ============================================================
-- COMPANIES
-- ============================================================
-- All roles: read own company row only
create policy "companies_select" on public.companies
  for select using (id = public.jwt_company_id());

-- Owner: update own company
create policy "companies_update_owner" on public.companies
  for update using (
    id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- No direct insert/delete via API — companies are provisioned by system

-- ============================================================
-- EMPLOYEES
-- ============================================================
create policy "employees_select" on public.employees
  for select using (company_id = public.jwt_company_id());

create policy "employees_insert_owner_manager" on public.employees
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "employees_update_owner_manager" on public.employees
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "employees_delete_owner" on public.employees
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- VEHICLES
-- ============================================================
create policy "vehicles_select" on public.vehicles
  for select using (company_id = public.jwt_company_id());

create policy "vehicles_insert_owner_manager" on public.vehicles
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "vehicles_update_owner_manager" on public.vehicles
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "vehicles_delete_owner" on public.vehicles
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- REPAIR CUSTOMERS
-- ============================================================
create policy "repair_customers_select" on public.repair_customers
  for select using (company_id = public.jwt_company_id());

create policy "repair_customers_insert" on public.repair_customers
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager', 'staff')
  );

create policy "repair_customers_update_owner_manager" on public.repair_customers
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "repair_customers_delete_owner" on public.repair_customers
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- REPAIR ORDERS
-- ============================================================
create policy "repair_orders_select" on public.repair_orders
  for select using (company_id = public.jwt_company_id());

create policy "repair_orders_insert" on public.repair_orders
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager', 'staff')
  );

create policy "repair_orders_update_owner_manager" on public.repair_orders
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "repair_orders_delete_owner" on public.repair_orders
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- ESTIMATES
-- ============================================================
create policy "estimates_select" on public.estimates
  for select using (company_id = public.jwt_company_id());

create policy "estimates_insert" on public.estimates
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager', 'staff')
  );

create policy "estimates_update_owner_manager" on public.estimates
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "estimates_delete_owner" on public.estimates
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- SURVEYS
-- ============================================================
create policy "surveys_select" on public.surveys
  for select using (company_id = public.jwt_company_id());

create policy "surveys_insert" on public.surveys
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager', 'staff')
  );

create policy "surveys_update_owner_manager" on public.surveys
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "surveys_delete_owner" on public.surveys
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- INSURANCE ENTITIES
-- ============================================================
create policy "insurance_entities_select" on public.insurance_entities
  for select using (company_id = public.jwt_company_id());

create policy "insurance_entities_insert_owner_manager" on public.insurance_entities
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "insurance_entities_update_owner_manager" on public.insurance_entities
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "insurance_entities_delete_owner" on public.insurance_entities
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- REFERRAL SOURCES
-- ============================================================
create policy "referral_sources_select" on public.referral_sources
  for select using (company_id = public.jwt_company_id());

create policy "referral_sources_insert_owner_manager" on public.referral_sources
  for insert with check (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "referral_sources_update_owner_manager" on public.referral_sources
  for update using (
    company_id = public.jwt_company_id()
    and public.jwt_role() in ('owner', 'manager')
  );

create policy "referral_sources_delete_owner" on public.referral_sources
  for delete using (
    company_id = public.jwt_company_id()
    and public.jwt_role() = 'owner'
  );

-- ============================================================
-- IMPORT LOGS
-- ============================================================
-- Staff and above can view; only owner/manager can insert (via import API service role)
create policy "import_logs_select" on public.import_logs
  for select using (company_id = public.jwt_company_id());

-- Import API uses service_role key (bypasses RLS) — no insert policy needed here
