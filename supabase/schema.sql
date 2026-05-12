-- ============================================================
-- Swiple — Schéma complet Ghostwriting TikTok
-- Mise à jour mai 2026 — toutes les tables utilisées dans le code
-- À coller dans l'éditeur SQL du dashboard Supabase (Run)
-- ============================================================


-- ── 1. TABLE USERS (profils étendus) ──────────────────────────────────────────

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text default 'client',        -- 'client' | 'prestataire'
  name          text,
  initials      text,
  bio           text,
  specialty     text,                         -- niveau freelance (Débutant / Confirmé / Expert)
  rating        numeric(3,1) default 5.0,
  missions      integer default 0,
  tags          text[],                       -- IDs des niches sélectionnées à l'inscription
  skills        text[],                       -- Labels affichés sur le profil
  avatar_color  text default '#8B5CF6',       -- couleur avatar dans les briefs
  level         text,                         -- alias specialty pour ghostwriters
  created_at    timestamptz default now()
);

alter table public.users enable row level security;

create policy "users_select_all"  on public.users for select using (true);
create policy "users_insert_own"  on public.users for insert with check (auth.uid() = id);
create policy "users_update_own"  on public.users for update using (auth.uid() = id);

-- Trigger : crée automatiquement une ligne users à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _role text;
  _name text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'client');
  _name := coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1));
  insert into public.users (id, role, name, initials, avatar_color)
  values (
    new.id,
    _role,
    _name,
    upper(left(_name, 1)) || upper(substr(split_part(_name, ' ', 2), 1, 1)),
    case _role
      when 'prestataire' then '#10B981'
      else '#7C3AED'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. TABLE BRIEFS (postés par les clients) ──────────────────────────────────

create table if not exists public.briefs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references auth.users(id) on delete cascade not null,
  type            text not null,              -- 'Script seul' | 'Script + Montage' | 'Pack mensuel'
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
  status          text default 'open',        -- 'open' | 'matched' | 'closed'
  created_at      timestamptz default now()
);

alter table public.briefs enable row level security;

create policy "briefs_insert_own"  on public.briefs for insert  with check (auth.uid() = client_id);
create policy "briefs_select"      on public.briefs for select  using (status = 'open' or auth.uid() = client_id);
create policy "briefs_update_own"  on public.briefs for update  using (auth.uid() = client_id);
create policy "briefs_delete_own"  on public.briefs for delete  using (auth.uid() = client_id);


-- ── 3. TABLE APPLICATIONS (candidatures des freelances) ───────────────────────

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
  message             text,                   -- message d'accompagnement
  proposed_rate       numeric(10,2),          -- tarif proposé
  status              text default 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at          timestamptz default now(),
  unique(brief_id, freelancer_id)
);

alter table public.applications enable row level security;

create policy "applications_insert_own"    on public.applications for insert
  with check (auth.uid() = freelancer_id);

create policy "applications_select"        on public.applications for select
  using (
    auth.uid() = freelancer_id
    or auth.uid() = (select client_id from public.briefs where id = brief_id)
  );

create policy "applications_update_client" on public.applications for update
  using (
    auth.uid() = (select client_id from public.briefs where id = brief_id)
  );


-- ── 4. TABLE ORDERS (missions en cours / historique) ──────────────────────────
-- Table la plus critique — utilisée par MissionsContext, OrdersScreen, MissionTracking

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  freelancer_id       uuid references auth.users(id) on delete set null,
  client_id           uuid references auth.users(id) on delete set null,
  brief_id            uuid references public.briefs(id) on delete set null,
  title               text not null,
  type                text,                   -- 'Script seul' | 'Script + Montage' | 'Pack mensuel'
  budget              numeric(10,2) default 0,
  price               numeric(10,2) default 0, -- alias budget côté client
  status              text default 'in_progress',
  -- Statuts valides : in_progress | delivered | completed | revision | cancelled
  color               text default '#8B5CF6',
  icon                text default 'sparkles-outline',
  deadline            text,
  client_name         text,
  client_initials     text,
  freelancer_name     text,
  freelancer_initials text,
  delivery_url        text,
  delivery_message    text,
  delivered_at        timestamptz,
  revision_count      integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.orders enable row level security;

-- Freelance : voir ses propres missions
create policy "orders_select_freelancer" on public.orders for select
  using (auth.uid() = freelancer_id);

-- Client : voir ses propres commandes
create policy "orders_select_client" on public.orders for select
  using (auth.uid() = client_id);

-- Freelance : créer une commande (quand il accepte un brief)
create policy "orders_insert_freelancer" on public.orders for insert
  with check (auth.uid() = freelancer_id);

-- Freelance + client : mettre à jour (statut, livraison…)
create policy "orders_update_freelancer" on public.orders for update
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- Trigger updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();


-- ── 5. TABLE MESSAGES (messagerie par mission) ────────────────────────────────

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null,              -- = order.id (UUID as text)
  sender_id       text not null,              -- user UUID ou 'system'
  sender_name     text,
  sender_initials text,
  text            text not null,
  msg_type        text default 'text',        -- 'text' | 'system' | 'delivery'
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id);

alter table public.messages enable row level security;

-- Lecture : participants à la conversation (via orders)
create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.orders o
      where o.id::text = conversation_id
        and (o.freelancer_id = auth.uid() or o.client_id = auth.uid())
    )
    or sender_id = 'system'
    or sender_id = auth.uid()::text
  );

-- Insertion : utilisateurs authentifiés
create policy "messages_insert" on public.messages for insert
  with check (auth.uid() is not null);


-- ── Index de performance ───────────────────────────────────────────────────────

create index if not exists briefs_client_idx        on public.briefs(client_id);
create index if not exists briefs_status_idx        on public.briefs(status);
create index if not exists applications_brief_idx   on public.applications(brief_id);
create index if not exists applications_freelancer_idx on public.applications(freelancer_id);
create index if not exists orders_freelancer_idx    on public.orders(freelancer_id);
create index if not exists orders_client_idx        on public.orders(client_id);
create index if not exists orders_status_idx        on public.orders(status);
