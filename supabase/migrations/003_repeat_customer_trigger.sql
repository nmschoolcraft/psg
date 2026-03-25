-- Migration 003: Repeat customer detection
--
-- A customer is flagged is_repeat=true when there are ≥2 repair orders
-- for a customer with a matching name/phone/email within the same company.
--
-- Matching logic (case-insensitive):
--   - phone match  OR  email match  OR  exact name match
-- The most conservative interpretation: any two ROs under the same company
-- for the same customer_id counts. We also support cross-customer dedup
-- (same phone/email, different customer records) via the scan function.

-- ============================================================
-- FUNCTION: check_and_update_repeat_status
-- Called after any insert/update/delete on repair_orders
-- ============================================================
create or replace function public.check_repeat_customer()
returns trigger language plpgsql security definer as $$
declare
  v_customer_id uuid;
  v_company_id  uuid;
  v_ro_count    integer;
  v_cust        record;
begin
  -- Determine which customer to evaluate
  if TG_OP = 'DELETE' then
    v_customer_id := old.customer_id;
    v_company_id  := old.company_id;
  else
    v_customer_id := new.customer_id;
    v_company_id  := new.company_id;
  end if;

  -- Nothing to do if no customer linked
  if v_customer_id is null then
    return coalesce(new, old);
  end if;

  -- Count ROs for this customer within the company
  select count(*) into v_ro_count
  from public.repair_orders
  where customer_id = v_customer_id
    and company_id  = v_company_id
    and status     <> 'cancelled';

  -- Update is_repeat flag
  update public.repair_customers
  set is_repeat = (v_ro_count >= 2)
  where id = v_customer_id;

  -- If this is the first RO for the customer, record it as first_order_id
  if TG_OP = 'INSERT' and v_ro_count = 1 then
    update public.repair_customers
    set first_order_id = new.id
    where id = v_customer_id
      and first_order_id is null;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_repair_orders_repeat_check
  after insert or update of customer_id, status or delete
  on public.repair_orders
  for each row execute function public.check_repeat_customer();

-- ============================================================
-- FUNCTION: merge_duplicate_customers
-- Optional utility: merges two customer records when the same
-- person has duplicate entries (same phone or email, same company).
-- Reassigns all ROs from source → target, then deletes source.
-- ============================================================
create or replace function public.merge_customers(
  p_company_id uuid,
  p_keep_id    uuid,  -- customer record to keep
  p_merge_id   uuid   -- customer record to delete/merge into keep
)
returns void language plpgsql security definer as $$
begin
  -- Validate both belong to same company
  if not exists (
    select 1 from public.repair_customers
    where id = p_keep_id and company_id = p_company_id
  ) or not exists (
    select 1 from public.repair_customers
    where id = p_merge_id and company_id = p_company_id
  ) then
    raise exception 'Both customers must belong to company %', p_company_id;
  end if;

  -- Reassign vehicles
  update public.vehicles
  set customer_id = p_keep_id
  where customer_id = p_merge_id and company_id = p_company_id;

  -- Reassign repair orders (triggers will re-evaluate is_repeat)
  update public.repair_orders
  set customer_id = p_keep_id
  where customer_id = p_merge_id and company_id = p_company_id;

  -- Reassign surveys (via ro cascade, no direct customer_id)

  -- Delete merged customer
  delete from public.repair_customers
  where id = p_merge_id and company_id = p_company_id;
end;
$$;

-- ============================================================
-- VIEW: potential_duplicate_customers
-- Surfaces customers within a company sharing phone or email
-- ============================================================
create or replace view public.potential_duplicate_customers as
select
  a.company_id,
  a.id   as customer_a_id,
  a.name as customer_a_name,
  b.id   as customer_b_id,
  b.name as customer_b_name,
  case
    when lower(a.phone) = lower(b.phone) then 'phone'
    when lower(a.email) = lower(b.email) then 'email'
    else 'name'
  end as match_type
from public.repair_customers a
join public.repair_customers b
  on  a.company_id = b.company_id
  and a.id < b.id  -- avoid duplicates
  and (
    (a.phone is not null and lower(a.phone) = lower(b.phone))
    or (a.email is not null and lower(a.email) = lower(b.email))
  );
