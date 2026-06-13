// =============================================================
// casino-audio.js  -  Lux Royale Casino
// 100% programmatic Web Audio synthesis. No .mp3 / .wav loaded.
//
// Usage from any game canvas loop:
//   CasinoAudio.playCardFlip();
//   CasinoAudio.playChipsBet();
//   CasinoAudio.playWinJackpot();
//   CasinoAudio.playLoseSound();
//   const eng = CasinoAudio.playCrashEngine();  // returns controller
//   eng.update(multiplier);  // call each frame
//   eng.stop();              // on crash / cash-out
//   CasinoAudio.playRouletteTick(velocity01); // 1=fast, 0=stopped
//
// AudioContext is created lazily and resumed on first user gesture
// (browsers block audio until a gesture). Master gain caps volume.
// =============================================================
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Resume on first gesture (mobile/desktop autoplay policies).
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, () => { try { ac(); } catch (_) {} }, { once: true, passive: true }));

  function out() { return muted ? null : master; }

  // ---- small helpers --------------------------------------
  // One enveloped oscillator tone.
  function blip(freq, t0, dur, type, peak, dest) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak || 0.3), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest || out() || c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
    return { o, g };
  }

  // Short burst of filtered white noise (clicks, chip rattles).
  function noiseBurst(t0, dur, filterType, cutoff, peak) {
    const c = ac();
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filterType || 'bandpass';
    f.frequency.value = cutoff || 2000;
    f.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(Math.max(0.0002, peak || 0.4), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(out() || c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    return src;
  }

  // =========================================================
  // 1. Card flip - crisp high tick + tiny noise snap
  // =========================================================
  function playCardFlip() {
    const c = ac(); const t = c.currentTime;
    noiseBurst(t, 0.05, 'highpass', 3500, 0.35);
    blip(1800, t + 0.005, 0.06, 'square', 0.12);
  }

  // =========================================================
  // 2. Chips bet - several offset plastic clicks (rolling)
  // =========================================================
  function playChipsBet() {
    const c = ac(); const t = c.currentTime;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const dt = t + i * (0.035 + Math.random() * 0.02);
      noiseBurst(dt, 0.045, 'bandpass', 1400 + Math.random() * 900, 0.3);
      blip(900 + Math.random() * 400, dt, 0.04, 'triangle', 0.08);
    }
  }

  // =========================================================
  // 3. Win jackpot - escalating major chord cascade + vibrato
  // =========================================================
  function playWinJackpot() {
    const c = ac(); const t = c.currentTime;
    // C major arpeggio rising across octaves
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      const t0 = t + i * 0.09;
      const o = c.createOscillator();
      const g = c.createGain();
      const vib = c.createOscillator();
      const vibGain = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t0);
      // vibrato
      vib.frequency.value = 6;
      vibGain.gain.value = f * 0.012;
      vib.connect(vibGain).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g).connect(out() || c.destination);
      vib.start(t0); o.start(t0);
      vib.stop(t0 + 0.52); o.stop(t0 + 0.52);
    });
    // sparkle on top
    blip(2093, t + notes.length * 0.09, 0.4, 'sine', 0.15);
  }

  // =========================================================
  // 4. Lose - deep descending detuned sweep
  // =========================================================
  function playLoseSound() {
    const c = ac(); const t = c.currentTime;
    [0, 7].forEach((detune) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.detune.value = detune;
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g).connect(out() || c.destination);
      o.start(t); o.stop(t + 0.85);
    });
  }

  // =========================================================
  // 5. Crash engine - continuous rumble; pitch tracks multiplier
  //    Returns a controller: { update(mult), stop() }
  // =========================================================
  function playCrashEngine() {
    const c = ac();
    const osc = c.createOscillator();
    const sub = c.createOscillator();
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    osc.type = 'sawtooth';
    sub.type = 'sine';
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    osc.frequency.value = 60;
    sub.frequency.value = 30;
    g.gain.value = 0.0001;
    osc.connect(lp); sub.connect(lp); lp.connect(g).connect(out() || c.destination);
    const t = c.currentTime;
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.15);
    osc.start(t); sub.start(t);
    let stopped = false;
    return {
      update(multiplier) {
        if (stopped) return;
        const m = Math.max(1, Number(multiplier) || 1);
        const now = c.currentTime;
        // pitch rises with multiplier (log so it doesn't run away)
        const base = 55 + Math.log(m) * 95;
        osc.frequency.setTargetAtTime(base, now, 0.05);
        sub.frequency.setTargetAtTime(base / 2, now, 0.05);
        lp.frequency.setTargetAtTime(500 + Math.log(m) * 800, now, 0.08);
      },
      stop() {
        if (stopped) return; stopped = true;
        const now = c.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.stop(now + 0.22); sub.stop(now + 0.22);
      },
    };
  }

  // =========================================================
  // 6. Roulette tick - single tactile click. Call repeatedly
  //    from the loop; velocity01 (1 fast .. 0 stopped) shapes it.
  // =========================================================
  let _lastTick = 0;
  function playRouletteTick(velocity01) {
    const c = ac(); const now = c.currentTime;
    const v = Math.max(0, Math.min(1, velocity01 == null ? 1 : velocity01));
    // throttle: faster wheel -> ticks closer together
    const minGap = 0.04 + (1 - v) * 0.28;
    if (now - _lastTick < minGap) return;
    _lastTick = now;
    noiseBurst(now, 0.03, 'bandpass', 2600 - (1 - v) * 1200, 0.25 + v * 0.15);
    blip(1500 - (1 - v) * 700, now, 0.025, 'square', 0.08);
  }

  // ---- master controls ------------------------------------
  function setVolume(v) { ac(); if (master) master.gain.value = Math.max(0, Math.min(1, v)); }
  function setMuted(m) { muted = !!m; }
  function isMuted() { return muted; }

  window.CasinoAudio = {
    playCardFlip, playChipsBet, playWinJackpot, playLoseSound,
    playCrashEngine, playRouletteTick,
    setVolume, setMuted, isMuted, resume: ac,
  };
})();
