-- ============================================================
-- Swiple v2 — Assistant IA Ghostwriting TikTok
-- Mai 2026 — DROP complet + recreate
-- Coller dans Supabase SQL Editor > New query > Run
-- ============================================================


-- ── 0. RESET (ordre inverse des dépendances) ─────────────────────────────────

drop table if exists public.messages      cascade;
drop table if exists public.orders        cascade;
drop table if exists public.applications  cascade;
drop table if exists public.briefs        cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.generations   cascade;
drop table if exists public.users         cascade;


-- ── 1. TABLE USERS ───────────────────────────────────────────────────────────

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text,
  avatar_color text default '#7C3AED',
  created_at   timestamptz default now()
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Trigger : auto-création profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _name text;
begin
  _name := coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1));
  insert into public.users (id, name)
  values (new.id, _name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. TABLE GENERATIONS ─────────────────────────────────────────────────────

create table public.generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  input      jsonb not null,
  -- { niche: text, idee: text, format: text, style: text }
  output     jsonb not null,
  -- { accroche: text, script: text[], captions: text[], montage: text[], conseil_pro: text }
  created_at timestamptz default now()
);

alter table public.generations enable row level security;

create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);

create policy "generations_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);

create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

create index generations_user_idx      on public.generations(user_id);
create index generations_user_date_idx on public.generations(user_id, created_at desc);


-- ── 3. TABLE SUBSCRIPTIONS ───────────────────────────────────────────────────

create table public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id     text,
  status                 text not null default 'active',
  -- 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_end     timestamptz not null,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- Le client peut lire sa propre subscription (statut affiché dans l'app)
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Écriture UNIQUEMENT via Edge Functions (service_role) — jamais depuis le client

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
