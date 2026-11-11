-- =============================================================================
-- SeaScan 0008 - RBAC permissions, JWT role claims, audit log
-- -----------------------------------------------------------------------------
-- RBAC: roles map to named permissions (role_permissions). Every RLS policy
--   now asks has_permission('...') instead of checking a role name, so access
--   is changed in one table, not in every policy.
-- JWT: custom_access_token_hook puts the user's role and permissions into the
--   access token (claims user_role, permissions). The app uses them for the UI.
--   ENABLE IT in Dashboard > Authentication > Hooks (see DEPLOYMENT.md).
--   Policies still check the profiles table, so a role change or revocation
--   applies immediately, without waiting for the token to refresh.
-- AUDIT: every change made by staff (species, stations, roles, sighting
--   reviews, deletions, test-data clean-up) is written to audit_log by
--   database triggers. The log is append-only and readable by admins only.
-- =============================================================================

-- ---------------------------------------------------------------- RBAC
create table if not exists public.role_permissions (
  role        text not null check (role in ('community', 'researcher', 'admin', 'developer')),
  permission  text not null,
  primary key (role, permission)
);

comment on table public.role_permissions is
  'RBAC: which role holds which permission. Edit only via SQL (no API write access).';

insert into public.role_permissions (role, permission) values
  ('community',  'sightings.submit'),
  ('community',  'questions.ask'),
  ('developer',  'sightings.submit'),
  ('developer',  'questions.ask'),
  ('researcher', 'sightings.submit'),
  ('researcher', 'questions.ask'),
  ('researcher', 'sightings.review'),
  ('researcher', 'sightings.delete'),
  ('researcher', 'sightings.export'),
  ('researcher', 'feedback.read'),
  ('researcher', 'questions.answer'),
  ('admin',      'sightings.submit'),
  ('admin',      'questions.ask'),
  ('admin',      'sightings.review'),
  ('admin',      'sightings.delete'),
  ('admin',      'sightings.export'),
  ('admin',      'feedback.read'),
  ('admin',      'feedback.delete'),
  ('admin',      'questions.answer'),
  ('admin',      'questions.delete'),
  ('admin',      'species.manage'),
  ('admin',      'stations.manage'),
  ('admin',      'users.manage'),
  ('admin',      'testdata.delete'),
  ('admin',      'audit.read')
on conflict do nothing;

alter table public.role_permissions enable row level security;
drop policy if exists "role_permissions: signed-in read" on public.role_permissions;
create policy "role_permissions: signed-in read" on public.role_permissions
  for select to authenticated using (true);
-- No insert/update/delete policies: permissions change only through SQL.

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role = pr.role
    where pr.id = auth.uid() and rp.permission = p_permission
  );
$$;

create or replace function public.my_permissions()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select rp.permission
  from public.profiles pr
  join public.role_permissions rp on rp.role = pr.role
  where pr.id = auth.uid()
  order by 1;
$$;

grant execute on function public.has_permission(text), public.my_permissions() to anon, authenticated;

-- Keep the older helpers meaningful for any code that still calls them.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_permission('users.manage'); $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_permission('sightings.review'); $$;

-- ------------------------------------------ policies rewritten on permissions
-- profiles
drop policy if exists "profiles: read own or staff" on public.profiles;
create policy "profiles: read own or staff" on public.profiles
  for select to authenticated using (id = auth.uid() or public.has_permission('users.manage'));
drop policy if exists "profiles: admin updates any" on public.profiles;
create policy "profiles: admin updates any" on public.profiles
  for update to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.is_test_account is distinct from old.is_test_account)
     and auth.uid() is not null
     and not public.has_permission('users.manage') then
    raise exception 'Only an administrator can change roles or the test-account flag.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile id and created_at cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- species
drop policy if exists "species: admin insert" on public.species;
create policy "species: admin insert" on public.species for insert to authenticated with check (public.has_permission('species.manage'));
drop policy if exists "species: admin update" on public.species;
create policy "species: admin update" on public.species for update to authenticated using (public.has_permission('species.manage')) with check (public.has_permission('species.manage'));
drop policy if exists "species: admin delete" on public.species;
create policy "species: admin delete" on public.species for delete to authenticated using (public.has_permission('species.manage'));

drop policy if exists "species-photos: admin upload" on storage.objects;
create policy "species-photos: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'species-photos' and public.has_permission('species.manage'));
drop policy if exists "species-photos: admin update" on storage.objects;
create policy "species-photos: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'species-photos' and public.has_permission('species.manage'));
drop policy if exists "species-photos: admin delete" on storage.objects;
create policy "species-photos: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'species-photos' and public.has_permission('species.manage'));

