/* script.js
   Obsidian / Real King Casino - Client
   - Vanilla JS
   - Supabase optional (configured in Settings)
   - Slot game, balance, history, PWA registration, offline persistence
   Version: 1.0.0
*/

/* ===========================
   CONFIG & STATE
   =========================== */

const STATE = {
  balance: 1000.00,            // local fallback balance (USD)
  history: [],                 // local play history
  pendingSessions: [],         // sessions waiting to sync to server
  symbols: ['🍒','🍋','🍊','🔔','💎','7','⭐'], // reel symbols, 7 is premium
  reelsCount: 3,
  spinning: false,
  supabase: null,
  user: null,
  clientSeed: null
};

const LS_KEYS = {
  BALANCE: 'rk_balance_v1',
  HISTORY: 'rk_history_v1',
  CREDENTIALS: 'rk_supabase_creds_v1',
  PENDING: 'rk_pending_sessions_v1',
  CLIENT_SEED: 'rk_client_seed_v1'
};

/* ===========================
   UTILITIES
   =========================== */

function fmt(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function nowISO() {
  return new Date().toISOString();
}

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function hashHex(str) {
  // simple SHA-256 wrapper returning hex string (browser crypto)
  const enc = new TextEncoder();
  return crypto.subtle.digest('SHA-256', enc.encode(str)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  });
}

/* ===========================
   PERSISTENCE
   =========================== */

function loadState() {
  try {
    const b = localStorage.getItem(LS_KEYS.BALANCE);
    const h = localStorage.getItem(LS_KEYS.HISTORY);
    const p = localStorage.getItem(LS_KEYS.PENDING);
    const cs = localStorage.getItem(LS_KEYS.CLIENT_SEED);

    if (b !== null) STATE.balance = parseFloat(b);
    if (h) STATE.history = JSON.parse(h);
    if (p) STATE.pendingSessions = JSON.parse(p);
    if (cs) STATE.clientSeed = cs;
    if (!STATE.clientSeed) {
      STATE.clientSeed = crypto.getRandomValues(new Uint32Array(4)).join('-') + '-' + Date.now();
      localStorage.setItem(LS_KEYS.CLIENT_SEED, STATE.clientSeed);
    }
  } catch (err) {
    console.warn('Failed to load state:', err);
  }
}

function saveBalance() {
  try { localStorage.setItem(LS_KEYS.BALANCE, String(STATE.balance)); } catch(e){}
}

function saveHistory() {
  try { localStorage.setItem(LS_KEYS.HISTORY, JSON.stringify(STATE.history.slice(0,250))); } catch(e){}
}

function savePending() {
  try { localStorage.setItem(LS_KEYS.PENDING, JSON.stringify(STATE.pendingSessions)); } catch(e){}
}

/* ===========================
   UI HELPERS
   =========================== */

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function updateBalanceUI() {
  const el = $('#balance');
  if (!el) return;
  el.textContent = fmt(STATE.balance);
}

function pushHistory(entry) {
  STATE.history.unshift(entry);
  if (STATE.history.length > 200) STATE.history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const list = $('#history');
  if (!list) return;
  list.innerHTML = '';
  if (!STATE.history.length) {
    const li = document.createElement('li');
    li.className = 'text-center text-emerald-200/30';
    li.textContent = 'No plays yet';
    list.appendChild(li);
    return;
  }
  for (const h of STATE.history.slice(0,50)) {
    const li = document.createElement('li');
    li.innerHTML = `<div>${h.resultEmoji} <strong>${h.outcome}</strong></div><div style="text-align:right"><small>${h.amountLabel}</small><br/><small style="opacity:.6">${new Date(h.ts).toLocaleString()}</small></div>`;
    list.appendChild(li);
  }
}

/* ===========================
   SETTINGS & SUPABASE
   =========================== */

function loadSavedCreds() {
  const raw = localStorage.getItem(LS_KEYS.CREDENTIALS);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e){ return null; }
}

function saveCreds(url, key) {
  const obj = { url: url, key: key };
  localStorage.setItem(LS_KEYS.CREDENTIALS, JSON.stringify(obj));
}

