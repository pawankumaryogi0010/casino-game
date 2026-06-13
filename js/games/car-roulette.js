// Car Roulette - spinning reel of car badges. The winning segment
// (and its multiplier) is decided server-side; reel decelerates to it.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, ease = window.easeOutCubic;
  const CARS=[{n:'Coupe',e:'\uD83D\uDE97',m:2},{n:'Sedan',e:'\uD83D\uDE99',m:3},{n:'Sport',e:'\uD83C\uDFCE\uFE0F',m:5},{n:'SUV',e:'\uD83D\uDE99',m:2},{n:'Limo',e:'\uD83D\uDE96',m:10},{n:'Taxi',e:'\uD83D\uDE95',m:3},{n:'Van',e:'\uD83D\uDE90',m:2},{n:'Race',e:'\uD83C\uDFCE\uFE0F',m:8}];
    class CarRoulette extends Base {
    async setup(){ this.angle=0;this.spinning=false;this.t=0;this.dur=4;this.from=0;this.to=0;this.win=null;this.msg='Tap to spin';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._spin()); }
    async _spin(){ if(this.spinning)return; this.sfx('spin');this.spinning=true;this.t=0;
      const res=await this.resolveBet(10,{game:'car_roulette'}); const o=res.outcome||{};
      this.win=(o.segment!=null)?o.segment:(Math.random()*CARS.length)|0; this.demo=o.demo!==false;
      const slice=(Math.PI*2)/CARS.length; this.from=this.angle%(Math.PI*2);
      this.to=Math.PI*2*5 - this.win*slice; }
    update(dt){ if(!this.spinning)return; this.t+=dt; const p=Math.min(1,this.t/this.dur);
      this.angle=this.from+(this.to-this.from)*ease(p);
      if(p>=1){ this.spinning=false; const c=CARS[this.win];
        this.msg=c.n+' x'+c.m+(this.demo?' (DEMO)':''); this.sfx('win'); } }
    render(ctx){ this.clear('#0B0C10'); const cx=this.width/2,cy=this.height/2-10;
      const R=Math.min(this.width,this.height)*0.33,n=CARS.length,slice=(Math.PI*2)/n;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(this.angle);
      for(let i=0;i<n;i++){ ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,i*slice,(i+1)*slice);ctx.closePath();
        ctx.fillStyle=i%2?'#15171F':'#1f2937';ctx.fill();ctx.strokeStyle='rgba(255,215,0,0.25)';ctx.stroke();
        ctx.save();ctx.rotate(i*slice+slice/2);ctx.translate(R*0.72,0);ctx.rotate(Math.PI/2);
        ctx.font='22px system-ui';ctx.textAlign='center';ctx.fillText(CARS[i].e,0,0);
        ctx.fillStyle='#FFD700';ctx.font='700 10px system-ui';ctx.fillText('x'+CARS[i].m,0,16);ctx.restore(); }
      ctx.restore();
      ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(cx,cy-R-4);ctx.lineTo(cx-8,cy-R-18);ctx.lineTo(cx+8,cy-R-18);ctx.closePath();ctx.fill();
      ctx.fillStyle='#50C878';ctx.font='700 15px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,cx,this.height-16); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Car Roulette']=CarRoulette;
  window.CasinoGames['Fortune Wheel']=CarRoulette;
})();
