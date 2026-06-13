// =============================================================
// js/games/_engine.js  -  Lux Royale Casino
// CasinoGameEngine: abstract base for all canvas games.
//
// DESIGN PRINCIPLE (read before extending):
//   The client RENDERS outcomes; it does NOT DECIDE them.
//   RNG, win/loss, payout and RTP enforcement are authoritative
//   on the server (Supabase RPC / game_sessions). A client that
//   computes its own results is both trivially cheatable by
//   players AND, if an admin silently tunes payout odds here,
//   indistinguishable from a rigged/illegal game. So `resolveBet`
//   asks the server for the outcome and the engine animates it.
//
// Depends on supabase-config.js (window.Casino) when online.
// =============================================================

(function () {
  'use strict';

  // =============================================================
  // Visual helpers (global, reusable across all game files)
  // =============================================================

  // Neon glow: set canvas shadow before drawing cards/grids/numbers.
  // Call resetGlow(ctx) afterwards to avoid bleeding into later draws.
  function applyNeonGlow(ctx, color, blurAmount) {
    if (!ctx) return;
    ctx.shadowColor = color || '#FFD700';
    ctx.shadowBlur = blurAmount == null ? 16 : blurAmount;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  function resetGlow(ctx) {
    if (!ctx) return;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Interpolation / easing for smooth 60fps motion.
  const lerp = (a, b, t) => a + (b - a) * t;
  // Frame-rate independent smoothing toward a target (use in update(dt)).
  const damp = (current, target, smoothing, dt) =>
    lerp(current, target, 1 - Math.pow(smoothing, dt));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cubicBezier = (t, p1, p2) => {
    // 1D cubic-bezier easing with control points p1,p2 (0..1), endpoints 0 and 1.
    const u = 1 - t;
    return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
  };

  // =============================================================
  // ParticleSystem - golden win cascade with gravity + bounce
  // =============================================================
  class ParticleSystem {
    constructor(opts = {}) {
      this.particles = [];
      this.gravity = opts.gravity != null ? opts.gravity : 900;
      this.color = opts.color || '#FFD700';
      this.restitution = opts.restitution != null ? opts.restitution : 0.55; // bounce resistance
    }
    // Spawn `count` particles from the top of a w x h container.
    burst(width, height, count = 100, color) {
      const col = color || this.color;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: -Math.random() * height * 0.3,
          vx: (Math.random() - 0.5) * 160,
          vy: Math.random() * 60,
          r: 2 + Math.random() * 3,
          life: 1,
          decay: 0.25 + Math.random() * 0.35,
          color: col,
        });
      }
    }
    get active() { return this.particles.length > 0; }
    update(dt, width, height) {
      const floor = height - 2;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += this.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > floor) { p.y = floor; p.vy *= -this.restitution; p.vx *= 0.8; }
        if (p.x < 0 || p.x > width) p.vx *= -0.7;
        p.life -= p.decay * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    render(ctx) {
      if (!ctx || !this.particles.length) return;
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    clear() { this.particles.length = 0; }
  }

  // Expose helpers globally for every game file.
  window.CasinoFX = { applyNeonGlow, resetGlow, lerp, damp, easeOutCubic, easeInOutCubic, cubicBezier, ParticleSystem };

  class CasinoGameEngine {
    /**
     * @param {Object} opts
     * @param {HTMLCanvasElement} opts.canvas
     * @param {string} opts.gameName
     * @param {string} [opts.sessionId] shared game_sessions row id
     */
    constructor(opts = {}) {
      if (new.target === CasinoGameEngine) {
        throw new Error('CasinoGameEngine is abstract; extend it.');
      }
      this.canvas = opts.canvas;
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.gameName = opts.gameName || 'game';
      this.sessionId = opts.sessionId || null;

      this.running = false;
      this._raf = null;
      this._lastT = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      // RTP is display/telemetry only on the client. It is NOT used
      // to decide outcomes. The server is the source of truth.
      this.serverRTP = null;

      this._channel = null;
      this._audioCtx = null;

      // Win particle cascade, available to every game via triggerWin().
      this.particles = new ParticleSystem();

      if (this.canvas) this.resize();
      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);
    }

    // ---- canvas sizing (HiDPI aware) ----
    resize() {
      if (!this.canvas) return;
      const r = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.floor(r.width * this.dpr));
      this.canvas.height = Math.max(1, Math.floor(r.height * this.dpr));
      if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.width = r.width;
      this.height = r.height;
    }

    // ---- lifecycle ----
    async start() {
      if (this.running) return;
      this.running = true;
      await this.setup();            // subclass hook
      if (this.sessionId) await this._connectRealtime();
      this._lastT = performance.now();
      const loop = (t) => {
        if (!this.running) return;
        // Clamp dt so a backgrounded tab / hitch can't teleport physics.
        const dt = Math.min(0.05, (t - this._lastT) / 1000);
        this._lastT = t;
        this.update(dt);             // subclass hook
        this.render(this.ctx);       // subclass hook
        // Particle cascade drawn on top of the game each frame.
        if (this.particles.active) {
          this.particles.update(dt, this.width, this.height);
          this.particles.render(this.ctx);
        }
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
      if (this._channel && window.Casino) window.Casino.unsubscribe(this._channel);
      this._channel = null;
      window.removeEventListener('resize', this._onResize);
      this.teardown();              // subclass hook
    }

    // ---- abstract hooks (override in each game) ----
    async setup() {}
    update(_dt) {}
    render(_ctx) {}
    teardown() {}
    /** Apply a server-authoritative outcome to the visual state. */
    onOutcome(_outcome) {}
    /** Render shared multiplayer state pushed via realtime. */
    onSharedState(_state) {}

    // ---- realtime: receive shared game state from the server ----
    async _connectRealtime() {
      if (!window.Casino) return;
      const snap = await window.Casino.getGameSession(this.sessionId);
      if (snap) {
        this.serverRTP = snap.game_state && snap.game_state.rtp != null ? snap.game_state.rtp : this.serverRTP;
        this.onSharedState(snap.game_state);
      }
      this._channel = window.Casino.subscribeToGameSession(this.sessionId, (row) => {
        if (!row) return;
        if (row.game_state && row.game_state.rtp != null) this.serverRTP = row.game_state.rtp;
        this.onSharedState(row.game_state, row.status);
      });
    }

    // ---- authoritative bet resolution (server decides outcome) ----
    // Calls a server RPC that performs RNG + payout + balance change
    // atomically. Falls back to a clearly-labelled local demo result
    // ONLY when offline, so the UI still works in a sandbox.
    async resolveBet(betAmount, params = {}) {
      if (window.Casino && window.Casino.sb) {
        const { data, error } = await window.Casino.sb.rpc('play_round', {
          p_game: this.gameName,
          p_bet: betAmount,
          p_params: params,
        });
        if (error) { console.error('resolveBet:', error.message); return { ok: false, error: error.message }; }
        this.onOutcome(data);
        return { ok: true, outcome: data };
      }
      // ---- offline demo only (NOT for real play) ----
      const demo = this._demoOutcome(betAmount, params);
      this.onOutcome(demo);
      return { ok: true, outcome: demo, demo: true };
    }

    // Visual-only placeholder for offline development. Explicitly
    // marked demo so it can never be mistaken for real settlement.
    _demoOutcome(betAmount) {
      const win = Math.random() < 0.45;
      return { demo: true, win, multiplier: win ? 1.9 : 0, payout: win ? betAmount * 1.9 : 0 };
    }

    // ---- Web Audio FX synthesis (no MP3 assets) ----
    _audio() {
      this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      return this._audioCtx;
    }
    sfx(kind = 'click') {
      try {
        const ac = this._audio();
        const now = ac.currentTime;
        const map = {
          click: [[440, 0.06]],
          spin: [[330, 0.08], [392, 0.08], [523, 0.12]],
          win: [[523.25, 0.1], [659.25, 0.1], [783.99, 0.18]],
          lose: [[294.66, 0.12], [233.08, 0.2]],
        };
        const seq = map[kind] || map.click;
        let t = now;
        seq.forEach(([freq, dur]) => {
          const osc = ac.createOscillator();
          const g = ac.createGain();
          osc.type = kind === 'win' ? 'triangle' : 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.connect(g).connect(ac.destination);
          osc.start(t); osc.stop(t + dur + 0.02);
          t += dur;
        });
      } catch (_) { /* audio optional */ }
    }

    // ---- win cascade hook (call from a game when it resolves a win) ----
    // Spawns 100 golden glowing particles and plays the win chord.
    triggerWin(count = 100) {
      this.particles.burst(this.width, this.height, count, '#FFD700');
      if (window.CasinoAudio && window.CasinoAudio.playWinJackpot) window.CasinoAudio.playWinJackpot();
      else this.sfx('win');
    }

    // ---- glow + interpolation passthroughs (so games can use this.*) ----
    glow(color, blur) { window.CasinoFX.applyNeonGlow(this.ctx, color, blur); }
    noGlow() { window.CasinoFX.resetGlow(this.ctx); }

    // ---- draw helpers ----
    clear(color = '#0B0C10') {
      if (!this.ctx) return;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  window.CasinoGameEngine = CasinoGameEngine;
})();
