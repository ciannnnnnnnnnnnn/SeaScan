-- =============================================================================
-- SeaScan 0006 - admin functions (user list)
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
    select p.id, u.email::text, p.display_name, p.user_type, p.role,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.sightings s where s.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
