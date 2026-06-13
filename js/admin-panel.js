// =============================================================
// js/admin-panel.js  -  Advanced Super Admin Panel (#admin)
// Replaces the basic admin view. Renders into #admin section.
//
// SECURITY MODEL (read before editing):
//  - Client auth guard checks profiles.role and redirects non-admins.
//    This is UX only; REAL enforcement is RLS + the admin RPCs, which
//    re-check is_admin() server-side. A hidden/blocked UI is never a
//    security boundary on its own.
//  - All privileged actions call admin-gated, AUDITED server RPCs:
//      admin_approve_deposit / admin_reject_deposit
//      admin_set_game_rtp / admin_set_ban / admin_adjust_balance
//    The client never increments a balance or sets a status directly.
//  - RTP sliders write a REQUESTED target RTP to game_settings via
//    admin_set_game_rtp. The SERVER maps RTP -> published payouts.
//    They do NOT alter client win-probability (that would be both
//    cheat-editable and rigged-game fraud). Games stay server-driven.
//
// Requires: supabase-config.js (window.Casino), auth.js, Tailwind.
// =============================================================
(function () {
  'use strict';
  const C = window.Casino;
  if (!C) { console.error('admin-panel.js: supabase-config.js must load first'); return; }

  const GAMES = [
    ['golden_pharaoh','Golden Pharaoh'],['dragon_spin','Dragon Spin'],['lucky_7s','Lucky 7s'],
    ['mega_roulette','Mega Roulette'],['diamond_rush','Diamond Rush'],['neon_slots','Neon Slots'],
    ['royal_poker','Royal Poker'],['baccarat_pro','Baccarat Pro'],['wild_west','Wild West'],
    ['fortune_wheel','Fortune Wheel'],['crystal_crash','Crystal Crash'],['aztec_gold','Aztec Gold'],
    ['mystic_dice','Mystic Dice'],['tiger_fortune','Tiger Fortune'],['cash_blitz','Cash Blitz'],
    ['vegas_nights','Vegas Nights'],['plinko_drop','Plinko Drop'],['mines_master','Mines Master'],
    ['aviator_x','Aviator X'],['treasure_vault','Treasure Vault'],
  ];

  let channels = [];
  let mounted = false;
  let isAdmin = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c])); }
  function money(n) { return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // ---- TRUE AUTH GUARD ----
  async function guard() {
    const view = document.getElementById('admin');
    const user = await C.getCurrentUser();
    if (!user) { location.hash = '#home'; return false; }
    const { data, error } = await C.sb.from('profiles').select('role').eq('id', user.id).single();
    if (error || !data || data.role !== 'admin') {
      if (view) view.innerHTML = '<div class="glass rounded-2xl p-6 text-center"><p class="text-red-400 font-bold">Access denied</p><p class="text-xs text-gray-400 mt-1">Admin role required. Redirecting…</p></div>';
      setTimeout(() => { if (location.hash === '#admin') location.hash = '#home'; }, 1200);
      return false;
    }
    return true;
  }

  // ---- SHELL ----
  function shell() {
    return '' +
    '<h3 class="text-base font-bold text-emerald2 mb-3">Super Admin Panel</h3>' +
    '<div class="grid grid-cols-2 gap-3 mb-5">' +
      card('Total Players','statPlayers','#FFD700') + card('Active Bets','statBets','#50C878') +
      card('Pending Crypto','statPending','#FFD700') + card('Revenue','statRevenue','#50C878') +
    '</div>' +
    section('Pending Deposits') + '<div id="depTable" class="space-y-2 mb-5"></div>' +
    section('Game RTP (requested target → server payouts)') + '<div id="rtpList" class="space-y-2 mb-5"></div>' +
    section('User Management') +
    '<input id="userSearch" placeholder="Search phone / id" class="w-full mb-2 px-3 py-2 rounded-xl bg-obsidian border border-yellow-500/20 text-white text-sm"/>' +
    '<div id="userTable" class="space-y-2"></div>';
  }
  function card(label, id, color) {
    return '<div class="glass rounded-xl p-3"><p class="text-[11px] text-gray-400">' + label + '</p>' +
      '<p class="text-xl font-bold" id="' + id + '" style="color:' + color + '">…</p></div>';
  }
  function section(t) { return '<h4 class="text-sm font-bold text-white mb-2">' + esc(t) + '</h4>'; }

  // ---- METRICS ----
  async function loadMetrics() {
    const [players, bets, pending, dep] = await Promise.all([
      C.sb.from('profiles').select('*', { count: 'exact', head: true }),
      C.sb.from('game_sessions').select('*', { count: 'exact', head: true }).in('status', ['betting','active']),
      C.sb.from('crypto_deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      C.sb.from('transactions').select('type, amount').eq('status', 'success'),
    ]);
    set('statPlayers', players.count || 0);
    set('statBets', bets.count || 0);
    set('statPending', pending.count || 0);
    let rev = 0; (dep.data || []).forEach(t => { rev += (t.type === 'deposit' ? 1 : -1) * Number(t.amount); });
    set('statRevenue', money(rev));
  }
  function set(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

  // ---- DEPOSIT APPROVAL ----
  async function loadDeposits() {
    const wrap = document.getElementById('depTable'); if (!wrap) return;
    const { data } = await C.sb.from('crypto_deposits').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(50);
    if (!data || !data.length) { wrap.innerHTML = '<p class="text-xs text-gray-500">No pending deposits.</p>'; return; }
    wrap.innerHTML = data.map(d =>
      '<div class="glass rounded-xl p-3 text-xs">' +
        '<div class="flex justify-between"><span class="text-gray-300">' + esc(d.network) + ' • ' + esc((d.user_id||'').slice(0,8)) + '…</span>' +
        '<span class="text-gold font-bold">' + (d.amount != null ? money(d.amount) : 'verify amt') + '</span></div>' +
        '<p class="text-gray-500 break-all mt-1">Tx: ' + esc(d.tx_id) + '</p>' +
        '<div class="flex gap-2 mt-2">' +
          '<button onclick="window.AdminPanel.approve(\'' + d.id + '\')" class="flex-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald2 font-bold">APPROVE</button>' +
          '<button onclick="window.AdminPanel.reject(\'' + d.id + '\')" class="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 font-bold">REJECT</button>' +
        '</div></div>').join('');
  }
  async function approve(id) {
    const { error } = await C.sb.rpc('admin_approve_deposit', { p_kind: 'crypto', p_id: id });
    note(error ? ('Approve failed: ' + error.message) : 'Deposit approved & credited');
    if (!error) { loadDeposits(); loadMetrics(); }
  }
  async function reject(id) {
    const { error } = await C.sb.rpc('admin_reject_deposit', { p_kind: 'crypto', p_id: id });
    note(error ? ('Reject failed: ' + error.message) : 'Deposit rejected');
    if (!error) { loadDeposits(); loadMetrics(); }
  }

  // ---- RTP CONTROLS ----
  async function loadRTP() {
    const wrap = document.getElementById('rtpList'); if (!wrap) return;
    const { data } = await C.sb.from('game_settings').select('*');
    const byKey = {}; (data || []).forEach(g => byKey[g.game_key] = g);
    wrap.innerHTML = GAMES.map(([key, name]) => {
      const rtp = byKey[key] ? byKey[key].target_rtp : 96;
      return '<div class="glass rounded-xl p-3">' +
        '<div class="flex justify-between text-xs mb-1"><span class="text-white font-semibold">' + esc(name) + '</span>' +
        '<span class="text-gold font-bold" id="rtp_' + key + '">' + rtp + '%</span></div>' +
        '<input type="range" min="80" max="99" value="' + rtp + '" class="w-full accent-yellow-400" ' +
        'oninput="document.getElementById(\'rtp_' + key + '\').textContent=this.value+\'%\'" ' +
        'onchange="window.AdminPanel.setRTP(\'' + key + '\',\'' + esc(name) + '\',this.value)"/></div>';
    }).join('');
  }
  async function setRTP(key, name, value) {
    const { error } = await C.sb.rpc('admin_set_game_rtp', { p_game_key: key, p_display: name, p_rtp: Number(value) });
    note(error ? ('RTP rejected: ' + error.message) : (name + ' target RTP set to ' + value + '%'));
  }

  // ---- USER MANAGEMENT ----
  async function loadUsers(term) {
    const wrap = document.getElementById('userTable'); if (!wrap) return;
    let q = C.sb.from('profiles').select('id, phone_number, balance, role, banned').order('created_at', { ascending: false }).limit(25);
    if (term) q = q.ilike('phone_number', '%' + term + '%');
    const { data } = await q;
    if (!data || !data.length) { wrap.innerHTML = '<p class="text-xs text-gray-500">No users.</p>'; return; }
    wrap.innerHTML = data.map(u =>
      '<div class="glass rounded-xl p-3 text-xs">' +
        '<div class="flex justify-between"><span class="text-gray-300">' + esc(u.phone_number || (u.id||'').slice(0,8)) + (u.banned ? ' <span class="text-red-400">[BANNED]</span>' : '') + '</span>' +
        '<span class="text-emerald2 font-bold">' + money(u.balance) + '</span></div>' +
        '<div class="flex gap-2 mt-2">' +
          '<button onclick="window.AdminPanel.ban(\'' + u.id + '\',' + (!u.banned) + ')" class="flex-1 py-1.5 rounded-lg ' + (u.banned ? 'bg-emerald-500/20 text-emerald2' : 'bg-red-500/20 text-red-400') + ' font-bold">' + (u.banned ? 'UNBAN' : 'BAN') + '</button>' +
          '<button onclick="window.AdminPanel.adjust(\'' + u.id + '\')" class="flex-1 py-1.5 rounded-lg bg-yellow-500/20 text-gold font-bold">ADJUST</button>' +
        '</div></div>').join('');
  }
  async function ban(id, val) {
    const { error } = await C.sb.rpc('admin_set_ban', { p_user: id, p_banned: val });
    note(error ? ('Failed: ' + error.message) : (val ? 'User banned' : 'User unbanned'));
    if (!error) loadUsers(document.getElementById('userSearch').value);
  }
  async function adjust(id) {
    const delta = prompt('Balance delta (e.g. 100 or -50):');
    if (delta === null) return;
    const reason = prompt('Reason for adjustment (required, audited):');
    if (!reason) { note('Reason required'); return; }
    const { error } = await C.sb.rpc('admin_adjust_balance', { p_user: id, p_delta: Number(delta), p_reason: reason });
    note(error ? ('Failed: ' + error.message) : 'Balance adjusted');
    if (!error) { loadUsers(document.getElementById('userSearch').value); loadMetrics(); }
  }

  // ---- realtime ----
  function subscribe() {
    unsubscribe();
    channels.push(C.sb.channel('adm:dep').on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_deposits' }, () => { loadDeposits(); loadMetrics(); }).subscribe());
    channels.push(C.sb.channel('adm:tx').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => loadMetrics()).subscribe());
    channels.push(C.sb.channel('adm:prof').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadMetrics()).subscribe());
  }
  function unsubscribe() { channels.forEach(ch => C.unsubscribe(ch)); channels = []; }

  function note(msg) { let el = document.getElementById('admNote'); if (!el) { el = document.createElement('div'); el.id = 'admNote'; el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:90;background:rgba(21,23,31,.95);border:1px solid rgba(255,215,0,.4);color:#FFD700;padding:10px 16px;border-radius:12px;font:600 12px system-ui;max-width:90%;text-align:center;'; document.body.appendChild(el); } el.textContent = msg; clearTimeout(el._t); el.style.opacity = '1'; el._t = setTimeout(() => el.style.opacity = '0', 2600); }

  async function mount() {
    const view = document.getElementById('admin'); if (!view) return;
    isAdmin = await guard(); if (!isAdmin) { unsubscribe(); mounted = false; return; }
    view.innerHTML = shell(); mounted = true;
    loadMetrics(); loadDeposits(); loadRTP(); loadUsers('');
    const s = document.getElementById('userSearch');
    if (s) s.addEventListener('input', () => loadUsers(s.value.trim()));
    subscribe();
  }

  function onRoute() { if (location.hash === '#admin') mount(); else { unsubscribe(); mounted = false; } }
  window.addEventListener('hashchange', onRoute);
  window.addEventListener('DOMContentLoaded', onRoute);

  window.AdminPanel = { approve, reject, setRTP, ban, adjust, mount, _loadMetrics: loadMetrics };
})();
