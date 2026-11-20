-- =============================================================================
-- SeaScan 0014 - opt-in sharing of nickname and photo on the public map
-- -----------------------------------------------------------------------------
-- By default the public map shows a community sighting without who submitted
-- it and without its photo (as promised on the Help page). A submitter can now
-- choose, per sighting, to show their nickname and photo with it once a
-- researcher approves it. Existing sightings stay private (default false).
--
-- public_sightings gains submitter_name (the profile's nickname, never the
-- email) and photo_path, both filled only for shared sightings. Shared photos
-- of approved sightings become readable by anyone through a short-lived signed
-- link; all other sighting photos stay private as before.
-- =============================================================================

alter table public.sightings add column if not exists share_publicly boolean not null default false;

comment on column public.sightings.share_publicly is
  'The submitter chose to show their nickname and photo with this sighting on the public map (after approval).';

-- Same columns as before, in the same order, plus the two shared fields.
create or replace view public.public_sightings as
select s.id, s.species_id, sp.scientific_name, s.latitude, s.longitude, s.observed_on, s.location_source,
       case when s.share_publicly then p.display_name end as submitter_name,
       case when s.share_publicly then s.photo_path end as photo_path
from public.sightings s
join public.species sp on sp.id = s.species_id
left join public.profiles p on p.id = s.user_id
where s.status = 'approved';

grant select on public.public_sightings to anon, authenticated;

-- True when a storage path is the photo of an approved, shared sighting.
-- SECURITY DEFINER so the storage rule can check sightings, which anonymous
-- visitors cannot read themselves.
create or replace function public.is_public_sighting_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sightings s
    where s.photo_path = p_path and s.status = 'approved' and s.share_publicly
  );
$$;

grant execute on function public.is_public_sighting_photo(text) to anon, authenticated;

drop policy if exists "sighting-photos: shared on the public map" on storage.objects;
create policy "sighting-photos: shared on the public map" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'sighting-photos' and public.is_public_sighting_photo(name));