-- stations
drop policy if exists "stations: admin insert" on public.stations;
create policy "stations: admin insert" on public.stations for insert to authenticated with check (public.has_permission('stations.manage'));
drop policy if exists "stations: admin update" on public.stations;
create policy "stations: admin update" on public.stations for update to authenticated using (public.has_permission('stations.manage')) with check (public.has_permission('stations.manage'));
drop policy if exists "stations: admin delete" on public.stations;
create policy "stations: admin delete" on public.stations for delete to authenticated using (public.has_permission('stations.manage'));
drop policy if exists "station_species: admin insert" on public.station_species;
create policy "station_species: admin insert" on public.station_species for insert to authenticated with check (public.has_permission('stations.manage'));
drop policy if exists "station_species: admin delete" on public.station_species;
create policy "station_species: admin delete" on public.station_species for delete to authenticated using (public.has_permission('stations.manage'));

-- sightings
drop policy if exists "sightings: read own or staff" on public.sightings;
create policy "sightings: read own or staff" on public.sightings for select to authenticated
  using (user_id = auth.uid() or public.has_permission('sightings.review'));
drop policy if exists "sightings: insert own" on public.sightings;
create policy "sightings: insert own" on public.sightings for insert to authenticated
  with check (user_id = auth.uid() and public.has_permission('sightings.submit'));
drop policy if exists "sightings: staff review" on public.sightings;
create policy "sightings: staff review" on public.sightings for update to authenticated
  using (public.has_permission('sightings.review')) with check (public.has_permission('sightings.review'));
drop policy if exists "sightings: delete own pending or staff" on public.sightings;
create policy "sightings: delete own pending or staff" on public.sightings for delete to authenticated
  using ((user_id = auth.uid() and status = 'pending') or public.has_permission('sightings.delete'));

