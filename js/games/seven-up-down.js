// 7 Up 7 Down - two dice; sum compared to 7. Faces from resolveBet().
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  const PIPS={1:[[.5,.5]],2:[[.25,.25],[.75,.75]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.25,.25],[.75,.25],[.25,.5],[.75,.5],[.25,.75],[.75,.75]]};
  class SevenUpDown extends Base {
    async setup(){ this.d=[1,1];this.final=null;this.state='idle';this.t=0;this.msg='Tap to roll';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._roll()); }
    async _roll(){ if(this.state==='rolling')return; this.sfx('spin');this.state='rolling';this.t=0;
      const res=await this.resolveBet(10,{game:'seven_up_down'}); const o=res.outcome||{};
      this.final=o.dice||[1+((Math.random()*6)|0),1+((Math.random()*6)|0)]; this.demo=o.demo!==false; }
    update(dt){ if(this.state!=='rolling')return; this.t+=dt;
      if(this.t<1.0){ if(((this.t*18)|0)%2===0)this.d=[1+((Math.random()*6)|0),1+((Math.random()*6)|0)]; }
      else { this.d=this.final.slice(); this.state='idle'; const s=this.d[0]+this.d[1];
        this.msg=(s>7?'7 UP ('+s+')':s<7?'7 DOWN ('+s+')':'LUCKY 7')+(this.demo?' (DEMO)':''); this.sfx('win'); } }
    _die(ctx,x,y,sz,n){ ctx.fillStyle='#f8fafc';ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,sz,sz,12):ctx.rect(x,y,sz,sz);ctx.fill();ctx.stroke();
      ctx.fillStyle='#b91c1c';(PIPS[n]||[]).forEach(([px,py])=>{ctx.beginPath();ctx.arc(x+px*sz,y+py*sz,sz*0.08,0,7);ctx.fill();}); }
    render(ctx){ this.clear('#0B0C10'); const sz=72,gap=24; const tw=sz*2+gap; const sx=(this.width-tw)/2,sy=this.height/2-50;
      this._die(ctx,sx,sy,sz,this.d[0]); this._die(ctx,sx+sz+gap,sy,sz,this.d[1]);
      ctx.fillStyle='#FFD700';ctx.font='800 20px system-ui';ctx.textAlign='center';ctx.fillText('vs 7',this.width/2,sy-20);
      ctx.fillStyle='#50C878';ctx.font='700 16px system-ui';ctx.fillText(this.msg,this.width/2,this.height-18); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['7 Up 7 Down']=SevenUpDown;
  window.CasinoGames['Lucky 7s']=SevenUpDown;
})();
