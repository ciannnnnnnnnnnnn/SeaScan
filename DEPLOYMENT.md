# SeaScan: setup and deployment

Follow the steps in order. Steps marked **(you)** happen in a website dashboard;
everything else is already in the repository.

| Part | Where it lives |
|---|---|
| Web app (React + Vite) | `seascan-app/` → hosted on **Vercel** |
| Database, accounts, photo storage | **Supabase** (SQL in `supabase/migrations/`) |
| Identification models | `seascan-app/public/models/` (float16-quantized), run in the visitor's browser |
| Backend API (Flask) | `app.py` → hosted on **Render** |

---

## 1. Create the Supabase project (you)

The project in the old `.env` no longer exists, so start a new one.

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name it `seascan`. Choose the region closest to the Philippines (e.g. *Southeast Asia (Singapore)*).
3. Set a strong **database password** and save it in a password manager. You need it only for backups.
4. Wait until the project is ready.

## 2. Create the tables, rules and seed data (you)

In the Supabase dashboard open **SQL Editor → New query**. For each file below, in this
order, open it in VS Code, copy **all** of it, paste it into the editor and click **Run**.
Each should finish with "Success. No rows returned".

1. `supabase/migrations/20261109000100_profiles_and_roles.sql`
2. `supabase/migrations/20261109000200_species.sql`
3. `supabase/migrations/20261109000300_stations.sql`
4. `supabase/migrations/20261109000400_sightings_and_storage.sql`
5. `supabase/migrations/20261109000500_feedback_and_questions.sql`
6. `supabase/migrations/20261109000600_admin_functions.sql`
7. `supabase/migrations/20261109000700_seed_species_and_stations.sql`
8. `supabase/migrations/20261110000100_rbac_jwt_audit.sql`: permissions (RBAC), JWT claims, audit log
9. `supabase/migrations/20261110000200_library_and_map_content.sql`: species profiles, station
   coordinates and species per station, from *SeaScan Library & Map Content*
10. `supabase/migrations/20261110000300_species_photos.sql`: links the species photos in
    `seascan-app/public/species/` (only for species that have no photo yet)
11. `supabase/migrations/20261111000100_identification_log.sql`: the identification log the
    Flask API writes to (what the Scanner answered and how long it took; no photos)
12. `supabase/migrations/20261112000100_account_model_realtime.sql`: scan history for
    My Account, the CNN model settings admins can change, and real-time updates

Running a file twice is safe. If you ever re-run an earlier file, run file 8 again afterwards
(it upgrades the rules that the earlier files define). File 9 **overwrites** the species and
station fields it fills, including edits made in Admin, so re-run it only to restore that content.

### 2b. Turn on the JWT role claims (you, one switch)

**Authentication → Hooks → Add hook → Customize Access Token (JWT) Claims hook** → type
*Postgres*, schema `public`, function `custom_access_token_hook` → **Create**.

Every login token then carries `user_role` and `permissions`. Users who were already signed
in get them at their next token refresh (or log out and in). Until this is on, the app still
works; it reads the permissions from the database instead, and the Admin sidebar shows
"JWT role claims not enabled yet".

Recommended: **Authentication → Sessions**. Keep the JWT expiry at 3600 s (1 hour) or lower. If you prefer the Supabase CLI: `npx supabase link` then
`npx supabase db push` from the repository root.

Check: **Table Editor** should show `profiles`, `species` (9 rows), `stations` (10 rows),
`station_species`, `sightings`, `feedback`, `community_questions`. Every table should show
the green **RLS enabled** label. **Storage** should show buckets `sighting-photos`
(private) and `species-photos` (public).

## 3. Auth settings (you)

**Authentication → URL Configuration**
- **Site URL**: `http://localhost:5173` for now; change it to your Vercel URL in step 7.
- **Redirect URLs**: add `http://localhost:5173` and, later, your Vercel URL.

