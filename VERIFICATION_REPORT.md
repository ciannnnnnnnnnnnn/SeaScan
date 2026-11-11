# SeaScan: Verification Report (code vs. manuscript)

**Manuscript checked:** `seascan-app/docs/SeaScan_Manuscript_UREB_Revised.docx` (sections quoted below as §x.y)
**Code checked:** working tree of `D:\SeaScan-main` on 2026-11-10 (branch `main`, HEAD `f52ff4d` plus uncommitted changes)
**Type of review:** audit only. No source file was changed. This report is the only file created.

## How this audit was done

| Step | Result |
|---|---|
| Read every page, component, hook and lib file the app routes to (`src/App.jsx` routes) | done |
| Read all 8 SQL migrations in `supabase/migrations/` (tables, RLS, storage, seed data) | done |
| Inspected both TF.js models (`model.json` format, weight dtypes, input/output signature, shard sizes) | done |
| Read `app.py`, `render.yaml`, `requirements.txt`, `vercel.json`, `.env.example`, `.gitignore`, `DEPLOYMENT.md`, `scripts/backup-db.ps1` | done |
| Scanned **all git history** for keys (`eyJhbGciOi…`, `service_role`, `sb_secret_`) | done (see NFR9) |
| `npm install` | ok. It reported 2 *high* advisories (vite dev server, source-map-js); both are build-time only. Note: `npm install` rewrote `seascan-app/package-lock.json`, which was already modified before the audit; check `git diff seascan-app/package-lock.json` if that matters to you |
| `npm run build` | **passes** (one 866 kB JS chunk, warning only) |
| `npm run lint` (oxlint) | **0 errors, 25 warnings** (mostly `set-state-in-effect`, `only-export-components`) |
| Existing tests | There is no unit test suite. `scripts/test_models.mjs` exists but needs `test_photos/seagrass` and `test_photos/not_seagrass`, which are not in the repo, so it **could not be run** |
| Mockup images (Figures 12-17) | extracted from the .docx and compared |

**Limits of this audit (things that could not be checked):**
- The **live Supabase project** was not accessed. Statements about tables, RLS and data are based on the migration files. Whether these migrations were actually applied, whether the JWT hook is enabled, and whether admins have since edited species and station data in the live database must be confirmed in the Supabase dashboard.
- The app was not run in real browsers or phones, so timings (NFR1) and browser behaviour (NFR6, NFR7) are **code-based estimates**, not measurements.
- The Python training/preprocessing script (`enhance_and_flip.py`) is not in the repo, so training-vs-browser preprocessing parity could only be checked against the JS comments and `app_settings.json`.

Status legend: **MET**, **PARTIAL**, **NOT MET**, **CONFLICT** (code contradicts the manuscript), **N/A-CODE** (research activity; the row lists what the system must provide).

---

## A. Specific Objectives (§1.3)

| ID | Requirement | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| O1 | CNN (transfer learning) identifies the 9 Mati City species from user photos | **MET** | Real route: `src/App.jsx:65` `/scanner` → `src/components/ScannerPage.jsx`. Flow: `selectFiles()` (L83-96) validates with `lib/images.js` → `triggerScan()` (L112-130) → `classifySeagrass()` in `src/components/seagrassModel.js` (L121-172) → `prepareCanvas()` in `src/components/seascanPreprocess.js` → gate model → species model (9 outputs, `public/models/seascan_tfjs/model.json` output shape `[-1, 9]`) → result UI (L340-531). Profile text comes from Supabase via `hooks/useCatalog.js` `speciesByModelLabel()` (L52-53). | Field accuracy is not verifiable in code (no test photos in the repo). Put the held-out test photos in `seascan-app/test_photos/` and run `node scripts/test_models.mjs` to show that the browser pipeline reproduces the offline 96.9%. |
| O2 | Digital library to browse **and** search the 9 species; profiles with leaf morphology, rhizome, sheath, reproductive organs, ecological role, conservation status, distribution, GPS-verified stations | **PARTIAL** | Code is complete. Browse/search: `src/pages/DigitalLibraryPage.jsx` (search on scientific/common/local name L20-29; leaf-shape and status filters). Profile: `src/pages/SpeciesProfilePage.jsx` L102-157 shows every required field plus a station mini-map. Schema has all columns: `supabase/migrations/20261109000200_species.sql` L11-39. | **Content is missing.** Per the seed (`20261109000700_seed_species_and_stations.sql`): for all 9 species `rhizome_structure`, `sheath_characteristics`, `reproductive_organs`, `conservation_status`, `geographic_distribution`, `ecosystem_contribution`, `conservation_tips`, `photo_url`, `sources` are empty; *Halophila minor* has no text at all; all 9 are `needs_review = true`; **no station has coordinates or species links**, so "GPS-Verified Station Locations" show "To be added" for every species. Fix: researchers enter content in Admin → Species / Stations (no code change). |
| O3 | Distribution map: (a) historically verified stations, (b) GPS-tagged user sightings, within Mati City | **PARTIAL** | (a) `src/pages/DistributionMapPage.jsx` L170-200 draws stations with source, species and richness. 10 station names are seeded (`…seed…sql` L66-77). (b) Sightings: `src/components/SightingForm.jsx` (GPS / tap-map / demo point, Mati bounding box L13, L104-107), stored in `sightings` with a DB-level bounds check (`20261109000400_sightings_and_storage.sql` L15-16), shown after approval (L202-229). | (a) is **not visible yet**: all station `latitude/longitude` are NULL and `station_species` is empty, so the map shows **0 station markers** and every richness count is 0. Researchers must enter coordinates and species-per-station with their source. (b) is MET. |
| O4 | Responsive interface for students, tourists, fisherfolk and researchers; SUS ≥ 70; ISO/IEC 25010 questionnaire | **N/A-CODE** | Evaluation activity. | For the sessions the system needs: generic test accounts (E2 ✔), a demo location (E1 ✔), data deletion after the sessions (E3 ✔), and **a usable phone layout for the Community Hub, which is currently broken** (see NFR7). This must be fixed before the sessions, because participants signed in with community test accounts land there. |
| O5 | CNN evaluation: Accuracy/Precision/Recall/F1 per species + 9×9 confusion matrix | **N/A-CODE** | `src/pages/AboutModelPage.jsx` (route `/about-model`) displays results from `src/data/modelMetrics.js`. | In `modelMetrics.js` L17-25 **all per-species values are `null`** (they show "to be added"), and the confusion-matrix image path `/model/confusion_matrix.png` **does not exist** (`public/model/` is missing). Only the overall 96.9% is filled in. No evaluation notebook or report is in the repo. Add the per-class report values and the matrix PNG, and keep the evaluation files (notebook, classification report, matrix) in the repo or the appendices. |

