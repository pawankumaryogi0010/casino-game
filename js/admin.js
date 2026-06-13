// =============================================================
// js/admin.js  -  Lux Royale Casino Master Dashboard (#admin)
//
// IMPORTANT - how RTP works here (read this):
//   The admin RTP slider sends a REQUESTED target RTP to the
//   SERVER. It does NOT, and must not, alter client-side win
//   probability. A browser-side knob that secretly changes each
//   player's odds is (a) trivially editable by any user via
//   devtools, so it fails as house protection, and (b) a hidden
//   live odds-tilt against players, which is rigged-game fraud
//   under licensed-gaming rules. Legitimate house edge comes from
//   published payout multipliers enforced server-side within a
//   configured legal range, with every change logged/audited.
//
//   So: client games stay server-authoritative (resolveBet ->
//   server play_round). This file only REQUESTS a config change
//   and renders monitoring data.
// =============================================================
(function () {
  'use strict';
  const C = window.Casino; // may be null offline

  // ---- send requested RTP to server config (admin-gated by RLS) ----
  async function applyRTP(value) {
    const status = document.getElementById('rtpStatus');
    if (!C || !C.sb) { if (status) status.textContent = 'Offline: not sent to server (demo only)'; return; }
    try {
      // Server validates caller is admin AND value within legal range,
      // then maps RTP -> published payout table. Outcome RNG unchanged.
      const { error } = await C.sb.rpc('set_house_config', { p_target_rtp: value });
      if (error) throw error;
      if (status) status.textContent = 'Requested RTP ' + value + '% (server-validated)';
    } catch (e) {
      if (status) status.textContent = 'Rejected: ' + e.message;
    }
  }

  // ---- live transaction feed (read-only; RLS: admin sees all) ----
  let txChannel = null;
  async function loadTransactions() {
    const list = document.getElementById('adminTxFeed');
    if (!list) return;
    if (!C || !C.sb) { list.innerHTML = demoRows(); return; }
    const { data } = await C.sb.from('transactions').select('*').order('created_at', { ascending: false }).limit(15);
    renderTx(list, data || []);
    if (txChannel) C.unsubscribe(txChannel);
    txChannel = C.sb.channel('admin:tx')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' },
        () => loadTransactions())
      .subscribe();
  }
  function renderTx(list, rows) {
    if (!rows.length) { list.innerHTML = '<p class="text-xs text-gray-500">No transactions yet.</p>'; return; }
    list.innerHTML = rows.map(t => {
      const pos = t.type === 'deposit';
      return '<div class="glass rounded-lg p-2 flex justify-between text-xs">' +
        '<span class="text-gray-300">' + (t.user_id || '').toString().slice(0, 8) + '\u2026</span>' +
        '<span class="' + (pos ? 'text-emerald2' : 'text-red-400') + '">' + (pos ? '+' : '-') + '$' + Number(t.amount).toFixed(2) + '</span>' +
        '<span class="text-gray-500">' + t.status + '</span></div>';
    }).join('');
  }
  function demoRows() {
    const u = ['8a3f', '1c90', 'd45e', '77b2'];
    return u.map((id, i) => '<div class="glass rounded-lg p-2 flex justify-between text-xs">' +
      '<span class="text-gray-300">' + id + '\u2026</span>' +
      '<span class="' + (i % 2 ? 'text-red-400' : 'text-emerald2') + '">' + (i % 2 ? '-' : '+') + '$' + (50 + i * 25) + '.00</span>' +
      '<span class="text-gray-500">success</span></div>').join('') +
      '<p class="text-[10px] text-gray-600 mt-1">DEMO data (no server connected)</p>';
  }

  // ---- active rooms monitor (from game_sessions) ----
  async function loadRooms() {
    const el = document.getElementById('adminRooms');
    if (!el) return;
    if (!C || !C.sb) { el.textContent = '4 active (demo)'; return; }
    const { count } = await C.sb.from('game_sessions').select('*', { count: 'exact', head: true }).neq('status', 'closed');
    el.textContent = (count || 0) + ' active rooms';
  }

  // ---- wire the existing #admin slider in index.html ----
  function init() {
    const slider = document.querySelector('#admin input[type=range]');
    const out = document.getElementById('rtpVal');
    if (slider) {
      slider.addEventListener('change', () => applyRTP(Number(slider.value)));
      slider.addEventListener('input', () => { if (out) out.textContent = slider.value + '%'; });
    }
    window.addEventListener('hashchange', () => { if (location.hash === '#admin') { loadTransactions(); loadRooms(); } });
    if (location.hash === '#admin') { loadTransactions(); loadRooms(); }
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

  window.Admin = { applyRTP, loadTransactions, loadRooms };
})();
