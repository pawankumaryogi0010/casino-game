// Keno - pick numbers on an 80 grid; the 20 drawn numbers come from
// resolveBet(). Matches are highlighted as they are drawn.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  class Keno extends Base {
    async setup(){ this.picks=new Set();this.drawn=[];this.state='pick';this.t=0;this.di=0;this.msg='Pick up to 10, tap DRAW';
      this.canvas.addEventListener('pointerdown',this._tap=(e)=>this._click(e)); }
    async _draw(){ if(this.picks.size===0)return; this.sfx('spin');
      const res=await this.resolveBet(10,{game:'keno',picks:[...this.picks]}); const o=res.outcome||{};
      if(o.drawn){ this.drawnFinal=o.drawn; } else { const s=new Set(); while(s.size<20)s.add(1+((Math.random()*80)|0)); this.drawnFinal=[...s]; }
      this.demo=o.demo!==false; this.drawn=[]; this.di=0; this.state='drawing'; this.t=0; }
    update(dt){ if(this.state!=='drawing')return; this.t+=dt;
      if(this.t>0.12){ this.t=0; if(this.di<this.drawnFinal.length){ this.drawn.push(this.drawnFinal[this.di++]); this.sfx('click'); }
        else { this.state='done'; const hits=[...this.picks].filter(p=>this.drawn.includes(p)).length;
          this.msg=hits+' / '+this.picks.size+' hits'+(this.demo?' (DEMO)':''); this.sfx(hits>=this.picks.size/2?'win':'lose'); } } }
    _click(e){ if(this.state==='done'){ this.picks.clear();this.drawn=[];this.state='pick';this.msg='Pick up to 10, tap DRAW';return; }
      const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      if(y>this.height-44){ if(this.state==='pick')this._draw(); return; }
      if(this.state!=='pick')return;
      const cols=10,cell=this.width/cols,row=Math.floor((y-30)/cell),col=Math.floor(x/cell);
      if(row<0||row>7||col<0||col>9)return; const num=row*10+col+1;
      if(this.picks.has(num)) this.picks.delete(num); else if(this.picks.size<10){ this.picks.add(num); this.sfx('click'); } }
    render(ctx){ this.clear('#0B0C10'); const cols=10,cell=this.width/cols;
      for(let i=1;i<=80;i++){ const r=((i-1)/cols)|0,c=(i-1)%cols; const x=c*cell,y=30+r*cell;
        const picked=this.picks.has(i),hit=this.drawn.includes(i);
        ctx.fillStyle=hit&&picked?'#1f8a4c':hit?'#b45309':picked?'#FFD700':'#15171F';
        ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.rect(x+1,y+1,cell-2,cell-2);ctx.fill();ctx.stroke();
        ctx.fillStyle=picked?'#0B0C10':'#94a3b8';ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i,x+cell/2,y+cell/2); }
      ctx.textBaseline='alphabetic';
      ctx.fillStyle='rgba(255,215,0,0.15)';ctx.fillRect(0,this.height-44,this.width,44);
      ctx.fillStyle='#FFD700';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText(this.state==='pick'?'DRAW':this.msg,this.width/2,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Keno Jackpot']=Keno;
})();