**Authentication → Sign In / Providers → Email**: keep *Confirm email* ON for real users.
Test accounts are created already confirmed (step 6), so they need no inbox.

## 4. Connect the app (you)

1. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   Never copy the `service_role` key anywhere in this project.
2. In `seascan-app/`, copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_CONTACT_EMAIL=your-team-email@example.com
   ```
3. Restart the dev server: `cd seascan-app` then `npm run dev`, and open <http://localhost:5173>.

`.env` is ignored by git, so the keys stay on your computer.

## 5. Make yourself the first admin (you)

1. In the app click **Portal Login → Create Account** and register with your email.
   Confirm it from the email Supabase sends.
2. In **SQL Editor** run (put in your email, lowercase):
   ```sql
   update public.profiles p
   set role = 'admin'
   from auth.users u
   where u.id = p.id and u.email = 'your-email@example.com';
   ```
3. In the app, log out and back in. You land on the Admin panel. From now on you can
   change everyone's role in **Admin → Users & Roles**; no more SQL is needed.

## 6. Test accounts for user testing, one per role (you)

1. **Authentication → Users → Add user → Create new user**, tick **Auto Confirm User**.
   Create these, each with its own password:
   - `test.student@seascan.test`
   - `test.tourist@seascan.test`
   - `test.researcher@seascan.test`
   - `test.admin@seascan.test`
2. In **SQL Editor** run:
   ```sql
   update public.profiles p
   set role = case u.email
                when 'test.researcher@seascan.test' then 'researcher'
                when 'test.admin@seascan.test'      then 'admin'
                else 'community' end,
       user_type = case u.email
                when 'test.student@seascan.test' then 'student'
                when 'test.tourist@seascan.test' then 'tourist'
                else 'other' end,
       is_test_account = true
   from auth.users u
   where u.id = p.id and u.email like 'test.%@seascan.test';
   ```
3. Give participants these accounts. No names are collected. During sessions, have them
   choose **Demo location** when recording a sighting.
4. **After the sessions**: Admin → **Test Data** → choose the session dates → **Delete test
   data**. This removes everything the test accounts created, their photos, and the
   anonymous feedback from that window. You can also delete the test accounts themselves
   in Authentication → Users.

## 7. Deploy the web app on Vercel (you)

1. Push the repository to GitHub.
2. <https://vercel.com/new> → import the repository.
3. **Root Directory**: `seascan-app`. Framework: Vite (detected). Build `npm run build`, output `dist`.
4. **Environment Variables**: add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_CONTACT_EMAIL`
   with the same values as your `.env`, and `VITE_API_URL` with your Render URL from step 8
   (add it after step 8, then **Redeploy**).
5. Deploy. You get `https://<name>.vercel.app`, which is HTTPS. The camera and GPS need HTTPS.
6. Back in Supabase step 3, set **Site URL** to the Vercel URL and add it to **Redirect URLs**.

`seascan-app/vercel.json` already sends every page path to the app, so refreshing
`/scanner` or `/library/halophila-ovalis` works. It also caches the model files for a week
and adds security headers.

**Models.** The deployed models are float16-quantized copies (about 5.7 MB each, half the
original size) of the float32 models kept in `seascan-app/model-source/`. To rebuild them, or
after retraining (replace the files in `model-source/` first):

```powershell
cd seascan-app
node scripts/quantize_models.mjs      # writes public/models/*_f16 and compares both versions
node scripts/evaluate_models.mjs      # per-species metrics on test_photos/<Species>/, float32 vs float16
```

If you replace a model with a retrained one, also rename its output folder (e.g. `_f16_v2`
in `scripts/quantize_models.mjs`, `src/components/seagrassModel.js`, `scripts/evaluate_models.mjs`, `scripts/test_models.mjs`
and `MODEL_FOLDERS` in `app.py`), or users may keep the old cached version for up to a week.

## 8. Deploy the Flask backend API on Render (you)