function clearCreds() {
  localStorage.removeItem(LS_KEYS.CREDENTIALS);
  STATE.supabase = null;
  STATE.user = null;
  $('#btn-auth')?.classList.remove('bg-mint');
  $('#btn-auth').textContent = 'Sign in';
}

function initSupabaseFromSaved() {
  const creds = loadSavedCreds();
  if (!creds || !creds.url || !creds.key) return false;
  try {
    STATE.supabase = supabase.createClient(creds.url, creds.key, { auth: { persistSession: true } });
    // Try to get current user (if any)
    STATE.supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        STATE.user = data.user;
        $('#btn-auth').textContent = 'Account';
      }
    }).catch(() => {});
    return true;
  } catch (err) {
    console.warn('Supabase init failed', err);
    STATE.supabase = null;
    return false;
  }
}

/* ===========================
   AUTH (simple email magic link)
   =========================== */

async function signInMagic(email) {
  if (!STATE.supabase) { showToast('Supabase not configured', 'error'); return; }
  try {
    const res = await STATE.supabase.auth.signInWithOtp({ email });
    if (res.error) throw res.error;
    showToast('Check your email for the magic link', 'success');
  } catch (err) {
    showToast('Sign-in failed: ' + (err.message || err), 'error');
  }
}

async function signOut() {
  if (!STATE.supabase) { showToast('Not signed in', 'info'); return; }
  await STATE.supabase.auth.signOut();
  STATE.user = null;
  showToast('Signed out', 'info');
  $('#btn-auth').textContent = 'Sign in';
}

/* ===========================
   PROVABLY-FAIR (client local fallback)
   =========================== */

async function getServerSeedHash(game_type='neon-slot') {
  // If supabase and function exists, call generate_provably_fair_seed
  if (STATE.supabase && STATE.user) {
    try {
      const rpcName = 'generate_provably_fair_seed';
      // supabase.rpc expects proper parameter names; the provided function accepts p_user_id, p_game_type
      const resp = await STATE.supabase.rpc(rpcName, { p_user_id: STATE.user.id, p_game_type: game_type });
      if (resp && resp.data) return resp.data;
    } catch (err) {
      console.warn('RPC seed fetch failed:', err);
    }
  }
  // Fallback: local serverSeed (not truly server) - generate and return hash
  const localServerSeed = crypto.getRandomValues(new Uint32Array(8)).join('-') + '-' + Date.now();
  return hashHex(localServerSeed);
}

/* ===========================
   GAME CORE: Slot Machine
   =========================== */

function getRandomSpinResult() {
  // produce an array of reel indices
  return Array.from({length: STATE.reelsCount}, () => randInt(STATE.symbols.length));
}

function evaluateSpin(symbolIndexes, stake) {
  // rules:
  // - triple match: if all three equal => payoutFactor depending on symbol
  // - double match (any two equal): payout 2x
  // - '7' symbol triple => 50x
  // - '💎' triple => 20x
  // - any other triple => 10x
  // - single 7 => small bonus 0.5x? (we'll ignore)
  const symbols = STATE.symbols;
  const s = symbolIndexes.map(i => symbols[i]);
  const counts = {};
  s.forEach(sym => counts[sym] = (counts[sym]||0) + 1);
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]); // [symbol,count]
  const top = entries[0];

  let multiplier = 0;
  let outcome = 'LOSS';
  let emoji = '😞';

  if (top[1] === 3) {
    // triple
    const sym = top[0];
    if (sym === '7') multiplier = 50;
    else if (sym === '💎') multiplier = 20;
    else if (sym === '⭐') multiplier = 12;
    else multiplier = 10;
    outcome = 'JACKPOT';
    emoji = '🎉';
  } else if (top[1] === 2) {
    multiplier = 2;
    outcome = 'WIN';
    emoji = '✨';
  } else {
    // small consolation if one 7
    if (s.includes('7')) {
      multiplier = 0.25; // return quarter
      outcome = 'MINI';
      emoji = '🔸';
    } else {
      multiplier = 0;
      outcome = 'LOSS';
      emoji = '😞';
    }
  }

  const winAmount = +(stake * multiplier);
  return { multiplier, winAmount, outcome, emoji, symbols: s };
}

