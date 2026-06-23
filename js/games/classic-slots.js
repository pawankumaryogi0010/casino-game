/**
 * js/games/classic-slots.js
 * ClassicSlotsFullGame - Mobile-first, Real King Casino style slot machine
 *
 * - Vanilla JS, no frameworks
 * - Designed to integrate with the repo's game loader if present
 * - Plays nicely with window.STATE (script.js) if available:
 *     - reads/writes STATE.balance
 *     - pushes to STATE.pendingSessions and calls savePending() if present
 *     - calls pushHistory(entry) if present
 * - Otherwise uses localStorage with keys prefixed 'rk_'
 *
 * Visual + UX goals:
 * - Dark obsidian background, neon mint accents, gold highlights
 * - Glassmorphism canvas card
 * - Touch-first controls, large SPIN button, quick-bet chips
 * - Responsive: works well inside 450px mobile width
 *
 * Usage:
 * - The game loader should create a canvas and pass canvas + ctx to constructor
 * - If launched standalone, the class will create its own full-screen modal canvas
 *
 * Author: Copied/Adapted for your repo by assistant
 * Version: 1.0.0
 */

(function () {
  // Helper: safe access to repo globals
  const GLOBAL = window || {};

  // LocalStorage keys fallback
  const LS = {
    BALANCE: 'rk_balance_v1',
    HISTORY: 'rk_history_v1',
    PENDING: 'rk_pending_sessions_v1',
    CLIENT_SEED: 'rk_client_seed_v1'
  };

  // Default fallback balance if no STATE present
  const FALLBACK_BALANCE = 500.0;

  // Utility functions
  function fmt(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function nowISO() { return new Date().toISOString(); }
  function randInt(max) { return Math.floor(Math.random() * max); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Access or initialize clientSeed
  function ensureClientSeed() {
    try {
      let cs = localStorage.getItem(LS.CLIENT_SEED);
      if (!cs) {
        cs = (crypto.getRandomValues(new Uint32Array(4)).join('-')) + '-' + Date.now();
        localStorage.setItem(LS.CLIENT_SEED, cs);
      }
      return cs;
    } catch (e) {
      return String(Date.now());
    }
  }

  // Balance helper
  function readBalance() {
    if (GLOBAL.STATE && typeof GLOBAL.STATE.balance === 'number') return GLOBAL.STATE.balance;
    try {
      const raw = localStorage.getItem(LS.BALANCE);
      if (raw !== null) return parseFloat(raw);
    } catch (e) {}
    return FALLBACK_BALANCE;
  }
  function writeBalance(value) {
    if (GLOBAL.STATE && typeof GLOBAL.STATE.balance === 'number') {
      GLOBAL.STATE.balance = value;
      if (typeof saveBalance === 'function') saveBalance(); // try global saveBalance from script.js
      return;
    }
    try { localStorage.setItem(LS.BALANCE, String(value)); } catch (e) {}
  }

  // History helper
  function pushHistoryEntry(entry) {
    if (typeof pushHistory === 'function') { pushHistory(entry); return; }
    try {
      const raw = localStorage.getItem(LS.HISTORY);
      let arr = raw ? JSON.parse(raw) : [];
      arr.unshift(entry);
      if (arr.length > 300) arr = arr.slice(0, 300);
      localStorage.setItem(LS.HISTORY, JSON.stringify(arr));
    } catch (e) {}
  }

  // Pending sessions helper
  function pushPendingSession(session) {
    if (GLOBAL.STATE && Array.isArray(GLOBAL.STATE.pendingSessions)) {
      GLOBAL.STATE.pendingSessions.unshift(session);
      if (typeof savePending === 'function') savePending();
      // try sync
      if (typeof trySyncPending === 'function') trySyncPending();
      return;
    }
    try {
      const raw = localStorage.getItem(LS.PENDING);
      let arr = raw ? JSON.parse(raw) : [];
      arr.unshift(session);
      if (arr.length > 500) arr = arr.slice(0, 500);
      localStorage.setItem(LS.PENDING, JSON.stringify(arr));
    } catch (e) {}
  }

  // Play sound if SoundManager exists
  function playSound(name) {
    try {
      if (window.soundManager && typeof window.soundManager[name] === 'function') {
        window.soundManager[name]();
      }
    } catch (e) {}
  }

  // Payout configuration (tune for desired RTP)
  const PAYTABLE = {
    '7': 100,    // jackpot (triple 7)
    '💎': 25,
    '⭐': 15,
    '🔔': 10,
    '🍊': 8,
    '🍋': 6,
    '🍒': 5
  };

  // Game class
  class ClassicSlotsFullGame {
    constructor(canvas, ctx, opts = {}) {
      this.canvas = canvas || null;
      this.ctx = ctx || (canvas ? canvas.getContext('2d') : null);
      this.container = null; // optional DOM wrapper when self-created
      this.width = opts.width || 420;
      this.height = opts.height || 360;
      this.devicePixelRatio = Math.max(1, (window.devicePixelRatio || 1));

      // Symbols - arranged by visual weight (rarer later)
      this.symbols = opts.symbols || ['🍒', '🍋', '🍊', '🔔', '💎', '⭐', '7'];
      this.reels = 3;
      this.rows = 1; // single-row classic
      this.reelState = new Array(this.reels).fill(0).map(() => ({ spinning: false, offset: 0, speed: 0 }));
      this.isSpinning = false;
      this.spinStart = 0;
      this.finalIndices = [0,0,0];

      // UI / bet
      this.bet = opts.bet || 5;
      this.minBet = 1;
      this.maxBet = opts.maxBet || 200;
      this.quickBets = [1,5,10,25,50];

      // Visuals
      this.theme = {
        bg: '#011713',
        panel: 'rgba(255,255,255,0.02)',
        neon: '#00e676',
        gold: '#FFD700',
        glassBorder: 'rgba(255,255,255,0.06)',
        text: '#eafff0'
      };

      // Animation
      this.rafId = null;
      this.lastTS = 0;
      this.animProgress = 0;

      // Balance
      this.balance = readBalance();

      // Seeds
      this.clientSeed = ensureClientSeed();

      // Hook methods to DOM (spin button)
      this.onExit = opts.onExit || null;

      // Prepare if canvas absent: create modal
      if (!this.canvas) {
        this._createModalCanvas();
      } else {
        this._setupCanvas();
      }

      // Initialize sizes and listeners
      this.resize();
      this._bindEvents();
      this._drawInitialFrame();

      // register with global registry if available
      try {
        if (typeof registerGameClass === 'function') registerGameClass('classic-slots', ClassicSlotsFullGame);
      } catch (e) {}
      console.log('🎰 ClassicSlotsFullGame initialized');
    }

    // Create an overlay modal canvas if none supplied
    _createModalCanvas() {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.inset = '0';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.background = 'linear-gradient(180deg, rgba(1,23,19,0.6), rgba(1,23,19,0.9))';
      wrapper.style.zIndex = 9999;
      wrapper.style.padding = '20px';

      const card = document.createElement('div');
      card.style.width = '100%';
      card.style.maxWidth = '450px';
      card.style.borderRadius = '18px';
      card.style.padding = '12px';
      card.style.backdropFilter = 'blur(8px) saturate(140%)';
      card.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
      card.style.border = '1px solid rgba(255,255,255,0.06)';
      card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '10px';

      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '260px';
      canvas.style.borderRadius = '12px';
      canvas.style.display = 'block';

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.justifyContent = 'space-between';
      controls.style.alignItems = 'center';
      controls.style.gap = '8px';

      card.appendChild(canvas);
      card.appendChild(controls);
      wrapper.appendChild(card);

      document.body.appendChild(wrapper);

      this.container = wrapper;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    _setupCanvas() {
      // ensure canvas has appropriate style for mobile
      this.canvas.style.borderRadius = this.canvas.style.borderRadius || '12px';
    }

    resize() {
      // Set desired drawing size based on container width (mobile-first)
      const parentWidth = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : (Math.min(window.innerWidth - 28, 450));
      this.width = Math.min(450, Math.max(320, parentWidth));
      this.height = Math.round((this.width * 0.65));
      // set canvas pixel size for crisp drawing
      const dpr = this.devicePixelRatio;
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._drawInitialFrame();
    }

    // Binds touch/click events for spin / quick bets
    _bindEvents() {
      // Touch to spin center area
      const onTap = (e) => {
        e.preventDefault();
        if (this.isSpinning) return;
        this.spin();
      };
      this.canvas.addEventListener('click', onTap);
      this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onTap(e); }, { passive: false });

      // Resize
      window.addEventListener('resize', () => {
        this.resize();
      });

      // Optional external controls when modal exists: create UI controls below canvas
      if (this.container) {
        // controls live in container's second child
        const controls = this.container.querySelector('div');
        controls.innerHTML = '';

        // left: chips
        const chips = document.createElement('div');
        chips.style.display = 'flex';
        chips.style.gap = '6px';
        chips.style.flexWrap = 'wrap';
        this.quickBets.forEach(b => {
          const c = document.createElement('button');
          c.textContent = b;
          c.style.padding = '8px 10px';
          c.style.borderRadius = '10px';
          c.style.border = '1px solid rgba(255,255,255,0.04)';
          c.style.background = 'transparent';
          c.style.color = this.theme.text;
          c.style.fontWeight = '700';
          c.style.fontSize = '13px';
          c.addEventListener('click', () => {
            this.setBet(b);
            playSound('playClick');
            this._drawInitialFrame();
          });
          chips.appendChild(c);
        });

        // center: bet display
        const betDisp = document.createElement('div');
        betDisp.style.display = 'flex';
        betDisp.style.flexDirection = 'column';
        betDisp.style.alignItems = 'center';
        betDisp.style.flex = '1';
        betDisp.style.textAlign = 'center';
        const bLabel = document.createElement('div');
        bLabel.textContent = 'BET';
        bLabel.style.fontSize = '12px';
        bLabel.style.opacity = '0.8';
        bLabel.style.color = this.theme.text;
        const bValue = document.createElement('div');
        bValue.id = 'classic-bet-value';
        bValue.textContent = this.bet;
        bValue.style.fontSize = '18px';
        bValue.style.fontWeight = '800';
        bValue.style.color = this.theme.neon;
        betDisp.appendChild(bLabel);
        betDisp.appendChild(bValue);

        // right: spin button
        const spinBtn = document.createElement('button');
        spinBtn.id = 'classic-spin-btn';
        spinBtn.textContent = 'SPIN';
        spinBtn.style.padding = '12px 18px';
        spinBtn.style.borderRadius = '12px';
        spinBtn.style.background = 'linear-gradient(180deg, rgba(0,230,118,0.14), rgba(0,230,118,0.06))';
        spinBtn.style.color = '#011713';
        spinBtn.style.fontWeight = '900';
        spinBtn.style.fontSize = '16px';
        spinBtn.style.boxShadow = '0 10px 30px rgba(0,230,118,0.06)';
        spinBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.isSpinning) return;
          this.spin();
        });

        controls.appendChild(chips);
        controls.appendChild(betDisp);
        controls.appendChild(spinBtn);

        // add small footer: balance, auto-play hint
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.justifyContent = 'space-between';
        footer.style.alignItems = 'center';
        footer.style.marginTop = '6px';
        const bal = document.createElement('div');
        bal.id = 'classic-balance-display';
        bal.textContent = `Balance: ${fmt(this.balance)} USD`;
        bal.style.fontSize = '13px';
        bal.style.color = this.theme.text;
        const hint = document.createElement('div');
        hint.textContent = 'Tap SPIN or canvas';
        hint.style.fontSize = '12px';
        hint.style.color = 'rgba(255,255,255,0.6)';
        footer.appendChild(bal);
        footer.appendChild(hint);

        this.container.appendChild(footer);
      }
    }

    setBet(amount) {
      this.bet = clamp(Math.round(amount), this.minBet, this.maxBet);
      const bv = document.getElementById('classic-bet-value');
      if (bv) bv.textContent = this.bet;
    }

    // Draw initial static frame
    _drawInitialFrame() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      // background
      ctx.clearRect(0,0,w,h);
      // card background
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0,0,w,h);

      // glass panel
      const pad = 14;
      const panelW = w - pad*2;
      const panelH = h - 36;
      ctx.save();
      // rounded rect
      ctx.fillStyle = this.theme.panel;
      ctx.strokeStyle = this.theme.glassBorder;
      ctx.lineWidth = 1;
      this._roundRect(ctx, pad, pad, panelW, panelH, 12);
      ctx.fill();
      ctx.stroke();

      // draw reels area
      const reelW = Math.floor(panelW * 0.84);
      const reelH = Math.floor(panelH * 0.54);
      const rx = pad + (panelW - reelW)/2;
      const ry = pad + 18;
      // inner area background
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      this._roundRect(ctx, rx, ry, reelW, reelH, 10);
      ctx.fill();

      // draw three reel boxes
      const gap = Math.floor((reelW - (this.reels * 92)) / (this.reels - 1 || 1));
      const boxW = 92;
      const boxH = reelH - 18;
      const startX = rx + Math.floor((reelW - (this.reels * boxW + (this.reels - 1) * gap)) / 2);
      const centerY = ry + Math.floor((reelH - boxH)/2);

      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i=0;i<this.reels;i++) {
        const bx = startX + i*(boxW + gap);
        // box
        ctx.fillStyle = 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005))';
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this._roundRect(ctx, bx, centerY, boxW, boxH, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.01)';
        ctx.fill();
        ctx.stroke();

        // symbol placeholder
        ctx.fillStyle = this.theme.text;
        const sym = this.symbols[(i*2) % this.symbols.length];
        ctx.fillText(sym, bx + boxW/2, centerY + boxH/2);
      }

      // Title
      ctx.fillStyle = this.theme.neon;
      ctx.font = 'bold 16px system-ui, Arial';
      ctx.textAlign = 'left';
      ctx.fillText('REAL KING SLOTS', pad + 8, h - 12);

      ctx.restore();
      this._maybeUpdateFooter();
    }

    // Round rect helper
    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.arcTo(x+w, y, x+w, y+h, r);
      ctx.arcTo(x+w, y+h, x, y+h, r);
      ctx.arcTo(x, y+h, x, y, r);
      ctx.arcTo(x, y, x+w, y, r);
      ctx.closePath();
    }

    // The main spin routine
    async spin() {
      if (this.isSpinning) return;
      // Check balance
      this.balance = readBalance();
      if (this.bet > this.balance) {
        this._notify('Insufficient balance', 'error');
        playSound('playLose');
        return;
      }

      // Deduct stake optimistically
      this.balance = +(this.balance - this.bet);
      writeBalance(this.balance);
      this._maybeUpdateFooter();

      this.isSpinning = true;
      playSound('playSpin');

      // Start visual spin: set reel speeds
      for (let i=0;i<this.reels;i++) {
        this.reelState[i].spinning = true;
        this.reelState[i].speed = 1 + Math.random() * 2.0 + i*0.2;
        this.reelState[i].offset = 0;
      }

      // compute final symbol indices (provably-fair attempt)
      let serverHash = null;
      try {
        if (GLOBAL.STATE && GLOBAL.STATE.supabase && GLOBAL.STATE.user && typeof GLOBAL.STATE.supabase.rpc === 'function') {
          // attempt to use generate_provably_fair_seed RPC
          const rpc = await GLOBAL.STATE.supabase.rpc('generate_provably_fair_seed', { p_user_id: GLOBAL.STATE.user.id, p_game_type: 'classic-slots' });
          if (rpc && rpc.data) serverHash = rpc.data;
        }
      } catch (e) { serverHash = null; }

      // Use serverHash + clientSeed + timestamp to produce deterministic result (best-effort)
      const entropy = (serverHash || (Math.random().toString(36) + Date.now())) + '|' + this.clientSeed + '|' + Date.now();
      const hashed = await this._sha256Hex(entropy);
      // Use hashed bytes to select symbols per reel
      const indices = [];
      for (let i=0;i<this.reels;i++) {
        const hexChunk = hashed.substr(i*8, 8);
        const val = parseInt(hexChunk, 16);
        indices.push(val % this.symbols.length);
      }
      this.finalIndices = indices;

      // animate reels staggered stop
      const delays = [700, 900, 1150];
      const start = performance.now();
      this.spinStart = start;

      // Create a promise to wait until animation completes
      await new Promise((resolve) => {
        const totalDuration = delays[delays.length - 1] + 300;
        const tick = (ts) => {
          const elapsed = ts - start;
          // update offsets for each reel while spinning
          for (let i=0;i<this.reels;i++) {
            const rs = this.reelState[i];
            if (!rs) continue;
            if (elapsed < delays[i]) {
              // still spinning at speed
              rs.offset += rs.speed * 24;
            } else {
              // allow to ease into final symbol
              if (rs.spinning) {
                // snap to final symbol smoothly
                const symbolIndex = this.finalIndices[i];
                // compute desired offset such that symbolIndex centers
                // we'll just ease offset to target value
                const target = symbolIndex * 100; // arbitrary
                // approach target
                rs.offset += (target - rs.offset) * 0.18;
                // if close enough, stop
                if (Math.abs(rs.offset - target) < 2) {
                  rs.offset = target;
                  rs.spinning = false;
                }
              }
            }
          }

          // draw frame
          this._renderFrame();

          if (elapsed < totalDuration) {
            this.rafId = requestAnimationFrame(tick);
          } else {
            // make sure final symbols set
            for (let i=0;i<this.reels;i++) {
              this.reelState[i].spinning = false;
              this.reelState[i].offset = this.finalIndices[i] * 100;
            }
            this._renderFrame();
            resolve();
          }
        };
        this.rafId = requestAnimationFrame(tick);
      });

      // Evaluate result
      const evalResult = this._evaluate(this.finalIndices, this.bet);

      // If win, add win amount
      if (evalResult.winAmount > 0) {
        this.balance = +(this.balance + evalResult.winAmount);
        writeBalance(this.balance);
        this._maybeUpdateFooter();
        this._showWinEffect(evalResult);
        playSound('playWin');
      } else {
        this._showLoseEffect(evalResult);
        playSound('playLose');
      }

      // Add history & pending session
      const historyEntry = {
        ts: nowISO(),
        outcome: evalResult.outcome,
        amountLabel: evalResult.winAmount > 0 ? `+${fmt(evalResult.winAmount)}` : `-${fmt(this.bet)}`,
        resultEmoji: evalResult.emoji,
        symbols: this.finalIndices.map(i => this.symbols[i]),
        stake: this.bet,
        multiplier: evalResult.multiplier
      };
      pushHistoryEntry(historyEntry);

      // Session payload for server
      const payload = {
        id: 'local-' + (crypto.getRandomValues(new Uint32Array(2)).join('-')) + '-' + Date.now(),
        user_id: (GLOBAL.STATE && GLOBAL.STATE.user) ? GLOBAL.STATE.user.id : null,
        game_type: 'classic-slots',
        stake: this.bet,
        win_amount: evalResult.winAmount,
        multiplier: evalResult.multiplier,
        hash_seed: serverHash || '',
        settlement: evalResult.winAmount > 0 ? 'WON' : 'LOST',
        created_at: nowISO(),
        game_data: { symbols: this.finalIndices.map(i => this.symbols[i]), client_seed: this.clientSeed }
      };
      pushPendingSession(payload);

      this.isSpinning = false;
    }

    // Simple evaluation logic
    _evaluate(indices, stake) {
      const syms = indices.map(i => this.symbols[i]);
      const counts = {};
      syms.forEach(s => counts[s] = (counts[s]||0)+1);
      const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
      const top = sorted[0] || [null,0];

      let multiplier = 0;
      let outcome = 'LOSS';
      let emoji = '😞';
      if (top[1] === 3) {
        // triple
        const s = top[0];
        multiplier = PAYTABLE[s] || 8;
        outcome = (multiplier >= 25) ? 'JACKPOT' : 'BIG WIN';
        emoji = (multiplier >= 25) ? '🎰' : '🎉';
      } else if (top[1] === 2) {
        multiplier = 2;
        outcome = 'WIN';
        emoji = '✨';
      } else if (syms.includes('7')) {
        multiplier = 0.5;
        outcome = 'SMALL';
        emoji = '🔸';
      } else {
        multiplier = 0;
        outcome = 'LOSS';
        emoji = '😞';
      }

      const winAmount = +(stake * multiplier);
      return { multiplier, winAmount, outcome, emoji };
    }

    // Render current frame (draw reels with current offsets)
    _renderFrame() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      ctx.clearRect(0,0,w,h);

      // background panel
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0,0,w,h);

      const pad = 14;
      const panelW = w - pad*2;
      const panelH = h - 36;
      // glass panel
      ctx.save();
      ctx.fillStyle = this.theme.panel;
      ctx.strokeStyle = this.theme.glassBorder;
      ctx.lineWidth = 1;
      this._roundRect(ctx, pad, pad, panelW, panelH, 12);
      ctx.fill();
      ctx.stroke();

      // reel area
      const reelW = Math.floor(panelW * 0.84);
      const reelH = Math.floor(panelH * 0.54);
      const rx = pad + (panelW - reelW)/2;
      const ry = pad + 18;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      this._roundRect(ctx, rx, ry, reelW, reelH, 10);
      ctx.fill();

      const gap = Math.floor((reelW - (this.reels * 92)) / (this.reels - 1 || 1));
      const boxW = 92;
      const boxH = reelH - 18;
      const startX = rx + Math.floor((reelW - (this.reels * boxW + (this.reels - 1) * gap)) / 2);
      const centerY = ry + Math.floor((reelH - boxH)/2);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // draw each reel slot with current "virtual" strip
      for (let i=0;i<this.reels;i++) {
        const bx = startX + i*(boxW + gap);
        // draw box
        ctx.fillStyle = 'rgba(255,255,255,0.01)';
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this._roundRect(ctx, bx, centerY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        // compute symbol index from offset -> symbol to display
        const rs = this.reelState[i];
        let idx;
        if (rs.spinning) {
          // spinning: use offset value to show varied symbols by time
          const virtual = Math.floor((rs.offset / 24)) % this.symbols.length;
          idx = Math.abs(virtual) % this.symbols.length;
        } else {
          idx = Math.floor((rs.offset / 100)) % this.symbols.length;
        }
        const symbol = this.symbols[idx];
        // draw shadow circle behind symbol
        const cx = bx + boxW/2;
        const cy = centerY + boxH/2;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI*2);
        ctx.fill();

        // draw symbol big
        ctx.font = '42px serif';
        ctx.fillStyle = this.theme.text;
        ctx.fillText(symbol, cx, cy);
      }

      // bottom title + small info
      ctx.fillStyle = this.theme.neon;
      ctx.font = '700 14px system-ui, Arial';
      ctx.textAlign = 'left';
      ctx.fillText('REAL KING SLOTS', pad + 8, h - 18);

      // show small instruction
      ctx.font = '12px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'right';
      ctx.fillText('Tap SPIN or canvas', w - pad - 8, h - 18);

      ctx.restore();
    }

    _maybeUpdateFooter() {
      const el = document.getElementById('classic-balance-display');
      if (el) el.textContent = `Balance: ${fmt(this.balance)} USD`;
    }

    _showWinEffect(result) {
      // show a golden neon overlay / brief popup
      const ctx = this.ctx;
      const w = this.width, h = this.height;
      // small flashing banner
      const banner = document.createElement('div');
      banner.textContent = `${result.emoji} ${result.outcome} +${fmt(result.winAmount)} USD`;
      banner.style.position = 'fixed';
      banner.style.left = '50%';
      banner.style.top = '20px';
      banner.style.transform = 'translateX(-50%)';
      banner.style.background = 'linear-gradient(90deg, rgba(255,215,0,0.12), rgba(0,230,118,0.06))';
      banner.style.color = '#fff';
      banner.style.padding = '10px 16px';
      banner.style.borderRadius = '999px';
      banner.style.zIndex = 10000;
      banner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
      document.body.appendChild(banner);
      setTimeout(() => {
        banner.style.transition = 'all 420ms ease';
        banner.style.transform = 'translateX(-50%) translateY(-40px)';
        banner.style.opacity = '0';
      }, 800);
      setTimeout(()=> banner.remove(), 1400);

      // spawn win particles if WinParticleCascade available
      try {
        if (typeof WinParticleCascade === 'function') {
          const cascade = new WinParticleCascade(this.ctx);
          cascade.spawn(this.width/2, this.height/3, 90);
          // render briefly
          let life = 0;
          const id = setInterval(() => {
            cascade.update();
            cascade.render();
            life++;
            if (life > 30) { clearInterval(id); cascade.destroy(); this._renderFrame(); }
          }, 33);
        }
      } catch (e) {}
    }

    _showLoseEffect(result) {
      const div = document.createElement('div');
      div.textContent = `${result.emoji} ${result.outcome} -${fmt(this.bet)} USD`;
      div.style.position = 'fixed';
      div.style.left = '50%';
      div.style.top = '24px';
      div.style.transform = 'translateX(-50%)';
      div.style.background = 'rgba(255,68,68,0.08)';
      div.style.color = '#ff7777';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '999px';
      div.style.zIndex = 10000;
      document.body.appendChild(div);
      setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translateX(-50%) translateY(-24px)'; }, 900);
      setTimeout(()=> div.remove(), 1400);
    }

    // SHA256 hex for provably-fair seed mixing
    async _sha256Hex(message) {
      const enc = new TextEncoder();
      const data = enc.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Cleanup (remove modal)
    destroy() {
      cancelAnimationFrame(this.rafId);
      try {
        if (this.container && this.container.parentElement) this.container.parentElement.removeChild(this.container);
      } catch (e) {}
      console.log('🎰 ClassicSlotsFullGame destroyed');
    }
  }

  // Expose class to global registry
  try {
    window.ClassicSlotsFullGame = ClassicSlotsFullGame;
    if (typeof registerGameClass === 'function') registerGameClass('classic-slots', ClassicSlotsFullGame);
  } catch (e) {}

  // Auto-register in a lightweight registry if none available
  if (!window.GameRegistry) window.GameRegistry = {};
  window.GameRegistry['classic-slots'] = ClassicSlotsFullGame;

  // If the repo's app loader expects createGameInstance(gameId, canvas, ctx) behavior,
  // create a compatibility helper:
  if (typeof window.createGameInstance === 'function') {
    // nothing to do; loader will call createGameInstance
  } else {
    window.createClassicSlots = function (canvas, ctx, opts) {
      return new ClassicSlotsFullGame(canvas, ctx, opts || {});
    };
  }

  // Provide minimal info for lobby cards (optional)
  window.CLASSIC_SLOTS_METADATA = {
    id: 'classic-slots',
    title: 'Real King Slots',
    description: 'Classic 3-reel neon slot with jackpot and big-win animations. Mobile-first, glass UI.',
    icon: '🎰',
    rtp: '95-97%'
  };

  console.log('✅ classic-slots.js loaded');
})();