`app.py` is the REST layer between the web app and the database:

| Endpoint | What it does |
|---|---|
| `GET /api/health` | Is the API up |
| `GET /api/species`, `GET /api/species/<slug>` | Species profiles |
| `GET /api/map/verified-stations` | Survey stations with their species |
| `GET /api/map/sightings` | Approved community sightings (no submitter, no photo) |
| `GET /api/model` | Settings of the deployed CNN models and status of the server-side service |
| `POST /api/identify` | **Server-side identification service**: one JPEG/PNG photo in (form field `photo`, max 10 MB), the identification out. The photo is processed in memory and not stored |
| `POST /api/identifications` | Records one browser identification result: species, confidence, time taken. Never the photo |

Identification normally runs in the visitor's browser. Devices that cannot run the models
(no WebGL, or loading fails, e.g. out of memory) send the photo to `/api/identify`, which runs
the same preprocessing, seagrass check and species model (`seascan_inference.py`) with the
ONNX copies of the models in `server_models/`. Admins can switch this off in
**Admin → CNN Model**. Accounts, sighting submissions and admin work go from the app straight
to Supabase with the user's own token.

1. Run migrations 11 and 12 (step 2) if you have not yet.
2. <https://dashboard.render.com> → **New → Blueprint** → pick the repository (`render.yaml` is used).
3. Set the environment values: `SUPABASE_URL` and `SUPABASE_ANON_KEY` (same as the web app;
   the **anon** key only) and `ALLOWED_ORIGINS` = your Vercel URL, e.g. `https://seascan.vercel.app`
   (no slash at the end; separate several with commas).
4. Deploy, then open `https://<name>.onrender.com/api/health`. It should say "healthy".
5. In Vercel add `VITE_API_URL` = `https://<name>.onrender.com` and redeploy the web app.
6. Check: scan a photo, then open **Admin → Identifications**. The scan should be listed.

Render's free tier sleeps after about 15 minutes without requests, and waking takes up to a
minute. The web app does not wait for it: if the API has not answered within 2.5 seconds it
reads the same data straight from Supabase and tries the API again a minute later. A result
scanned while the API is asleep may not be logged. Before a user-testing session, open the
`/api/health` link once to wake it.

