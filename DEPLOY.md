# Lux Royale - Deployment & Supabase Setup

## 1. Supabase project

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the contents of `schema.sql`. This creates
   `profiles`, `transactions`, `game_sessions`, the RLS policies, the
   `process_transaction` RPC, triggers, and adds `game_sessions` to the
   `supabase_realtime` publication.
3. In **Project Settings > API**, copy:
   - **Project URL** -> `SUPABASE_URL`
   - **anon public** key -> `SUPABASE_ANON_KEY` (this key is safe in the browser;
     the `service_role` key must NEVER be used in client code).

## 2. Enable Realtime for `profiles` and `game_sessions`

Realtime drives the live balance and shared multiplayer game state.

**Option A - Dashboard (UI):**
1. Go to **Database > Replication** (or **Database > Publications**).
2. Open the `supabase_realtime` publication.
3. Toggle **ON** the tables you want broadcast: enable `profiles` and
   `game_sessions`.
4. Save. Changes (INSERT/UPDATE/DELETE) on those tables now stream to clients.

**Option B - SQL (already partly done in schema.sql):**
```sql
-- game_sessions is added by schema.sql; add profiles too if you want
-- live balance via the profiles subscription:
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.game_sessions;
```

> Note: enabling Realtime publishes row changes, but **RLS still applies** to
> what each client may receive. Users only get realtime rows they are allowed
> to read (their own profile; shared game_sessions).

## 3. Credentials (no secrets in git)

- `env.js` holds `window.env` and is **git-ignored** (see `.gitignore`).
- Locally: `cp env.example.js env.js` and fill in your URL + anon key.
- On Vercel: set `SUPABASE_URL` and `SUPABASE_ANON_KEY` as Environment
  Variables, and let the build generate `env.js`.

## 4. Vercel deploy

1. Import the repo into Vercel.
2. **Settings > Environment Variables**: add `SUPABASE_URL` and
   `SUPABASE_ANON_KEY`.
3. **Settings > Build & Output**:
   - Build Command: `node scripts/generate-env.js`
   - Output Directory: `.` (static site; this is a plain HTML/JS app)
4. Ensure `index.html` loads scripts in this order (env.js first):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="env.js"></script>
   <script src="supabase-config.js"></script>
   <script src="auth.js"></script>
   <script src="payment-gateway.js"></script>
   <script src="js/games/_engine.js"></script>
   <script src="js/games/_shared.js"></script>
   <!-- game files -->
   <script src="app.js"></script>
   <script src="js/admin.js"></script>
   ```
5. Deploy.

## 5. Data sync (how auth maps to tables)

- On sign-up, the `on_auth_user_created` trigger (in `schema.sql`) auto-inserts
  a `profiles` row for the new `auth.users` id. No client write needed.
- On login, `auth.js` reads the profile and subscribes to balance changes.
- Balance only changes via the `process_transaction` RPC (server-side, atomic).

## 6. Still required before real use

- Implement `play_round` (provably-fair RNG + payout + atomic balance) and
  `set_house_config` (admin-gated, range-validated, logged) as Postgres
  functions / Edge Functions. Until then games run in labelled DEMO mode.
- Real-money gambling requires licensing, KYC, and age/geo controls in most
  jurisdictions. Run as a virtual-chips simulation unless properly licensed.
