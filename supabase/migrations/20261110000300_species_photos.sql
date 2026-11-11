-- =============================================================================
-- SeaScan 0010 - species reference photos
-- -----------------------------------------------------------------------------
-- The photos are static files served with the web app from
-- seascan-app/public/species/<slug>.jpg (no metadata; checked 2026-11-10).
-- Only species without a photo are updated, so a photo uploaded later in
-- Admin > Species is never overwritten. Running this file twice is safe.
--
-- Cymodocea rotundata is left out on purpose: the supplied picture is a
-- dreamstime stock preview with a watermark. Add a licensed or own photo in
-- Admin > Species.
-- TODO (research team): the photos were collected from the web; record each
-- photo's source in photo_credit and get permission where needed.
-- =============================================================================

update public.species s
set photo_url    = '/species/' || s.slug || '.jpg',
    photo_credit = coalesce(s.photo_credit, v.credit)
from (values
  ('cymodocea-serrulata', null),
  ('enhalus-acoroides', null),
  ('halodule-pinifolia', null),
  ('halodule-uninervis', null),
  ('halophila-minor', '© Dave Burdick / guamreeflife.com'),
  ('halophila-ovalis', null),
  ('syringodium-isoetifolium', null),
  ('thalassia-hemprichii', null)
) as v(slug, credit)
where s.slug = v.slug
  and s.photo_url is null;