To run it on your PC: `pip install -r requirements.txt`, then `python app.py`
(<http://localhost:5000/api/health>), and put `VITE_API_URL=http://localhost:5000` in
`seascan-app/.env`. ONNX Runtime needs Python 3.10 to 3.13 (Render uses 3.12, set in
`render.yaml`).

**Server models.** `server_models/*.onnx` are the trained Keras models converted to ONNX, so
the server does not need TensorFlow (ONNX Runtime fits Render's free 512 MB). To rebuild them,
e.g. after retraining, put `seascan_final.keras`, `seascan_gate.keras`, `class_names.json` and
`gate_settings.json` in `model-keras/`, then in a separate Python 3.12 environment:

```powershell
pip install "tensorflow==2.20.*" "keras==3.13.2" tf2onnx onnx onnxruntime pillow
python scripts/convert_models_onnx.py        # writes server_models/
python scripts/check_server_inference.py     # server vs browser: preprocessing and test set
```

The `.keras` files are not committed (35 MB each); keep your own copy.

## 9. Weekly backup

The free Supabase plan does not give you downloadable backups, so run this once a week:

1. Install the PostgreSQL **Command Line Tools** (pg_dump):
   <https://www.postgresql.org/download/windows/>.
2. In Supabase click **Connect** (top bar) → **Session pooler** → copy the URI and put your
   database password into it.
3. In PowerShell, from the repository folder:
   ```powershell
   $env:SEASCAN_DB_URL = "postgresql://postgres.xxxx:PASSWORD@aws-0-xx.pooler.supabase.com:5432/postgres"
   .\scripts\backup-db.ps1
   ```
   This writes `backups\seascan-YYYY-MM-DD.sql` and keeps the last 8. `backups/` is ignored by git.
4. To automate it, use **Task Scheduler → Create Basic Task → Weekly**. Program:
   `powershell.exe`. Arguments: `-ExecutionPolicy Bypass -File "D:\SeaScan-main\scripts\backup-db.ps1"`.
   Set `SEASCAN_DB_URL` as a *user environment variable* (Windows search: "Edit environment
   variables for your account").
5. Photos: species photos can be re-uploaded from their sources; sighting photos can be
   downloaded from **Storage → sighting-photos** if needed.
6. Restore test (do it once): create a scratch Supabase project, run the migrations, then
   run the backup file in its SQL Editor.

## 10. Content the research team must add

Migration 9 loads the morphology, ecology, status, distribution, tips, sources and all
11 station points from *SeaScan Library & Map Content*. What is still open is in
**Admin → Species** and **Admin → Stations**, so no code changes are needed:

- **Adviser review**: all 9 profiles stay marked **Needs review** (the app shows "Draft
  profile") until the marine science adviser has read them; then untick *Needs review*.
  Open questions from the content file: *H. minor* cross-vein count, the *Cymodocea* leaf
  scar descriptions, *E. acoroides* at Manguihay, and whether *C. serrulata* belongs at a
  2003 station.
- **Not in the content file yet**: common name and local name (the 8 old values are
  unsourced; *H. minor* has none), "Why it matters" (`ecosystem_contribution`), a licensed
  photo of *C. rotundata* (the supplied one is a watermarked stock preview), the source and
  permission (`photo_credit`) for the other photos, and a few quick facts kept from the old app without a source (blade width of both
  *Halodule*, *H. ovalis* and *T. hemprichii*; venation of *E. acoroides* and
  *S. isoetifolium*).
- **Stations**: confirm the 2025 coordinates on a map (the paper prints them in an invalid
  form; they were read as decimal degrees).

## Security notes

- **RBAC**: roles (`profiles.role`) map to named permissions (`role_permissions`, e.g.
  `sightings.review`, `species.manage`, `audit.read`). Every database rule checks a permission
  through `has_permission()`, and the app hides tabs the same way. To change what a role can
  do, edit `role_permissions` in the SQL Editor; there is deliberately no way to do it from the app.
- **JWT**: Supabase Auth issues short-lived JWT access tokens (1 h) plus a refresh token. The
  hook adds `user_role` and `permissions` claims. The database still checks the live
  `profiles` table, so removing someone's admin role takes effect immediately, not when their
  token expires.
- **Sessions and cookies**: the session is stored in first-party cookies (`sb-…-auth-token.N`,
  `SameSite=Lax`, `Secure` on HTTPS). It's a browser-session cookie unless "Keep me signed in"
  is ticked (then 30 days). Sessions end after 30 minutes of inactivity (always for admins and
  researchers). Logging out deletes the cookies. Because the app has no server of its own,
  the cookies are set by JavaScript and cannot be `HttpOnly`; the short token lifetime and
  database rules limit what a stolen token could do.
- **Audit log**: database triggers record every change made by admins and researchers
  (species, stations, station species, role or test-flag changes, sighting reviews and
  deletions, feedback deletion, answered questions, test-data clean-up), with who, when,
  and old and new values. It is append-only: no one can edit or delete entries through the
  app or API, and only admins (`audit.read`) can read it. View it in **Admin → Audit Log**.
- Permissions are enforced by **Row Level Security** in the database, not by hidden
  buttons. Roles live in `profiles.role`, and users cannot change their own role.
- Only the anon key is used in the browser. The `service_role` key must never appear in
  `VITE_` variables, the code or git.
- The old `.env` was committed in earlier git history. It held only an anon key for a
  project that no longer exists, so nothing needs rotating. `.env` is now git-ignored.
- Sighting photos are private (signed links for owner and staff), and their EXIF/GPS
  metadata is removed in the browser before upload.
