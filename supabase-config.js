// =====================================================================
// SUPABASE CONFIG — Client SDK init + Realtime + RPC helpers (v2)
// Load via CDN BEFORE this file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
// =====================================================================

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

// ---------------------------------------------------------------------
// AUTH HELPERS
// ---------------------------------------------------------------------
async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) console.error("OTP send error:", error.message);
  return { data, error };
}

async function verifyOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) console.error("OTP verify error:", error.message);
  return { data, error };
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error("getUser error:", error.message);
  return data?.user || null;
}

async function signOut() {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------
// PROFILE / BALANCE
// ---------------------------------------------------------------------
async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) console.error("getProfile error:", error.message);
  return data;
}

function subscribeToBalance(userId, onChange) {
  return supabase
    .channel(`profile-balance-${userId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
      (payload) => onChange(payload.new)
    )
    .subscribe();
}

// ---------------------------------------------------------------------
// TRANSACTIONS
// ---------------------------------------------------------------------
async function createTransaction(userId, type, amount, status = "pending") {
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ user_id: userId, type, amount, status }])
    .select()
    .single();
  if (error) console.error("createTransaction error:", error.message);
  return { data, error };
}

async function getTransactions(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("getTransactions error:", error.message);
  return data || [];
}

function subscribeToTransactions(userId, onChange) {
  return supabase
    .channel(`transactions-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload)
    )
    .subscribe();
}

// ---------------------------------------------------------------------
// GAME SESSIONS — REALTIME MULTIPLAYER SYNC
// ---------------------------------------------------------------------
async function getGameSession(gameName) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("game_name", gameName)
    .single();
  if (error) console.error("getGameSession error:", error.message);
  return data;
}

// Subscribe to a single room. All players receive the SAME state instantly.
function subscribeToGameSession(gameName, onUpdate) {
  return supabase
    .channel(`game-session-${gameName}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_sessions", filter: `game_name=eq.${gameName}` },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        onUpdate(payload.new);
      }
    )
    .subscribe();
}

// Subscribe to all bets placed in a session+round (live bet feed / pot totals)
function subscribeToBets(sessionId, onUpdate) {
  return supabase
    .channel(`bets-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bets", filter: `session_id=eq.${sessionId}` },
      (payload) => onUpdate(payload)
    )
    .subscribe();
}

function subscribeToAllGameSessions(onUpdate) {
  return supabase
    .channel("game-sessions-all")
    .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions" }, (payload) =>
      onUpdate(payload)
    )
    .subscribe();
}

function unsubscribe(channel) {
  if (channel) supabase.removeChannel(channel);
}

// ---------------------------------------------------------------------
// RPC WRAPPERS (security-definer functions in schema.sql)
// ---------------------------------------------------------------------

// Place a bet — server-side validates balance + round status atomically
async function placeBet(sessionId, roundId, choice, amount) {
  const { data, error } = await supabase.rpc("place_bet", {
    p_session_id: sessionId,
    p_round_id: roundId,
    p_choice: choice,
    p_amount: amount
  });
  if (error) console.error("placeBet error:", error.message);
  return { data, error };
}

// Settle a round — admin only
async function settleRound(sessionId, roundId, winningChoice, multiplier = 2.0) {
  const { data, error } = await supabase.rpc("settle_round", {
    p_session_id: sessionId,
    p_round_id: roundId,
    p_winning_choice: winningChoice,
    p_multiplier: multiplier
  });
  if (error) console.error("settleRound error:", error.message);
  return { data, error };
}

// Adjust balance — used by payment-gateway (deposit/withdraw)
async function adjustBalance(userId, delta, reason = "adjustment") {
  const { data, error } = await supabase.rpc("adjust_balance", {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason
  });
  if (error) console.error("adjustBalance error:", error.message);
  return { data, error };
}

// Update game_sessions.game_state (admin/dealer-driven state machine)
async function updateGameState(gameName, patch) {
  const { data, error } = await supabase
    .from("game_sessions")
    .update(patch)
    .eq("game_name", gameName)
    .select()
    .single();
  if (error) console.error("updateGameState error:", error.message);
  return { data, error };
}

// ---------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------
window.SupabaseAPI = {
  supabase,
  // auth
  signInWithPhone,
  verifyOtp,
  getCurrentUser,
  signOut,
  // profile
  getProfile,
  subscribeToBalance,
  // transactions
  createTransaction,
  getTransactions,
  subscribeToTransactions,
  // game sessions
  getGameSession,
  subscribeToGameSession,
  subscribeToBets,
  subscribeToAllGameSessions,
  updateGameState,
  unsubscribe,
  // RPC
  placeBet,
  settleRound,
  adjustBalance
};
