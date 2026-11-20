-- =============================================================================
-- SeaScan 16 - species sources as an APA reference list
-- -----------------------------------------------------------------------------
-- Rewrites the reference lines that file 9 put in species.sources into APA
-- (7th edition) style. The content is unchanged, only the form: authors,
-- (year), title, journal, volume(issue), pages. Text between *asterisks* is
-- shown in italics on the species profile, which also sorts the list
-- alphabetically.
--
-- Each line is replaced only if it is still exactly as file 9 wrote it, so
-- references added or edited in Admin > Species are left alone.
-- Running this file twice is safe.
-- =============================================================================

update public.species
set sources = regexp_replace(
  replace(replace(replace(replace(replace(replace(replace(replace(sources,
    'Angsinco-Jimenez et al. 2003: Jimenez, L. A., Nogodula, R. M., & Tans, D. P. Assessment of seagrass and macrobenthic algae in Pujada Bay, Mati, Davao Oriental. Davao Research Journal 6(1).',
    'Jimenez, L. A., Nogodula, R. M., & Tans, D. P. (2003). Assessment of seagrass and macrobenthic algae in Pujada Bay, Mati, Davao Oriental. *Davao Research Journal, 6*(1).'),
    'Sanchez-Delute et al. 2025: Sanchez-Delute, C. C., Atoy, S. E. B., & Ybanez, C. O., Jr. Seagrass ecosystems in Pujada Bay, Davao Oriental, Philippines. Academia Journal of Biology 47(3): 13-26.',
    'Sanchez-Delute, C. C., Atoy, S. E. B., & Ybanez, C. O., Jr. (2025). Seagrass ecosystems in Pujada Bay, Davao Oriental, Philippines. *Academia Journal of Biology, 47*(3), 13–26.'),
    'Sanchez 2017: Sanchez, C. C. Assessment of seagrass distribution in dugong grazing areas of Pujada Bay, Mati City, Philippines. Davao Research Journal 11(3): 16-29.',
    'Sanchez, C. C. (2017). Assessment of seagrass distribution in dugong grazing areas of Pujada Bay, Mati City, Philippines. *Davao Research Journal, 11*(3), 16–29.'),
    'Fortes 2013: Fortes, M. D. A review: Biodiversity, distribution and conservation of Philippine seagrasses. Philippine Journal of Science 142 (Special Issue): 95-111.',
    'Fortes, M. D. (2013). A review: Biodiversity, distribution and conservation of Philippine seagrasses. *Philippine Journal of Science, 142*(Special Issue), 95–111.'),
    'Short 2025: Short, F. T. Bioregional Guide to the Seagrass Species of the World: Tropical Indo-Pacific. SeagrassNet.',
    'Short, F. T. (2025). *Bioregional guide to the seagrass species of the world: Tropical Indo-Pacific*. SeagrassNet.'),
    'Seagrass-Watch: Seagrass-Watch HQ field booklet, species identification pages.',
    'Seagrass-Watch. (n.d.). *Seagrass-Watch HQ field booklet* [Species identification pages].'),
    'Flora Malesiana via Naturalis: Hydrocharitaceae, after den Hartog (1957), Flora Malesiana I, 5.',
    'den Hartog, C. (1957). Hydrocharitaceae. In *Flora Malesiana* (Series I, Vol. 5). Accessed via Naturalis.'),
    'Wikipedia: Pujada Bay (protected-area status, Proclamation No. 431, 1994).',
    'Pujada Bay. (n.d.). In *Wikipedia*.'),
  -- One Florabase line per genus (Cymodocea, Enhalus, Halodule, ...).
  'Florabase: (\w+) genus description \(H\. R\. Coleman, 2016, Western Australian Herbarium\)\.',
  'Coleman, H. R. (2016). *\1* [Genus description]. In *Florabase*. Western Australian Herbarium.',
  'g')
where sources is not null;
