// =====================================================================
// _ENGINE.JS — CasinoGameEngine (Master Abstract Engine)
//
// Every game module extends/uses this engine for:
//   - Canvas setup + requestAnimationFrame game loop (start/stop/tick)
//   - Web Audio API sound FX synthesis (zero MP3/asset weight)
//   - RTP modifier injection (read from game_sessions.rtp, admin-controlled)
//   - Supabase realtime hookup (session state + bets channel)
//
// USAGE (inside a game module):
//   class PlinkoEngine extends CasinoGameEngine {
//     constructor(canvas, gameMeta) { super(canvas, gameMeta); }
//     onTick(dt) { ... draw frame using this.ctx ... }
//     onSessionUpdate(session) { ... }
//   }
//   const engine = new PlinkoEngine(canvas, gameMeta);
//   await engine.connect();
//   engine.start();
//   // on unmount: engine.destroy();
// =====================================================================

class CasinoGameEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} gameMeta - { slug, name, room, category, ... } from GAME_REGISTRY
   */
  constructor(canvas, gameMeta) {
    this.canvas = canvas;
    this.gameMeta = gameMeta || {};
    this.ctx = canvas?.getContext("2d") || null;

    // RAF loop state
    this._rafId = null;
    this._running = false;
    this._lastTime = 0;

    // RTP modifier — defaults to 96%, overwritten by game_sessions.rtp
    this.rtp = 96.0;

    // Realtime channels
    this.sessionChannel = null;
    this.betsChannel = null;
    this.session = null;

    // Shared Web Audio context (lazily created on first sound — autoplay policies)
    this._audioCtx = null;

    this._resizeObserver = null;
    this._setupCanvas();
  }

  // -------------------------------------------------------------
  // CANVAS SETUP — handles DPR scaling for crisp rendering
  // -------------------------------------------------------------
  _setupCanvas() {
    if (!this.canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = rect.width;
      this.height = rect.height;
      if (typeof this.onResize === "function") this.onResize(this.width, this.height);
    };

    resize();
    this._resizeObserver = new ResizeObserver(resize);
    this._resizeObserver.observe(this.canvas.parentElement);
  }

  // -------------------------------------------------------------
  // GAME LOOP (requestAnimationFrame)
  // -------------------------------------------------------------
  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    const loop = (now) => {
      if (!this._running) return;
      const dt = Math.min(0.05, (now - this._lastTime) / 1000); // clamp to avoid spikes
      this._lastTime = now;

      if (typeof this.onTick === "function") {
        try {
          this.onTick(dt, now);
        } catch (err) {
          console.error(`[${this.gameMeta.slug || "game"}] tick error:`, err);
          this.stop();
          return;
        }
      }
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  // -------------------------------------------------------------
  // SUPABASE CONNECTION — session state + bets feed + RTP sync
  // -------------------------------------------------------------
  async connect() {
    const api = window.SupabaseAPI;
    if (!api) {
      console.warn("SupabaseAPI not available — engine running in offline/demo mode");
      return;
    }

    const room = this.gameMeta.room;
    if (!room) return;

    // Initial fetch
    this.session = await api.getGameSession(room);
    if (this.session) {
      this.rtp = Number(this.session.rtp) || 96.0;
      if (typeof this.onSessionUpdate === "function") this.onSessionUpdate(this.session);
    }

    // Realtime: session state (status, game_state, rtp changes from admin)
    this.sessionChannel = api.subscribeToGameSession(room, (updated) => {
      this.session = updated;
      this.rtp = Number(updated.rtp) || this.rtp;
      if (typeof this.onSessionUpdate === "function") this.onSessionUpdate(updated);
    });

    // Realtime: bet feed (live pot / player activity)
    if (this.session?.id) {
      this.betsChannel = api.subscribeToBets(this.session.id, (payload) => {
        if (typeof this.onBetEvent === "function") this.onBetEvent(payload);
      });
    }
  }

  // Place a bet through the secure RPC (validates balance + round status server-side)
  async placeBet(choice, amount) {
    const api = window.SupabaseAPI;
    if (!api || !this.session) return { error: new Error("Not connected") };
    return api.placeBet(this.session.id, this.session.round_id, choice, amount);
  }

  // -------------------------------------------------------------
  // RTP MODIFIER — applies admin-controlled RTP to outcome generation
  // -------------------------------------------------------------
  /**
   * Returns a probability-adjusted random outcome.
   * Example: weightedRandom(['win','lose'], [this.rtp, 100-this.rtp])
   */
  weightedRandom(outcomes, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < outcomes.length; i++) {
      if (r < weights[i]) return outcomes[i];
      r -= weights[i];
    }
    return outcomes[outcomes.length - 1];
  }

  /**
   * Returns true with probability == this.rtp / 100 (basic RTP-weighted coin flip)
   */
  rollWithRtp() {
    return Math.random() * 100 < this.rtp;
  }

  // -------------------------------------------------------------
  // SOUND FX — Web Audio API synthesis (no audio files)
  // -------------------------------------------------------------
  _getAudioCtx() {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx.state === "suspended") {
      this._audioCtx.resume();
    }
    return this._audioCtx;
  }

  /**
   * Plays a synthesized tone.
   * @param {object} opts - { freq, type, duration, volume, slideTo }
   */
  playTone({ freq = 440, type = "sine", duration = 0.2, volume = 0.15, slideTo = null } = {}) {
    try {
      const ctx = this._getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      /* audio blocked — fail silently */
    }
  }

  // Preset FX library — common casino sound cues
  sfx = {
    chipPlace: () => this.playTone({ freq: 320, type: "triangle", duration: 0.08, volume: 0.12 }),
    cardFlip: () => this.playTone({ freq: 600, type: "square", duration: 0.05, volume: 0.08 }),
    win: () => {
      this.playTone({ freq: 660, type: "sine", duration: 0.15, volume: 0.18, slideTo: 990 });
      setTimeout(() => this.playTone({ freq: 880, type: "sine", duration: 0.2, volume: 0.18, slideTo: 1320 }), 100);
    },
    lose: () => this.playTone({ freq: 180, type: "sawtooth", duration: 0.3, volume: 0.12, slideTo: 80 }),
    tick: () => this.playTone({ freq: 1000, type: "square", duration: 0.03, volume: 0.05 }),
    crashOut: () => this.playTone({ freq: 1200, type: "sawtooth", duration: 0.4, volume: 0.15, slideTo: 60 }),
    spin: () => this.playTone({ freq: 200, type: "triangle", duration: 0.5, volume: 0.1, slideTo: 400 })
  };

  // -------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------
  destroy() {
    this.stop();
    const api = window.SupabaseAPI;
    if (api) {
      if (this.sessionChannel) api.unsubscribe(this.sessionChannel);
      if (this.betsChannel) api.unsubscribe(this.betsChannel);
    }
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._audioCtx && this._audioCtx.state !== "closed") {
      this._audioCtx.close();
    }
    this.sessionChannel = null;
    this.betsChannel = null;
    this._resizeObserver = null;
    this._audioCtx = null;
  }
}

// -------------------------------------------------------------
// EXPORT
// -------------------------------------------------------------
window.CasinoGameEngine = CasinoGameEngine;
