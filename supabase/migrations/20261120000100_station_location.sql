-- =============================================================================
-- SeaScan 0013 - station location description
-- -----------------------------------------------------------------------------
-- A plain-language location for each survey station (road, barangay, beach or
-- resort), shown under the station name in the map popup. Entered by admins in
-- Admin > Stations; empty until then ("Location to be added"). Existing rules
-- apply: everyone reads, admins edit, every change is in the audit log.
-- =============================================================================

alter table public.stations add column if not exists location text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stations_location_length') then
    alter table public.stations
      add constraint stations_location_length check (location is null or char_length(location) <= 200);
  end if;
end $$;

comment on column public.stations.location is
  'Where the station is, in words: road, barangay, beach or resort. Shown in the map popup.';
