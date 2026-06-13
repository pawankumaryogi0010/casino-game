// Andar Bahar - deals a joker, then alternates cards to Andar/Bahar
// until the match side (decided server-side) is reached.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU = window.CardUtil;
  class AndarBahar extends Base {
    async setup() {
      this.state = 'idle'; this.andar = []; this.bahar = []; this.joker = null;
      this.deals = 0; this.t = 0; this.msg = 'Tap to start'; this.outcome = null;
      this.canvas.addEventListener('pointerdown', this._tap = () => this._start());
    }
    async _start() {
      if (this.state !== 'idle') return;
      this.sfx('spin'); this.andar = []; this.bahar = []; this.deals = 0; this.t = 0;
      const res = await this.resolveBet(10, { game: 'andar_bahar' });
      const o = res.outcome || {};
      this.outcome = o.joker ? o : this._visualDemo();
      this.joker = this.outcome.joker; this.state = 'dealing';
    }
    _visualDemo() {
      const rnd = () => ({ r: CU.RANKS[(Math.random()*13)|0], s: CU.SUITS[(Math.random()*4)|0] });
      const steps = 3 + ((Math.random()*8)|0);
      const side = Math.random() < 0.5 ? 'andar' : 'bahar';
      return { demo: true, joker: rnd(), steps, side };
    }
    update(dt) {
      if (this.state !== 'dealing') return;
      this.t += dt;
      if (this.t > 0.28) {
        this.t = 0;
        const toAndar = this.deals % 2 === 0;
        const rnd = { r: CU.RANKS[(Math.random()*13)|0], s: CU.SUITS[(Math.random()*4)|0] };
        (toAndar ? this.andar : this.bahar).push(rnd);
        this.deals++; this.sfx('click');
        if (this.deals >= this.outcome.steps) {
          this.state = 'idle';
          this.msg = 'Match on ' + this.outcome.side.toUpperCase() + (this.outcome.demo ? ' (DEMO)' : '');
          this.sfx('win');
        }
      }
    }
    render(ctx) {
      this.clear('#0B0C10'); const cx = this.width / 2;
      ctx.fillStyle = '#FFD700'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('JOKER', cx, 26);
      if (this.joker) CU.drawCard(ctx, cx - 23, 34, 46, 64, this.joker.r, this.joker.s, true);
      const rowY = [120, 200];
      [['ANDAR', this.andar], ['BAHAR', this.bahar]].forEach(([label, arr], i) => {
        ctx.fillStyle = i ? '#50C878' : '#FFD700'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(label, 12, rowY[i] - 6);
        arr.forEach((c, j) => CU.drawCard(ctx, 12 + j * 22, rowY[i], 30, 44, c.r, c.s, true));
      });
      ctx.fillStyle = '#cbd5e1'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(this.msg, cx, this.height - 18);
    }
    teardown() { this.canvas.removeEventListener('pointerdown', this._tap); }
  }
  window.CasinoGames['Andar Bahar'] = AndarBahar;
})();
