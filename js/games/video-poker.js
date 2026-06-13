// Video Poker - five-card draw; deal & redraw cards from resolveBet().
// Player taps cards to hold before drawing.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU=window.CardUtil;
  class VideoPoker extends Base {
    async setup(){ this.hand=[];this.hold=[false,false,false,false,false];this.state='idle';this.msg='Tap to deal';
      this.canvas.addEventListener('pointerdown',this._tap=(e)=>this._click(e)); }
    async _deal(){ this.sfx('spin'); const res=await this.resolveBet(10,{game:'video_poker'}); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.deck=o.deck||Array.from({length:10},rnd); this.demo=o.demo!==false; this.di=0;
      this.hand=[0,1,2,3,4].map(()=>this.deck[this.di++]); this.hold=[false,false,false,false,false];
      this.state='draw'; this.msg='Tap cards to HOLD, then tap below to DRAW'; }
    _draw(){ if(this.state!=='draw')return; this.hand=this.hand.map((c,i)=>this.hold[i]?c:this.deck[this.di++]); this.state='done';
      this.msg='Final hand'+(this.demo?' (DEMO)':''); this.sfx('win'); }
    _click(e){ const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      if(this.state==='idle'||this.state==='done'){ this._deal(); return; }
      if(y>this.height-46){ this._draw(); return; }
      const cw=this.width/5; const i=Math.floor(x/cw); if(i>=0&&i<5){ this.hold[i]=!this.hold[i]; this.sfx('click'); } }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const cw=this.width/5,w=cw-10,h=w*1.4,y=this.height/2-h/2;
      this.hand.forEach((c,i)=>{ const x=i*cw+5; CU.drawCard(ctx,x,y,w,h,c.r,c.s,true);
        if(this.hold[i]){ctx.strokeStyle='#50C878';ctx.lineWidth=3;ctx.strokeRect(x-1,y-1,w+2,h+2);
          ctx.fillStyle='#50C878';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText('HELD',x+w/2,y-6);} });
      ctx.fillStyle='rgba(255,215,0,0.15)';ctx.fillRect(0,this.height-46,this.width,46);
      ctx.fillStyle='#FFD700';ctx.font='700 14px system-ui';ctx.textAlign='center';
      ctx.fillText(this.state==='draw'?'DRAW':this.msg,this.width/2,this.height-18); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Video Poker']=VideoPoker;
})();
