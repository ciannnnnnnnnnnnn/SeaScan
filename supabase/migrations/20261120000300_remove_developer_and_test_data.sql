-- =============================================================================
-- SeaScan 15 - remove the developer role, test accounts and the demo location
-- -----------------------------------------------------------------------------
-- The app no longer has a Developer portal, a "Test Data" clean-up, test
-- accounts or a "Demo location" for sightings. This file removes them from
-- the database and deletes the data they produced:
--   * sightings recorded at the demo location
--   * sightings, questions, feedback and scan history of accounts marked as
--     test accounts
-- The test ACCOUNTS themselves (their logins) are not deleted here; remove them
-- in Authentication > Users if you no longer need them.
--
-- BEFORE RUNNING, see what will be deleted (run this first, on its own):
--
--   select 'test account' as what, u.email as detail
--   from public.profiles p join auth.users u on u.id = p.id where p.is_test_account
--   union all
--   select 'sighting photo to delete in Storage > sighting-photos', s.photo_path
--   from public.sightings s left join public.profiles p on p.id = s.user_id
--   where s.photo_path is not null and (s.location_source = 'demo' or p.is_test_account);
--
-- Photo files are not removed by SQL. Delete the listed ones by hand in
-- Storage > sighting-photos (without their sighting nobody can open them).
-- =============================================================================

begin;

-- ------------------------------------------------------------- test data
delete from public.sightings where location_source = 'demo';

-- Test accounts' data. Skipped on a database that never had the flag.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_test_account') then
    execute 'delete from public.sightings s using public.profiles p where p.id = s.user_id and p.is_test_account';
    execute 'delete from public.community_questions q using public.profiles p where p.id = q.user_id and p.is_test_account';
    execute 'delete from public.feedback f using public.profiles p where p.id = f.user_id and p.is_test_account';
    execute 'delete from public.scan_history h using public.profiles p where p.id = h.user_id and p.is_test_account';
  end if;
end $$;

-- ------------------------------------------------------ test-data clean-up
drop function if exists public.delete_test_session_data(timestamptz, timestamptz);

-- Only the clean-up deleted identification results; the log is now append-only.
drop policy if exists "identification_log: admin delete" on public.identification_log;

-- --------------------------------------------------------- developer role
-- Any developer account becomes an ordinary community account.
update public.profiles set role = 'community' where role = 'developer';

delete from public.role_permissions
where role = 'developer' or permission = 'testdata.delete';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('community', 'researcher', 'admin'));

alter table public.role_permissions drop constraint if exists role_permissions_role_check;
alter table public.role_permissions
  add constraint role_permissions_role_check check (role in ('community', 'researcher', 'admin'));

-- ---------------------------------------------------- test-account flag
-- Everything that reads profiles.is_test_account is redefined without it
-- before the column is dropped.
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.audit_row_change();

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null          -- null = SQL editor / service role
     and not public.has_permission('users.manage') then
    raise exception 'Only an administrator can change roles.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile id and created_at cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- The result columns change, so the function is dropped and created again.
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (id uuid, email text, display_name text, user_type text, role text,
               created_at timestamptz, last_sign_in_at timestamptz, sighting_count bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_permission('users.manage') then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.user_type, p.role,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.sightings s where s.user_id = p.id)
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

alter table public.profiles drop column if exists is_test_account;

-- ------------------------------------------------------- demo location
-- New sightings must use the device GPS or a point picked on the map.
alter table public.sightings drop constraint if exists sightings_location_source_check;
alter table public.sightings
  add constraint sightings_location_source_check check (location_source in ('gps', 'map'));

commit;