## B. Functional Requirements (§3.3, Requirements Specification 1)

| ID | Requirement | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| FR1 | Upload **or** capture with the device camera (phone rear camera, desktop webcam) | **MET** | Upload: file picker + drag-drop (`ScannerPage.jsx` L208-228, `accept="image/jpeg,image/png"`). Camera: `src/components/CameraCapture.jsx` `getUserMedia({ facingMode: { ideal: 'environment' } })` L22-23, front/back switch L99-103, `playsInline` for iOS L83, readable error for denied/no camera L34-40. The camera button is hidden when unsupported (L7-8). | Camera and GPS require **HTTPS** (fine on Vercel; fails on `http://<LAN-IP>` during local phone tests). |
| FR2 | Automatic identification with the CNN, same preprocessing as training | **MET** | See the detailed check below. | Two minor unverifiable points, plus one behaviour gap (silent gate fallback). Details below. |
| FR3 | Result shows scientific name, common name, leaf morphology, rhizome, sheath, reproductive organs, ecological role, conservation status, distribution, GPS stations; plus a link to the full profile | **PARTIAL** | `ScannerPage.jsx`: scientific name L391-393, common/local name L394-400, blade length/width/venation/margin L464-469, ecological role L475-483, distribution + verified stations L485-505, conservation status inside `ConservationGuide` L509, **"Full profile in the Digital Library"** link L520-528. | (1) **Code gap:** the Scanner result does **not** show `leaf_morphology`, `rhizome_structure`, `sheath_characteristics` or `reproductive_organs` (only on the profile page). Add four `<Fact>` rows next to L465-468 (small). (2) Content gap: most of these fields are empty (see O2). |
| FR4 | Digital library: browse, search, view all 9. DB or hard-coded? Empty fields? | **PARTIAL** | Data comes from **Supabase** (`lib/api.js` `fetchSpecies()` L45-47 via `useCatalog`), editable by admins in Admin → Species (`components/staff/SpeciesManager.jsx`), protected by RLS (`species.manage`). | Empty fields per the seed: listed under O2. Also note a **second, hard-coded** species text source, `public/seagrass/species.json` (3D viewer), with different common names (e.g. *Enhalus acoroides*: "Tape seagrass" in the JSON, "Tropical Eelgrass" in the DB). Only its hotspot labels are displayed, but this content is not editable by admins and not marked for review. |
| FR5 | Educational content + conservation tips per species ("Conservation Guide": how it helps the ecosystem + what users can do) | **PARTIAL** | Component exists and is shown on both the Scanner result and the profile: `src/components/SpeciesFacts.jsx` `ConservationGuide` L33-73 ("Why it matters" = `ecosystem_contribution`, "How you can help" = `conservation_tips[]`, plus status). | **Content missing for all 9** (`ecosystem_contribution`, `conservation_tips`, `conservation_status` are empty in the seed), so every guide currently reads "To be added". |
| FR6 | Roles (students, tourists, researchers, administrators) enforced by RBAC (Supabase Auth + RLS) | **MET** (in code) | Roles: `profiles.role` ∈ community/researcher/admin/developer; students/tourists/fisherfolk are `profiles.user_type` with community permissions (`20261109000100_profiles_and_roles.sql` L13-22). Permissions table + `has_permission()` (`20261110000100_rbac_jwt_audit.sql` L18-90). **Every table has RLS ON** (table below). Users cannot change their own role (trigger L105-128 / L110-124). | Confirm in the dashboard that the migrations are applied (Database → Tables shows "RLS enabled"). The manuscript's role list differs from the code (students and tourists are user types, not separate roles; there is an extra `developer` role). Update the manuscript text, or drop the `developer` role. |
| FR7 | Numerical confidence on **every** result; below 70% a clearly visible advisory to retake in better light or consult an expert | **MET** | Threshold 0.70 from `public/models/seascan_tfjs/app_settings.json`. Confident result: big % (L407-414). Below threshold: amber `role="alert"` box "Not sure - please retake … Retake the photo in better lighting … or consult a marine science expert" with the % (L362-379). Gate rejection also shows its % (L353-358). Alternatives are shown with % (L426-448). | — |
| FR8 | Map shows the 2003 and 2025 stations with source and species, accepts GPS sightings, shows sightings separately and labelled unverified, species richness per station/zone, species filter | **PARTIAL** | Stations seeded with the correct sources: Lawigan (2003+2025), Taitaidaga, Manguihay, Dacab-Mamali, Macarnbol, Juanivan Island-Taganilao, Pujada Island (2003+2025), Bobon, Sandigan-Dahican, Taganilao (2025) (`…seed…sql` L66-77). Separate layer "Community sightings (unverified)" with gold pins and the popup "Community-submitted, unverified" (`DistributionMapPage.jsx` L202-216). Richness per station: marker size + side list (L31-32, L256-293) and view `station_richness`. Species filter (L95-99). | (1) No coordinates and no species links → **nothing pinned, richness = 0** (content). (2) **Richness per coastal zone is not implemented**: there is no zone concept in the schema; it needs zone definitions from the researchers. (3) The map page has **no "submit sighting" button of its own**; it links to the Scanner (L294-296). See E1. (4) Spelling "Macarnbol" is flagged in the seed as unconfirmed. |

### FR2 detail: model loading and preprocessing vs. training

| Check | Expected | Code | OK? |
|---|---|---|---|
| Loader | `tf.loadGraphModel` | `seagrassModel.js` L91 `tf.loadGraphModel(\`${dir}/model.json\`)` | ✔ |
| Model paths exist | `public/models/seascan_tfjs/`, `public/models/gate_tfjs/` | L20-21; both folders have `model.json` + 3 shards; `format: graph-model` | ✔ |
| Gate runs first | gate → species only if passed | L153-160 (`score >= 0.87`, then species) | ✔ (but see difference 1) |
| Max side 1024 | `MAX_SIDE = 1024` | `seascanPreprocess.js` L16, L127-132 | ✔ |
| Enhancement | contrast stretch → Gaussian denoise → unsharp mask | `enhanceRGBA()` L83-121, called by `prepareCanvas()` L140 | ✔ (constants match the comments; Python original not in repo) |
| Resize | `resizeBilinear([320,320], alignCorners=false, halfPixelCenters=true)` | `seagrassModel.js` L138 `tf.image.resizeBilinear(pixels, [h, w], false, true)` | ✔ |
| Pixel range | raw 0-255, **no /255** | L130 `fromPixels(canvas).cast("float32")`, no division. The graph contains the rescaling ops itself (`Mul`/`AddV2`), consistent with Keras MobileNetV3 `include_preprocessing`. | ✔ |
| Input size | 320×320 | Both `model.json` signatures are `[-1,320,320,3]`; `app_settings.json` `input_size: [320,320]` | ✔ |
| Label order | `class_names.json` order | Code uses `app_settings.json` `class_names` (L86, L162), which is **identical** to `class_names.json` (verified) | ✔ |
| Gate output meaning | P(seagrass) | One sigmoid output; `class_names: ["not_seagrass","seagrass"]` → output = class 1 = seagrass (Keras alphabetical convention) | ✔ (assumed; confirm with the training notebook) |

