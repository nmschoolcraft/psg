-- RLS Test Suite for portal.psgweb.me v2
-- Run with: psql <connection_string> -f rls_tests.sql
--
-- Uses pgTAP (https://pgtap.org/) for structured test output.
-- Install: CREATE EXTENSION pgtap;
--
-- Tests verify:
--   1. Company A user cannot see Company B data
--   2. Role permissions (owner/manager/staff) are enforced
--   3. is_repeat trigger fires correctly

-- ============================================================
-- TEST SETUP
-- ============================================================
begin;

select plan(24);

-- Create test companies
insert into public.companies (id, name, email, phone, address)
values
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Shop Alpha', 'alpha@test.com', '555-0001', '1 Main St'),
  ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'Shop Beta',  'beta@test.com',  '555-0002', '2 Main St');

-- Create employees for both companies
insert into public.employees (id, company_id, name, email, role) values
  ('eeeeeeee-aaaa-0000-0000-000000000001'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Alpha Owner',   'owner@alpha.com',   'owner'),
  ('eeeeeeee-aaaa-0000-0000-000000000002'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Alpha Manager', 'manager@alpha.com', 'manager'),
  ('eeeeeeee-aaaa-0000-0000-000000000003'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Alpha Staff',   'staff@alpha.com',   'staff'),
  ('eeeeeeee-bbbb-0000-0000-000000000001'::uuid, 'bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'Beta Owner',    'owner@beta.com',    'owner');

-- Seed data for Alpha
insert into public.repair_customers (id, company_id, name, phone, email) values
  ('cccccccc-aaaa-0000-0000-000000000001'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'Alice A', '555-1111', 'alice@a.com'),
  ('cccccccc-bbbb-0000-0000-000000000001'::uuid, 'bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'Bob B',   '555-2222', 'bob@b.com');

-- ============================================================
-- HELPER: set JWT context for a given company + role
-- ============================================================
create or replace function test_set_jwt(p_company_id uuid, p_role text)
returns void language sql as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('company_id', p_company_id::text, 'role', p_role)::text,
    true  -- local to transaction
  );
$$;

-- ============================================================
-- TEST GROUP 1: Company isolation on repair_customers
-- ============================================================

-- Alpha owner can see Alpha customers
select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.repair_customers $$,
  $$ values (1) $$,
  'Alpha owner sees only Alpha customers'
);

-- Alpha owner cannot see Beta customers
select results_eq(
  $$ select count(*)::int from public.repair_customers
     where company_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid $$,
  $$ values (0) $$,
  'Alpha owner cannot access Beta customer rows'
);

-- Beta owner sees Beta customers only
select test_set_jwt('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.repair_customers $$,
  $$ values (1) $$,
  'Beta owner sees only Beta customers'
);

-- ============================================================
-- TEST GROUP 2: Role enforcement on employees
-- ============================================================

-- Staff cannot insert employees
select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'staff');
select throws_ok(
  $$ insert into public.employees (company_id, name, email, role)
     values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'New Staff', 'new@alpha.com', 'staff') $$,
  'new row violates row-level security policy',
  'Staff cannot insert employees'
);

-- Manager can insert employees
select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'manager');
select lives_ok(
  $$ insert into public.employees (company_id, name, email, role)
     values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'New Tech', 'tech@alpha.com', 'tech') $$,
  'Manager can insert employees'
);

-- Manager cannot delete employees (owner only)
select throws_ok(
  $$ delete from public.employees where name = 'New Tech' $$,
  'new row violates row-level security policy',
  'Manager cannot delete employees'
);

-- Owner can delete employees
select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'owner');
select lives_ok(
  $$ delete from public.employees where name = 'New Tech' $$,
  'Owner can delete employees'
);

-- ============================================================
-- TEST GROUP 3: Company isolation on repair_orders
-- ============================================================

-- Seed ROs for Alpha
insert into public.repair_orders (id, company_id, customer_id, ro_number, status)
values
  ('dddddddd-aaaa-0000-0000-000000000001'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
   'cccccccc-aaaa-0000-0000-000000000001'::uuid, 'RO-001', 'open'),
  ('dddddddd-aaaa-0000-0000-000000000002'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
   'cccccccc-aaaa-0000-0000-000000000001'::uuid, 'RO-002', 'open');

-- Alpha owner sees 2 ROs
select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.repair_orders $$,
  $$ values (2) $$,
  'Alpha owner sees 2 repair orders'
);

-- Beta owner sees 0 ROs
select test_set_jwt('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.repair_orders $$,
  $$ values (0) $$,
  'Beta owner sees 0 repair orders (isolation)'
);

-- ============================================================
-- TEST GROUP 4: is_repeat trigger
-- ============================================================

-- After 2 ROs for Alice A, is_repeat should be true
select results_eq(
  $$ select is_repeat from public.repair_customers
     where id = 'cccccccc-aaaa-0000-0000-000000000001'::uuid $$,
  $$ values (true) $$,
  'is_repeat = true after 2 ROs for same customer'
);

-- first_order_id should be set to the first RO
select results_eq(
  $$ select first_order_id from public.repair_customers
     where id = 'cccccccc-aaaa-0000-0000-000000000001'::uuid $$,
  $$ values ('dddddddd-aaaa-0000-0000-000000000001'::uuid) $$,
  'first_order_id set to first inserted RO'
);

-- After deleting one RO, is_repeat should revert to false
set local role postgres;  -- bypass RLS for cleanup
delete from public.repair_orders
where id = 'dddddddd-aaaa-0000-0000-000000000002'::uuid;

select results_eq(
  $$ select is_repeat from public.repair_customers
     where id = 'cccccccc-aaaa-0000-0000-000000000001'::uuid $$,
  $$ values (false) $$,
  'is_repeat = false after removing second RO'
);

-- ============================================================
-- TEST GROUP 5: Surveys isolation
-- ============================================================

select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'owner');

insert into public.surveys (ro_id, company_id, csi_score)
values ('dddddddd-aaaa-0000-0000-000000000001'::uuid,
        'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 9);

select test_set_jwt('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.surveys $$,
  $$ values (0) $$,
  'Beta owner sees 0 surveys (isolation)'
);

-- ============================================================
-- TEST GROUP 6: Import logs
-- ============================================================
set local role postgres;
insert into public.import_logs (company_id, filename, status)
values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'test.csv', 'completed');

select test_set_jwt('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'staff');
select results_eq(
  $$ select count(*)::int from public.import_logs $$,
  $$ values (1) $$,
  'Alpha staff can see Alpha import logs'
);

select test_set_jwt('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'owner');
select results_eq(
  $$ select count(*)::int from public.import_logs $$,
  $$ values (0) $$,
  'Beta owner cannot see Alpha import logs'
);

-- ============================================================
-- CLEANUP
-- ============================================================
select * from finish();
rollback;
