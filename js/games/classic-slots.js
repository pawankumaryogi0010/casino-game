// Classic Slots - 3 reels; final symbols from resolveBet(). Reels spin
// then snap to the server result; payline checked for display only.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  // map reel indices to premium vector symbols
  const SYM=['cherry','bell','seven','crown','diamond','seven'];
  class ClassicSlots extends Base {
    async setup(){ this.reels=[0,0,0];this.final=[0,0,0];this.state='idle';this.t=0;this.msg='Tap to spin';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._spin()); }
    async _spin(){ if(this.state==='spinning')return; this.sfx('spin');this.state='spinning';this.t=0;
      const res=await this.resolveBet(10,{game:'slots'}); const o=res.outcome||{};
      this.final=o.reels||[(Math.random()*6)|0,(Math.random()*6)|0,(Math.random()*6)|0]; this.demo=o.demo!==false; }
    update(dt){ if(this.state!=='spinning')return; this.t+=dt;
      this.reels=this.reels.map((v,i)=> this.t>0.6+i*0.4 ? this.final[i] : (Math.random()*6)|0 );
      if(this.t>0.6+2*0.4+0.2){ this.state='idle'; const [a,b,c]=this.final;
        const win=a===b&&b===c; this.msg=(win?'JACKPOT x10!':'Try again')+(this.demo?' (DEMO)':''); this.sfx(win?'win':'lose'); } }
    render(ctx){ this.clear('#0B0C10'); const bw=this.width*0.26,gap=this.width*0.04; const total=bw*3+gap*2; let x=(this.width-total)/2; const y=this.height/2-bw/2;
      for(let i=0;i<3;i++){ ctx.fillStyle='#15171F';ctx.strokeStyle='rgba(255,215,0,0.5)';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,bw,bw,12):ctx.rect(x,y,bw,bw);ctx.fill();ctx.stroke();
        // pulse-scale the symbol when this is a winning (all-equal) result
        const win = this.state==='idle' && this.final[0]===this.final[1] && this.final[1]===this.final[2];
        const pulse = win ? 1 + 0.18*Math.abs(Math.sin(performance.now()/180)) : 1;
        if (window.SlotArt) window.SlotArt.draw(ctx, SYM[this.reels[i]], x+bw/2, y+bw/2, bw*0.5, pulse);
        x+=bw+gap; }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='#50C878';ctx.font='700 16px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,this.width/2,this.height-18); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Neon Slots']=ClassicSlots;
  window.CasinoGames['Golden Pharaoh']=ClassicSlots;
  window.CasinoGames['Aztec Gold']=ClassicSlots;
  window.CasinoGames['Cash Blitz']=ClassicSlots;
  window.CasinoGames['Diamond Rush']=ClassicSlots;
  window.CasinoGames['Treasure Vault']=ClassicSlots;
  window.CasinoGames['Classic Slots']=ClassicSlots;
})();
