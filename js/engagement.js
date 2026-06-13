// =============================================================
// js/engagement.js  -  Lux Royale Casino
// 1) Floating real-time win ticker (under the top bar)
// 2) Live support FAB -> WhatsApp/Telegram popup
//
// Self-mounting: injects its own DOM into the app frame. Just add
//   <script src="js/engagement.js"></script>
// after supabase-config.js (window.Casino optional).
//
// HONEST-UX NOTE: the ticker prefers REAL Supabase events. Fake
// 'wins' presented as real are deceptive (and, for gambling, can be
// misleading advertising). Demo events are only used when no backend
// is connected, and are tagged so they can't masquerade as real.
// Toggle window.env.TICKER_DEMO = false to require real data only.
// =============================================================
(function () {
  'use strict';
  const C = window.Casino || null;
  const ENV = (window.env || {});
  const SUPPORT_WHATSAPP = ENV.SUPPORT_WHATSAPP || '';   // e.g. '919999999999'
  const SUPPORT_TELEGRAM = ENV.SUPPORT_TELEGRAM || '';   // e.g. 'luxroyale_support'
  const DEMO_ALLOWED = ENV.TICKER_DEMO !== false;        // default true

  function frame() {
    return document.querySelector('.max-w-\\[450px\\]') ||
      document.querySelector('main') && document.querySelector('main').parentElement ||
      document.body;
  }

  // ---------------------------------------------------------
  // 1) WIN TICKER
  // ---------------------------------------------------------
  function mountTicker() {
    if (document.getElementById('winTicker')) return;
    const host = frame();
    const header = host.querySelector('header');
    const bar = document.createElement('div');
    bar.id = 'winTicker';
    bar.style.cssText = 'position:sticky;top:60px;z-index:30;overflow:hidden;white-space:nowrap;' +
      'background:rgba(11,12,16,0.7);backdrop-filter:blur(10px);border-bottom:1px solid rgba(80,200,120,0.18);' +
      'padding:6px 0;';
    bar.innerHTML = '<div id="winTickerText" style="display:inline-block;padding-left:100%;' +
      'color:#50C878;font:600 12px system-ui;text-shadow:0 0 8px rgba(80,200,120,0.7);' +
      'animation:tickerScroll 18s linear infinite;"></div>' +
      '<style>@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-100%)}}</style>';
    if (header && header.parentElement) header.parentElement.insertBefore(bar, header.nextSibling);
    else host.insertBefore(bar, host.firstChild);
    refreshTicker();
    setInterval(refreshTicker, 9000 + Math.random() * 4000);
  }

  const games = ['Crash', 'Roulette', 'Teen Patti', 'Aviator X', 'Mines', 'Plinko', 'Dragon Tiger'];
  function demoEvent() {
    const id = 'User_' + (100 + Math.floor(Math.random() * 900)) + 'x';
    const r = Math.random();
    if (r < 0.6) {
      const amt = (500 + Math.floor(Math.random() * 200) * 100).toLocaleString('en-IN');
      const g = games[(Math.random() * games.length) | 0];
      const mult = (1.2 + Math.random() * 8).toFixed(1);
      return id + ' just won \u20B9' + amt + ' in ' + g + ' at ' + mult + 'x';
    }
    const amt = (1000 + Math.floor(Math.random() * 40) * 250).toLocaleString('en-IN');
    return id + ' deposited \u20B9' + amt + ' via ' + (Math.random() < 0.5 ? 'Cashfree' : 'USDT');
  }

  async function realEvents() {
    if (!C || !C.sb) return null;
    try {
      const { data, error } = await C.sb.from('transactions')
        .select('type, amount, status').eq('status', 'success')
        .order('created_at', { ascending: false }).limit(8);
      if (error || !data || !data.length) return null;
      return data.map((t) => {
        const amt = Number(t.amount).toLocaleString('en-IN');
        return t.type === 'deposit'
          ? 'A player deposited \u20B9' + amt
          : 'A player withdrew \u20B9' + amt;
      });
    } catch (_) { return null; }
  }

  async function refreshTicker() {
    const el = document.getElementById('winTickerText'); if (!el) return;
    let items = await realEvents();
    let demo = false;
    if (!items) {
      if (!DEMO_ALLOWED) { el.textContent = 'Live activity will appear here'; return; }
      items = Array.from({ length: 6 }, demoEvent); demo = true;
    }
    const sep = '  \u2022  ';
    el.textContent = (demo ? '[demo] ' : '') + items.join(sep) + sep;
  }

  // ---------------------------------------------------------
  // 2) SUPPORT FAB + POPUP
  // ---------------------------------------------------------
  function mountSupport() {
    if (document.getElementById('supportFab')) return;
    const host = frame();

    const fab = document.createElement('button');
    fab.id = 'supportFab';
    fab.setAttribute('aria-label', 'Live support');
    fab.style.cssText = 'position:fixed;right:16px;bottom:84px;z-index:55;width:54px;height:54px;border:none;' +
      'border-radius:50%;background:linear-gradient(135deg,#FFD700,#C9A227);box-shadow:0 0 16px rgba(255,215,0,0.6);' +
      'display:flex;align-items:center;justify-content:center;';
    fab.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B0C10" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 01-.9-3.8A8.38 8.38 0 0112.5 3 8.5 8.5 0 0121 11.5z"/></svg>';
    // clamp inside the 450px frame on desktop
    fab.style.right = 'max(16px, calc(50vw - 209px))';
    document.body.appendChild(fab);

    const pop = document.createElement('div');
    pop.id = 'supportPop';
    pop.style.cssText = 'position:fixed;right:16px;bottom:148px;z-index:55;width:260px;max-width:calc(100vw - 32px);' +
      'right:max(16px, calc(50vw - 209px));background:rgba(21,23,31,0.85);backdrop-filter:blur(16px);' +
      'border:1px solid rgba(255,215,0,0.2);border-radius:18px;padding:16px;transform:translateY(12px) scale(0.96);' +
      'opacity:0;pointer-events:none;transition:all .25s cubic-bezier(.2,.9,.2,1);';
    pop.innerHTML =
      '<p style="color:#FFD700;font:800 15px system-ui;margin-bottom:2px;">Live Support</p>' +
      '<p style="color:#94a3b8;font:500 11px system-ui;margin-bottom:12px;">We usually reply within minutes</p>' +
      supportLink('WhatsApp', '#25D366',
        SUPPORT_WHATSAPP ? 'https://wa.me/' + encodeURIComponent(SUPPORT_WHATSAPP) : '',
        'M20 4a10 10 0 00-15 13L4 21l4.2-1a10 10 0 0011.8-16z') +
      supportLink('Telegram', '#2AABEE',
        SUPPORT_TELEGRAM ? 'https://t.me/' + encodeURIComponent(SUPPORT_TELEGRAM) : '',
        'M21 4L3 11l5 2 2 6 3-4 4 3z');
    document.body.appendChild(pop);

    let open = false;
    const toggle = () => { open = !open;
      pop.style.opacity = open ? '1' : '0';
      pop.style.pointerEvents = open ? 'auto' : 'none';
      pop.style.transform = open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)';
    };
    fab.addEventListener('click', toggle);
    document.addEventListener('click', (e) => { if (open && !pop.contains(e.target) && e.target !== fab && !fab.contains(e.target)) toggle(); });
  }

  function supportLink(label, color, href, iconPath) {
    const disabled = !href;
    const tag = disabled ? 'button' : 'a';
    const attrs = disabled
      ? 'onclick="alert(\'Support handle not configured. Set window.env.SUPPORT_WHATSAPP / SUPPORT_TELEGRAM.\')"'
      : 'href="' + href + '" target="_blank" rel="noopener"';
    return '<' + tag + ' ' + attrs + ' style="display:flex;align-items:center;gap:10px;width:100%;text-decoration:none;' +
      'margin-bottom:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;' +
      'background:rgba(255,255,255,0.04);color:#fff;font:700 13px system-ui;cursor:pointer;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>' +
      '<span>Chat via ' + label + '</span></' + tag + '>';
  }

  function init() { mountTicker(); mountSupport(); }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
