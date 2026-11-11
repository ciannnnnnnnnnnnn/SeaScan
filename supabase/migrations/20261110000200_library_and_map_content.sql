-- =============================================================================
-- SeaScan 0009 - Digital Library and Distribution Map content
-- -----------------------------------------------------------------------------
-- Source: "SeaScan Library & Map Content" (research team, 2026-11-10). Every
-- text below is taken from that document, which cites its sources in brackets.
--
-- SPECIES: fills morphology, rhizome, sheath, reproductive organs, ecological
--   role, conservation status, distribution, conservation tips and sources for
--   all nine species. The short quick-fact fields (blade length/width,
--   venation, leaf margin) are taken from the same document's leaf morphology
--   text; where it gives no value the existing value is kept (coalesce).
--   local_distribution_note is cleared: its old, unsourced text contradicted
--   the sourced distribution text. needs_review stays true until the marine
--   science adviser has read the content (untick it in Admin > Species).
--   Not covered by the document (left as they are): common_name, local_name,
--   ecosystem_contribution, photo_url.
--
-- STATIONS: coordinates and species-per-station from Angsinco-Jimenez et al.
--   (2003) and Sanchez-Delute et al. (2025). Lawigan was surveyed at two
--   different points, so it becomes two stations. The 2003 coordinates are the
--   team's conversion from degrees-minutes-seconds; the 2025 coordinates were
--   printed in an invalid form and read as decimal degrees (see each note).
--
-- Unlike the seed file, this file OVERWRITES these fields, including edits
-- made in the app. Running it twice is safe.
-- =============================================================================

-- ------------------------------------------------------------------ species
update public.species s
set leaf_morphology         = v.leaf_morphology,
    blade_length            = coalesce(v.blade_length, s.blade_length),
    blade_width             = coalesce(v.blade_width, s.blade_width),
    venation                = coalesce(v.venation, s.venation),
    leaf_margin             = coalesce(v.leaf_margin, s.leaf_margin),
    rhizome_structure       = v.rhizome_structure,
    sheath_characteristics  = v.sheath_characteristics,
    reproductive_organs     = v.reproductive_organs,
    ecological_role         = v.ecological_role,
    conservation_status     = 'IUCN Red List: Least Concern. Protected locally as part of the Pujada Bay Protected Landscape and Seascape. [Short 2025; Wikipedia: Pujada Bay]',
    geographic_distribution = v.geographic_distribution,
    local_distribution_note = null,
    -- Species-specific tip first, then the tips shared by every species.
    conservation_tips       = array[v.species_tip] || array[
      'Keep sewage, garbage and farm runoff out of the bay: nutrient pollution (eutrophication) is a major long-term threat to Philippine seagrass [Fortes 2013], and pollution is a named pressure in Pujada Bay [Sanchez-Delute et al. 2025].',
      'Speak up against reclamation and soil dumping near the shore: sedimentation and land reclamation damage Pujada Bay seagrass, especially at Taganilao [Sanchez-Delute et al. 2025; Sanchez 2017].',
      'Never use destructive fishing methods in or near seagrass beds [Sanchez 2017].',
      'When gleaning at low tide, do not uproot or trample seagrass; gleaners were among the human factors noted at Lawigan [Angsinco-Jimenez et al. 2003].',
      'Follow the rules of the Pujada Bay Protected Landscape and Seascape (Proclamation No. 431, 1994) [Wikipedia: Pujada Bay].',
      'Report your sightings in SeaScan: the 2025 study calls for continuous monitoring [Sanchez-Delute et al. 2025].'
    ],
    sources                 = concat_ws(E'\n',
      'Angsinco-Jimenez et al. 2003: Jimenez, L. A., Nogodula, R. M., & Tans, D. P. Assessment of seagrass and macrobenthic algae in Pujada Bay, Mati, Davao Oriental. Davao Research Journal 6(1).',
      'Sanchez-Delute et al. 2025: Sanchez-Delute, C. C., Atoy, S. E. B., & Ybanez, C. O., Jr. Seagrass ecosystems in Pujada Bay, Davao Oriental, Philippines. Academia Journal of Biology 47(3): 13-26.',
      'Sanchez 2017: Sanchez, C. C. Assessment of seagrass distribution in dugong grazing areas of Pujada Bay, Mati City, Philippines. Davao Research Journal 11(3): 16-29.',
      'Fortes 2013: Fortes, M. D. A review: Biodiversity, distribution and conservation of Philippine seagrasses. Philippine Journal of Science 142 (Special Issue): 95-111.',
      'Short 2025: Short, F. T. Bioregional Guide to the Seagrass Species of the World: Tropical Indo-Pacific. SeagrassNet.',
      'Seagrass-Watch: Seagrass-Watch HQ field booklet, species identification pages.',
      v.florabase,
      v.flora_malesiana,
      'Wikipedia: Pujada Bay (protected-area status, Proclamation No. 431, 1994).'
    ),
    needs_review            = true
