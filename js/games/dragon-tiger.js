// Dragon Tiger - single high-card per side. Cards from resolveBet().
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU = window.CardUtil;
  const hi=(c)=>CU.RANKS.indexOf(c.r);
  class DragonTiger extends Base {
    async setup(){ this.d=null;this.t2=null;this.state='idle';this.flip=0;this.msg='Tap to deal';
      this.canvas.addEventListener('pointerdown',this._tap=()=>{ if(this.state==='idle')this._deal();}); }
    async _deal(){ this.sfx('spin'); this.flip=0;
      const res=await this.resolveBet(10,{game:'dragon_tiger'}); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.d=o.dragon||rnd(); this.t2=o.tiger||rnd(); this.demo=o.demo!==false; this.state='flip'; }
    update(dt){ if(this.state!=='flip')return; this.flip=Math.min(1,this.flip+dt*1.5);
      if(this.flip>=1){ const dw=hi(this.d),tw=hi(this.t2); this.state='idle';
        this.msg=(dw>tw?'DRAGON wins':tw>dw?'TIGER wins':'TIE')+(this.demo?' (DEMO)':''); this.sfx(dw===tw?'lose':'win'); } }
    render(ctx){ this.clear('#0B0C10'); const cx=this.width/2,cy=this.height/2-20;
      const draw=(label,c,x,col)=>{ ctx.fillStyle=col;ctx.shadowBlur=14;ctx.shadowColor=col;ctx.font='800 16px system-ui';ctx.textAlign='center';ctx.fillText(label,x,cy-60);ctx.shadowBlur=0;
        if(c) CU.drawCard(ctx,x-30,cy-40,60,84,c.r,c.s,this.flip>=1); };
      draw('DRAGON',this.d,cx-80,'#ef4444'); draw('TIGER',this.t2,cx+80,'#FFD700');
      ctx.fillStyle='#50C878';ctx.font='700 16px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,cx,this.height-20); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Tiger Fortune']=DragonTiger;
  window.CasinoGames['Dragon Tiger']=DragonTiger;
  window.CasinoGames['Dragon Spin']=DragonTiger;
})();
