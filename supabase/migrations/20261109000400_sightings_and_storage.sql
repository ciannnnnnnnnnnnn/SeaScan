-- =============================================================================
-- SeaScan 0004 - community sightings and their photos
-- -----------------------------------------------------------------------------
-- Signed-in users submit sightings (always 'pending'). Researchers and admins
-- approve, reject or delete them. The public map sees approved sightings
-- through public_sightings, which leaves out who submitted them and the photo.
-- Photos live in a PRIVATE bucket; the app strips EXIF (incl. GPS) before
-- upload, since the location is stored deliberately in latitude/longitude.
-- =============================================================================

create table if not exists public.sightings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  species_id        bigint not null references public.species (id) on delete restrict,
  latitude          double precision not null check (latitude between 6.72 and 7.08),     -- Mati City bounds
  longitude         double precision not null check (longitude between 126.08 and 126.40),
  location_source   text not null check (location_source in ('gps', 'map', 'demo')),
  observed_on       date not null default current_date,
  notes             text check (notes is null or char_length(notes) <= 500),
  photo_path        text,                                    -- object path in 'sighting-photos'
  model_confidence  numeric(5, 2) check (model_confidence between 0 and 100),
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note       text check (review_note is null or char_length(review_note) <= 500),
  reviewed_by       uuid references auth.users (id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  check (observed_on <= current_date + 1 and observed_on >= date '2000-01-01')
);

create index if not exists sightings_status_idx on public.sightings (status);
create index if not exists sightings_user_idx on public.sightings (user_id);

-- Review fields are set by the server, never trusted from the client.
create or replace function public.stamp_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  elsif new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists sightings_stamp_review on public.sightings;
create trigger sightings_stamp_review
  before insert or update on public.sightings
  for each row execute function public.stamp_review();

alter table public.sightings enable row level security;

drop policy if exists "sightings: read own or staff" on public.sightings;
create policy "sightings: read own or staff" on public.sightings
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "sightings: insert own" on public.sightings;
create policy "sightings: insert own" on public.sightings
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "sightings: staff review" on public.sightings;
create policy "sightings: staff review" on public.sightings
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "sightings: delete own pending or staff" on public.sightings;
create policy "sightings: delete own pending or staff" on public.sightings
  for delete to authenticated
  using ((user_id = auth.uid() and status = 'pending') or public.is_staff());

-- Public map feed: approved sightings only, no submitter and no photo.
-- Runs with the view owner's rights on purpose, so anonymous visitors can see
-- these columns without being able to read the sightings table itself.
create or replace view public.public_sightings as
select s.id, s.species_id, sp.scientific_name, s.latitude, s.longitude, s.observed_on, s.location_source
from public.sightings s
join public.species sp on sp.id = s.species_id
where s.status = 'approved';

grant select on public.public_sightings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private photo bucket. Files go under '<user id>/<file>'.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sighting-photos', 'sighting-photos', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "sighting-photos: upload own folder" on storage.objects;
create policy "sighting-photos: upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sighting-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "sighting-photos: read own or staff" on storage.objects;
create policy "sighting-photos: read own or staff" on storage.objects
  for select to authenticated
  using (bucket_id = 'sighting-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

drop policy if exists "sighting-photos: delete own or staff" on storage.objects;
create policy "sighting-photos: delete own or staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sighting-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
