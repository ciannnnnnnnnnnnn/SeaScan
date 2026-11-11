-- =============================================================================
-- SeaScan 0003 - verified survey stations (Distribution Map)
-- -----------------------------------------------------------------------------
-- Stations and the species recorded at each come from the published surveys.
-- Coordinates stay NULL until entered from the papers; such stations are
-- listed on the map page but not pinned. Everyone reads; admins edit.
-- =============================================================================

create table if not exists public.stations (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  sources     text[] not null default '{}',   -- e.g. {'Angsinco-Jimenez et al. (2003)'}
  notes       text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  check ((latitude is null) = (longitude is null))
);

create table if not exists public.station_species (
  station_id  bigint not null references public.stations (id) on delete cascade,
  species_id  bigint not null references public.species (id) on delete cascade,
  source      text not null,
  primary key (station_id, species_id, source)
);

drop trigger if exists stations_touch on public.stations;
create trigger stations_touch
  before update on public.stations
  for each row execute function public.touch_updated();

alter table public.stations enable row level security;
alter table public.station_species enable row level security;

drop policy if exists "stations: public read" on public.stations;
create policy "stations: public read" on public.stations
  for select to anon, authenticated using (true);
drop policy if exists "stations: admin insert" on public.stations;
create policy "stations: admin insert" on public.stations
  for insert to authenticated with check (public.is_admin());
drop policy if exists "stations: admin update" on public.stations;
create policy "stations: admin update" on public.stations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "stations: admin delete" on public.stations;
create policy "stations: admin delete" on public.stations
  for delete to authenticated using (public.is_admin());

drop policy if exists "station_species: public read" on public.station_species;
create policy "station_species: public read" on public.station_species
  for select to anon, authenticated using (true);
drop policy if exists "station_species: admin insert" on public.station_species;
create policy "station_species: admin insert" on public.station_species
  for insert to authenticated with check (public.is_admin());
drop policy if exists "station_species: admin delete" on public.station_species;
create policy "station_species: admin delete" on public.station_species
  for delete to authenticated using (public.is_admin());

-- Species richness per station = number of distinct species recorded there.
create or replace view public.station_richness
with (security_invoker = true) as
select s.id as station_id,
       s.name,
       count(distinct ss.species_id)::int as species_count
from public.stations s
left join public.station_species ss on ss.station_id = s.id
group by s.id, s.name;

grant select on public.station_richness to anon, authenticated;
