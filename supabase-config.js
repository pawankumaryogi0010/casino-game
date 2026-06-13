// =============================================================
// supabase-config.js  -  Lux Royale Casino
// Zero-API: the browser talks directly to Supabase via the SDK.
//
// Load the SDK first (in index.html, before this file):
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase-config.js"></script>
//
// SECURITY: only ever expose the ANON (publishable) key here.
// Never put the service_role key in client code. RLS + the
// process_transaction RPC enforce all real security server-side.
// =============================================================

// Credentials are injected at deploy time via env.js (see env.example.js
// and DEPLOY.md). env.js is generated from Vercel env vars and is NOT
// committed. The ANON key is safe to expose in the client (RLS enforces
// access) but should still come from config, never be hardcoded in source.
const ENV = (typeof window !== 'undefined' && window.env) ? window.env : {};
const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabase-config] Missing window.env.SUPABASE_URL / SUPABASE_ANON_KEY. ' +
    'Ensure env.js is generated from your Vercel environment variables and loaded before this file.');
}

// `supabase` global comes from the CDN UMD bundle.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
});

// -------------------------------------------------------------
// AUTH (phone OTP example)
// -------------------------------------------------------------
async function signInWithPhone(phone) {
  const { data, error } = await sb.auth.signInWithOtp({ phone });
  if (error) console.error('OTP send failed:', error.message);
  return { data, error };
}

async function verifyOtp(phone, token) {
  const { data, error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) console.error('OTP verify failed:', error.message);
  return { data, error };
}

async function signOut() {
  return sb.auth.signOut();
}

async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// -------------------------------------------------------------
// PROFILE / BALANCE
// -------------------------------------------------------------
async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('id, phone_number, balance, role, created_at')
    .eq('id', user.id)
    .single();
  if (error) { console.error('getMyProfile:', error.message); return null; }
  return data;
}

// Balance changes go through the secure RPC, never a direct UPDATE.
async function processTransaction(type, amount) {
  const { data, error } = await sb.rpc('process_transaction', {
    p_type: type,
    p_amount: amount,
  });
  if (error) { console.error('processTransaction:', error.message); return { error }; }
  return { data }; // returns the updated profile row
}

async function getMyTransactions(limit = 20) {
  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('getMyTransactions:', error.message); return []; }
  return data;
}

// Live balance: listen to my own profile row changing.
function subscribeToBalance(userId, onChange) {
  return sb
    .channel('profile:' + userId)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      (payload) => onChange(payload.new))
    .subscribe();
}

// -------------------------------------------------------------
// GAME SESSIONS - shared realtime state for all players
// -------------------------------------------------------------

// Fetch the current state of a session once (e.g. on page load).
async function getGameSession(sessionId) {
  const { data, error } = await sb
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error) { console.error('getGameSession:', error.message); return null; }
  return data;
}

// Subscribe to ALL changes on one game session. Every connected
// client receives the new row instantly, so state stays in sync.
//
//   const channel = subscribeToGameSession(id, (state, evt) => render(state));
//   ...later...  unsubscribe(channel);
function subscribeToGameSession(sessionId, onUpdate) {
  return sb
    .channel('game_session:' + sessionId)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
      (payload) => onUpdate(payload.new, payload.eventType))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('Live on session', sessionId);
    });
}

// Subscribe to the whole table (lobby view: all active games).
function subscribeToAllGameSessions(onUpdate) {
  return sb
    .channel('game_sessions:all')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'game_sessions' },
      (payload) => onUpdate(payload.new, payload.eventType))
    .subscribe();
}

// Admin-only: push new shared game state (RLS blocks non-admins).
async function updateGameState(sessionId, gameState, status) {
  const patch = { game_state: gameState };
  if (status) patch.status = status;
  const { data, error } = await sb
    .from('game_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select()
    .single();
  if (error) { console.error('updateGameState:', error.message); return { error }; }
  return { data };
}

function unsubscribe(channel) {
  if (channel) sb.removeChannel(channel);
}

// Expose globally for the SPA in index.html
window.Casino = {
  sb,
  signInWithPhone, verifyOtp, signOut, getCurrentUser,
  getMyProfile, processTransaction, getMyTransactions, subscribeToBalance,
  getGameSession, subscribeToGameSession, subscribeToAllGameSessions,
  updateGameState, unsubscribe,
};
