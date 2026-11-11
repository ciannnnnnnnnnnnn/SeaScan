-- =============================================================================
-- SeaScan 0011 - identification log (written by the Flask API)
-- -----------------------------------------------------------------------------
-- One row per identification made in the Scanner: what the model answered and
-- how long it took. No photo, no account and no location is stored, so a row
-- cannot be linked to a person. Used to monitor the 5-second response target
-- and how often the model is unsure, after deployment.
--
-- The Flask API (app.py) inserts rows with the public anon key; the table's
-- CHECK rules limit what a row may contain. Researchers and admins read the
-- log; admins can delete rows (e.g. after user-testing sessions).
-- =============================================================================

create table if not exists public.identification_log (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  outcome        text not null check (outcome in ('identified', 'low_confidence', 'not_seagrass')),
  species_label  text check (species_label is null or species_label ~ '^[A-Za-z_]{3,60}$'),  -- model class, e.g. 'Halophila_minor'
  confidence     numeric(5, 2) check (confidence between 0 and 100),   -- species model, %
  gate_score     numeric(5, 2) check (gate_score between 0 and 100),   -- seagrass check, %
  duration_ms    integer not null check (duration_ms between 0 and 600000),
  model_version  text check (model_version is null or char_length(model_version) <= 60),
  device         text check (device is null or device in ('mobile', 'desktop')),
  -- A photo that failed the seagrass check has no species; any other result has one.
  check ((outcome = 'not_seagrass') = (species_label is null))
);

create index if not exists identification_log_created_idx on public.identification_log (created_at desc);

insert into public.role_permissions (role, permission) values
  ('researcher', 'identifications.read'),
  ('admin',      'identifications.read')
on conflict do nothing;

alter table public.identification_log enable row level security;

drop policy if exists "identification_log: anyone records" on public.identification_log;
create policy "identification_log: anyone records" on public.identification_log
  for insert to anon, authenticated with check (true);

drop policy if exists "identification_log: staff read" on public.identification_log;
create policy "identification_log: staff read" on public.identification_log
  for select to authenticated using (public.has_permission('identifications.read'));

drop policy if exists "identification_log: admin delete" on public.identification_log;
create policy "identification_log: admin delete" on public.identification_log
  for delete to authenticated using (public.has_permission('testdata.delete'));

-- No update policy: rows are never changed.