from (values
  ('cymodocea-rotundata',
   'Flat, ribbon-like leaves 7–20 cm long and 2–5 mm wide, with 9–15 parallel veins and a smooth, rounded-to-squared tip. Its narrower blade and smooth tip separate it from C. serrulata. [Short 2025; Seagrass-Watch]',
   '7–20 cm', '2–5 mm', '9–15 parallel veins', 'Smooth, rounded-to-squared tip',
   'Creeping, non-woody rhizome with a short upright stem at each node and 1–5 roots per node. [Florabase: Cymodocea]',
   'Well-developed leaf sheath that stays on the stem after the blade falls, with a small flap (ligule) where sheath and blade meet. The leaf scar fully encircles the upright stem. [Seagrass-Watch; Florabase: Cymodocea; Short 2025]',
   'Male and female flowers grow on separate plants. Flowers are small, single and without petals; the male flower has two stalked stamens. Pollen is released as long threads carried by the water. The fruit is a dry, flattened, ridged nut. [Short 2025; Florabase: Cymodocea]',
   'Found at all three 2025 Pujada Bay stations, making up 29% of shoots at Pujada Island (1,626 shoots/m²). In 2001–02 it was the densest species at Taitaidaga (317 shoots/m²) and part of the bay''s Syringodium–Cymodocea–Halodule zone. Like other seagrass meadows, its beds shelter fish, shrimp and sea urchins. [Sanchez-Delute et al. 2025; Angsinco-Jimenez et al. 2003; Fortes 2013]',
   'Tropical Indo-Pacific; recorded in the Philippines. In Pujada Bay: Lawigan, Taitaidaga and Manguihay (2003); Taganilao, Lawigan and Pujada Island (2025); also common at the bay''s other sampled sites. [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'One of the most widespread seagrasses in the bay, so protecting water quality protects most of its meadows.',
   'Florabase: Cymodocea genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('cymodocea-serrulata',
   'Flat, ribbon-like leaves 6–15 cm long and 4–12 mm wide, with 13–17 parallel veins and a rounded, serrated (toothed) tip. The wider blade and toothed tip separate it from C. rotundata. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '6–15 cm', '4–12 mm', '13–17 parallel veins', 'Rounded, serrated (toothed) tip',
   'Robust, creeping rhizome with a short upright stem at each node and 1–5 roots per node. [Seagrass-Watch; Florabase: Cymodocea]',
   'Triangle-shaped leaf sheath that stays on the stem after the blade falls, with a ligule where sheath and blade meet. The leaf scar does not fully encircle the upright stem. [Short 2025; Florabase: Cymodocea]',
   'Male and female flowers grow on separate plants. Flowers are small, single and without petals; pollen is released as long threads carried by the water. The fruit is a dry, flattened, ridged nut. [Short 2025; Florabase: Cymodocea]',
   'One of the two species with limited distribution in Pujada Bay in 2001–02 (absent from Manguihay), and not recorded at any of the three 2025 stations. Like other seagrass meadows, its beds shelter fish, shrimp and sea urchins. [Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025; Fortes 2013]',
   'Tropical Indo-Pacific; recorded in the Philippines. In Pujada Bay: recorded in 2001–02 somewhere other than Manguihay (the paper does not say where); not found in 2025. [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'It is rare in the bay today. If you find it, submit a SeaScan sighting with a clear photo of the toothed leaf tip so researchers can confirm it.',
   'Florabase: Cymodocea genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('enhalus-acoroides',
   'The largest seagrass in Pujada Bay: strap-like leaves 30 cm to 2 m long and 10–20 mm wide, with a smooth, rounded tip. The leaf edge rolls around a tough fibre. [Short 2025; Angsinco-Jimenez et al. 2003]',
   '30 cm – 2 m', '10–20 mm', null, 'Smooth, rounded tip; edge rolled around a tough fibre',
   'Thick, creeping rhizome with short internodes, covered by long black bristles (fibrous remains of old leaves). Coarse, cord-like roots grow from its underside. [Short 2025; Seagrass-Watch; Florabase: Enhalus; Fortes 2013]',
   'Large, wide leaf sheaths with free margins; after the leaves die, the sheath fibres stay on the rhizome as the black bristles. [Florabase: Enhalus; Angsinco-Jimenez et al. 2003]',
   'Male and female flowers grow on separate plants. Male flowers form in clusters that break off and float open on the surface. Female flowers are single, on a stalk that reaches the surface at low tide. The fruit is a pointed, egg-shaped capsule with 8–14 seeds that splits open underwater. [Short 2025; Florabase: Enhalus]',
   'Sensitive to murky water (turbidity) and nutrient enrichment. In 2025 it was found only at undisturbed Pujada Island, at 9 shoots/m², and it had the lowest density in the bay''s dugong grazing areas. Its leaves grew 0.71–0.87 cm per day in 2001–02. [Sanchez-Delute et al. 2025; Sanchez 2017; Angsinco-Jimenez et al. 2003]',
   'Tropical Indo-Pacific; recorded in the Philippines. Grows from the intertidal zone to 2 m deep. In Pujada Bay: Lawigan (2003) and Pujada Island (2025). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'It needs clear water: keep soil, sewage and fertiliser runoff out of the bay. Its presence is a good sign of a healthy, low-disturbance site.',
   'Florabase: Enhalus genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('halodule-pinifolia',
   'Very narrow, flat leaves 10–30 cm long with a single central vein. The tip is rounded, with side teeth faint or absent, which separates it from the three-pointed tip of H. uninervis. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '10–30 cm', null, '1 central vein', 'Rounded tip; side teeth faint or absent',
   'Usually pale, creeping rhizome with clean black leaf scars; each node has one or more roots and a short upright stem. [Short 2025; Seagrass-Watch; Florabase: Halodule]',
   'Leaf sheath stays on the stem after the blade falls, with a ligule where sheath and blade meet; fallen leaves leave clean black scars on the rhizome. [Florabase: Halodule; Short 2025]',
   'Male and female flowers grow on separate plants. Flowers are tiny, single and without petals: the male flower is stalked, the female almost stalkless. The fruit is a small, hard-walled nut. [Short 2025; Florabase: Halodule]',
   'In 2001–02 it was among the seven species widespread across Pujada Bay''s main stations, part of the Syringodium–Cymodocea–Halodule zone. It was not recorded at the three 2025 stations. Like other seagrass meadows, its beds shelter fish, shrimp and sea urchins. [Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025; Fortes 2013]',
   'Tropical Indo-Pacific; recorded in the Philippines. Grows from the intertidal zone to 20 m deep. In Pujada Bay: Lawigan, Taitaidaga and Manguihay (2003). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003]',
   'It was not found in the 2025 survey, so every confirmed sighting helps. Photograph the leaf tip up close when you submit it.',
   'Florabase: Halodule genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('halodule-uninervis',
   'Narrow, flat leaves 10–30 cm long with a single central vein. The tip has three points (trident-shaped), with well-developed side teeth, which separates it from H. pinifolia. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '10–30 cm', null, '1 central vein', 'Three-pointed (trident) tip with well-developed side teeth',
   'Whitish, creeping rhizome with clean black leaf scars; each node has one or more roots and a short upright stem. [Short 2025; Seagrass-Watch; Florabase: Halodule]',
   'Leaf sheath stays on the stem after the blade falls, with a ligule where sheath and blade meet; fallen leaves leave black scars on the rhizome. [Florabase: Halodule; Short 2025]',
   'Male and female flowers grow on separate plants. Flowers are tiny, single and without petals: the male flower is stalked, the female almost stalkless. The fruit is a small, hard-walled nut. [Short 2025; Florabase: Halodule]',
   'In 2001–02 it was among the seven species widespread across Pujada Bay''s main stations, part of the Syringodium–Cymodocea–Halodule zone. It was not recorded at the three 2025 stations. Like other seagrass meadows, its beds shelter fish, shrimp and sea urchins. [Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025; Fortes 2013]',
   'Tropical Indo-Pacific; recorded in the Philippines. Grows from the intertidal zone to 20 m deep. In Pujada Bay: Lawigan, Taitaidaga and Manguihay (2003). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003]',
   'It was not found in the 2025 survey, so every confirmed sighting helps. Photograph the three-pointed leaf tip up close when you submit it.',
   'Florabase: Halodule genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('halophila-minor',
   'Small oval leaves 8–13 mm long and under 5 mm wide, with smooth edges and no hairs. Veins branch from a central midrib, with few cross-veins (4–8; fewer than H. ovalis), which, with its smaller size, separates it from H. ovalis. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '8–13 mm', 'Under 5 mm', 'Central midrib with 4–8 cross-veins', 'Smooth edges, no hairs',
   'Creeping rhizome; each node bears one to several roots, a leafy shoot and two scales. [Florabase: Halophila; Flora Malesiana via Naturalis]',
   'Leaves sit on stalks (petioles) whose bases may sheath the shoot; each node also carries a pair of small scales. [Florabase: Halophila; Flora Malesiana via Naturalis]',
   'Male and female flowers grow on separate plants. Flowers are single; the male flower breaks off and floats, and the female flower has only a ring of tiny tepals. The fruit is a small, thin-walled capsule that splits open underwater. [Short 2025; Florabase: Halophila]',
   'In 2001–02 it was widespread across the bay''s main stations and common at its other sampled sites, and with H. ovalis gave Taitaidaga the bay''s highest seagrass cover (41%; H. minor 8%). It was not recorded at the three 2025 stations. Like other seagrass meadows, its beds shelter fish, shrimp and sea urchins. [Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025; Fortes 2013]',
   'Tropical Indo-Pacific; recorded in the Philippines, often intertidal at 0.2–1 m depth. In Pujada Bay: Lawigan, Taitaidaga and Manguihay, plus Macambol, Sandigan-Dahican, Dacab-Mamali, Bobon and Juanivan Island-Taganilao (2003). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003]',
   'It grows on shallow flats people walk on at low tide, and its tiny leaves are easily crushed: step on bare sand, not on the green carpet.',
   'Florabase: Halophila genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   'Flora Malesiana via Naturalis: Hydrocharitaceae, after den Hartog (1957), Flora Malesiana I, 5.'),

  ('halophila-ovalis',
   'Oval leaves 1–4 cm long with smooth edges and no hairs. Veins branch from a central midrib with 8 or more pairs of cross-veins (11–25 in Philippine material), more than H. minor. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '1–4 cm', null, 'Central midrib with 8 or more pairs of cross-veins (11–25 in Philippine material)', 'Smooth edges, no hairs',
   'Creeping rhizome; each node bears one to several roots, a leafy shoot and two scales. [Florabase: Halophila; Flora Malesiana via Naturalis]',
   'Leaves sit on stalks (petioles) whose bases may sheath the shoot; each node also carries a pair of small scales. [Florabase: Halophila; Flora Malesiana via Naturalis]',
   'Male and female flowers grow on separate plants. Flowers are single; the male flower breaks off and floats, and the female flower has only a ring of tiny tepals. The fruit is a small, thin-walled capsule that splits open underwater. [Short 2025; Florabase: Halophila]',
   'The only seagrass confirmed as dugong food in Pujada Bay''s dugong grazing areas (Taganilao, Pujada Island, Lawigan). Found at all three 2025 stations, and the main contributor to Taitaidaga''s cover in 2001–02 (12%). [Sanchez 2017; Sanchez-Delute et al. 2025; Angsinco-Jimenez et al. 2003]',
   'Tropical Indo-Pacific; recorded in the Philippines. Grows from 0 to 10 m deep. In Pujada Bay: Lawigan, Taitaidaga and Manguihay (2003); Taganilao, Lawigan and Pujada Island (2025). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'Dugongs in Pujada Bay depend on it. Keep boats slow and anchors off seagrass in dugong areas, and never chase or touch a dugong.',
   'Florabase: Halophila genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   'Flora Malesiana via Naturalis: Hydrocharitaceae, after den Hartog (1957), Flora Malesiana I, 5.'),

  ('syringodium-isoetifolium',
   'The only seagrass in the bay with cylindrical (round, spaghetti-like) leaves: 7–30 cm long, 1–2 mm thick, with air channels inside and a tip that tapers to a point. [Short 2025; Seagrass-Watch; Fortes 2013]',
   '7–30 cm', '1–2 mm thick (round)', null, 'Round leaf; tip tapers to a point',
   'Creeping, non-woody rhizome with one or more roots and a short upright stem at each node. [Florabase: Syringodium]',
   'Leaf sheath with free margins that stays on the stem after the blade falls, with a ligule where sheath and blade meet; usually 2–3 leaves per stem. [Florabase: Syringodium]',
   'Male and female flowers grow on separate plants. Flowers are small, without petals, and grouped in branched clusters (cymes). The fruit is hard-walled with a two-branched beak. [Short 2025; Florabase: Syringodium; Fortes 2013]',
   'The most abundant seagrass at Pujada Island (39% of shoots, 2,187 shoots/m²) and Lawigan (46%) in 2025, and the densest species at Lawigan in 2001–02 (438 shoots/m²). It is part of the bay''s Syringodium–Cymodocea–Halodule zone. [Sanchez-Delute et al. 2025; Angsinco-Jimenez et al. 2003]',
   'Tropical Indo-Pacific; recorded in the Philippines, sometimes in pure stands. In Pujada Bay: Lawigan, Taitaidaga and Manguihay, plus the bay''s other sampled sites (2003); Taganilao, Lawigan and Pujada Island (2025). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'It is most abundant at Pujada Island and Lawigan, the less-disturbed 2025 sites; keeping them that way protects most of its meadows.',
   'Florabase: Syringodium genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   null),

  ('thalassia-hemprichii',
   'Ribbon-like leaves 10–40 cm long, often curved like a sickle, with 9–17 veins and a rounded, slightly serrated tip. Leaves often show small dark tannin spots, and can be reddish in shallow water. [Short 2025; Seagrass-Watch; Florabase: Thalassia]',
   '10–40 cm', null, '9–17 veins', 'Rounded, slightly serrated tip',
   'Thick, more or less woody creeping rhizome with scale leaves between the shoots; each node has one short root and one thin scale. Unlike Enhalus, the rhizome has no black fibres. [Short 2025; Seagrass-Watch; Florabase: Thalassia; Flora Malesiana via Naturalis; Fortes 2013]',
   'Pale leaf sheath with free margins; leaves grow in tufts of 2–6 on short side shoots. Its sheath is large enough that it was used for growth measurements in Pujada Bay. [Florabase: Thalassia; Angsinco-Jimenez et al. 2003]',
   'Male and female flowers grow on separate plants. Male flowers have 3 tepals and 3–12 stamens; female flowers have a long tube and 6–8 forked styles. The fruit is a round, spiny capsule that splits open underwater, releasing a few conical seeds. [Short 2025; Florabase: Thalassia]',
   'One of the most common seagrasses in Pujada Bay: highest density and abundance in the dugong grazing areas, 76% of shoots at heavily populated Taganilao and 41% at Lawigan (2025), and the densest species at Manguihay in 2001–02 (524 shoots/m²). Its leaves grew 0.34–0.39 cm per day. [Sanchez 2017; Sanchez-Delute et al. 2025; Angsinco-Jimenez et al. 2003]',
   'Widely distributed in the tropical Indo-Pacific; recorded in the Philippines. In Pujada Bay: Lawigan, Taitaidaga and Manguihay (2003); Taganilao, Lawigan and Pujada Island (2025). [Short 2025; Fortes 2013; Angsinco-Jimenez et al. 2003; Sanchez-Delute et al. 2025]',
   'It still dominates disturbed Taganilao, where the meadow has fewer species. Reducing pollution, sedimentation and reclamation there, as the 2025 study recommends, gives that meadow its best chance to recover.',
   'Florabase: Thalassia genus description (H. R. Coleman, 2016, Western Australian Herbarium).',
   'Flora Malesiana via Naturalis: Hydrocharitaceae, after den Hartog (1957), Flora Malesiana I, 5.')
) as v(slug, leaf_morphology, blade_length, blade_width, venation, leaf_margin,
       rhizome_structure, sheath_characteristics, reproductive_organs, ecological_role,
       geographic_distribution, species_tip, florabase, flora_malesiana)
where s.slug = v.slug;

-- ----------------------------------------------------------------- stations
-- "Macarnbol" in the manuscript is a scanning error for Macambol.
update public.stations set name = 'Macambol' where name = 'Macarnbol';
-- Lawigan was surveyed at two points 0.7 km apart: keep them as two stations.
update public.stations set name = 'Lawigan (2003 survey)' where name = 'Lawigan';

insert into public.stations (name, sources) values
  ('Lawigan (2003 survey)', array['Angsinco-Jimenez et al. (2003)']),
  ('Lawigan (2025 survey)', array['Sanchez-Delute et al. (2025)'])
on conflict (name) do nothing;

update public.stations st
set latitude = v.lat, longitude = v.lng, sources = v.sources, notes = v.notes
from (values
  ('Pujada Island', 6.7865, 126.2632, array['Sanchez-Delute et al. (2025)'],
   'Uninhabited; highest richness of the three 2025 sites. The 2003 paper also lists Pujada Island as a preliminary site but prints the same coordinates as Dacab-Mamali (13 km away), so the 2025 point is used. The 2025 paper prints its coordinates in an invalid form; they were read as decimal degrees - confirm on a map.'),
  ('Lawigan (2025 survey)', 6.7990, 126.3325, array['Sanchez-Delute et al. (2025)'],
   'Moderately populated; S. isoetifolium 46% of shoots. Coordinates printed in an invalid form in the paper and read as decimal degrees (0.7 km from the 2003 point) - confirm on a map.'),
  ('Taganilao', 6.8310, 126.2895, array['Sanchez-Delute et al. (2025)'],
   'Heavily populated; T. hemprichii 76% of shoots. Coordinates printed in an invalid form in the paper and read as decimal degrees (1.7 km from the 2003 Juanivan Island-Taganilao point) - confirm on a map.'),
  ('Lawigan (2003 survey)', 6.79889, 126.32611, array['Angsinco-Jimenez et al. (2003)'],
   'Outer bay, Pacific side; 40% cover; densest site (1,720 shoots/m²). Coordinates converted by the SeaScan team from the paper''s degrees-minutes-seconds.'),
  ('Taitaidaga', 6.88333, 126.18972, array['Angsinco-Jimenez et al. (2003)'],
   'Mouth of the bay; highest cover, 41%. Coordinates converted by the SeaScan team from the paper''s degrees-minutes-seconds.'),
  ('Manguihay', 6.88389, 126.27639, array['Angsinco-Jimenez et al. (2003)'],
   'Inner bay; 24% cover; E. acoroides and C. serrulata stated absent (the paper also reports E. acoroides growth measured here - check with the adviser). Coordinates converted by the SeaScan team from the paper''s degrees-minutes-seconds.'),
  ('Macambol', 6.96056, 126.22056, array['Angsinco-Jimenez et al. (2003)'],
   'Preliminary sampling only. Spelled "Macarnbol" in the manuscript (scanning error). Coordinates converted by the SeaScan team.'),
  ('Sandigan-Dahican', 6.90861, 126.29028, array['Angsinco-Jimenez et al. (2003)'],
   'Preliminary; narrow tidal flat, strong waves. Coordinates converted by the SeaScan team.'),
  ('Dacab-Mamali', 6.87528, 126.18361, array['Angsinco-Jimenez et al. (2003)'],
   'Preliminary sampling only. Coordinates converted by the SeaScan team.'),
  ('Bobon', 6.83361, 126.27444, array['Angsinco-Jimenez et al. (2003)'],
   'Preliminary; narrow tidal flat, strong waves. Coordinates converted by the SeaScan team.'),
  ('Juanivan Island-Taganilao', 6.83250, 126.27389, array['Angsinco-Jimenez et al. (2003)'],
   'Preliminary sampling only. Coordinates converted by the SeaScan team.')
) as v(name, lat, lng, sources, notes)
where st.name = v.name;

-- Species recorded at each station, only as each paper states it. The 2003
-- paper does not say where C. serrulata grew, so it is linked to no station.
insert into public.station_species (station_id, species_id, source)
select st.id, sp.id, v.source
from (values
  ('Pujada Island',          'Sanchez-Delute et al. (2025)', array['cymodocea-rotundata', 'enhalus-acoroides', 'halophila-ovalis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Lawigan (2025 survey)',  'Sanchez-Delute et al. (2025)', array['cymodocea-rotundata', 'halophila-ovalis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Taganilao',              'Sanchez-Delute et al. (2025)', array['cymodocea-rotundata', 'halophila-ovalis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Lawigan (2003 survey)',  'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'enhalus-acoroides', 'halophila-minor', 'halophila-ovalis', 'halodule-pinifolia', 'halodule-uninervis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Taitaidaga',             'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'halophila-ovalis', 'halodule-pinifolia', 'halodule-uninervis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Manguihay',              'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'halophila-ovalis', 'halodule-pinifolia', 'halodule-uninervis', 'syringodium-isoetifolium', 'thalassia-hemprichii']),
  ('Macambol',               'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'syringodium-isoetifolium']),
  ('Sandigan-Dahican',       'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'syringodium-isoetifolium']),
  ('Dacab-Mamali',           'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'syringodium-isoetifolium']),
  ('Bobon',                  'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'syringodium-isoetifolium']),
  ('Juanivan Island-Taganilao', 'Angsinco-Jimenez et al. (2003)', array['cymodocea-rotundata', 'halophila-minor', 'syringodium-isoetifolium'])
) as v(station, source, slugs)
join public.stations st on st.name = v.station
join public.species sp on sp.slug = any (v.slugs)
on conflict do nothing;