**Differences found:**
1. **Silent gate fallback.** If the gate model fails to load, the species model runs alone and only a `console.warn` is written (`seagrassModel.js` L64-70). The user is not told that non-seagrass photos are no longer filtered. Suggest showing a notice or refusing to identify.
2. **First downscale is done by the browser** (`ctx.drawImage` with `imageSmoothingQuality = "high"`, `seascanPreprocess.js` L135-138), not by the resampler used in Python. The resampling filter differs slightly between Chrome, Safari and Firefox. This is a small numeric difference; verify by running `test_models.mjs` on the test set.
3. **EXIF orientation:** browsers rotate photos by their EXIF tag when decoding. If the training script did not apply `ImageOps.exif_transpose`, rotated phone photos are seen differently in training and in the browser. Check the training script.
4. Transparent PNGs are composited on black by the canvas. This is an edge case and has no impact for normal photos.
5. TensorFlow.js is loaded from a CDN (`index.html` L27, `cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0`), not bundled. Version pinning is good, but it is an external dependency (see NFR3).

### FR6 / NFR10: every table, RLS status and policies (from migrations; the final state after `20261110000100_rbac_jwt_audit.sql`)

| Table / object | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `profiles` | ON | own row, or `users.manage` | none (created by trigger `handle_new_user`) | own row (trigger blocks role/test-flag change unless `users.manage`); any row with `users.manage` | none (cascade from `auth.users`) |
| `species` | ON | anon + authenticated | `species.manage` | `species.manage` | `species.manage` |
| `stations` | ON | anon + authenticated | `stations.manage` | `stations.manage` | `stations.manage` |
| `station_species` | ON | anon + authenticated | `stations.manage` | none | `stations.manage` |
| `sightings` | ON | own, or `sightings.review` | own `user_id` + `sightings.submit`; trigger forces `status='pending'` | `sightings.review` (all columns) | own while pending, or `sightings.delete` |
| `feedback` | ON | `feedback.read` | anon + authenticated (`user_id` null or self) | none | `feedback.delete` |
| `community_questions` | ON | own, or `questions.answer` | own, unanswered, `questions.ask` | `questions.answer` | own, or `questions.delete` |
| `role_permissions` | ON | authenticated | none (SQL only) | none | none |
| `audit_log` | ON | `audit.read` | revoked (triggers only) | revoked | revoked |
| view `public_sightings` | runs as owner | anon + authenticated: approved only; no `user_id`, no photo | — | — | — |
| view `station_richness` | `security_invoker` | anon + authenticated | — | — | — |
| bucket `species-photos` | **public**, 5 MB, JPEG/PNG | public | `species.manage` | `species.manage` | `species.manage` |
| bucket `sighting-photos` | **private**, 5 MB, JPEG/PNG | own folder, or `sightings.review` | own folder only (`<uid>/…`) | none | own folder, or `sightings.delete` |

Role → permissions: community/developer = submit sightings, ask questions; researcher = + review/delete/export sightings, read feedback, answer questions; admin = everything + species, stations, users, test-data deletion, audit log.

Minor RLS notes: researchers can update **any column** of a sighting, not only its status (column-level grants could restrict this). Anonymous feedback has no rate limit, so it can be spammed.

## C. Non-Functional Requirements (§3.3, Requirements Specification 2)

