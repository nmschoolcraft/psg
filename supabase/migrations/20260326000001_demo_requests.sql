-- Migration: demo_requests table for BSM landing page lead capture
-- Public-facing submissions go through service role API (bypasses RLS)

create table public.demo_requests (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  company     text not null,
  phone       text,
  message     text,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index idx_demo_requests_email on public.demo_requests(email);
create index idx_demo_requests_created_at on public.demo_requests(created_at desc);

-- Enable RLS — service role bypasses it; no anon policies needed
-- since inserts happen server-side via service role key
alter table public.demo_requests enable row level security;
