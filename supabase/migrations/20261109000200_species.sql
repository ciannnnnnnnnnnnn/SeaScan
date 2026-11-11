-- =============================================================================
-- SeaScan 0002 - species catalogue (Digital Library, Scanner profile)
-- -----------------------------------------------------------------------------
-- Everyone can read; only admins can create, edit or delete.
-- model_label links a row to the species model's output (class_names.json).
-- Any field left NULL is shown in the app as "To be added".
-- needs_review = true marks content not yet verified by the researchers
-- against Angsinco-Jimenez et al. (2003) / Sanchez-Delute et al. (2025).
-- =============================================================================

create table if not exists public.species (
  id                      bigint generated always as identity primary key,
  slug                    text not null unique check (slug ~ '^[a-z0-9-]+$'),
  scientific_name         text not null unique,
  model_label             text unique,              -- e.g. 'Halophila_minor'
  common_name             text,
  local_name              text,
  leaf_shape              text,                     -- short filter value, e.g. 'Ribbon-like'
  leaf_morphology         text,
  blade_length            text,
  blade_width             text,
  venation                text,
  leaf_margin             text,
  rhizome_structure       text,
  sheath_characteristics  text,
  reproductive_organs     text,
  ecological_role         text,
  ecosystem_contribution  text,                     -- conservation guide: what it does for the ecosystem
  conservation_tips       text[] not null default '{}', -- conservation guide: what people can do
  conservation_status     text,                     -- e.g. IUCN category, as given by the sources
  geographic_distribution text,
  local_distribution_note text,                     -- notes specific to Pujada Bay / Mati City
  photo_url               text,
  photo_credit            text,
  sources                 text,
  needs_review            boolean not null default true,
  updated_at              timestamptz not null default now(),
  updated_by              uuid references auth.users (id) on delete set null
);

create or replace function public.touch_updated()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists species_touch on public.species;
create trigger species_touch
  before update on public.species
  for each row execute function public.touch_updated();

alter table public.species enable row level security;

drop policy if exists "species: public read" on public.species;
create policy "species: public read" on public.species
  for select to anon, authenticated using (true);

drop policy if exists "species: admin insert" on public.species;
create policy "species: admin insert" on public.species
  for insert to authenticated with check (public.is_admin());

drop policy if exists "species: admin update" on public.species;
create policy "species: admin update" on public.species
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "species: admin delete" on public.species;
create policy "species: admin delete" on public.species
  for delete to authenticated using (public.is_admin());

-- Public bucket for species reference photos (admins upload, everyone views).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('species-photos', 'species-photos', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "species-photos: admin upload" on storage.objects;
create policy "species-photos: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'species-photos' and public.is_admin());

drop policy if exists "species-photos: admin update" on storage.objects;
create policy "species-photos: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'species-photos' and public.is_admin());

drop policy if exists "species-photos: admin delete" on storage.objects;
create policy "species-photos: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'species-photos' and public.is_admin());
