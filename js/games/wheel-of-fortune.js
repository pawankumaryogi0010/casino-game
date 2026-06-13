// Wheel of Fortune - vertical pointer wheel with tick sounds; the
// winning wedge is server-decided, wheel eases to it.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, ease=window.easeOutCubic;
  const W=[2,5,10,2,20,2,5,40,2,5,10,2];
  class WheelOfFortune extends Base {
    async setup(){ this.angle=0;this.spinning=false;this.t=0;this.dur=4.2;this.from=0;this.to=0;this.win=0;this.lastTick=0;this.msg='Tap to spin';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._spin()); }
    async _spin(){ if(this.spinning)return; this.sfx('spin');this.spinning=true;this.t=0;
      const res=await this.resolveBet(10,{game:'wheel'}); const o=res.outcome||{};
      this.win=(o.segment!=null)?o.segment:(Math.random()*W.length)|0; this.demo=o.demo!==false;
      const slice=(Math.PI*2)/W.length; this.from=this.angle%(Math.PI*2); this.to=Math.PI*2*6 - this.win*slice; }
    update(dt){ if(!this.spinning)return; this.t+=dt; const p=Math.min(1,this.t/this.dur);
      this.angle=this.from+(this.to-this.from)*ease(p);
      const slice=(Math.PI*2)/W.length; const tickIdx=Math.floor(this.angle/slice);
      if(tickIdx!==this.lastTick){ this.lastTick=tickIdx; this.sfx('click'); }
      if(p>=1){ this.spinning=false; this.msg='Win x'+W[this.win]+(this.demo?' (DEMO)':''); this.sfx('win'); } }
    render(ctx){ this.clear('#0B0C10'); const cx=this.width/2,cy=this.height/2+10,R=Math.min(this.width,this.height)*0.32,n=W.length,slice=(Math.PI*2)/n;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(this.angle);
      for(let i=0;i<n;i++){ ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,i*slice,(i+1)*slice);ctx.closePath();
        ctx.fillStyle=i%3===0?'#b91c1c':i%3===1?'#15171F':'#1f8a4c';ctx.fill();ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.stroke();
        ctx.save();ctx.rotate(i*slice+slice/2);ctx.translate(R*0.7,0);ctx.rotate(Math.PI/2);
        ctx.fillStyle='#FFD700';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText('x'+W[i],0,0);ctx.restore(); }
      ctx.restore();
      ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(cx,cy-R-2);ctx.lineTo(cx-10,cy-R-20);ctx.lineTo(cx+10,cy-R-20);ctx.closePath();ctx.fill();
      ctx.fillStyle='#50C878';ctx.font='700 16px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,cx,this.height-14); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Wheel of Fortune']=WheelOfFortune;
  window.CasinoGames['Vegas Nights']=WheelOfFortune;
})();
