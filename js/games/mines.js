// Mines - 5x5 grid; mine positions come from resolveBet(). Reveal tiles,
// cash out anytime. Multiplier grows per safe tile.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  class Mines extends Base {
    async setup(){ this.grid=Array(25).fill(0);this.revealed=Array(25).fill(false);this.state='idle';
      this.mult=1;this.safe=0;this.mines=[];this.msg='Tap a tile to start';
      this.canvas.addEventListener('pointerdown',this._tap=(e)=>this._click(e)); }
    async _begin(){ const res=await this.resolveBet(10,{game:'mines',count:5}); const o=res.outcome||{};
      if(o.mines) this.mines=o.mines; else { const s=new Set(); while(s.size<5)s.add((Math.random()*25)|0); this.mines=[...s]; }
      this.demo=o.demo!==false; this.state='playing'; this.mult=1; this.safe=0; this.msg='Pick tiles \u2022 tap CASH to stop'; }
    async _click(e){ const r=this.canvas.getBoundingClientRect(); const x=e.clientX-r.left,y=e.clientY-r.top;
      if(this.state==='idle'||this.state==='done'){ this.revealed=Array(25).fill(false); await this._begin(); return; }
      if(y>this.height-44){ this._cashOut(); return; } // cash-out bar
      const cell=this._cellAt(x,y); if(cell<0||this.revealed[cell])return;
      this.revealed[cell]=true;
      if(this.mines.includes(cell)){ this.state='done'; this.msg='BOOM! Mine hit'+(this.demo?' (DEMO)':''); this.sfx('lose'); this.mines.forEach(m=>this.revealed[m]=true); }
      else { this.safe++; this.mult=+(1+this.safe*0.35).toFixed(2); this.sfx('click'); this.msg='x'+this.mult+' \u2022 tap CASH'; } }
    _cashOut(){ if(this.state!=='playing')return; this.state='done'; this.msg='Cashed out x'+this.mult+(this.demo?' (DEMO)':''); this.sfx('win'); }
    _cellAt(x,y){ const m=14,s=(this.width-m*6)/5; if(y<40||y>40+5*(s+m))return -1;
      const c=Math.floor((x-m)/(s+m)),r=Math.floor((y-40)/(s+m)); if(c<0||c>4||r<0||r>4)return -1; return r*5+c; }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const m=14,s=(this.width-m*6)/5;
      for(let i=0;i<25;i++){ const c=i%5,r=(i/5)|0; const x=m+c*(s+m),y=40+r*(s+m);
        const rev=this.revealed[i],mine=this.mines.includes(i);
        ctx.fillStyle=rev?(mine?'#7f1d1d':'#1f8a4c'):'#15171F';
        ctx.strokeStyle='rgba(255,215,0,0.25)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,s,s,8):ctx.rect(x,y,s,s);ctx.fill();ctx.stroke();
        if(rev){ctx.font='700 20px system-ui';ctx.textAlign='center';ctx.fillText(mine?'\uD83D\uDCA3':'\uD83D\uDC8E',x+s/2,y+s/2+7);} }
      ctx.fillStyle='rgba(255,215,0,0.15)';ctx.fillRect(0,this.height-44,this.width,44);
      ctx.fillStyle='#FFD700';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText(this.state==='playing'?'CASH OUT (x'+this.mult+')':this.msg,this.width/2,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Mines Master']=Mines;
})();
