-- =============================================================================
-- SeaScan 0006 - admin functions (user list, test-session clean-up)
-- =============================================================================

-- User management list. Emails live in auth.users, which the browser cannot
-- read, so this admin-only function returns them together with the profile.
create or replace function public.admin_list_users()
returns table (
  id               uuid,
  email            text,
  display_name     text,
  user_type        text,
  role             text,
  is_test_account  boolean,
  created_at       timestamptz,
  last_sign_in_at  timestamptz,
  sighting_count   bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.user_type, p.role, p.is_test_account,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.sightings s where s.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- After user testing: delete what test accounts created in a time window,
-- plus anonymous feedback sent in that window. Returns the photo paths of the
-- deleted sightings so the app can remove the files from storage too.
create or replace function public.delete_test_session_data(p_from timestamptz, p_to timestamptz)
returns table (photo_path text, deleted_sightings int, deleted_questions int, deleted_feedback int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paths text[];
  v_s int;
  v_q int;
  v_f int;
begin
  if not public.is_admin() then
    raise exception 'Administrators only.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Give a valid time window (from < to).';
  end if;

  with gone as (
    delete from public.sightings s
    using public.profiles p
    where p.id = s.user_id and p.is_test_account
      and s.created_at >= p_from and s.created_at < p_to
    returning s.photo_path
  )
  select array_agg(gone.photo_path) filter (where gone.photo_path is not null), count(*)
    into v_paths, v_s from gone;

  with gone as (
    delete from public.community_questions q
    using public.profiles p
    where p.id = q.user_id and p.is_test_account
      and q.created_at >= p_from and q.created_at < p_to
    returning 1
  )
  select count(*) into v_q from gone;

  with gone as (
    delete from public.feedback f
    where f.created_at >= p_from and f.created_at < p_to
      and (f.user_id is null
           or exists (select 1 from public.profiles p where p.id = f.user_id and p.is_test_account))
    returning 1
  )
  select count(*) into v_f from gone;

  if v_paths is null or cardinality(v_paths) = 0 then
    return query select null::text, v_s, v_q, v_f;
  else
    return query select unnest(v_paths), v_s, v_q, v_f;
  end if;
end;
$$;

revoke execute on function public.delete_test_session_data(timestamptz, timestamptz) from public, anon;
grant execute on function public.delete_test_session_data(timestamptz, timestamptz) to authenticated;
