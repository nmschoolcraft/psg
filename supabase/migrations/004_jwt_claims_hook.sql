-- Migration 004: Custom JWT claims hook
--
-- Supabase calls this hook (auth.custom_access_token_hook) after a user
-- successfully authenticates. We inject company_id and role into the token
-- so that RLS policies can use auth.jwt()->>'company_id' and auth.jwt()->>'role'.
--
-- Setup required in Supabase dashboard:
--   Authentication → Hooks → Custom Access Token → enable this function

-- The employees table is the authoritative source for company_id + role.
-- We look up the authenticated user's email against employees.email.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer as $$
declare
  v_user_email  text;
  v_company_id  uuid;
  v_role        text;
  v_employee    record;
  v_claims      jsonb;
begin
  v_user_email := event->'user'->>'email';

  -- Look up employee record by email
  select e.company_id, e.role::text
  into v_company_id, v_role
  from public.employees e
  where lower(e.email) = lower(v_user_email)
    and e.active = true
  limit 1;

  -- If no employee record found, deny with empty claims
  -- (user will be redirected to onboarding)
  if v_company_id is null then
    return event;
  end if;

  -- Build custom claims
  v_claims := coalesce(event->'claims', '{}'::jsonb);
  v_claims := jsonb_set(v_claims, '{company_id}', to_jsonb(v_company_id::text));
  v_claims := jsonb_set(v_claims, '{role}',       to_jsonb(v_role));

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

-- Grant execute to supabase_auth_admin (required for hook)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from public, anon, authenticated;

-- ============================================================
-- ONBOARDING STATE CHECK
-- Returns true if the company profile is considered complete
-- (used by frontend to decide whether to redirect to onboarding)
-- ============================================================
create or replace function public.is_onboarding_complete(p_company_id uuid)
returns boolean language sql stable security definer as $$
  select
    name is not null
    and address is not null
    and phone is not null
    and email is not null
  from public.companies
  where id = p_company_id;
$$;
