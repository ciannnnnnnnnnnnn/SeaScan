-- =============================================================================
-- SeaScan 0001 - user profiles and roles
-- -----------------------------------------------------------------------------
-- Roles (profiles.role):
--   community   public users: students, tourists, fisherfolk (see user_type)
--   researcher  reviews sightings, exports data
--   admin       manages species, stations, users; deletes test-session data
--   developer   kept for the existing Developer portal; no extra data rights
-- The role lives in public.profiles so admins can change it from the app.
-- Users can never change their own role or test flag (trigger below).
-- =============================================================================

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text check (display_name is null or char_length(display_name) between 1 and 60),
  user_type        text not null default 'other'
                     check (user_type in ('student', 'tourist', 'fisherfolk', 'researcher', 'other')),
  role             text not null default 'community'
                     check (role in ('community', 'researcher', 'admin', 'developer')),
  is_test_account  boolean not null default false,
  created_at       timestamptz not null default now()
);

comment on table public.profiles is 'One row per account. role drives permissions; display_name is optional (no real names needed).';

-- ---------------------------------------------------------------------------
-- Permission helpers. SECURITY DEFINER so they can read profiles without
-- tripping the profiles RLS policies (which themselves call these helpers).
-- ---------------------------------------------------------------------------
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Staff = researcher or admin: may review sightings and read all records.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role in ('admin', 'researcher') from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.current_role_name(), public.is_admin(), public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- New account -> profile row. Only non-privileged fields are taken from the
-- sign-up form; role always starts as 'community'.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := lower(coalesce(new.raw_user_meta_data ->> 'user_type', 'other'));
  v_name text := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if v_type not in ('student', 'tourist', 'fisherfolk', 'other') then
    v_type := 'other';
  end if;
  insert into public.profiles (id, display_name, user_type)
  values (new.id, left(v_name, 60), v_type)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that existed before this migration get a profile too. A role that
-- was previously stored in app_metadata is carried over.
insert into public.profiles (id, role)
select u.id,
       case when u.raw_app_meta_data ->> 'role' in ('community', 'researcher', 'admin', 'developer')
            then u.raw_app_meta_data ->> 'role' else 'community' end
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Only an admin (or the SQL editor / service role) may change role or the
-- test-account flag. Everyone else can only edit display_name and user_type.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.is_test_account is distinct from old.is_test_account)
     and auth.uid() is not null          -- null = SQL editor / service role
     and not public.is_admin() then
    raise exception 'Only an administrator can change roles or the test-account flag.'
      using errcode = '42501';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile id and created_at cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or staff" on public.profiles;
create policy "profiles: read own or staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: admin updates any" on public.profiles;
create policy "profiles: admin updates any" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No insert policy: rows are created only by the trigger above.
-- No delete policy: deleting the auth user (dashboard) cascades here.