drop policy if exists "sighting-photos: read own or staff" on storage.objects;
create policy "sighting-photos: read own or staff" on storage.objects for select to authenticated
  using (bucket_id = 'sighting-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('sightings.review')));
drop policy if exists "sighting-photos: delete own or staff" on storage.objects;
create policy "sighting-photos: delete own or staff" on storage.objects for delete to authenticated
  using (bucket_id = 'sighting-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('sightings.delete')));

-- feedback and questions
drop policy if exists "feedback: staff read" on public.feedback;
create policy "feedback: staff read" on public.feedback for select to authenticated using (public.has_permission('feedback.read'));
drop policy if exists "feedback: admin delete" on public.feedback;
create policy "feedback: admin delete" on public.feedback for delete to authenticated using (public.has_permission('feedback.delete'));

drop policy if exists "questions: read own or staff" on public.community_questions;
create policy "questions: read own or staff" on public.community_questions for select to authenticated
  using (user_id = auth.uid() or public.has_permission('questions.answer'));
drop policy if exists "questions: ask own" on public.community_questions;
create policy "questions: ask own" on public.community_questions for insert to authenticated
  with check (user_id = auth.uid() and answer is null and status = 'Open' and public.has_permission('questions.ask'));
drop policy if exists "questions: staff answer" on public.community_questions;
create policy "questions: staff answer" on public.community_questions for update to authenticated
  using (public.has_permission('questions.answer')) with check (public.has_permission('questions.answer'));
drop policy if exists "questions: delete own or admin" on public.community_questions;
create policy "questions: delete own or admin" on public.community_questions for delete to authenticated
  using (user_id = auth.uid() or public.has_permission('questions.delete'));

-- ------------------------------------------------------------------ audit log
create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid,                 -- null = SQL editor / system
  actor_email  text,
  actor_role   text,
  action       text not null,        -- insert | update | delete | role_change | review | bulk_delete
  table_name   text not null,
  record_id    text,
  old_data     jsonb,
  new_data     jsonb,
  details      text
);

create index if not exists audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;
drop policy if exists "audit_log: admin read" on public.audit_log;
create policy "audit_log: admin read" on public.audit_log for select to authenticated using (public.has_permission('audit.read'));
-- Append-only: no insert/update/delete policies, and no table rights to change it.
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;

create or replace function public.write_audit(
  p_action text, p_table text, p_record text, p_old jsonb, p_new jsonb, p_details text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, actor_email, actor_role, action, table_name, record_id, old_data, new_data, details)
  values (
    auth.uid(),
    (select u.email::text from auth.users u where u.id = auth.uid()),
    public.current_role_name(),
    p_action, p_table, p_record, p_old, p_new, p_details
  );
end;
$$;
revoke execute on function public.write_audit(text, text, text, jsonb, jsonb, text) from public, anon, authenticated;

-- One trigger function for all audited tables. Changes that ordinary users
-- make to their own data (submitting a sighting, asking a question) are not
-- staff actions and are not logged.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_action text := lower(tg_op);
  v_id text := coalesce(v_row ->> 'id',
                        concat_ws(':', v_row ->> 'station_id', v_row ->> 'species_id', v_row ->> 'source'));
begin
  -- Bulk clean-up writes one summary row instead of one row per record.
  if current_setting('seascan.bulk_audit', true) = 'on' then
    return coalesce(new, old);
  end if;

  if tg_table_name = 'sightings' then
    if not public.has_permission('sightings.review') and auth.uid() is not null then
      return coalesce(new, old);              -- owner editing their own sighting
    end if;
    if tg_op = 'UPDATE' and v_old ->> 'status' is distinct from v_new ->> 'status' then
      v_action := 'review';
    end if;
  elsif tg_table_name = 'profiles' then
    v_action := 'role_change';
  elsif tg_table_name = 'community_questions' and not public.has_permission('questions.answer')
        and auth.uid() is not null then
    return coalesce(new, old);
  end if;

  perform public.write_audit(v_action, tg_table_name, v_id, v_old, v_new);
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_species on public.species;
create trigger audit_species after insert or update or delete on public.species
  for each row execute function public.audit_row_change();

drop trigger if exists audit_stations on public.stations;
create trigger audit_stations after insert or update or delete on public.stations
  for each row execute function public.audit_row_change();

drop trigger if exists audit_station_species on public.station_species;
create trigger audit_station_species after insert or delete on public.station_species
  for each row execute function public.audit_row_change();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
  for each row
  when (old.role is distinct from new.role or old.is_test_account is distinct from new.is_test_account)
  execute function public.audit_row_change();

drop trigger if exists audit_sightings on public.sightings;
create trigger audit_sightings after update or delete on public.sightings
  for each row execute function public.audit_row_change();

drop trigger if exists audit_feedback on public.feedback;
create trigger audit_feedback after delete on public.feedback
  for each row execute function public.audit_row_change();

drop trigger if exists audit_questions on public.community_questions;
create trigger audit_questions after update or delete on public.community_questions
  for each row execute function public.audit_row_change();

-- Admin functions: permission-based, and the clean-up logs one summary row.
create or replace function public.admin_list_users()
returns table (id uuid, email text, display_name text, user_type text, role text, is_test_account boolean,
               created_at timestamptz, last_sign_in_at timestamptz, sighting_count bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_permission('users.manage') then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.user_type, p.role, p.is_test_account,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.sightings s where s.user_id = p.id)
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.delete_test_session_data(p_from timestamptz, p_to timestamptz)
returns table (photo_path text, deleted_sightings int, deleted_questions int, deleted_feedback int)
language plpgsql security definer set search_path = ''
as $$
declare
  v_paths text[];
  v_s int;
  v_q int;
  v_f int;
begin
  if not public.has_permission('testdata.delete') then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Give a valid time window (from < to).';
  end if;

  perform set_config('seascan.bulk_audit', 'on', true);

  with gone as (
    delete from public.sightings s using public.profiles p
    where p.id = s.user_id and p.is_test_account and s.created_at >= p_from and s.created_at < p_to
    returning s.photo_path
  )
  select array_agg(gone.photo_path) filter (where gone.photo_path is not null), count(*) into v_paths, v_s from gone;

  with gone as (
    delete from public.community_questions q using public.profiles p
    where p.id = q.user_id and p.is_test_account and q.created_at >= p_from and q.created_at < p_to
    returning 1
  )
  select count(*) into v_q from gone;

  with gone as (
    delete from public.feedback f
    where f.created_at >= p_from and f.created_at < p_to
      and (f.user_id is null or exists (select 1 from public.profiles p where p.id = f.user_id and p.is_test_account))
    returning 1
  )
  select count(*) into v_f from gone;

  perform set_config('seascan.bulk_audit', 'off', true);
  perform public.write_audit('bulk_delete', 'test_session_data', null, null,
    jsonb_build_object('from', p_from, 'to', p_to, 'sightings', v_s, 'questions', v_q, 'feedback', v_f),
    'Evaluation-session data deleted');

  if v_paths is null or cardinality(v_paths) = 0 then
    return query select null::text, v_s, v_q, v_f;
  else
    return query select unnest(v_paths), v_s, v_q, v_f;
  end if;
end;
$$;

-- ------------------------------------------------------- JWT custom claims
-- Adds user_role and permissions to every access token Supabase Auth issues.
-- Enable: Dashboard > Authentication > Hooks > Customize Access Token (JWT)
-- Claims > Postgres function: public.custom_access_token_hook.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  v_role text;
  v_perms jsonb;
begin
  select pr.role into v_role from public.profiles pr where pr.id = (event ->> 'user_id')::uuid;
  v_role := coalesce(v_role, 'community');
  select coalesce(jsonb_agg(rp.permission order by rp.permission), '[]'::jsonb) into v_perms
  from public.role_permissions rp where rp.role = v_role;

  v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_role));
  v_claims := jsonb_set(v_claims, '{permissions}', v_perms);
  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema public to supabase_auth_admin;
    grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
  end if;
end $$;
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
