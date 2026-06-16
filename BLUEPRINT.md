# Vega Casino — Project Blueprint

## Folder Structure
```
casino-app/
├── index.html              # SPA shell, router, top bar, bottom nav, PWA manifest links
├── manifest.json           # PWA manifest
├── sw.js                    # Service worker (offline shell caching)
├── supabase-config.js       # Supabase client init + realtime channel helpers
├── auth.js                  # Auth: signup/login/session/logout
├── payment-gateway.js        # Deposit/withdraw mock gateway + ledger
├── app.js                    # Master engine: router, game loader, lobby renderer
├── admin.js                  # Admin dashboard logic (RTP, monitoring, logs)
├── schema.sql                # Full Postgres schema + RLS + RPC functions
├── /games
│   ├── teen-patti.js          # Game 1 — 3D Teen Patti (multiplayer)
│   ├── andar-bahar.js         # Game 2 — Andar Bahar (multiplayer)
│   ├── crash.js               # Game 3 — Aviator/Crash
│   ├── roulette.js            # Game 4 — 3D WebGL Roulette
│   ├── blackjack.js           # Game 5
│   ├── baccarat.js            # Game 6
│   ├── jhandi-munda.js        # Game 7
│   ├── dragon-tiger.js        # Game 8
│   ├── seven-up-down.js       # Game 9
│   ├── car-roulette.js        # Game 10
│   ├── ludo.js                # Game 11
│   ├── plinko.js              # Game 12 — physics
│   ├── mines.js               # Game 13
│   ├── wheel-fortune.js       # Game 14
│   ├── slots-3reel.js         # Game 15
│   ├── video-poker.js         # Game 16
│   ├── red-dog.js             # Game 17
│   ├── sicbo.js               # Game 18 — 3D dice
│   ├── hilo.js                # Game 19
│   └── keno.js                # Game 20
└── /assets
    └── (none — all visuals via CSS/SVG/Three.js procedural geometry)
```

## Routing Model
Hash-based SPA router in `app.js`:
- `#home` → Lobby grid (20 game tiles)
- `#game-<slug>` → Loads `/games/<slug>.js` module dynamically, mounts into `#game-canvas`
- `#wallet` → Deposit/withdraw UI (payment-gateway.js)
- `#admin` → Admin dashboard (admin.js), gated by `profiles.role === 'admin'`
- `#live-rooms` → Live multiplayer lobby (Teen Patti / Andar Bahar / Dragon Tiger rooms)

## Realtime Sync Pattern (No-API)
Every multiplayer game writes/reads a row in `game_sessions`:
```
game_sessions
├── id
├── game_name      ('teen-patti-room-1')
├── game_state     (jsonb: cards, pot, timer, players, multiplier...)
├── status         ('waiting' | 'betting' | 'dealing' | 'finished')
└── updated_at
```
Client A places a bet → `supabase.from('bets').insert(...)` (validated by RLS + RPC for balance deduction)
→ Postgres trigger updates `game_sessions.game_state`
→ Realtime broadcasts `UPDATE` to all subscribed clients
→ Each client's `subscribeToGameSession()` callback re-renders the table/wheel/cards

This avoids any custom API route — all writes go through `supabase-js` directly with RLS + RPC enforcing rules server-side.

## RPC Functions (replace risky direct balance writes)
- `place_bet(p_session_id, p_amount, p_choice)` — atomically checks balance, deducts, inserts bet row
- `settle_round(p_session_id)` — admin/cron-triggered, distributes payouts based on `game_state.result`
- `adjust_balance(p_user_id, p_delta, p_reason)` — used by payment-gateway for deposits/withdrawals

## Build Order (this delivery)
Given the size of a 20-game platform, this delivery includes:
1. Updated `schema.sql` (adds `bets` table + RPC functions for game economy)
2. `app.js` — master router + dynamic game loader + lobby with all 20 tiles
3. `games/teen-patti.js` — full 3D card UI + realtime multiplayer betting
4. `games/andar-bahar.js` — full realtime multiplayer with countdown + card dealing
5. `games/_template.js` — boilerplate template the remaining 18 games extend (so each can be
   generated quickly following the same pattern: countdown → bet → realtime result → payout)
6. Lightweight placeholder stubs for the remaining 18 games (registered in lobby, loadable,
   show "coming online" with the shared betting UI shell — ready to extend using the template)

`index.html`, `supabase-config.js`, `auth.js`, `payment-gateway.js` are reused from the previous
delivery with minor additions (game-canvas mount point, admin route guard).
