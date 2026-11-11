-- =============================================================================
-- SeaScan 0007 - seed data
-- -----------------------------------------------------------------------------
-- SPECIES: the nine species the model identifies (class_names.json). Text for
-- eight of them is carried over unchanged from the app's earlier hard-coded
-- catalogue (src/data/species.js) and is marked needs_review = true: it has
-- NOT been checked against the sources. Halophila minor replaces Halophila
-- spinulosa (the model's class is H. minor); its fields are left empty.
--
-- TODO (researchers): fill or correct, from Angsinco-Jimenez et al. (2003) and
-- Sanchez-Delute et al. (2025), for every species:
--   common_name, local_name, leaf_morphology, rhizome_structure,
--   sheath_characteristics, reproductive_organs, ecological_role,
--   ecosystem_contribution, conservation_tips, conservation_status,
--   geographic_distribution, local_distribution_note, photo_url, sources.
-- Then set needs_review = false. This can be done in Admin > Species.
--
-- STATIONS: names as listed in the two surveys. Coordinates are NULL on
-- purpose. TODO (researchers): enter latitude/longitude from the papers and
-- add the species recorded at each station (Admin > Stations).
-- Re-running this file does not overwrite edits made in the app.
-- =============================================================================

insert into public.species
  (slug, scientific_name, model_label, common_name, local_name, leaf_shape, leaf_morphology,
   blade_length, blade_width, venation, leaf_margin, ecological_role, local_distribution_note, needs_review)
values
  ('cymodocea-rotundata', 'Cymodocea rotundata', 'Cymodocea_rotundata', 'Smooth Ribbon Seagrass', 'Lusay',
   'Ribbon-like', 'Smooth, rounded leaf tip', '7 - 15 cm', '0.2 - 0.4 cm', '9 - 13 veins', 'Smooth, smooth leaf sheath',
   'Forms dense meadows that trap fine silt and prevent coastal erosion.',
   'Common in shallow sandy-muddy intertidal zones of Taganilao.', true),
  ('cymodocea-serrulata', 'Cymodocea serrulata', 'Cymodocea_serrulata', 'Serrated Ribbon Seagrass', 'Lusay Serrated',
   'Ribbon-like', 'Distinctly serrated tip, wide blade', '6 - 15 cm', '0.4 - 0.9 cm', '13 - 17 veins', 'Distinctly serrated tips',
   'High leaf productivity contributing significant organic detritus to coastal food webs.',
   'Frequent in sublittoral sandy beds near Taganilao fishing reserves.', true),
  ('enhalus-acoroides', 'Enhalus acoroides', 'Enhalus_acoroides', 'Tropical Eelgrass', 'Lagu-lagu',
   'Ribbon-like', 'Ribbon-like, coarse sheath base', '30 - 150 cm', '1.2 - 2.0 cm', 'Direct parallel veins', 'Slightly serrated near apex',
   'Provides key nursery grounds for juvenile fish and dugongs; high carbon sequestration potential.',
   'Abundant in soft muddy substrates near the inner basin of Lawigan and sheltered coves of Pujada Island.', true),
  ('halodule-pinifolia', 'Halodule pinifolia', 'Halodule_pinifolia', 'Fine-leaf Seagrass', 'Lusay-pino Fine',
   'Ribbon-like', 'Hair-like ultra fine blades', '5 - 20 cm', '0.06 - 0.12 cm', '1 central vein', 'Slightly serrated tip',
   'Tolerates extreme salinities and exposure during low spring tides.',
   'Forms delicate carpets in shallow upper intertidal zones across Pujada Island.', true),
  ('halodule-uninervis', 'Halodule uninervis', 'Halodule_uninervis', 'Narrow-leaf Seagrass', 'Lusay-pino',
   'Ribbon-like', 'Three-toothed tip, narrow blade', '6 - 15 cm', '0.1 - 0.35 cm', '3 distinct veins', 'Tridentate (3-toothed) apex',
   'Pioneer colonizer capable of rapid horizontal rhizome extension.',
   'Widespread across intertidal sandy flats in Lawigan.', true),
  ('halophila-minor', 'Halophila minor', 'Halophila_minor', null, null,
   'Oval', null, null, null, null, null, null, null, true),
  ('halophila-ovalis', 'Halophila ovalis', 'Halophila_ovalis', 'Paddle Weed', 'Puso-puso',
   'Oval', 'Paired paddle-shaped leaves', '1 - 4 cm', '0.5 - 2.0 cm', '10 - 25 cross veins', 'Smooth margins',
   'Pioneer species that stabilizes disturbed sandy sediments and re-establishes degraded meadows.',
   'Found in sandy patches subject to moderate wave exposure in Pujada Island.', true),
  ('syringodium-isoetifolium', 'Syringodium isoetifolium', 'Syringodium_isoetifolium', 'Noodle Seagrass', 'Tubong-tubong',
   'Cylindrical', 'Cylindrical, spaghetti-like blades', '7 - 30 cm', '0.1 - 0.2 cm (diameter)', 'Central vascular bundle', 'Smooth round cross-section',
   'Adapts well to strong currents; provides habitat for juvenile pipefish and seahorses.',
   'Thrives in high-energy channels with moderate to strong tidal flow near Pujada Island.', true),
  ('thalassia-hemprichii', 'Thalassia hemprichii', 'Thalassia_hemprichii', 'Pacific Turtle Grass', 'Pugai',
   'Ribbon-like', 'Slightly curved blades, dark flecks', '10 - 40 cm', '0.4 - 1.0 cm', '10 - 17 veins', 'Smooth or micro-serrated apex',
   'Primary dietary staple for green sea turtles (Chelonia mydas) in shallow reef flats.',
   'Dominant species in intertidal reef flats across Taganilao and Lawigan coastlines.', true)
on conflict (scientific_name) do nothing;

-- Station names exactly as provided from the two surveys. "Macarnbol" is kept
-- as written in the source list - TODO: confirm the spelling (Macambol?).
insert into public.stations (name, sources) values
  ('Lawigan',                    array['Angsinco-Jimenez et al. (2003)', 'Sanchez-Delute et al. (2025)']),
  ('Taitaidaga',                 array['Angsinco-Jimenez et al. (2003)']),
  ('Manguihay',                  array['Angsinco-Jimenez et al. (2003)']),
  ('Dacab-Mamali',               array['Angsinco-Jimenez et al. (2003)']),
  ('Macarnbol',                  array['Angsinco-Jimenez et al. (2003)']),
  ('Juanivan Island-Taganilao',  array['Angsinco-Jimenez et al. (2003)']),
  ('Pujada Island',              array['Angsinco-Jimenez et al. (2003)', 'Sanchez-Delute et al. (2025)']),
  ('Bobon',                      array['Angsinco-Jimenez et al. (2003)']),
  ('Sandigan-Dahican',           array['Angsinco-Jimenez et al. (2003)']),
  ('Taganilao',                  array['Sanchez-Delute et al. (2025)'])
on conflict (name) do nothing;