| ID | Requirement | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| NFR1 | Identification within 5 s | **PARTIAL** (not measured) | Models preload when the Scanner opens with the message "Loading identification model…" (`ScannerPage.jsx` L65-69, L182-187); there is a warm-up run (`seagrassModel.js` L93-98); `vercel.json` caches `/models/*` for 7 days. **Download size: species 11.9 MB + gate 11.9 MB ≈ 24 MB of float32 weights**, plus the TF.js library from the CDN. | First visit: roughly 20 s on a 10 Mbit/s mobile link just to download the weights, so the **first identification will exceed 5 s** on mobile data. After the models are loaded: the JS enhancement on a 1024 px image (two Gaussian passes × 3 channels plus a sort) and two MobileNetV3 inferences on WebGL are estimated at about 1-4 s on a mid-range phone. Fixes: quantize (D5); start preloading on the Home page; measure on a real mid-range Android and record the numbers for Chapter IV. |
| NFR2 | CNN ≥ 85% | **N/A-CODE** | Offline result 96.9% overall, all classes ≥ 85% (as provided by the team). | Per-class numbers are not yet in the app or the repo (O5). |
| NFR3 | Always accessible | **PARTIAL** | Static hosting on Vercel (`seascan-app/vercel.json`). Errors are handled: model load failure (`ScannerPage.jsx` L188-193), identification failure (L286-291), catalogue failure on the Library (L107-112) and Map (L121-128); a new photo retries model loading (`seagrassModel.js` L51-54). | Risks: (1) **Supabase free projects pause after about 1 week without activity**, which takes the library, map and login down. (2) Runtime dependencies on third-party hosts: TF.js from `cdn.jsdelivr.net`, map marker icons from `raw.githubusercontent.com` (`DistributionMapPage.jsx` L13-14, `LocationPicker.jsx` L15), tiles from `tile.openstreetmap.fr` (volunteer server, no SLA), Google Fonts. (3) There is no React error boundary, and missing `VITE_SUPABASE_*` env vars give a blank page (`supabaseClient.js`). (4) No uptime monitoring. |
| NFR4 | Regular (weekly) backups of species records and user data (§3.5.4) | **PARTIAL** | `scripts/backup-db.ps1` (pg_dump of schema `public`, keeps 8 copies) + `DEPLOYMENT.md` §9 (manual run or Windows Task Scheduler). | (1) It writes to a local `backups/` folder on one PC; §3.5.4 says a **secure cloud storage folder**. (2) The dump excludes `auth.users` (accounts) and Storage files (sighting photos). (3) It depends on one person's PC being on. (4) There is no record of a restore test. |
| NFR5 | Standard browsers, no installation | **MET** | Plain web app (Vite build, `index.html`); no app store or plugin. | — |
| NFR6 | Chrome, Firefox, Safari, Edge | **PARTIAL** | No canvas `filter`, no `OffscreenCanvas`, no `:has()`. `img.decode()`, `getUserMedia` with `playsInline`, geolocation and `datetime-local` are all supported in current versions. The built CSS includes `-webkit-backdrop-filter`. | Flags: (1) **Tailwind CSS 4.3** (71 `@property` rules and `color-mix`/`oklch` in the built CSS) officially needs **Safari 16.4+, Chrome 111+, Firefox 128+**, so older iPhones (iOS ≤ 16.3) will show broken styling. (2) `crypto.randomUUID()` (`lib/api.js` L126) needs Safari 15.4+ **and a secure context**, so photo uploads fail over plain http. (3) If WebGL is unavailable, TF.js falls back to the CPU and breaks the 5 s target. (4) On macOS Safari a HEIC photo is rejected by the JPEG/PNG check (with a clear message). Test each browser by hand (checklist below). |
| NFR7 | Responsive on small and large screens | **PARTIAL** | Public pages use responsive grids; the Header has a mobile menu (`Header.jsx` L136-147); staff portals have a mobile drawer (`staff/PortalShell.jsx` L97-106); the map has a min-height of 440 px. | **Bug:** `src/pages/CommunityPortal.jsx` L108 (and `DeveloperPortal.jsx` L129) always shows a fixed `w-64` (256 px) sidebar with no mobile version, so on a 360 px phone the content column is about 100 px wide. Community users, **including student/tourist/fisherfolk test accounts, land here after login** (`AuthContext.jsx` `portalPathForRole`). Also: heavy use of 11-12 px text and some small tap targets (e.g. the remove-chip button `p-0.5` in `AdminManagers.jsx` L131, the star buttons on Help). |
| NFR8 | SUS ≥ 70 | **N/A-CODE** | — | See O4 and E. |
| NFR9 | Secure handling of user data and images | **PARTIAL** | Private `sighting-photos` bucket + folder policies (`20261109000400…sql` L96-118); file-type/size checks in the client (`lib/images.js` L12-30: 1 file, JPEG/PNG, ≤ 10 MB, videos rejected) and in the bucket (5 MB, JPEG/PNG); EXIF/GPS stripped by re-encoding (`lib/images.js` L38-56, used in `api.js` L60, L125); no service-role key anywhere in code or history; `.env` is git-ignored now (`seascan-app/.gitignore` L27); HTTPS on Vercel + HSTS header (`vercel.json`); feedback is anonymous. | (1) **`seascan-app/.env` was committed in `f52ff4d` and that commit is on `origin/main` (GitHub).** It holds the project URL and the **anon** key (decoded role = `anon`, not service-role). The anon key is public by design (it ships in the JS bundle anyway), so the risk is low, but it stays in git history; RLS is what protects the data. The deletion is staged but not committed yet. (2) EXIF stripping happens only in the browser; a hand-crafted request could still upload a photo with metadata into the user's own private folder. (3) Session cookies cannot be HttpOnly (no server; documented in DEPLOYMENT.md). (4) `npm audit`: 2 high advisories in dev-time packages (vite dev server, source-map-js); run `npm audit fix`. |
| NFR10 | Only authorized roles modify/delete species and admin data | **MET** (in code) | RLS: species/stations/station_species writes need `species.manage` / `stations.manage` (admin only); role changes are guarded by trigger + `users.manage`; `admin_list_users` and `delete_test_session_data` check permissions server-side (`20261110000100…sql` L312-382); append-only `audit_log` records every staff change. Admin UI: `/admin` behind `ProtectedRoute` + tabs filtered by permission (`AdminDashboard.jsx` L19-29). | Confirm in the live DB (try an admin edit while signed in as a researcher; it must fail; see checklist TC-16). |
| NFR11 | 500 concurrent users | **N/A-CODE** (analysis) | Identification runs on each user's device, so there is no inference server to overload. Static files are served by the Vercel CDN. | Limits are elsewhere: (1) **Model bandwidth:** about 24 MB per first-time visitor; 500 new visitors ≈ 12 GB. On the Vercel Hobby plan (about 100 GB/month transfer; check current limits) that is roughly 4,000 first-time scanner visits per month. Quantization cuts this 2-4×. (2) **Supabase free tier:** limited egress, database size and file storage; the built-in email sender allows only a few sign-up/reset emails per hour (the app already explains this, `AuthContext.jsx` L86-88), so 500 people cannot register at once. (3) OSM HOT tiles have a fair-use policy. (4) Render free tier (optional Flask) sleeps when idle. |

## D. Architecture claims (§3.2, §3.4, §3.5)

| ID | Claim | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| D1 | React.js frontend | **MET** | `seascan-app/package.json`: react 19.2, react-router 7, Vite 8, Tailwind 4. | — |
| D2 | Python Flask backend handles API requests, **CNN model communication and identification results**, on Render (§3.2 Technical Feasibility; §3.4 Hosting and Deployment; §3.5.1; §3.5.3) | **CONFLICT** | `app.py` exists but is an **optional, read-only** API (`/api/health`, `/api/species`, `/api/map/verified-stations`, `/api/map/sightings`) using the anon key. It has **no model, no upload, no identification**. The web app **never calls it** (no API URL in `src/`). The CNN runs **in the browser** (`seagrassModel.js`). `render.yaml` and `DEPLOYMENT.md` §8 both call it optional. | Update the manuscript: "Inference runs client-side with TensorFlow.js; the React app talks to Supabase directly (PostgREST + RLS). An optional read-only Flask API exposes public data." Or remove Flask from the architecture entirely. |
| D3 | Supabase PostgreSQL tables (species, stations, sightings, users/roles), Auth with JWT, RLS for 4 roles, real-time (optional) | **MET** | Tables: `species`, `stations`, `station_species`, `sightings`, `profiles` (+ `role_permissions`, `feedback`, `community_questions`, `audit_log`). Supabase Auth email/password with JWT; a custom access-token hook adds `user_role`/`permissions` claims (`20261110000100…sql` L388-418). RLS on all tables. | No real-time subscriptions are used (none in `src/`). This was optional; say so in the manuscript. The JWT hook must be enabled manually (`DEPLOYMENT.md` §2b). |
| D4 | Image storage: Supabase Storage or Cloudinary; EXIF stripped? | **MET** | **Supabase Storage** only (no Cloudinary). Scanner photos are **not uploaded** (processed on the device; stated in the UI at `ScannerPage.jsx` L180). A photo is uploaded only when attached to a sighting: private bucket, path `<user-id>/<uuid>.jpg`, re-encoded to JPEG ≤ 2048 px with **all EXIF (incl. GPS) removed** (`lib/images.js` L38-56). Species reference photos go to a public bucket, also re-encoded. | Manuscript: name Supabase Storage and drop "or Cloudinary". |
| D5 | TF.js deployment **with quantization** (§3.2 Technical Feasibility; §3.4 Model Architecture and Training, last sentence) | **CONFLICT** | Both `model.json` weight manifests: `float32` (199 tensors) + `int32` (13), **no `quantization` entry** → **not quantized**; about 11.9 MB per model. | Either quantize when converting (`tensorflowjs_converter --quantize_float16` or `--quantize_uint8`), re-run the test set to prove accuracy stays ≥ 85%, and update the model folders; **or** change the manuscript text to "float32, not quantized". |
| D6 | Model input 224×224 (§3.4 Table 4 rows "Model input resolution" and "CNN input dimensions"; "Preprocessing Pipeline" paragraph) | **CONFLICT** | Both models: input `[-1, 320, 320, 3]`; `app_settings.json` `input_size: [320, 320]`; `modelMetrics.js` L10. | Update the manuscript to 320 × 320 × 3 (and describe the 1024 px enhancement step, resize with half-pixel centres, and raw 0-255 input with in-model rescaling). |
| D7 | Frontend on Vercel, backend on Render, Supabase for DB/auth/storage | **MET** (config present) | `seascan-app/vercel.json` (framework vite, SPA rewrite, 7-day model cache, security headers incl. HSTS and Permissions-Policy camera/geolocation=self); `seascan-app/.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CONTACT_EMAIL`); `render.yaml` (optional Flask, gunicorn, `/api/health`); `requirements.txt`; `supabase/migrations/*`; `DEPLOYMENT.md` §1-9. | Render's role differs from the manuscript (see D2). Whether production is actually deployed was not checked. |
| D8 | RESTful API endpoints between frontend and backend that **receive photos and return identification results** (§3.5.1) | **CONFLICT** | Only the 4 read-only GET endpoints in `app.py` exist, and the frontend does not use them. There is no upload or identify endpoint. The frontend uses Supabase's REST API (PostgREST) directly via `lib/api.js`. | Rewrite §3.5.1 accordingly. In Technical Testing (§3.5.2.1) replace "the identification API endpoint" with "the in-browser preprocessing + inference pipeline". |

