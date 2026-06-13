// Ludo Betting - single-token race; dice rolls/outcome from resolveBet().
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  class LudoBetting extends Base {
    async setup(){ this.pos=[0,0];this.state='idle';this.t=0;this.rolls=null;this.idx=0;this.msg='Tap to race';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._race()); }
    async _race(){ if(this.state==='racing')return; this.sfx('spin');this.state='racing';this.pos=[0,0];this.idx=0;this.t=0;
      const res=await this.resolveBet(10,{game:'ludo'}); const o=res.outcome||{};
      this.rolls=o.rolls||Array.from({length:8},()=>1+((Math.random()*6)|0)); this.winner=o.winner!=null?o.winner:(Math.random()<0.5?0:1); this.demo=o.demo!==false; }
    update(dt){ if(this.state!=='racing')return; this.t+=dt;
      if(this.t>0.4){ this.t=0; const p=this.idx%2; const step=this.rolls[this.idx%this.rolls.length];
        this.pos[p]=Math.min(30,this.pos[p]+step); this.die=step; this.sfx('click'); this.idx++;
        if(this.pos[this.winner]>=30){ this.state='idle'; this.msg=(this.winner===0?'You win!':'Rival wins')+(this.demo?' (DEMO)':''); this.sfx('win'); } } }
    render(ctx){ this.clear('#0B0C10'); const w=this.width-40;
      ['You','Rival'].forEach((label,i)=>{ const y=70+i*70;
        ctx.fillStyle=i?'#ef4444':'#50C878';ctx.font='700 13px system-ui';ctx.textAlign='left';ctx.fillText(label,20,y-10);
        ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(20,y,w,14);
        ctx.fillStyle=i?'#ef4444':'#50C878';ctx.fillRect(20,y,w*(this.pos[i]/30),14);
        ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(20+w*(this.pos[i]/30),y+7,9,0,7);ctx.fill(); });
      if(this.die){ctx.fillStyle='#FFD700';ctx.font='800 18px system-ui';ctx.textAlign='center';ctx.fillText('\uD83C\uDFB2 '+this.die,this.width/2,this.height-50);}
      ctx.fillStyle='#cbd5e1';ctx.font='600 14px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,this.width/2,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Ludo Betting']=LudoBetting;
  window.CasinoGames['Wild West']=LudoBetting;
})();
