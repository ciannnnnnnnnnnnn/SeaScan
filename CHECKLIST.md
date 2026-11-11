# SeaScan requirements checklist

Status: **DONE** = built and tested · **NEEDS DATA** = built, waiting for content from the
research/ML team · **YOU** = a setup step you must do (see `DEPLOYMENT.md`) · **TEST** = verify
on real devices.

How it was tested:
- **Database rules:** 39 automated checks on a local Postgres, covering every role and every
  table rule.
- **Screens:** 44 end-to-end checks in Chrome against a stand-in for the Supabase API.
- **Live project:** nothing has run against a real Supabase project yet. Do the
  `DEPLOYMENT.md` steps, then the "How to test" column below.

## Objective 1 - Scanner

| ID | Status | What was done | How to test |
|---|---|---|---|
| R1.1 | DONE | One JPEG/PNG, max 10 MB; video, other formats and multiple files rejected with a clear message (`src/lib/images.js`) | Scanner → try a video, a GIF and two photos at once: each shows a red message |
| R1.2 | DONE · TEST | "Use camera": live rear camera on phones, webcam on desktop, with a switch button (`CameraCapture.jsx`). Needs HTTPS | On the Vercel site, tap **Use camera** on a phone and a laptop |
| R1.3 | DONE | Gate model first; "This doesn't look like seagrass"; species model skipped | Scan a photo of land grass or a hand |
| R1.4 | DONE | Confidence % on every result, including "not sure" | Any scan |
| R1.5 | DONE | Below 70%: highlighted amber advisory to retake in better light or consult a marine science expert | Scan a blurry seagrass photo |
| R1.6 | DONE · NEEDS DATA | After identification: names, morphology, ecological role, conservation status, distribution, verified stations, link to the full profile | Scan a clear photo and check the panel |
| R1.7 | DONE · NEEDS DATA | Conservation guide (why it matters, how to help) on the scan result and profile page; content comes from Admin → Species | Fill tips for one species, then scan it |
| R1.8 | TEST | Measured on this PC: models ready in 9 s, a 12-megapixel photo in about 1 s. Simulated mid-range phone: 39 s first load (24 MB of models), 3.2-3.7 s per photo. Models are cached for a week | Time it on a real phone over mobile data |
| R1.9 | DONE | Scanned photos are never uploaded. Sighting photos are re-encoded without EXIF/GPS, stored in a **private** bucket under the user's folder, viewable by owner and staff through short-lived links | Submit a sighting with a photo, then open the photo link while logged out: it is refused |

## Objective 2 - Digital Library

| ID | Status | What was done | How to test |
|---|---|---|---|
| R2.1 | DONE · NEEDS DATA | Grid of 9 species from the database; placeholder until a photo is uploaded. The stock photos were removed | Open Species Library |
| R2.2 | DONE | Search by scientific, common or local name; filter by leaf shape and conservation status | Type "puso", choose a filter |
| R2.3 | DONE · NEEDS DATA | Page per species `/library/<slug>` with every required field, station list and mini map, conservation guide, sources. Empty fields show "To be added" | Open any species |
| R2.4 | DONE | Content lives in the `species`, `stations` and `station_species` tables, editable in Admin → Species / Stations | Edit a field as admin and reload the library |
| R2.5 | NEEDS DATA | All 9 lack rhizome, sheath, reproductive organs, conservation status, distribution, tips, photo, sources. 8 carry unverified older text ("Draft profile" notice). *H. minor* is fully empty (replaces *H. spinulosa*) | Researchers fill Admin → Species, then untick "Needs review" |

## Objective 3 - Distribution map

| ID | Status | What was done | How to test |
|---|---|---|---|
| R3.1 | DONE | Leaflet + OpenStreetMap, locked to Mati City; reads Supabase directly (no localhost API) | Open the map |
| R3.2 | NEEDS DATA | 10 stations seeded by name with their source(s); no invented coordinates. Unpinned stations are listed beside the map | Admin → Stations: enter coordinates and species from the papers; pins appear |
| R3.3 | DONE | Species, location by device GPS, map tap or **Demo location**, date, notes, optional photo | Scanner → Record This Sighting, or Community Hub → Record a Sighting |
| R3.4 | DONE | Gold pins labelled "Community-submitted, unverified"; own pending sightings in grey (visible only to you) | Approve a sighting, then view the map logged out |
| R3.5 | DONE | Researchers and admins approve, reject (with note) or delete; enforced by RLS | Researcher panel → Sighting Review |
| R3.6 | DONE · NEEDS DATA | Species richness per station (marker size and ranked list) and a species filter | Link species to stations, then use the filter |

## Objective 4 - Interface, users, security