async function spinAction() {
  if (STATE.spinning) return;
  STATE.spinning = true;

  const betEl = $('#bet');
  const stake = Math.max(1, Math.floor(Number(betEl?.value || 1)));
  if (isNaN(stake) || stake <= 0) {
    showToast('Enter a valid stake', 'warning');
    STATE.spinning = false;
    return;
  }

  if (stake > STATE.balance) {
    showToast('Insufficient balance', 'error');
    STATE.spinning = false;
    return;
  }

  // Deduct stake immediately (optimistic)
  STATE.balance = +(STATE.balance - stake);
  saveBalance();
  updateBalanceUI();

  // UI: animate reel placeholders
  const reelEls = $all('.reel');
  reelEls.forEach(r => {
    r.classList.remove('win');
    r.innerHTML = '<div class="strip">...</div>';
    r.classList.add('spin');
  });

  // keep a random animation for 600-900ms then finalize each reel staggered
  const finalIndices = getRandomSpinResult();
  const spinDurations = finalIndices.map((_,i) => 700 + i*180 + randInt(200));

  // for accessible play announce
  let announceText = 'Spinning...';

  $('#result').textContent = 'Spinning...';
  announce(announceText);

  // staggered stopping
  for (let i=0;i<STATE.reelsCount;i++) {
    await new Promise(res => setTimeout(res, spinDurations[i]));
    const idx = finalIndices[i];
    const symbol = STATE.symbols[idx];
    const reel = reelEls[i];
    if (reel) {
      reel.classList.remove('spin');
      reel.querySelector('.strip')?.remove?.();
      reel.textContent = symbol;
      // small flicker
      reel.animate([{ transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 180, easing: 'cubic-bezier(.16,.92,.32,1)' });
    }
  }

  // evaluate
  const result = evaluateSpin(finalIndices, stake);
  if (result.winAmount > 0) {
    STATE.balance = +(STATE.balance + result.winAmount);
    // mark winning reels visually (if triple or double)
    const winSymbol = result.symbols[0];
    $all('.reel').forEach(r => { if (r.textContent === winSymbol) r.classList.add('win'); });
    $('#result').innerHTML = `<span class="accent-gold">${result.emoji} ${result.outcome} — +${fmt(result.winAmount)} USD</span>`;
  } else {
    $('#result').innerHTML = `<span style="color:#ff4444">${result.emoji} ${result.outcome} — -${fmt(stake)} USD</span>`;
  }

  // store history and pending session
  const historyEntry = {
    ts: nowISO(),
    outcome: result.outcome,
    amountLabel: (result.winAmount > 0) ? `+${fmt(result.winAmount)}` : `-${fmt(stake)}`,
    resultEmoji: result.emoji,
    symbols: result.symbols,
    stake,
    multiplier: result.multiplier
  };

  pushHistory(historyEntry);
  saveBalance();

  // create session payload to send to server later (or now)
  const sessionPayload = {
    id: 'local-' + (crypto.getRandomValues(new Uint32Array(2)).join('-')) + '-' + Date.now(),
    user_id: STATE.user ? STATE.user.id : null,
    game_type: 'neon-slot',
    stake: stake,
    win_amount: result.winAmount,
    multiplier: result.multiplier,
    hash_seed: null, // will attempt to fetch server hash if possible
    settlement: result.winAmount > 0 ? 'WON' : 'LOST',
    created_at: nowISO(),
    game_data: { symbols: result.symbols, client_seed: STATE.clientSeed }
  };

  // try to fetch provably fair server seed hash (best-effort)
  try {
    sessionPayload.hash_seed = await getServerSeedHash('neon-slot');
  } catch (err) { sessionPayload.hash_seed = null; }

  // push to pending array and try to sync
  STATE.pendingSessions.unshift(sessionPayload);
  savePending();

  trySyncPending();

  // final UI cleanup
  updateBalanceUI();
  STATE.spinning = false;
}

/* ===========================
   SYNC: send pending sessions to Supabase if configured
   =========================== */

async function trySyncPending() {
  if (!STATE.supabase || !STATE.user) return; // must be authenticated to write server-side
  if (!STATE.pendingSessions.length) return;

  const toSync = STATE.pendingSessions.slice(); // copy
  for (const s of toSync) {
    try {
      // if server has RPC handle_game_result, call it to update settlement atomically
      // insert a game_sessions row then call handle_game_result OR use RPC directly
      // We'll attempt to insert a game_sessions row and then call handle_game_result
      const insert = {
        user_id: STATE.user.id,
        game_type: s.game_type,
        stake: s.stake,
        win_amount: s.win_amount,
        multiplier: s.multiplier,
        hash_seed: s.hash_seed || '',
        settlement: s.settlement,
        game_data: s.game_data
      };
      // Insert session
      const { data: insertData, error: insertErr } = await STATE.supabase
        .from('game_sessions')
        .insert(insert)
        .select('id')
        .limit(1)
        .single();

      if (insertErr) {
        console.warn('Insert session failed', insertErr);
        // continue to next (don't remove)
        continue;
      }

      const sessionId = insertData.id;

      // If win, call handle_game_result to atomically update user balance on server
      if (s.settlement === 'WON') {
        try {
          const { data: rpcData, error: rpcErr } = await STATE.supabase.rpc('handle_game_result', {
            p_user_id: STATE.user.id,
            p_session_id: sessionId,
            p_win_amount: s.win_amount,
            p_settlement: s.settlement
          });
          if (rpcErr) {
            console.warn('handle_game_result rpc failed', rpcErr);
            // Not critical to block; server might be configured differently
          }
        } catch (err) {
          console.warn('RPC call error', err);
        }
      }

      // successful sync: remove from pending
      STATE.pendingSessions = STATE.pendingSessions.filter(x => x.id !== s.id);
      savePending();
    } catch (err) {
      console.warn('Sync pending failed for', s.id, err);
    }
  }
}

/* ===========================
   PWA: manifest link & service worker
   =========================== */

function registerPWA() {
  // manifest already present in repo; ensure link set to /manifest.json
  const mlink = document.getElementById('site-manifest');
  if (mlink) mlink.setAttribute('href', '/manifest.json');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      console.log('Service worker registered', reg);

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            // New content available
            console.log('SW update installed');
          }
        });
      });

    }).catch(err => {
      console.warn('SW registration failed', err);
    });
  }
}

