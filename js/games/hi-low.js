// Hi-Low - guess next card higher/lower; next card from resolveBet().
// Streak multiplier grows on each correct call.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU=window.CardUtil;
  const v=(c)=>CU.RANKS.indexOf(c.r);
  class HiLow extends Base {
    async setup(){ const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.cur=rnd();this.next=null;this.streak=0;this.mult=1;this.state='choose';this.msg='Higher or Lower?';
      this.canvas.addEventListener('pointerdown',this._tap=(e)=>this._click(e)); }
    async _guess(higher){ if(this.state!=='choose')return; this.sfx('click');
      const res=await this.resolveBet(0,{game:'hi_low'}); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.next=o.next||rnd(); this.demo=o.demo!==false;
      const correct=higher? v(this.next)>=v(this.cur): v(this.next)<=v(this.cur);
      if(correct){ this.streak++; this.mult=+(1+this.streak*0.5).toFixed(2); this.msg='Correct! x'+this.mult+(this.demo?' (DEMO)':''); this.sfx('win'); this.cur=this.next; this.next=null; }
      else { this.msg='Wrong! Streak lost'+(this.demo?' (DEMO)':''); this.sfx('lose'); this.streak=0; this.mult=1; this.cur=this.next; this.next=null; } }
    _click(e){ const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left; this._guess(x<this.width/2); }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const cw=70,ch=100,cx=this.width/2-cw/2,cy=this.height/2-ch/2-20;
      CU.drawCard(ctx,cx,cy,cw,ch,this.cur.r,this.cur.s,true);
      ctx.fillStyle='#FFD700';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText('Streak x'+this.mult,this.width/2,cy-14);
      ctx.fillStyle='rgba(80,200,120,0.15)';ctx.fillRect(0,this.height-54,this.width/2-2,54);
      ctx.fillStyle='rgba(239,68,68,0.15)';ctx.fillRect(this.width/2+2,this.height-54,this.width/2,54);
      ctx.fillStyle='#50C878';ctx.font='700 14px system-ui';ctx.fillText('\u2191 HIGHER',this.width/4,this.height-22);
      ctx.fillStyle='#ef4444';ctx.fillText('\u2193 LOWER',this.width*0.75,this.height-22);
      ctx.fillStyle='#cbd5e1';ctx.font='600 12px system-ui';ctx.fillText(this.msg,this.width/2,this.height-64); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Hi-Low']=HiLow;
})();
