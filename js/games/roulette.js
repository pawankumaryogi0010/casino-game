// Roulette - wheel decelerates (easeOutCubic) to the server-chosen
// winning number. The landing pocket is NOT random in the browser.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, ease = window.easeOutCubic;
  const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  class Roulette extends Base {
    async setup() {
      this.angle = 0; this.spinning = false; this.from = 0; this.to = 0; this.t = 0; this.dur = 4.5;
      this.result = null; this.msg = 'Tap to spin';
      this.canvas.addEventListener('pointerdown', this._tap = () => this._spin());
    }
    async _spin() {
      if (this.spinning) return; this.sfx('spin'); this.spinning = true; this.t = 0;
      const res = await this.resolveBet(10, { game: 'roulette' });
      const o = res.outcome || {};
      this.result = (o.number != null) ? o.number : ORDER[(Math.random() * ORDER.length) | 0];
      this.demo = o.demo !== false;
      const idx = ORDER.indexOf(this.result);
      const slice = (Math.PI * 2) / ORDER.length;
      this.from = this.angle % (Math.PI * 2);
      this.to = Math.PI * 2 * 6 - idx * slice; // several turns then land
    }
    update(dt) {
      if (!this.spinning) return; this.t += dt;
      const p = Math.min(1, this.t / this.dur);
      this.angle = this.from + (this.to - this.from) * ease(p);
      if (p >= 1) { this.spinning = false;
        this.msg = 'Landed on ' + this.result + (this.demo ? ' (DEMO)' : ''); this.sfx('win'); }
    }
    render(ctx) {
      this.clear('#0B0C10'); const cx = this.width / 2, cy = this.height / 2 - 10;
      const R = Math.min(this.width, this.height) * 0.32; const n = ORDER.length, slice = (Math.PI*2)/n;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle);
      // outer mahogany wood rim with radial gradient
      const rim = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.18);
      rim.addColorStop(0, '#5b2a16'); rim.addColorStop(0.7, '#3b1a0d'); rim.addColorStop(1, '#1c0d06');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(0, 0, R * 1.16, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < n; i++) {
        const num = ORDER[i];
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, i*slice, (i+1)*slice); ctx.closePath();
        const grad = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
        const base = num === 0 ? ['#1f8a4c', '#0f5e33'] : (i % 2 ? ['#1f2937', '#0a0e16'] : ['#c2231f', '#7f1212']);
        grad.addColorStop(0, base[0]); grad.addColorStop(1, base[1]);
        ctx.fillStyle = grad; ctx.fill();
        // golden separators
        ctx.strokeStyle = 'rgba(255,215,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.save(); ctx.rotate(i*slice + slice/2); ctx.translate(R*0.8, 0);
        ctx.rotate(Math.PI/2); ctx.fillStyle = '#fff'; ctx.font = '700 10px Georgia, system-ui'; ctx.textAlign='center';
        ctx.fillText(num, 0, 0); ctx.restore();
      }
      // metallic hub
      const hub = ctx.createRadialGradient(-R*0.05, -R*0.05, 2, 0, 0, R*0.28);
      hub.addColorStop(0, '#fff7cc'); hub.addColorStop(0.5, '#C9A227'); hub.addColorStop(1, '#6b5410');
      ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(0, 0, R*0.26, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      // metallic ball with shadow, fixed at top pocket
      ctx.save(); ctx.translate(cx, cy);
      const ballA = -Math.PI/2; const br = R*0.92;
      const bx = Math.cos(ballA)*br, by = Math.sin(ballA)*br;
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      const bg = ctx.createRadialGradient(bx-2, by-2, 1, bx, by, 6);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#9ca3af');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.moveTo(cx, cy - R - 4); ctx.lineTo(cx - 8, cy - R - 18); ctx.lineTo(cx + 8, cy - R - 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#50C878'; ctx.font = '700 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(this.msg, cx, this.height - 16);
    }
    teardown() { this.canvas.removeEventListener('pointerdown', this._tap); }
  }
  window.CasinoGames['Mega Roulette'] = Roulette;
})();