| ID | Status | What was done | How to test |
|---|---|---|---|
| R4.1 | DONE · TEST | No sideways scrolling at phone width on all public pages and the Admin panel; portals get a slide-in menu on phones. Tested in Chrome only | Try Safari (iPhone), Firefox and Edge |
| R4.2 | DONE | Scanner, Digital Library, public viewer (Home), Login modal, Admin panel, Researcher panel, plus Help and About the model | Click through the menu |
| R4.3 | DONE · YOU | Roles `community` (user type student/tourist/fisherfolk/other), `researcher`, `admin` (+ `developer` for the existing portal) in `profiles`. RLS on **every** table and on storage; users cannot change their own role | Run migrations, log in with each test account |
| R4.4 | DONE | Admin: species create/edit/delete with photo upload, stations and their species, users and roles, sighting review, feedback, delete test-session data | Admin panel tabs |
| R4.5 | DONE | Researcher: review sightings, CSV export (sightings, feedback, stations), answer community questions | Researcher panel → Export CSV |
| R4.6 | DONE | Only admins edit species/stations/roles (RLS-tested). Photos private, EXIF stripped. Input validation in forms **and** database checks (Mati bounds, lengths, dates). Only the anon key in the frontend; `.env` untracked; no service-role key anywhere | Try editing a species as a community user: refused |
| R4.7 | DONE · YOU | Help page: user manual, FAQ, privacy, contact, anonymous feedback form; footer links | Set `VITE_CONTACT_EMAIL`; send feedback; read it in Admin → Feedback |
| R4.8 | DONE | English UI | — |
| R4.9 | YOU | SQL in `DEPLOYMENT.md` §6 creates one test account per role, flagged as test accounts | Follow §6 |

## Objective 5 - Evaluation support

| ID | Status | What was done | How to test |
|---|---|---|---|
| R5.1 | DONE · NEEDS DATA | "About the model" page: 96.9% overall, the ≥85% claim, pipeline, limits. Per-species table and confusion matrix wait for numbers in `src/data/modelMetrics.js` and the image `public/model/confusion_matrix.png`. The wrong "92.4% v3.2" was removed everywhere | Open /about-model |
| R5.2 | DONE | Sign-up needs only email + password; nickname optional; no names shown. Admin → Test Data deletes test-account data, photos and anonymous feedback for a time window | Run a mock session, then delete it |

## Non-functional / deployment

| ID | Status | What was done | How to test |
|---|---|---|---|
| R6.1 | DONE · YOU | `seascan-app/vercel.json` (SPA routing, caching, security headers), `.env.example`, `render.yaml` + `requirements.txt` for the optional API | `DEPLOYMENT.md` §7-8 |
| R6.2 | DONE · YOU | Vercel serves HTTPS; HSTS header; all external resources use HTTPS; the `http://127.0.0.1` calls are gone | Open the Vercel URL; the camera and GPS prompts appear |
| R6.3 | DONE · YOU | `scripts/backup-db.ps1` (pg_dump, keeps 8 weekly files) and Task Scheduler steps | `DEPLOYMENT.md` §9, then do one restore test |
| R6.4 | NOTE | Identification runs on each device, so servers carry no ML load. Limits: 24 MB model download per new visitor (Vercel bandwidth), Supabase free tier (500 MB DB, 1 GB storage, egress, project pauses after ~1 idle week) | Check current plan limits before the evaluation |
| R6.5 | DONE (optional) | `app.py` is now a read-only public API over the new tables (no write endpoint, CORS restricted, debug off). The app does not depend on it | Decide with your adviser |

## Security additions

| Item | Status | What was done | How to test |
|---|---|---|---|
| Sessions and cookies | DONE | Session in first-party cookies (`SameSite=Lax`, `Secure` on HTTPS); browser-session cookie by default, 30 days with "Keep me signed in"; 30-min inactivity sign-out (always for staff); logout clears the cookies (`src/lib/cookieStorage.js`, `AuthContext.jsx`) | Log in, then DevTools → Application → Cookies shows `sb-…-auth-token.0`; close the browser and reopen; leave an admin tab idle 30 min |
| RBAC | DONE | `role_permissions` table (14 permissions over 4 roles); every RLS policy uses `has_permission()`; the app shows only permitted tabs and buttons (`can()`) | Log in as the test researcher: no Species/Users/Audit tabs, and editing a species is refused by the database |
| JWT | DONE · YOU | Supabase JWT access tokens carry `user_role` and `permissions` via `custom_access_token_hook`; the app reads them; the sidebar shows the token expiry | Enable the hook (`DEPLOYMENT.md` §2b), log in, paste the access token into jwt.io |
| Audit-logged admin actions | DONE | Append-only `audit_log` written by database triggers (who, role, when, action, old and new values); Admin → Audit Log with filters and CSV export | Edit a species, change a role, approve a sighting, then open Audit Log |

Database tests for these: 17 extra checks (56 total). Browser tests: 14 extra checks (58 total).

## Open items for the team

1. Create the Supabase project and run the migrations (`DEPLOYMENT.md` §1-6).
2. Fill species content and station coordinates and species from the two papers (Admin panel).
3. Add per-species metrics and the confusion matrix (R5.1).
4. Test on real phones: speed (R1.8), camera (R1.2), Safari/Firefox/Edge (R4.1).
5. The Developer portal (not in the manuscript) still shows sample bug reports and feedback;
   only its system-status card is live. Remove it or keep it as a demo.
