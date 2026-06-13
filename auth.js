// =============================================================
// auth.js  -  Lux Royale Casino
// Client-side authentication built on the Supabase SDK.
// Depends on supabase-config.js (window.Casino) loaded first:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase-config.js"></script>
//   <script src="auth.js"></script>
// =============================================================

(function () {
  'use strict';

  const C = window.Casino;
  if (!C) { console.error('auth.js: supabase-config.js must load first'); return; }

  let balanceChannel = null;

  // ---------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------
  function fmt(n) {
    const v = Number(n) || 0;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function paintBalance(balance) {
    const top = document.getElementById('balanceDisplay');
    const wallet = document.getElementById('walletBalance');
    if (top) top.textContent = fmt(balance);
    if (wallet) wallet.textContent = fmt(balance);
  }

  function goHome() {
    if (location.hash !== '#home') location.hash = '#home';
  }

  // ---------------------------------------------------------
  // Registration  (email OR phone)
  // ---------------------------------------------------------
  async function signUp({ email, phone, password }) {
    try {
      const creds = password
        ? (email ? { email, password } : { phone, password })
        : null;
      if (!creds) throw new Error('Email or phone with password required');

      const { data, error } = await C.sb.auth.signUp(creds);
      if (error) throw error;
      return { ok: true, data };
    } catch (err) {
      console.error('signUp:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // ---------------------------------------------------------
  // Login  (email+password, or phone OTP via config helpers)
  // ---------------------------------------------------------
  async function signIn({ email, phone, password }) {
    try {
      let res;
      if (email && password) {
        res = await C.sb.auth.signInWithPassword({ email, password });
      } else if (phone && password) {
        res = await C.sb.auth.signInWithPassword({ phone, password });
      } else if (phone) {
        return C.signInWithPhone(phone); // OTP flow, verify separately
      } else {
        throw new Error('Provide email/phone and password');
      }
      if (res.error) throw res.error;
      return { ok: true, data: res.data };
    } catch (err) {
      console.error('signIn:', err.message);
      return { ok: false, error: err.message };
    }
  }

  async function logout() {
    if (balanceChannel) { C.unsubscribe(balanceChannel); balanceChannel = null; }
    await C.signOut();
  }

  // ---------------------------------------------------------
  // Session bootstrap + live balance wiring
  // ---------------------------------------------------------
  async function hydrateSession(user) {
    if (!user) return;
    const profile = await C.getMyProfile();
    if (profile) paintBalance(profile.balance);

    // Live balance: re-paint whenever our profile row changes
    // (e.g. after a deposit/withdraw RPC or an admin adjustment).
    if (balanceChannel) C.unsubscribe(balanceChannel);
    balanceChannel = C.subscribeToBalance(user.id, (row) => paintBalance(row.balance));
  }

  // Keep the user logged in across refreshes: persistSession is on
  // in the client, so on load we just read the existing session.
  async function init() {
    const { data: { session } } = await C.sb.auth.getSession();
    if (session && session.user) {
      await hydrateSession(session.user);
      goHome();
    }

    // React to login/logout/token-refresh events globally.
    C.sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await hydrateSession(session.user);
        goHome();
      } else if (event === 'SIGNED_OUT') {
        if (balanceChannel) { C.unsubscribe(balanceChannel); balanceChannel = null; }
        paintBalance(0);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // session silently refreshed; nothing to do
      }
    });
  }

  // Expose
  window.Auth = { signUp, signIn, logout, init, hydrateSession, paintBalance };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
