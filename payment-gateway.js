// =============================================================
// payment-gateway.js  -  Lux Royale Casino
// Mock deposit/withdraw flow with instant UI feedback.
//
// SECURITY NOTE: balance is NOT written from the client. The
// balance column is reachable from the browser, so a direct
// `update({ balance })` would let any user set their own funds
// arbitrarily. Instead we call the server-side `process_transaction`
// RPC (security definer) defined in schema.sql, which:
//   - locks the profile row,
//   - validates sufficient funds for withdrawals,
//   - updates balance and inserts the ledger row atomically.
// The UX (speed, sufficiency check, success tone) is identical.
//
// Load order:
//   supabase-config.js -> auth.js -> payment-gateway.js
// =============================================================

(function () {
  'use strict';

  const C = window.Casino;
  if (!C) { console.error('payment-gateway.js: supabase-config.js must load first'); return; }

  // ---------------------------------------------------------
  // Audio tone emulation (no asset files; WebAudio synth)
  // ---------------------------------------------------------
  let audioCtx = null;
  function tone(success) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const notes = success ? [659.25, 880.0] : [220.0, 174.6]; // up = win, down = error
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.18);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
      });
    } catch (_) { /* audio optional */ }
  }

  // ---------------------------------------------------------
  // Toast / alert
  // ---------------------------------------------------------
  function toast(message, success) {
    let el = document.getElementById('pgToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pgToast';
      el.style.cssText =
        'position:fixed;left:50%;top:18px;transform:translateX(-50%) translateY(-120%);' +
        'z-index:60;padding:12px 18px;border-radius:14px;font:600 13px system-ui;' +
        'backdrop-filter:blur(12px);transition:transform .35s cubic-bezier(.2,.9,.2,1);' +
        'max-width:420px;width:calc(100% - 32px);text-align:center;';
      document.body.appendChild(el);
    }
    el.style.background = success ? 'rgba(80,200,120,0.18)' : 'rgba(255,80,80,0.18)';
    el.style.color = success ? '#50C878' : '#ff6b6b';
    el.style.border = '1px solid ' + (success ? 'rgba(80,200,120,0.5)' : 'rgba(255,80,80,0.5)');
    el.textContent = message;
    requestAnimationFrame(() => { el.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.transform = 'translateX(-50%) translateY(-120%)'; }, 2600);
  }

  // ---------------------------------------------------------
  // Core transaction
  // ---------------------------------------------------------
  async function transact(type, amount) {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      tone(false); toast('Enter a valid amount', false);
      return { ok: false, error: 'invalid amount' };
    }

    const user = await C.getCurrentUser();
    if (!user) {
      tone(false); toast('Please sign in first', false);
      return { ok: false, error: 'not authenticated' };
    }

    // Fast client-side sufficiency check for instant feedback.
    // (The server RPC re-checks authoritatively; this avoids a round
    //  trip when the user obviously lacks funds.)
    if (type === 'withdrawal') {
      const profile = await C.getMyProfile();
      if (profile && Number(profile.balance) < amt) {
        tone(false); toast('Insufficient balance', false);
        return { ok: false, error: 'insufficient funds' };
      }
    }

    // Authoritative, atomic balance change + ledger insert (server-side).
    const { data, error } = await C.processTransaction(type, amt);
    if (error) {
      tone(false); toast(error.message || 'Transaction failed', false);
      return { ok: false, error: error.message || 'failed' };
    }

    // Repaint balance immediately (realtime sub will also fire).
    if (window.Auth && data) window.Auth.paintBalance(data.balance);

    const verb = type === 'deposit' ? 'Deposited' : 'Withdrew';
    tone(true); toast(verb + ' $' + amt.toFixed(2) + ' successfully', true);
    return { ok: true, data };
  }

  const deposit = (amount) => transact('deposit', amount);
  const withdraw = (amount) => transact('withdrawal', amount);

  // ---------------------------------------------------------
  // Wire up the #wallet UI buttons if present
  // ---------------------------------------------------------
  function bindWalletUI() {
    const depBtn = document.getElementById('depositBtn');
    const wdrBtn = document.getElementById('withdrawBtn');
    const input = document.getElementById('amountInput');
    const readAmt = () => (input ? input.value : null);
    if (depBtn) depBtn.addEventListener('click', () => deposit(readAmt()));
    if (wdrBtn) wdrBtn.addEventListener('click', () => withdraw(readAmt()));
  }

  window.PaymentGateway = { deposit, withdraw, transact };

  if (document.readyState !== 'loading') bindWalletUI();
  else document.addEventListener('DOMContentLoaded', bindWalletUI);
})();