## E. What the user-testing sessions need (§3.5.2.2)

| ID | Requirement | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| E1 | Task 1 (identify by uploading a prepared photo), Task 2 (find and open a profile), Task 3 (view the map and submit a sighting with a **preset demo location**) | **PARTIAL** | Task 1: `/scanner`, no login needed. Task 2: `/library` → card → `/library/:slug`. Task 3: "Demo location" button in `SightingForm.jsx` L16, L20-24, L56-59 (fixed point 6.87, 126.26, saved as `location_source='demo'`, labelled in staff views and on the map). | Task 3 is **indirect**: the Map page has no submit button, only a text link "Found seagrass? Identify it and submit a sighting" → Scanner (`DistributionMapPage.jsx` L294-296). Submitting needs a login and then either a scan ("Record This Sighting") or Community Hub → "Record a Sighting". The form opens in "Tap the map" mode, so the participant must actively pick "Demo location". The new sighting is pending, so it shows only as the participant's own grey pin. Suggest: a "Submit a sighting" button on the Map page that opens the form, with "Demo location" preselected during the test period. Task 2 profiles currently show mostly "To be added" (content), which will hurt SUS and ISO scores. |
| E2 | Generic test accounts; no personal info entered by participants | **MET** | Sign-up needs only email + password; nickname optional (`LoginModal.jsx`, `AuthContext.jsx` L169-185). `DEPLOYMENT.md` §6 creates `test.student@`, `test.tourist@`, `test.researcher@`, `test.admin@seascan.test`, auto-confirmed and flagged `is_test_account`. | Add `test.fisherfolk@seascan.test` for the 4th participant group (the doc lists only student/tourist/researcher/admin). |
| E3 | Evaluation data and images can be deleted afterwards | **MET** | Admin → **Test Data** (`components/staff/AdminManagers.jsx` `TestDataCleanup` L229-276) → RPC `delete_test_session_data` (admin-only, logs one audit row) deletes sightings, questions and **all anonymous feedback** in the time window, then removes the photo files (`lib/api.js` L227-238). | (1) The result of the storage `remove()` is not checked (`api.js` L230), so failed photo deletions go unreported. (2) It also deletes anonymous feedback from **real** users sent in the same window. (3) It only covers accounts flagged as test accounts; demo sightings made from other accounts stay. |
| E4 | Uploaded test photos: EXIF location removed / not stored | **MET** | Scanning never uploads. Attached sighting photos are re-encoded without EXIF (`lib/images.js` L32-56). | The "Include the scanned photo" checkbox is **ticked by default** (`SightingForm.jsx` L36), so the prepared test photo is uploaded with Task 3 unless the participant unticks it. That is acceptable (EXIF is removed and E3 deletes it), but you can tell participants to untick it. |

## F. Pages from the mockups (§3.4, Figures 12-17)

| ID | Page | Status | Route / file | What it can do |
|---|---|---|---|---|
| F1 | Scanner (Fig. 12) | **MET** | `/scanner` → `src/components/ScannerPage.jsx` | Upload/drag-drop/camera, gate check, top-3 predictions with %, retake advisory, plant highlight box, profile summary, conservation guide, link to the full profile, "Record This Sighting", "My Recorded Sightings" (when signed in). |
| F2 | Digital Library (Fig. 13) | **MET** | `/library` → `src/pages/DigitalLibraryPage.jsx`; `/library/:slug` → `src/pages/SpeciesProfilePage.jsx` | Search by name, filter by leaf shape / status, cards, full profile with 3D model, morphology, ecology, stations mini-map, conservation guide, sources. |
| F3 | Public Viewer (Fig. 14) | **MET** | `/` → `src/pages/HomePage.jsx` (+ `/about`, `/about-model`, `/help`, `/map`) | Public landing page with links to all tools. The mockup's feature cards (AI recognition, 3D models, AR, knowledge base) all exist (3D/AR via `Seagrass3DViewer.jsx`). The mockup says "92% accuracy"; the app says 96.9%. Update the figure caption or text if the figure is kept. |
| F4 | Login modal (Fig. 15) | **MET** | `src/components/LoginModal.jsx` (global, `App.jsx` L109) | Login, create account (user type, optional nickname, password ≥ 8), forgot password, "keep me signed in", 30-min idle logout. Admin/researcher roles are granted by an admin (L257). |
| F5 | Admin panel (Fig. 16) | **MET** | `/admin` → `src/components/AdminDashboard.jsx` | Overview counts; **Sighting Review** (approve/reject/delete, CSV); **Species** (create/edit/delete all fields, photo upload, needs-review flag); **Stations** (coordinates, sources, species-per-station with source); **Users & Roles** (change role, mark test account); Feedback; Questions; Test Data clean-up; Audit Log. Accounts cannot be created or deleted from the app (Supabase dashboard; documented). The mockup's "AI Core / retrain" widget is not implemented (not a requirement). |
| F6 | Researcher panel (Fig. 17) | **MET** | `/researcher` → `src/components/ResearcherPanel.jsx` | Overview (pending/approved counts, approved per species, stations CSV); **Sighting Review** (approve/reject/delete with photo and details, CSV export, matching §3.5.3 "reviewing submitted sightings"); Questions; Feedback (read-only). |

