// Jhandi Munda - six symbol dice. Faces come from resolveBet();
// the roll animation tumbles then settles on the server faces.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  const SYM=['\u2660','\u2665','\u2666','\u2663','\uD83D\uDC51','\u26F3']; // spade heart diamond club crown flag
  class JhandiMunda extends Base {
    async setup(){ this.state='idle';this.t=0;this.faces=[0,0,0,0,0,0];this.final=null;this.msg='Tap to roll';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._roll()); }
    async _roll(){ if(this.state==='rolling')return; this.sfx('spin'); this.state='rolling'; this.t=0;
      const res=await this.resolveBet(10,{game:'jhandi_munda'}); const o=res.outcome||{};
      this.final=o.faces||Array.from({length:6},()=>(Math.random()*6)|0); this.demo=o.demo!==false; }
    update(dt){ if(this.state!=='rolling')return; this.t+=dt;
      if(this.t<1.1){ if(((this.t*16)|0)%2===0) this.faces=this.faces.map(()=>(Math.random()*6)|0); }
      else { this.faces=this.final.slice(); this.state='idle';
        this.msg='Result'+(this.demo?' (DEMO)':''); this.sfx('win'); } }
    render(ctx){ this.clear('#0B0C10'); const cols=3,sz=58,gap=14;
      const totalW=cols*sz+(cols-1)*gap; const sx=(this.width-totalW)/2; const sy=70;
      for(let i=0;i<6;i++){ const r=(i/cols)|0,c=i%cols; const x=sx+c*(sz+gap),y=sy+r*(sz+gap);
        ctx.fillStyle='#15171F';ctx.strokeStyle='rgba(255,215,0,0.4)';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,sz,sz,10):ctx.rect(x,y,sz,sz);ctx.fill();ctx.stroke();
        ctx.fillStyle='#FFD700';ctx.font='700 26px system-ui';ctx.textAlign='center';ctx.fillText(SYM[this.faces[i]],x+sz/2,y+sz/2+9); }
      ctx.fillStyle='#50C878';ctx.font='600 14px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,this.width/2,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Mystic Dice']=JhandiMunda;
  window.CasinoGames['Jhandi Munda']=JhandiMunda;
})();
