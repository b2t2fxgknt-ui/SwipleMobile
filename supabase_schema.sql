-- ============================================================
--  SWIPLE — Schema Supabase complet
--  À exécuter UNE FOIS dans l'éditeur SQL de ton projet Supabase
--  (Dashboard → SQL Editor → New query → coller → Run)
--
--  Idempotent : safe à ré-exécuter, ne détruit aucune donnée
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. USERS  (complète la table auth créée automatiquement)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.users (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  name             text,
  role             text default 'client',          -- 'client' | 'acheteur' | 'prestataire' | 'freelancer'
  bio              text,
  avatar_color     text default '#8B5CF6',
  initials         text,

  -- Freelancer fields
  specialty        text,                           -- 'Script seul' | 'Script + Montage' | 'Pack mensuel' ...
  daily_rate       numeric(10,2),
  is_available     boolean default true,
  response_time    text default '< 4h',
  delivery_time    text default '48h',
  tags             text[],
  rating           numeric(3,2) default 0,
  reviews_count    int default 0,
  missions_count   int default 0,

  -- Client/acheteur fields
  handle           text,
  tagline          text,
  activity_type    text,
  activity_desc    text,
  tiktok_stage     text,
  goals            text[],
  publish_freq     text,
  budget           text,
  posts_per_month  text,
  audiences        text[],

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Colonnes ajoutées progressivement (safe si table existe déjà)
alter table public.users add column if not exists specialty        text;
alter table public.users add column if not exists daily_rate       numeric(10,2);
alter table public.users add column if not exists is_available     boolean default true;
alter table public.users add column if not exists response_time    text default '< 4h';
alter table public.users add column if not exists delivery_time    text default '48h';
alter table public.users add column if not exists default_delivery text;
alter table public.users add column if not exists tags             text[];
alter table public.users add column if not exists skills           text[];
alter table public.users add column if not exists rating           numeric(3,2) default 0;
alter table public.users add column if not exists reviews_count    int default 0;
alter table public.users add column if not exists missions_count   int default 0;
alter table public.users add column if not exists avatar_color     text default '#8B5CF6';
alter table public.users add column if not exists initials         text;
alter table public.users add column if not exists handle           text;
alter table public.users add column if not exists tagline          text;
alter table public.users add column if not exists activity_type    text;
alter table public.users add column if not exists activity_desc    text;
alter table public.users add column if not exists tiktok_stage     text;
alter table public.users add column if not exists goals            text[];
alter table public.users add column if not exists publish_freq     text;
alter table public.users add column if not exists budget           text;
alter table public.users add column if not exists posts_per_month  text;
alter table public.users add column if not exists portfolio_url    text;
alter table public.users add column if not exists linkedin_url     text;
alter table public.users add column if not exists sector           text;
alter table public.users add column if not exists budget_range     text;
alter table public.users add column if not exists portfolio_items  jsonb   default '[]'::jsonb;
alter table public.users add column if not exists audiences       text[];
alter table public.users add column if not exists updated_at      timestamptz default now();

-- Auto-créer un profil vide à chaque inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.users (id, email, name, role, initials, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(meta->>'nom', meta->>'full_name', split_part(new.email, '@', 1)),
    coalesce(meta->>'role', 'client'),
    upper(left(coalesce(meta->>'nom', meta->>'full_name', 'U'), 1)),
    coalesce(meta->>'avatarColor', '#8B5CF6')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. BRIEFS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.briefs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references public.users(id) on delete cascade,
  type            text not null,                   -- 'Script seul' | 'Script + Montage' | 'Pack mensuel'
  title           text not null,
  activity        text,
  audience        text,
  subject         text,
  tone            text,
  platform        text default 'TikTok',
  posts_per_month int default 4,
  budget          numeric(10,2) default 0,
  deadline        text default '48h',
  color           text,
  icon            text,
  status          text default 'open',             -- 'open' | 'matched' | 'closed'
  urgent          boolean default false,
  created_at      timestamptz default now()
);

alter table public.briefs add column if not exists urgent    boolean default false;
alter table public.briefs add column if not exists activity  text;
alter table public.briefs add column if not exists audience  text;
alter table public.briefs add column if not exists subject   text;
alter table public.briefs add column if not exists tone      text;

create index if not exists briefs_client_id_idx on public.briefs(client_id);
create index if not exists briefs_status_idx    on public.briefs(status);

-- ─────────────────────────────────────────────────────────────
-- 3. APPLICATIONS  (candidatures des freelancers sur les briefs)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.applications (
  id                   uuid primary key default gen_random_uuid(),
  brief_id             text not null,              -- text car peut être UUID ou ID local "br123"
  freelancer_id        text not null,
  freelancer_name      text,
  freelancer_initials  text,
  specialty            text,
  rating               numeric(3,2),
  missions_count       int,
  bio                  text,
  message              text,
  proposed_rate        numeric(10,2),
  brief_ref            text,                       -- alias fallback
  status               text default 'pending',     -- 'pending' | 'accepted' | 'rejected'
  created_at           timestamptz default now(),
  constraint applications_brief_freelancer_unique unique (brief_id, freelancer_id)
);

alter table public.applications add column if not exists message       text;
alter table public.applications add column if not exists proposed_rate numeric(10,2);
alter table public.applications add column if not exists brief_ref     text;

create index if not exists applications_brief_id_idx     on public.applications(brief_id);
create index if not exists applications_freelancer_id_idx on public.applications(freelancer_id);
create index if not exists applications_status_idx        on public.applications(status);

-- ─────────────────────────────────────────────────────────────
-- 4. ORDERS  (missions créées après un match)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  brief_id             text,
  service_id           text,                       -- pour OrderScreen (achat direct d'un service)
  client_id            text,
  client_name          text,
  client_initials      text,
  freelancer_id        text,
  freelancer_name      text,
  freelancer_initials  text,
  title                text,
  type                 text,
  budget               numeric(10,2) default 0,
  price                numeric(10,2),              -- alias de budget pour OrderScreen
  deadline             text,
  color                text,
  status               text default 'en_cours',   -- 'pending'|'en_cours'|'livre'|'revision'|'valide'|'completed'|'paid'
  delivery_url         text,
  delivery_message     text,
  revision_count       int default 0,
  delivered_at         timestamptz,
  rating               numeric(3,2),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.orders add column if not exists brief_id            text;
alter table public.orders add column if not exists service_id          text;
alter table public.orders add column if not exists client_name         text;
alter table public.orders add column if not exists client_initials     text;
alter table public.orders add column if not exists freelancer_name     text;
alter table public.orders add column if not exists freelancer_initials text;
alter table public.orders add column if not exists title               text;
alter table public.orders add column if not exists type                text;
alter table public.orders add column if not exists budget              numeric(10,2) default 0;
alter table public.orders add column if not exists price               numeric(10,2);
alter table public.orders add column if not exists deadline            text;
alter table public.orders add column if not exists color               text;
alter table public.orders add column if not exists delivery_url        text;
alter table public.orders add column if not exists delivery_message    text;
alter table public.orders add column if not exists revision_count      int default 0;
alter table public.orders add column if not exists delivered_at        timestamptz;
alter table public.orders add column if not exists rating              numeric(3,2);
alter table public.orders add column if not exists updated_at          timestamptz default now();
alter table public.orders add column if not exists icon                text;

create index if not exists orders_client_id_idx     on public.orders(client_id);
create index if not exists orders_freelancer_id_idx on public.orders(freelancer_id);
create index if not exists orders_status_idx        on public.orders(status);

-- ─────────────────────────────────────────────────────────────
-- 5. SERVICES  (offres des freelancers)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.services (
  id             uuid primary key default gen_random_uuid(),
  freelancer_id  text,
  title          text not null,
  description    text,
  category       text,                             -- 'script_seul' | 'script_montage' | 'pack_mensuel' ...
  price          numeric(10,2) default 0,
  delivery_time  text,
  revisions      int default 1,
  tags           text[],
  is_active      boolean default true,
  created_at     timestamptz default now()
);

alter table public.services add column if not exists description  text;
alter table public.services add column if not exists revisions    int default 1;
alter table public.services add column if not exists tags         text[];
alter table public.services add column if not exists is_active    boolean default true;

create index if not exists services_freelancer_id_idx on public.services(freelancer_id);
create index if not exists services_is_active_idx     on public.services(is_active);

-- ─────────────────────────────────────────────────────────────
-- 6. MESSAGES  (chat entre client et freelancer)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  text not null,                  -- = order.id (uuid ou local id)
  sender_id        text not null,
  sender_name      text,
  sender_initials  text,
  text             text not null,
  msg_type         text default 'text',            -- 'text' | 'system'
  created_at       timestamptz default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx      on public.messages(created_at);

-- ⚠️  Active Realtime sur messages (obligatoire pour le temps réel)
-- À faire aussi dans Dashboard → Database → Replication → messages ✓
alter publication supabase_realtime add table public.messages;

-- ─────────────────────────────────────────────────────────────
-- 7. REVIEWS  (avis laissés après une mission)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  mission_id      text,                            -- = order.id
  reviewer_id     text,                            -- client qui laisse l'avis
  freelancer_id   text,                            -- freelancer évalué
  freelancer_name text,
  rating          int not null check (rating between 1 and 5),
  comment         text,
  tags            text[],
  created_at      timestamptz default now()
);

create index if not exists reviews_freelancer_id_idx on public.reviews(freelancer_id);
create index if not exists reviews_mission_id_idx    on public.reviews(mission_id);

-- Trigger : recalcule automatiquement la note moyenne du freelancer après chaque review
create or replace function public.update_freelancer_rating()
returns trigger language plpgsql security definer as $$
declare
  avg_rating numeric(3,2);
  cnt        int;
begin
  select avg(rating), count(*)
    into avg_rating, cnt
    from public.reviews
   where freelancer_id = new.freelancer_id;

  update public.users
     set rating        = round(avg_rating, 2),
         reviews_count = cnt,
         updated_at    = now()
   where id::text = new.freelancer_id;

  return new;
end;
$$;

drop trigger if exists on_review_inserted on public.reviews;
create trigger on_review_inserted
  after insert on public.reviews
  for each row execute procedure public.update_freelancer_rating();

-- ─────────────────────────────────────────────────────────────
-- 8. SAVED_SERVICES  (favoris côté client)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.saved_services (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  freelancer_id  text not null,
  created_at     timestamptz default now(),
  constraint saved_services_unique unique (user_id, freelancer_id)
);

create index if not exists saved_services_user_id_idx on public.saved_services(user_id);

-- ─────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS  (in-app, créées par triggers)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  type           text not null,   -- 'new_application'|'message'|'delivery'|'match'|'review'|'payment'
  title          text not null,
  body           text,
  read           boolean default false,
  action_screen  text,            -- ex: 'MissionTracking', 'Messagerie', 'Applicants'
  action_params  jsonb,           -- ex: {"missionId": "abc123"}
  created_at     timestamptz default now()
);

