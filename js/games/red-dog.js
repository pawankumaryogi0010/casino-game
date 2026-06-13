// Red Dog - two cards spread, third decides win; cards from resolveBet().
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU=window.CardUtil;
  const v=(c)=>CU.RANKS.indexOf(c.r)+2;
  class RedDog extends Base {
    async setup(){ this.cards=[];this.state='idle';this.msg='Tap to deal';
      this.canvas.addEventListener('pointerdown',this._tap=()=>{ if(this.state==='idle'||this.state==='done')this._deal();}); }
    async _deal(){ this.sfx('spin'); const res=await this.resolveBet(10,{game:'red_dog'}); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.cards=o.cards||[rnd(),rnd(),rnd()]; this.demo=o.demo!==false;
      const a=v(this.cards[0]),b=v(this.cards[1]),c=v(this.cards[2]); const lo=Math.min(a,b),hi=Math.max(a,b);
      const spread=hi-lo-1; const win=spread>0 && c>lo && c<hi;
      const odds=spread===1?5:spread===2?4:spread===3?2:1;
      this.msg=(spread<=0?'No spread - push':win?'WIN '+odds+':1':'Lose')+(this.demo?' (DEMO)':'');
      this.state='done'; this.sfx(win?'win':'lose'); }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const cw=58,ch=82,cy=this.height/2-ch/2,cx=this.width/2;
      const positions=[cx-cw-40,cx-cw/2,cx+40];
      this.cards.forEach((c,i)=>CU.drawCard(ctx,positions[i],cy,cw,ch,c.r,c.s,true));
      ctx.fillStyle='#FFD700';ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText('SPREAD',cx,cy-16);
      ctx.fillStyle='#50C878';ctx.font='700 16px system-ui';ctx.fillText(this.msg,cx,this.height-18); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Red Dog']=RedDog;
})();
