// Plinko - gravity ball through pegs. The TARGET slot is server-decided;
// the ball animates with physics but is nudged to land in that slot.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  const MULT=[9,4,2,1.2,0.6,1.2,2,4,9];
  class Plinko extends Base {
    async setup(){ this.rows=8;this.ball=null;this.state='idle';this.msg='Tap to drop';this.target=4;
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._drop()); }
    async _drop(){ if(this.state==='dropping')return; this.sfx('spin');
      const res=await this.resolveBet(10,{game:'plinko'}); const o=res.outcome||{};
      this.target=(o.slot!=null)?o.slot:(Math.random()*MULT.length)|0; this.demo=o.demo!==false;
      this.ball={x:this.width/2,y:24,vx:0,vy:0}; this.state='dropping'; }
    update(dt){ if(this.state!=='dropping'||!this.ball)return;
      this.ball.vy+=420*dt; this.ball.y+=this.ball.vy*dt; this.ball.x+=this.ball.vx*dt;
      const gap=this.height*0.7/this.rows;
      const rowI=Math.floor((this.ball.y-40)/gap);
      if(rowI>=0&&rowI<this.rows&&!this.ball['r'+rowI]){ this.ball['r'+rowI]=1; this.sfx('click');
        // steer gently toward the target slot center
        const slotW=this.width/MULT.length; const tx=slotW*(this.target+0.5);
        this.ball.vx+=(tx-this.ball.x)*1.4 + (Math.random()-0.5)*60; }
      if(this.ball.y>this.height-40){ this.state='idle'; const m=MULT[this.target];
        this.msg='x'+m+(this.demo?' (DEMO)':''); this.sfx(m>=1?'win':'lose'); } }
    render(ctx){ this.clear('#0B0C10'); const gap=this.height*0.7/this.rows;
      ctx.fillStyle='rgba(255,215,0,0.6)';
      for(let r=0;r<this.rows;r++){ const cnt=r+3; const y=40+r*gap; const sp=this.width/(cnt+1);
        for(let c=0;c<cnt;c++){ ctx.beginPath();ctx.arc(sp*(c+1),y,3,0,7);ctx.fill(); } }
      const slotW=this.width/MULT.length;
      MULT.forEach((m,i)=>{ ctx.fillStyle=m>=2?'#1f8a4c':m>=1?'#15171F':'#7f1d1d';
        ctx.fillRect(i*slotW+1,this.height-34,slotW-2,30);
        ctx.fillStyle='#FFD700';ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText('x'+m,i*slotW+slotW/2,this.height-14); });
      if(this.ball){ ctx.fillStyle='#50C878';ctx.shadowBlur=12;ctx.shadowColor='#50C878';ctx.beginPath();ctx.arc(this.ball.x,this.ball.y,6,0,7);ctx.fill();ctx.shadowBlur=0; }
      ctx.fillStyle='#fff';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,this.width/2,20); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Plinko Drop']=Plinko;
})();
