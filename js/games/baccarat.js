// Baccarat - Player/Banker with natural 8/9 and third-card rules.
// The dealt cards come from resolveBet() (server shoe).
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU = window.CardUtil;
  const pts=(c)=>{ if(['10','J','Q','K'].includes(c.r))return 0; if(c.r==='A')return 1; return parseInt(c.r,10);};
  const total=(h)=>h.reduce((s,c)=>(s+pts(c))%10,0);
  class Baccarat extends Base {
    async setup(){ this.p=[];this.b=[];this.state='idle';this.msg='Tap to deal';
      this.canvas.addEventListener('pointerdown',this._tap=()=>{ if(this.state==='idle'||this.state==='done') this._deal();}); }
    async _deal(){ this.sfx('spin');
      const res=await this.resolveBet(10,{game:'baccarat'}); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.shoe=o.shoe||Array.from({length:6},rnd); this.demo=o.demo!==false; let i=0;
      this.p=[this.shoe[i++],this.shoe[i++]]; this.b=[this.shoe[i++],this.shoe[i++]];
      const pt=total(this.p),bt=total(this.b);
      if(pt<8&&bt<8){ let pThird=null; if(pt<=5){pThird=this.shoe[i++];this.p.push(pThird);} 
        const bDraw=(bt<=2)||(bt===3&&(!pThird||pts(pThird)!==8))||(bt===4&&pThird&&pts(pThird)>=2&&pts(pThird)<=7)||(bt===5&&pThird&&pts(pThird)>=4&&pts(pThird)<=7)||(bt===6&&pThird&&pts(pThird)>=6&&pts(pThird)<=7)||(bt<=5&&!pThird);
        if(bDraw) this.b.push(this.shoe[i++]); }
      const fp=total(this.p),fb=total(this.b);
      this.msg=(fp>fb?'Player wins '+fp:fb>fp?'Banker wins '+fb:'Tie '+fp)+(this.demo?' (DEMO)':'');
      this.state='done'; this.sfx('win'); }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const cx=this.width/2;
      const row=(label,h,y,col)=>{ctx.fillStyle=col;ctx.font='700 13px system-ui';ctx.textAlign='left';ctx.fillText(label+'  ('+total(h)+')',12,y-6);
        h.forEach((c,i)=>CU.drawCard(ctx,12+i*42,y,38,54,c.r,c.s,true));};
      row('PLAYER',this.p,46,'#50C878'); row('BANKER',this.b,150,'#FFD700');
      ctx.fillStyle='#cbd5e1';ctx.font='600 14px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,cx,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Baccarat Pro']=Baccarat;
})();
