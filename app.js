// =============================================================
// app.js  -  Lux Royale Casino SPA controller
// Handles lobby -> game transitions and mounts canvas games
// dynamically inside the mobile viewport.
//
// Load order:
//   supabase-config.js -> auth.js -> payment-gateway.js
//   -> js/games/_engine.js -> (game classes) -> app.js
// =============================================================

(function () {
  'use strict';

  const GAMES = [
    'Golden Pharaoh','Dragon Spin','Lucky 7s','Mega Roulette','Diamond Rush',
    'Neon Slots','Royal Poker','Baccarat Pro','Wild West','Fortune Wheel',
    'Crystal Crash','Aztec Gold','Mystic Dice','Tiger Fortune','Cash Blitz',
    'Vegas Nights','Plinko Drop','Mines Master','Aviator X','Treasure Vault',
  ];

  let activeEngine = null;

  // ---------------------------------------------------------
  // A minimal concrete engine so every game card is playable
  // out of the box. Real games extend CasinoGameEngine and
  // register themselves in window.CasinoGames[name].
  // ---------------------------------------------------------
  function makeDefaultEngine(canvas, name, sessionId) {
    const Base = window.CasinoGameEngine;
    class GenericGame extends Base {
      async setup() {
        this.angle = 0;
        this.glow = 0;
        this.message = 'Tap to play ' + this.gameName;
        canvas.addEventListener('pointerdown', this._tap = () => this._spin());
      }
      async _spin() {
        this.sfx('spin');
        this.message = 'Resolving...';
        const res = await this.resolveBet(10, {});
        const o = res.outcome || {};
        this.sfx(o.win ? 'win' : 'lose');
        this.message = o.win ? ('WIN x' + (o.multiplier || 0)) : 'No win - try again';
      }
      update(dt) { this.angle += dt * 1.4; this.glow = (Math.sin(performance.now() / 400) + 1) / 2; }
      render(ctx) {
        this.clear('#0B0C10');
        const cx = this.width / 2, cy = this.height / 2 - 10;
        const r = Math.min(this.width, this.height) * 0.26;
        // glowing ring
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(this.angle);
        ctx.lineWidth = 6;
        ctx.shadowBlur = 18 + this.glow * 22; ctx.shadowColor = '#FFD700';
        ctx.strokeStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 1.6); ctx.stroke();
        ctx.restore();
        // labels
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#50C878'; ctx.textAlign = 'center';
        ctx.font = '700 16px system-ui';
        ctx.fillText(this.gameName, cx, cy + r + 38);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '500 13px system-ui';
        ctx.fillText(this.message, cx, cy + r + 62);
      }
      teardown() { if (this._tap) canvas.removeEventListener('pointerdown', this._tap); }
    }
    return new GenericGame({ canvas, gameName: name, sessionId });
  }

  // ---------------------------------------------------------
  // Mount / unmount a game inside the viewport
  // ---------------------------------------------------------
  function ensureGameView() {
    let view = document.getElementById('game');
    if (!view) {
      view = document.createElement('section');
      view.id = 'game';
      view.className = 'view';
      view.innerHTML =
        '<div class="flex items-center justify-between mb-3">' +
          '<button id="gameBack" class="text-gold text-sm font-bold">&larr; Lobby</button>' +
          '<span id="gameTitle" class="text-sm font-bold text-white"></span>' +
          '<span class="w-10"></span>' +
        '</div>' +
        '<div class="glass rounded-2xl overflow-hidden">' +
          '<canvas id="gameCanvas" class="w-full" style="height:60vh;display:block;"></canvas>' +
        '</div>';
      document.querySelector('main').appendChild(view);
      view.querySelector('#gameBack').addEventListener('click', () => { location.hash = '#home'; });
    }
    return view;
  }

  function unmountGame() {
    if (activeEngine) { activeEngine.stop(); activeEngine = null; }
  }

  async function mountGame(name) {
    unmountGame();
    const view = ensureGameView();
    view.querySelector('#gameTitle').textContent = name;

    // fade lobby out / game in
    const home = document.getElementById('home');
    if (home) home.classList.remove('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    view.classList.add('active');

    const canvas = view.querySelector('#gameCanvas');
    const sessionId = null; // wire a real game_sessions id for multiplayer
    const Custom = window.CasinoGames && window.CasinoGames[name];
    activeEngine = Custom
      ? new Custom({ canvas, gameName: name, sessionId })
      : makeDefaultEngine(canvas, name, sessionId);
    await activeEngine.start();
  }

  // ---------------------------------------------------------
  // Wire lobby cards -> open game by index
  // ---------------------------------------------------------
  function bindLobby() {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('button');
      if (!card) return;
      const cards = Array.from(grid.children);
      const idx = cards.indexOf(card);
      if (idx >= 0 && GAMES[idx]) location.hash = '#play/' + encodeURIComponent(GAMES[idx]);
    });
  }

  // ---------------------------------------------------------
  // Router extension: #play/<GameName>
  // ---------------------------------------------------------
  function handleRoute() {
    const raw = location.hash.replace('#', '');
    if (raw.startsWith('play/')) {
      const name = decodeURIComponent(raw.slice(5));
      if (GAMES.includes(name)) { mountGame(name); return; }
      location.hash = '#home';
      return;
    }
    // leaving a game: stop the loop to save CPU/battery
    unmountGame();
    const g = document.getElementById('game');
    if (g) g.classList.remove('active');
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', () => { bindLobby(); handleRoute(); });
})();
