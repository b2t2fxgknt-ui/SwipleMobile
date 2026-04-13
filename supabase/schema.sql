-- ============================================================
-- Swiple — Schéma Ghostwriting TikTok
-- À coller dans l'éditeur SQL de ton dashboard Supabase
-- ============================================================

-- ── Table briefs (postés par les clients) ─────────────────────────────────────

create table if not exists public.briefs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references auth.users(id) on delete cascade not null,
  type            text not null,                 -- 'Script seul' | 'Script + Montage' | 'Pack mensuel'
  title           text not null,
  activity        text,
  audience        text,
  subject         text,
  tone            text,
  platform        text default 'TikTok',
  posts_per_month integer default 4,
  budget          integer default 0,
  deadline        text,
  color           text,
  icon            text,
  status          text default 'open',           -- 'open' | 'matched' | 'closed'
  created_at      timestamptz default now()
);

alter table public.briefs enable row level security;

-- Clients : créer leurs propres briefs
create policy "briefs_insert_own"
  on public.briefs for insert
  with check (auth.uid() = client_id);

-- Freelances : lire tous les briefs ouverts / clients : lire les leurs
create policy "briefs_select"
  on public.briefs for select
  using (status = 'open' or auth.uid() = client_id);

-- Clients : mettre à jour leurs propres briefs
create policy "briefs_update_own"
  on public.briefs for update
  using (auth.uid() = client_id);


-- ── Table applications (candidatures des freelances) ─────────────────────────

create table if not exists public.applications (
  id                  uuid primary key default gen_random_uuid(),
  brief_id            uuid references public.briefs(id) on delete cascade not null,
  freelancer_id       uuid references auth.users(id) on delete cascade not null,
  freelancer_name     text,
  freelancer_initials text,
  specialty           text,
  rating              numeric(3,1) default 5.0,
  missions_count      integer default 0,
  bio                 text,
  status              text default 'pending',    -- 'pending' | 'accepted' | 'rejected'
  created_at          timestamptz default now(),
  unique(brief_id, freelancer_id)
);

alter table public.applications enable row level security;

-- Freelances : postuler (insérer leur propre candidature)
create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = freelancer_id);

-- Freelance + propriétaire du brief : lire les candidatures
create policy "applications_select"
  on public.applications for select
  using (
    auth.uid() = freelancer_id
    or auth.uid() = (
      select client_id from public.briefs where id = brief_id
    )
  );

-- Clients : mettre à jour le statut (accepted/rejected)
create policy "applications_update_client"
  on public.applications for update
  using (
    auth.uid() = (
      select client_id from public.briefs where id = brief_id
    )
  );


-- ── Extension table users (si elle n'existe pas déjà) ────────────────────────
-- Cette table étend auth.users avec les infos de profil freelance

do $$ begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'users') then
    create table public.users (
      id          uuid primary key references auth.users(id) on delete cascade,
      role        text default 'client',          -- 'client' | 'prestataire'
      name        text,
      initials    text,
      bio         text,
      specialty   text,
      rating      numeric(3,1) default 5.0,
      missions    integer default 0,
      created_at  timestamptz default now()
    );
    alter table public.users enable row level security;
    create policy "users_select_all" on public.users for select using (true);
    create policy "users_update_own" on public.users for update using (auth.uid() = id);
    create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
  end if;
end $$;