/* ===========================
   SMALL ACCESSIBILITY / ANNOUNCE
   =========================== */

function announce(text) {
  let el = document.getElementById('rk-aria-live');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rk-aria-live';
    el.setAttribute('aria-live','polite');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
  }
  el.textContent = text;
}

/* ===========================
   SETTINGS MODAL BEHAVIOR
   =========================== */

function openSettings() {
  $('#modal-overlay').classList.remove('hidden');
  // populate fields from saved creds
  const creds = loadSavedCreds();
  $('#supabase-url').value = creds?.url || '';
  $('#supabase-key').value = creds?.key || '';
}

function closeSettings() {
  $('#modal-overlay').classList.add('hidden');
}

function saveSettingsAndInit() {
  const url = ($('#supabase-url').value || '').trim();
  const key = ($('#supabase-key').value || '').trim();
  if (!url || !key) {
    showToast('Please provide both Supabase URL and ANON key', 'warning');
    return;
  }
  try {
    saveCreds(url, key);
    initSupabaseFromSaved();
    showToast('Supabase configured (not signed in)', 'success');
    closeSettings();
  } catch (err) {
    showToast('Failed to initialize Supabase', 'error');
  }
}

function clearSettings() {
  clearCreds();
  showToast('Supabase credentials cleared', 'info');
}

/* ===========================
   TOPUP / WITHDRAW (simple local flow)
   =========================== */