Extra pages not in the manuscript: `/community` (Community Hub: record sighting, my sightings, ask a researcher) and `/developers` (Developer portal). The Developer portal shows **hard-coded mock bug reports and feedback** (`initialReports` / `initialFeedback` in `DeveloperPortal.jsx`), and its text "The Flask API is probed live" (L412) is wrong (it probes Supabase). Remove it or mark it as a demo before the evaluation.

## G. Deployment, maintenance and scope (§1.5, §3.5.3, §3.5.4)

| ID | Requirement | Status | Evidence | Missing / how to fix |
|---|---|---|---|---|
| G1 | Feedback link to report errors | **MET** | Footer "Send feedback" (`Footer.jsx` L15-20) → `/help#feedback` form (`HelpPage.jsx` L155-201) → `feedback` table (anonymous; category "Something is broken"); staff read it in Admin/Researcher → Feedback. | Feedback goes to the database, not to GitHub issues (§3.5.4 says issues are tracked in GitHub; that copying is manual). |
| G2 | FAQ page | **MET** | `/help#faq`, 8 Q&As (`HelpPage.jsx` L44-53, L113-126). | — |
| G3 | Contact email | **PARTIAL** | `HelpPage.jsx` L140-153 reads `VITE_CONTACT_EMAIL`; the local `.env` has a value set. If the variable is missing, the page shows "Contact email to be added". | Set `VITE_CONTACT_EMAIL` in the Vercel project settings too (`DEPLOYMENT.md` §7 step 4). Production was not verified. |
| G4 | User Manual / help (Scanner, Library, map) | **MET** | `/help#manual`, three step lists: identify, record a sighting, explore species and map (`HelpPage.jsx` L12-42, L99-111). | §3.5.3 also wants a User Manual in the appendices (a document task). |
| G5 | Admin and researcher accounts can be created at deployment | **MET** | `DEPLOYMENT.md` §5 (first admin via one SQL update), then Admin → Users & Roles; §6 test accounts. | — |
| G6 | English-only interface | **MET** | All UI text is in English; `<html lang="en">`. Bisaya local names appear only as species data. | — |
| G7 | Only single still images (JPEG/PNG); rejects video and bulk uploads with a clear message | **MET** | `lib/images.js` L12-30: "Please choose one photo at a time.", "Videos are not supported…", "… files are not supported. Please choose a JPEG or PNG photo.", 10 MB limit, empty-file check. The picker has no `multiple` attribute; multi-file drops are rejected. | — |
| G8 | Non-seagrass photos handled; gate active in the real Scanner | **MET** | The real `/scanner` uses `classifySeagrass()` with the gate (`seagrassModel.js` L153-157); the rejection card reads "This doesn't look like seagrass" with the score (`ScannerPage.jsx` L343-360). | If the gate fails to load, the app silently runs without it (FR2 difference 1). |

## H. Contradictions inside the manuscript, checked against the code

| ID | Contradiction | Status | What the code does | Manuscript text to change |
|---|---|---|---|---|
| H1 | §1.5 Limitations ("does not include a community-based data contribution or citizen science feature") vs. Objective 3 / FR8 (GPS-tagged user sightings) | **CONFLICT** | The code **has** community contribution: signed-in users submit GPS-tagged sightings (optionally with a photo), researchers review them, and approved ones appear on the public map. There is also "Ask a Researcher". | Delete or rewrite that Limitation, e.g. "Community sightings are supplementary and do not expand the CNN training set." |
| H2 | §1.5 Limitations: "requires an active internet connection to access cloud-based CNN processing" | **CONFLICT** | Inference is **on-device** (TF.js). Internet is needed to load the site, the models (~24 MB, cached 7 days), the species and map data, and to log in or submit. Once the Scanner page has loaded its models, further photos are identified without a network call. There is no service worker, so the app cannot be opened offline. | "Requires internet to load the application, model files and species/map data; identification itself runs in the browser." |
| H3 | §3.5.1 "the trained model will be exported and loaded by the Flask backend for inference" vs. TF.js in-browser (§3.2, §3.4) | **CONFLICT** | In-browser TF.js graph model; Flask has no model (see D2). | Rewrite §3.5.1 (and §3.4 Hosting: "Render … serving … CNN model inference at scale"; §3.5.3 "the Python Flask backend and CNN model on Render"). |
| H4 | §1.5 Limitations: user sightings "are not scientifically verified or validated by expert researchers" vs. §3.5.3 "reviewing submitted sightings" | **CONFLICT** (wording) | Sightings stay **pending until a researcher approves them**; only approved ones are public, labelled "Community-submitted, unverified" and "Reviewed by a researcher; not a verified survey station". | Say "screened by a researcher before publication, but not scientifically verified survey data". |

---

## 1. Summary table

| Section | MET | PARTIAL | NOT MET | CONFLICT | N/A-CODE |
|---|---|---|---|---|---|
| A. Objectives (O1-O5) | 1 | 2 | 0 | 0 | 2 |
| B. Functional (FR1-FR8) | 4 | 4 | 0 | 0 | 0 |
| C. Non-functional (NFR1-NFR11) | 2 | 6 | 0 | 0 | 3 |
| D. Architecture (D1-D8) | 4 | 0 | 0 | 4 | 0 |
| E. User testing (E1-E4) | 3 | 1 | 0 | 0 | 0 |
| F. Mockup pages (F1-F6) | 6 | 0 | 0 | 0 | 0 |
| G. Deployment/scope (G1-G8) | 7 | 1 | 0 | 0 | 0 |
| H. Manuscript contradictions (H1-H4) | 0 | 0 | 0 | 4 | 0 |
| **Total (54 items)** | **27** | **14** | **0** | **8** | **5** |

In short: the **code** is close to complete. Most PARTIALs are caused by **missing research content** (species text, station coordinates, per-class metrics) and a few UI/performance items. All 8 CONFLICTs are **manuscript text** that no longer matches the built system.

## 2. Manuscript text that must be updated to match the system

