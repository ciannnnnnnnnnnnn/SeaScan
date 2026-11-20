-- =============================================================================
-- SeaScan 0012 - scan history, CNN model settings, real-time updates
-- -----------------------------------------------------------------------------
-- SCAN HISTORY (My Account): each signed-in user's own identification
--   results. Only the result is kept - never the photo. Users read and delete
--   their own rows; nobody else can read them.
-- MODEL SETTINGS (Admin > CNN Model): the "not sure" threshold of the species
--   model, the threshold of the seagrass check, and whether the Flask
--   server-side identification service may be used. One row. Everyone reads it
--   (the Scanner and the Flask API apply it); only admins change it, and every
--   change is written to the audit log.
-- IDENTIFICATION LOG: records whether a result came from the browser or from
--   the server-side identification service.
-- REAL-TIME: species, stations, model settings, the identification log,
--   sightings and scan history are added to Supabase Realtime, so open pages
--   update when they change. Row Level Security still decides who receives
--   which rows (e.g. a user only hears about their own scans).
-- =============================================================================

-- ------------------------------------------------------------- scan history
create table if not exists public.scan_history (
  id             bigint generated always as identity primary key,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  outcome        text not null check (outcome in ('identified', 'low_confidence', 'not_seagrass')),
  species_label  text check (species_label is null or species_label ~ '^[A-Za-z_]{3,60}$'),
  confidence     numeric(5, 2) check (confidence between 0 and 100),
  gate_score     numeric(5, 2) check (gate_score between 0 and 100),
  duration_ms    integer check (duration_ms between 0 and 600000),
  method         text not null default 'browser' check (method in ('browser', 'server')),
  check ((outcome = 'not_seagrass') = (species_label is null))
);

create index if not exists scan_history_user_idx on public.scan_history (user_id, created_at desc);

alter table public.scan_history enable row level security;

drop policy if exists "scan_history: read own" on public.scan_history;
create policy "scan_history: read own" on public.scan_history
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "scan_history: insert own" on public.scan_history;
create policy "scan_history: insert own" on public.scan_history
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "scan_history: delete own" on public.scan_history;
create policy "scan_history: delete own" on public.scan_history
  for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------ model settings
create table if not exists public.model_settings (
  id                         smallint primary key default 1 check (id = 1),
  species_threshold          numeric(4, 3) not null default 0.700 check (species_threshold between 0.50 and 0.99),
  gate_threshold             numeric(4, 3) not null default 0.870 check (gate_threshold between 0.50 and 0.99),
  server_identification      boolean not null default true,
  updated_at                 timestamptz not null default now(),
  updated_by                 uuid references auth.users (id) on delete set null
);

insert into public.model_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists model_settings_touch on public.model_settings;
create trigger model_settings_touch
  before update on public.model_settings
  for each row execute function public.touch_updated();

insert into public.role_permissions (role, permission) values ('admin', 'model.manage')
on conflict do nothing;

alter table public.model_settings enable row level security;

drop policy if exists "model_settings: public read" on public.model_settings;
create policy "model_settings: public read" on public.model_settings
  for select to anon, authenticated using (true);

drop policy if exists "model_settings: admin update" on public.model_settings;
create policy "model_settings: admin update" on public.model_settings
  for update to authenticated
  using (public.has_permission('model.manage')) with check (public.has_permission('model.manage'));
-- No insert or delete: there is exactly one row.

drop trigger if exists audit_model_settings on public.model_settings;
create trigger audit_model_settings after update on public.model_settings
  for each row execute function public.audit_row_change();

-- --------------------------------------------------- identification log: method
alter table public.identification_log add column if not exists method text not null default 'browser';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'identification_log_method_check') then
    alter table public.identification_log
      add constraint identification_log_method_check check (method in ('browser', 'server'));
  end if;
end $$;

-- ---------------------------------------------------------------- real-time
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['species', 'stations', 'station_species', 'model_settings', 'identification_log', 'sightings', 'scan_history'] loop
      if not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Deleted station_species rows must carry their keys so clients can react.
alter table public.station_species replica identity full;