function openTopupPrompt() {
  const amt = prompt('Top up amount (USD)', '50');
  const n = Number(amt);
  if (!amt || isNaN(n) || n<=0) return;
  STATE.balance = +(STATE.balance + n);
  saveBalance();
  updateBalanceUI();
  pushHistory({ ts: nowISO(), outcome: 'TOPUP', amountLabel: `+${fmt(n)}`, resultEmoji: '💳', symbols: [] });
  showToast('Topup added locally', 'success');
}

function openWithdrawPrompt() {
  const amt = prompt('Withdraw amount (USD)', '50');
  const n = Number(amt);
  if (!amt || isNaN(n) || n<=0) return;
  if (n > STATE.balance) { showToast('Insufficient balance', 'error'); return; }
  STATE.balance = +(STATE.balance - n);
  saveBalance();
  updateBalanceUI();
  pushHistory({ ts: nowISO(), outcome: 'WITHDRAW', amountLabel: `-${fmt(n)}`, resultEmoji: '🏧', symbols: [] });
  showToast('Withdrawal queued locally', 'info');
}

/* ===========================
   UI Wiring & Init
   =========================== */

function bindUI() {
  // Buttons
  $('#btn-spin')?.addEventListener('click', spinAction);
  $('#btn-topup')?.addEventListener('click', openTopupPrompt);
  $('#btn-withdraw')?.addEventListener('click', openWithdrawPrompt);

  $('#btn-settings')?.addEventListener('click', openSettings);
  $('#modal-close')?.addEventListener('click', closeSettings);
  $('#save-credentials')?.addEventListener('click', saveSettingsAndInit);
  $('#clear-credentials')?.addEventListener('click', clearSettings);

  $('#btn-auth')?.addEventListener('click', async () => {
    // If supabase configured and user logged in -> open account; else open simple sign-in prompt
    if (!STATE.supabase) {
      showToast('Configure Supabase in Settings first', 'warning');
      openSettings();
      return;
    }
    // check user
    const userResp = await STATE.supabase.auth.getUser();
    if (userResp && userResp.data && userResp.data.user) {
      // signed in -> sign out
      if (confirm('Sign out?')) {
        await signOut();
      }
      return;
    }

    // Not signed in -> ask for email
    const email = prompt('Enter your email for a magic link sign in', '');
    if (!email) return;
    await signInMagic(email);
  });

  // keyboard shortcuts (accessibility)
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      $('#btn-spin')?.click();
    }
  });

  // Make reels tappable to animate small nudge
  $all('.reel').forEach(r => {
    r.addEventListener('click', () => {
      r.animate([{ transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 120 });
    });
  });
}

function boot() {
  loadState();
  initSupabaseFromSaved();
  bindUI();
  updateBalanceUI();
  renderHistory();
  registerPWA();

  // Sync pending if online and authenticated
  window.addEventListener('online', () => {
    trySyncPending();
    showToast('Back online — syncing', 'info');
  });

  // Periodic sync attempts
  setInterval(trySyncPending, 30 * 1000);

  console.log('Obsidian / Real King Casino client ready');
}

/* ===========================
   SMALL POLISH: toast system (re-usable)
   =========================== */

function showToast(message, type='info') {
  // small reuse; same style as other toasts to keep consistent
  const colors = { info: '#00b0ff', success: '#00e676', error: '#ff4444', warning: '#FFD700' };
  const existing = document.getElementById('rk-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'rk-toast';
  toast.style.cssText = `
    position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:9999;
    background:rgba(1,23,19,0.95);color:white;padding:10px 16px;border-radius:12px;
    border-left:4px solid ${colors[type] || colors.info};box-shadow:0 6px 30px rgba(0,0,0,0.6);font-weight:600;
    max-width:90vw;text-align:center;font-size:13px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(()=> {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(18px)';
    setTimeout(()=> toast.remove(), 320);
  }, 3000);
}

/* ===========================
   START
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
  // Re-map index.html layout if it uses other container class names
  // For compatibility with the provided index.html, ensure class names exist
  // (index.html already matches selectors used above)

  boot();
});