| Item | Section(s) to change | Change |
|---|---|---|
| D2, H3, D8 | §3.2 Technical Feasibility (paragraphs 1 and 4), §3.4 Hosting and Deployment, §3.5.1 (both paragraphs), §3.5.2.1 ("identification API endpoint"), §3.5.3 | CNN inference runs **in the browser with TensorFlow.js**; the React app reads/writes **Supabase directly** (PostgREST + RLS). Flask is optional and read-only (public species/stations/sightings), or remove it. No identification endpoint. |
| D5 | §3.2 Technical Feasibility para 4, §3.4 Model Architecture and Training (last sentence) | "Converted to a TF.js graph model (float32, not quantized, ~12 MB each)", unless you quantize (Gap #4). |
| D6 | §3.4 Table 4 ("Model input resolution", "CNN input dimensions"), "Preprocessing Pipeline" paragraph | 320 × 320 × 3; enhancement at ≤ 1024 px, bilinear resize with half-pixel centres, raw 0-255 pixels (rescaling inside the model). |
| — (gate) | §1.6 Process stage, §3.4 CNN-Based Image Recognition, §1.5 Limitation 2 | Add the **seagrass gate model** (threshold 0.87) that runs before the species model and rejects non-seagrass photos. |
| H2 | §1.5 Limitation 3 | Internet is needed to load the app, models and data; identification itself runs on the device. |
| H1 | §1.5 Limitation 8 | Remove "does not include a community-based data contribution" (the system has GPS-tagged sightings). |
| H4 | §1.5 Limitation 9 | Sightings are screened/approved by a researcher before they appear publicly, but are still not formal survey data. |
| FR6 | §1.5 Limitation 8 ("predefined roles for students, tourists, researchers, administrators"), §3.3 FR 6 | Roles in the system: **community** (user types: student, tourist, fisherfolk, other), **researcher**, **administrator** (and **developer** if kept). Permissions via RBAC table + RLS. |
| D3 | §3.4 / §3.5.1 | Real-time subscriptions are not used. Add the JWT custom claims hook and the audit log if you want to describe the security design. |
| D4 | §3.2 para 3, §3.5.1 | Supabase Storage (private bucket for sighting photos; EXIF removed in the browser). Drop Cloudinary. Scanner photos are not uploaded. |
| NFR4 | §3.5.4 | Describe the actual backup (pg_dump script, weekly), and either add the cloud copy step or change the wording. |
| F3 | Figure 14 | The mockup says "92% accuracy"; the current model is 96.9% overall. |

## 3. Top 10 gaps to build, in priority order

| # | Gap | Why it matters | Size |
|---|---|---|---|
| 1 | **Enter the research content**: station coordinates + species-per-station (with source), all species profile fields incl. *Halophila minor*, conservation guide text; then clear "needs review" | Blocks O2, O3(a), FR3-FR5, FR8 and makes Task 2/3 look empty (hurts SUS). Done in Admin → Species / Stations, with no code changes. | Small (data entry), but depends on researchers |
| 2 | **Fix the Community Hub mobile layout** (`CommunityPortal.jsx` L108; same in `DeveloperPortal.jsx` L129): hide the fixed sidebar below `md` and use a drawer like `PortalShell` | Participants on phones land there after login; content is about 100 px wide (NFR7, O4) | Small |
| 3 | **"Submit a sighting" button on the Distribution Map page** that opens `SightingForm` (Demo location preselected during testing) | Makes Task 3 a single, direct flow (E1) | Small |
| 4 | **Quantize both models** (float16 or uint8), re-run the test set to confirm ≥ 85% per class, preload the models from the Home page, and **measure** first-load and per-photo time on a mid-range phone | NFR1 (5 s), D5, NFR11 bandwidth | Medium |
| 5 | **Show leaf morphology, rhizome, sheath and reproductive organs in the Scanner result** | FR3 lists them for the identification result | Small |
| 6 | **Fill the About-model page**: per-species Accuracy/Precision/Recall/F1 in `src/data/modelMetrics.js`; add `public/model/confusion_matrix.png`; keep the evaluation files in the repo | O5, NFR2 evidence, Chapter IV | Small |
| 7 | **Backup procedure as written in §3.5.4**: copy the dump to a cloud folder, include `auth.users` and the sighting photos, schedule it, and do one documented restore test | NFR4 | Small-Medium |
| 8 | **Availability hardening**: self-host TF.js and the marker icons (avoid jsdelivr / raw.githubusercontent), add a React error boundary and a clear message when env vars are missing, plan for the Supabase free-tier pause (keep-alive or paid plan during the evaluation), add a simple uptime monitor | NFR3 | Medium |
| 9 | **Gate failure must be visible** (`seagrassModel.js` L64-70) and **check storage deletion errors** in the test-data clean-up (`lib/api.js` L230) | G8 reliability, E3 completeness | Small |
| 10 | **Species richness per coastal zone** (Scope §1.5): define zones with the researchers, add a `zone` to stations, and show counts per zone on the map | FR8 / scope statement | Medium |

Also worth doing (smaller): remove or label the Developer portal mock data; add `test.fisherfolk@seascan.test`; run `npm audit fix`; commit the staged `.env` deletion; test on an older iPhone because of Tailwind v4's Safari 16.4 floor.

## 4. Content the researchers must supply

Nothing below was invented. Each item has to come from Angsinco-Jimenez et al. (2003), Sanchez-Delute et al. (2025) or another cited source, and it is entered in **Admin → Species** or **Admin → Stations**.

**Species profiles (all 9; currently empty unless noted):**

| Field (DB column) | Status in seed |
|---|---|
| Common name, local name | Present for 8 species (draft); **missing for *Halophila minor*** |
| Leaf morphology, blade length, blade width, venation, leaf margin | Present for 8 (draft, `needs_review`); missing for *H. minor*. Check the *C. rotundata* leaf margin ("Smooth, smooth leaf sheath") |
| Leaf shape (filter value) | Present for all 9. **Check:** *Halodule pinifolia* and *H. uninervis* are seeded as "Ribbon-like", but manuscript §3.4 describes them as needle-like. Decide which is correct. |
| Rhizome structure | **content missing (all 9)** |
| Sheath characteristics | **content missing (all 9)** |
| Reproductive organs | **content missing (all 9)** |
| Ecological role | Present for 8 (draft); missing for *H. minor* |
| Ecosystem contribution ("Why it matters") | **content missing (all 9)** |
| Conservation tips ("How you can help") | **content missing (all 9)** |
| Conservation status (+ which list/source) | **content missing (all 9)** |
| Geographic distribution | **content missing (all 9)** |
| Local distribution note (Pujada Bay) | Present for 8 (draft); missing for *H. minor* |
| Reference photo + photo credit | **missing (all 9)** |
| Sources | **missing (all 9)** |
| Verify the draft text, then untick "needs review" | all 9 still need this |

**Stations (10 seeded by name, with sources):** latitude and longitude **exactly as published** (with the page/table of the source), and the list of species recorded at each station, each with its source. Confirm the spelling "Macarnbol" (Macambol?) and whether "Juanivan Island-Taganilao" (2003) and "Taganilao" (2025) are the same site or two sites.

**Also needed:** coastal zone definitions (if richness per zone is kept in scope); per-class test metrics and the confusion matrix image (ML team); a contact email for the Help page; and a check of the hotspot labels in `public/seagrass/species.json` (3D viewer), which are not editable in Admin.

## 5. Manual test checklist (for Chapter IV test cases)

Written for a tester who is not a programmer. Use the deployed **https** address. For each case write **Pass / Fail** and a note. Repeat the cases marked 📱 on: (a) an Android phone with Chrome, (b) an iPhone with Safari, (c) a Windows laptop with Chrome or Edge, (d) a laptop with Firefox.

**Prepare first:** the 4 test accounts from DEPLOYMENT.md §6 (an admin flags them as test accounts); 3 prepared seagrass photos (JPEG, EXIF removed), 1 photo of land grass or a shoe, 1 blurry or dark seagrass photo, 1 short video file, 1 PDF.

| ID | Covers | Steps | Expected result |
|---|---|---|---|
| TC-01 📱 | FR1 upload | 1. Open the site. 2. Tap **Scanner** in the top menu. 3. Tap **Select a photo** and choose a prepared seagrass JPEG. | The photo appears and "Analyzing botanical features..." shows, then a result appears. |
| TC-02 📱 | FR1 camera (phone) | 1. On the Scanner tap **Use camera**. 2. Allow camera access. 3. Point at a printed seagrass photo and tap **Capture**. | The **rear** camera opens; **Switch** changes cameras; the captured photo is identified. |
| TC-03 | FR1 camera (laptop) | Same as TC-02 on a laptop with a webcam. | The webcam opens and the capture is identified. |
| TC-04 | G7 | Try in turn: a video, a PDF, two photos dragged together, a photo larger than 10 MB. | A clear red message each time ("Videos are not supported…", "…not supported. Please choose a JPEG or PNG photo.", "Please choose one photo at a time.", "…The limit is 10 MB."). Nothing is identified. |
| TC-05 📱 | FR2, NFR1 | 1. Open the Scanner on a fresh browser (or after clearing the cache) and **start a stopwatch**. 2. Stop it when "Loading identification model…" disappears. 3. Select a photo and time until the result appears. Repeat step 3 with 3 photos. | Record both times. Requirement: identification ≤ 5 s. Note the device model and network. |
| TC-06 | FR2, G8 | Upload the land-grass or shoe photo. | Card "**This doesn't look like seagrass**" with a percentage below 87%; no species is named. |
| TC-07 | FR7 confident | Upload a clear prepared seagrass photo. | "Top match identified", the scientific name in italics, a **confidence %** (70% or more), and 2 alternative predictions with %. |
| TC-08 | FR7 low confidence | Upload the blurry or dark seagrass photo (repeat with others until one scores below 70%). | Amber box "**Not sure - please retake**" showing the best guess and its %, and the text "Retake the photo in better lighting … or consult a marine science expert." |
| TC-09 | FR3 | After TC-07, read the result card. | Shows the scientific name, common/local name, leaf facts, ecological role, distribution, verified survey stations, conservation guide (status, why it matters, how you can help), and a button **Full profile in the Digital Library** that opens that species' page. Write down any field that says "To be added". |
| TC-10 📱 | FR4, **Task 2** | 1. Tap **Species Library**. 2. Type part of a name (e.g. "halo") in the search box. 3. Tap one result card. | 9 species are listed at the start; the search narrows the list; the card opens a profile page showing morphology (incl. rhizome, sheath, reproductive organs), ecological role, distribution and stations, conservation guide, and sources. |
| TC-11 | FR4 | In the Library, use the **leaf shape** and **conservation status** filters, then **Reset filters**. | The list changes to match each filter; Reset shows all 9 again. |
| TC-12 | FR5 | Open each of the 9 profiles and scroll to **Conservation guide**. | Each has "Why it matters" and at least one "How you can help" tip (no "To be added"). |
| TC-13 📱 | FR8 stations | 1. Tap **Distribution Map**. 2. Tap a blue circle. 3. Use the species filter. | Blue circles are visible at the survey stations. A popup shows the station name, "Verified survey station", the source (2003 / 2025), species richness and the species list with sources. The filter hides stations without that species. The right panel lists stations by richness. |
| TC-14 📱 | FR8 sightings, **Task 3** | 1. Log in as `test.student@seascan.test`. 2. Go to the Scanner and identify a prepared photo. 3. Tap **Record This Sighting**. 4. Tap **Demo location**. 5. Check the species and date, untick "Include the scanned photo" if wanted, then tap **Submit sighting**. 6. Open **Distribution Map**. | A green message: "Sighting submitted…". On the map a **grey pin** "Your sighting - pending review" appears at the demo point (only for this user). The participant's real GPS is never asked for. |
| TC-15 | FR8 review | 1. Log in as `test.researcher@seascan.test`. 2. Open **Researcher Panel → Sighting Review**. 3. Find the TC-14 sighting (marked "demo location") and click **Approve**. 4. Log out and open the Map. | After approval a **gold pin** appears in the layer "Community sightings (unverified)" with the label "Community-submitted, unverified". |
| TC-16 | FR6, NFR10 | 1. Logged in as the researcher, type `/admin` in the address bar. 2. Logged in as `test.student`, type `/researcher` and `/admin`. 3. Logged out, type `/admin`. | 1 and 2: "This portal needs a different role". 3: "Sign in required". (The database also refuses these changes; a developer can confirm by calling the API with a researcher token.) |
| TC-17 | FR6 admin | Log in as `test.admin`. Open **Species**, edit one field, save; open **Stations**, edit a note, save; open **Users & Roles**; open **Audit Log**. | The changes save and appear in the Library and Map; the Audit Log shows who changed what and when. |
| TC-18 📱 | NFR7 | On a phone, open every page: Home, Scanner, Library, a profile, Map, Help, then log in as the student and open the Community Hub. | No sideways scrolling, no text cut off, all buttons can be tapped with a thumb. (Currently expected to **fail** in the Community Hub; see Gap #2.) |
| TC-19 | G1-G4 | Open **Help**: read the User manual and FAQ, check that a **Contact** email is shown, and send a message in **Send feedback**. Then as the admin open **Feedback**. | The manual covers Scanner, Library and Map; the FAQ opens; an email address is shown; "Thank you! Your feedback was sent anonymously."; the message is visible to the admin. |
| TC-20 | E3, E4 | After a test session, as the admin open **Test Data**, set From/To to cover the session, click **Delete test data** and confirm. Then check the Map, Researcher → Sighting Review, and Supabase → Storage → `sighting-photos`. | The message reports how many sightings, photos, questions and feedback were deleted. The test sightings and their photo files are gone. |
| TC-21 | NFR3 | Turn on airplane mode after the Scanner has loaded its model; identify another photo. Then reload the page. | The identification still works (it runs on the device). After reloading, the site cannot open (internet is needed to load it). |

---

*Produced as a read-only audit. No source code was modified.*
