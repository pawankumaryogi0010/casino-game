// Crash / Aviator - plane flies the multiplier curve and crashes at
// the server-decided crash point. Cash Out locks the multiplier at
// the moment of the click; payout is settled server-side.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  class Aviator extends Base {
    async setup() {
      this.state = 'idle'; this.mult = 1; this.t = 0; this.crashAt = 2;
      this.cashed = null; this.msg = 'Tap to launch'; this.trail = [];
      this.canvas.addEventListener('pointerdown', this._tap = () => this._tapHandler());
    }
    async _tapHandler() {
      if (this.state === 'flying') { this._cashOut(); return; }
      if (this.state !== 'idle') return;
      this.cashed = null; this.trail = []; this.mult = 1; this.t = 0;
      this.sfx('spin');
      const res = await this.resolveBet(10, { game: 'crash' });
      const o = res.outcome || {};
      this.crashAt = o.crashPoint || (1 + Math.random() * 6); // demo curve only
      this.demo = o.demo !== false;
      this.state = 'flying';
    }
    _cashOut() {
      if (this.state !== 'flying' || this.cashed) return;
      this.cashed = this.mult; this.sfx('win');
      this.msg = 'Cashed out @ ' + this.cashed.toFixed(2) + 'x' + (this.demo ? ' (DEMO)' : '');
      // Server settles payout = bet * cashed (validated against crashAt).
    }
    update(dt) {
      if (this.state !== 'flying') return;
      this.t += dt;
      this.mult = Math.exp(0.18 * this.t * 6 * dt * 60 / 60); // smooth exp growth
      this.mult = 1 + Math.pow(this.t, 1.6) * 1.15;
      if (this.mult >= this.crashAt) {
        this.mult = this.crashAt; this.state = 'idle';
        if (!this.cashed) { this.sfx('lose'); this.msg = 'Crashed @ ' + this.crashAt.toFixed(2) + 'x'; }
      }
    }
    render(ctx) {
      this.clear('#0B0C10');
      const w = this.width, h = this.height;
      const px = Math.min(w - 30, (this.t / Math.max(this.crashAt, 2)) * w * 0.7 + 30);
      const py = h - 30 - Math.min(h - 80, (this.mult - 1) * 60);
      this.trail.push([px, py]); if (this.trail.length > 120) this.trail.shift();
      ctx.strokeStyle = '#50C878'; ctx.lineWidth = 3; ctx.beginPath();
      this.trail.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(30, h - 30));
      ctx.stroke();
      // neon jet vector pointed along the climb angle
      const ang = this.trail.length > 1 ? Math.atan2(py - this.trail[this.trail.length - 2][1], px - this.trail[this.trail.length - 2][0]) : -0.5;
      if (window.JetArt) window.JetArt.draw(ctx, px, py, ang, 1.3);
      else { ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(14, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(this.mult.toFixed(2) + 'x', w / 2, 60);
      ctx.fillStyle = this.state === 'flying' ? '#50C878' : '#FFD700';
      ctx.font = '700 14px system-ui';
      ctx.fillText(this.state === 'flying' ? 'TAP TO CASH OUT' : this.msg, w / 2, h - 14);
    }
    teardown() { this.canvas.removeEventListener('pointerdown', this._tap); }
  }
  window.CasinoGames['Aviator X'] = Aviator;
  window.CasinoGames['Crystal Crash'] = Aviator;
})();
