// Teen Patti - 3-card renderer. Outcome (the dealt cards + winner)
// comes from resolveBet(); this file only animates the deal & flip.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU = window.CardUtil;
  class TeenPatti extends Base {
    async setup() {
      this.state = 'idle'; this.t = 0;
      this.hands = [[], []]; this.flip = 0; this.msg = 'Tap to deal';
      this.outcome = null;
      this.canvas.addEventListener('pointerdown', this._tap = () => this._deal());
    }
    async _deal() {
      if (this.state !== 'idle') return;
      this.sfx('spin'); this.state = 'dealing'; this.t = 0; this.flip = 0;
      const res = await this.resolveBet(10, { game: 'teen_patti' });
      const o = res.outcome || {};
      // Server returns cards; offline demo fabricates visual-only cards.
      this.outcome = o.cards ? o : this._visualDemo();
      this.hands = this.outcome.cards;
    }
    _visualDemo() {
      const rnd = () => ({ r: CU.RANKS[(Math.random()*13)|0], s: CU.SUITS[(Math.random()*4)|0] });
      const win = Math.random() < 0.5;
      return { demo: true, cards: [[rnd(),rnd(),rnd()],[rnd(),rnd(),rnd()]], winner: win ? 0 : 1 };
    }
    update(dt) {
      if (this.state === 'dealing') { this.t += dt; if (this.t > 0.6) { this.state = 'flip'; this.t = 0; } }
      else if (this.state === 'flip') { this.flip = Math.min(1, this.flip + dt * 1.6);
        if (this.flip >= 1) { this.state = 'idle';
          const w = this.outcome.winner;
          this.msg = (w === 0 ? 'You win!' : 'Dealer wins') + (this.outcome.demo ? ' (DEMO)' : '');
          this.sfx(w === 0 ? 'win' : 'lose'); } }
    }
    render(ctx) {
      this.clear('#0B0C10');
      const cw = 46, ch = 64, gap = 8, cx = this.width / 2;
      ['You', 'Dealer'].forEach((label, row) => {
        const y = 40 + row * 110;
        ctx.fillStyle = '#FFD700'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(label, cx, y - 8);
        const totalW = cw * 3 + gap * 2; let x = cx - totalW / 2;
        for (let i = 0; i < 3; i++) {
          const c = this.hands[row] && this.hands[row][i];
          const up = c && (this.state === 'flip' || this.state === 'idle') && this.flip > i / 3;
          CU.drawCard(ctx, x, y, cw, ch, c ? c.r : 'A', c ? c.s : '\u2660', !!up);
          x += cw + gap;
        }
      });
      ctx.fillStyle = '#50C878'; ctx.font = '600 14px system-ui';
      ctx.fillText(this.msg, cx, this.height - 22);
    }
    teardown() { this.canvas.removeEventListener('pointerdown', this._tap); }
  }
  window.CasinoGames['Royal Poker'] = TeenPatti; // lobby slot
  window.CasinoGames['Teen Patti'] = TeenPatti;
})();