create index if not exists notifications_user_id_idx   on public.notifications(user_id);
create index if not exists notifications_read_idx      on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Trigger : notifie le client quand une candidature arrive sur son brief
create or replace function public.notify_on_application()
returns trigger language plpgsql security definer as $$
declare
  brief_client_id text;
  brief_title     text;
begin
  -- Récupérer le client du brief
  select client_id::text, title
    into brief_client_id, brief_title
    from public.briefs
   where id::text = new.brief_id
   limit 1;

  if brief_client_id is not null then
    insert into public.notifications (user_id, type, title, body, action_screen, action_params)
    values (
      brief_client_id,
      'new_application',
      '🎯 Nouvelle candidature',
      coalesce(new.freelancer_name, 'Un ghostwriter') || ' a postulé sur "' || coalesce(brief_title, 'votre brief') || '"',
      'Applicants',
      jsonb_build_object('briefId', new.brief_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_application_inserted on public.applications;
create trigger on_application_inserted
  after insert on public.applications
  for each row execute procedure public.notify_on_application();

-- Trigger : notifie le destinataire d'un message
create or replace function public.notify_on_message()
returns trigger language plpgsql security definer as $$
declare
  rec   public.orders%rowtype;
  notif_user_id text;
begin
  if new.msg_type = 'system' then return new; end if;

  -- Trouver la commande/mission associée à la conversation
  select * into rec from public.orders where id::text = new.conversation_id limit 1;
  if rec is null then return new; end if;

  -- Notifier l'autre partie
  if new.sender_id = rec.client_id then
    notif_user_id := rec.freelancer_id;
  else
    notif_user_id := rec.client_id;
  end if;

  if notif_user_id is not null then
    insert into public.notifications (user_id, type, title, body, action_screen, action_params)
    values (
      notif_user_id,
      'message',
      '💬 Nouveau message',
      coalesce(new.sender_name, 'Quelqu''un') || ' : ' || left(new.text, 60),
      'Messagerie',
      jsonb_build_object('missionId', new.conversation_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.notify_on_message();

-- Trigger : notifie le client quand une mission est livrée
create or replace function public.notify_on_delivery()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'livre' and (old.status is null or old.status <> 'livre') then
    if new.client_id is not null then
      insert into public.notifications (user_id, type, title, body, action_screen, action_params)
      values (
        new.client_id,
        'delivery',
        '📦 Livraison reçue',
        coalesce(new.freelancer_name, 'Votre ghostwriter') || ' a livré "' || coalesce(new.title, 'votre mission') || '"',
        'MissionTracking',
        jsonb_build_object('missionId', new.id)
      );
    end if;
  end if;

  -- Notifie le freelancer quand la mission est validée
  if new.status = 'valide' and (old.status is null or old.status <> 'valide') then
    if new.freelancer_id is not null then
      insert into public.notifications (user_id, type, title, body, action_screen, action_params)
      values (
        new.freelancer_id,
        'payment',
        '💸 Mission validée !',
        coalesce(new.client_name, 'Votre client') || ' a validé "' || coalesce(new.title, 'la mission') || '" · Paiement libéré',
        'MissionBrief',
        jsonb_build_object('missionId', new.id)
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row execute procedure public.notify_on_delivery();

-- ─────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────

-- users
alter table public.users enable row level security;
drop policy if exists "users_select_all"    on public.users;
drop policy if exists "users_update_own"    on public.users;
drop policy if exists "users_insert_own"    on public.users;
create policy "users_select_all"  on public.users for select using (true);
create policy "users_insert_own"  on public.users for insert with check (auth.uid() = id);
create policy "users_update_own"  on public.users for update using (auth.uid() = id);

-- briefs
alter table public.briefs enable row level security;
drop policy if exists "briefs_select_all"    on public.briefs;
drop policy if exists "briefs_insert_client" on public.briefs;
drop policy if exists "briefs_update_client" on public.briefs;
create policy "briefs_select_all"    on public.briefs for select using (true);
create policy "briefs_insert_client" on public.briefs for insert with check (auth.uid() = client_id);
create policy "briefs_update_client" on public.briefs for update using (auth.uid() = client_id);

-- applications
alter table public.applications enable row level security;
drop policy if exists "applications_select"  on public.applications;
drop policy if exists "applications_insert"  on public.applications;
drop policy if exists "applications_update"  on public.applications;
create policy "applications_select" on public.applications for select using (true);
create policy "applications_insert" on public.applications for insert with check (auth.uid()::text = freelancer_id or true);
create policy "applications_update" on public.applications for update using (true);

-- orders
alter table public.orders enable row level security;
drop policy if exists "orders_select_parties" on public.orders;
drop policy if exists "orders_insert_any"     on public.orders;
drop policy if exists "orders_update_parties" on public.orders;
create policy "orders_select_parties" on public.orders for select
  using (auth.uid()::text = client_id or auth.uid()::text = freelancer_id);
create policy "orders_insert_any"     on public.orders for insert with check (true);
create policy "orders_update_parties" on public.orders for update
  using (auth.uid()::text = client_id or auth.uid()::text = freelancer_id);

-- services
alter table public.services enable row level security;
drop policy if exists "services_select_active"    on public.services;
drop policy if exists "services_insert_freelancer" on public.services;
drop policy if exists "services_update_freelancer" on public.services;
create policy "services_select_active"     on public.services for select using (true);
create policy "services_insert_freelancer" on public.services for insert with check (auth.uid()::text = freelancer_id);
create policy "services_update_freelancer" on public.services for update using (auth.uid()::text = freelancer_id);

-- messages
alter table public.messages enable row level security;
drop policy if exists "messages_select_parties" on public.messages;
drop policy if exists "messages_insert_any"     on public.messages;
create policy "messages_select_parties" on public.messages for select using (true);
create policy "messages_insert_any"     on public.messages for insert with check (true);

-- reviews
alter table public.reviews enable row level security;
drop policy if exists "reviews_select_all"    on public.reviews;
drop policy if exists "reviews_insert_client" on public.reviews;
create policy "reviews_select_all"    on public.reviews for select using (true);
create policy "reviews_insert_client" on public.reviews for insert with check (true);

-- notifications
alter table public.notifications enable row level security;
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications for all
  using (auth.uid()::text = user_id);

-- saved_services
alter table public.saved_services enable row level security;
drop policy if exists "saved_own" on public.saved_services;
create policy "saved_own" on public.saved_services for all
  using (auth.uid()::text = user_id);

-- ─────────────────────────────────────────────────────────────
-- 11. REALTIME  (en plus de messages, activer si besoin)
-- ─────────────────────────────────────────────────────────────
-- À activer aussi dans Dashboard → Database → Replication :
--   ✓ messages        (déjà fait ci-dessus)
--   ✓ notifications   (pour les notifs in-app temps réel)

alter publication supabase_realtime add table public.notifications;

-- ─────────────────────────────────────────────────────────────
-- 12. PATCHES — corrections de bugs dans les triggers
-- ─────────────────────────────────────────────────────────────

-- Bug : notify_on_delivery vérifiait 'livre'/'valide' (valeurs locales FR)
-- mais l'app écrit 'delivered'/'completed' en DB via STATUS_TO_DB.
-- Correction : on accepte les deux conventions.

create or replace function public.notify_on_delivery()
returns trigger language plpgsql security definer as $$
begin
  -- Livraison : statut local 'livre' OU DB 'delivered'
  if new.status in ('livre', 'delivered')
     and (old.status is null or old.status not in ('livre', 'delivered')) then
    if new.client_id is not null then
      insert into public.notifications (user_id, type, title, body, action_screen, action_params)
      values (
        new.client_id,
        'delivery',
        '📦 Livraison reçue',
        coalesce(new.freelancer_name, 'Votre ghostwriter') || ' a livré "' || coalesce(new.title, 'votre mission') || '"',
        'MissionTracking',
        jsonb_build_object('missionId', new.id::text)
      );
    end if;
  end if;

  -- Validation : statut local 'valide' OU DB 'completed'
  if new.status in ('valide', 'completed')
     and (old.status is null or old.status not in ('valide', 'completed')) then
    if new.freelancer_id is not null then
      insert into public.notifications (user_id, type, title, body, action_screen, action_params)
      values (
        new.freelancer_id,
        'payment',
        '💸 Mission validée !',
        coalesce(new.client_name, 'Votre client') || ' a validé "' || coalesce(new.title, 'la mission') || '" · Paiement libéré',
        'MissionBrief',
        jsonb_build_object('missionId', new.id::text)
      );
    end if;
  end if;

  return new;
end;
$$;

-- Relancer le trigger sur INSERT aussi (missions insérées directement comme 'completed')
drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after insert or update of status on public.orders
  for each row execute procedure public.notify_on_delivery();

-- Auto-incrémenter missions_count du freelancer quand un ordre est complété
create or replace function public.increment_freelancer_missions()
returns trigger language plpgsql security definer as $$
declare
  is_now_done boolean;
  was_done    boolean;
begin
  is_now_done := new.status in ('valide', 'completed');
  was_done    := (tg_op = 'UPDATE' and old.status in ('valide', 'completed'));

  if is_now_done and not was_done and new.freelancer_id is not null then
    update public.users
       set missions_count = coalesce(missions_count, 0) + 1,
           updated_at     = now()
     where id::text = new.freelancer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_completed on public.orders;
create trigger on_order_completed
  after insert or update of status on public.orders
  for each row execute procedure public.increment_freelancer_missions();

-- ─────────────────────────────────────────────────────────────
-- FIN DU SCRIPT
-- ─────────────────────────────────────────────────────────────
-- Tables créées : users, briefs, applications, orders, services,
--                 messages, reviews, saved_services, notifications
-- Triggers      : on_auth_user_created, on_review_inserted,
--                 on_application_inserted, on_message_inserted,
--                 on_order_status_change, on_order_completed
-- RLS activée sur toutes les tables
-- ─────────────────────────────────────────────────────────────
