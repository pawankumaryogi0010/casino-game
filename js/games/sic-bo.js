// Sic Bo - three dice; faces from resolveBet(). Shaker then settle.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine;
  const PIPS={1:[[.5,.5]],2:[[.3,.3],[.7,.7]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]],5:[[.3,.3],[.7,.3],[.5,.5],[.3,.7],[.7,.7]],6:[[.3,.25],[.7,.25],[.3,.5],[.7,.5],[.3,.75],[.7,.75]]};
  class SicBo extends Base {
    async setup(){ this.d=[1,1,1];this.final=null;this.state='idle';this.t=0;this.msg='Tap to roll';
      this.canvas.addEventListener('pointerdown',this._tap=()=>this._roll()); }
    async _roll(){ if(this.state==='rolling')return; this.sfx('spin');this.state='rolling';this.t=0;
      const res=await this.resolveBet(10,{game:'sic_bo'}); const o=res.outcome||{};
      this.final=o.dice||[1+((Math.random()*6)|0),1+((Math.random()*6)|0),1+((Math.random()*6)|0)]; this.demo=o.demo!==false; }
    update(dt){ if(this.state!=='rolling')return; this.t+=dt;
      if(this.t<1.1){ if(((this.t*16)|0)%2===0)this.d=this.d.map(()=>1+((Math.random()*6)|0)); }
      else { this.d=this.final.slice(); this.state='idle'; const s=this.d[0]+this.d[1]+this.d[2];
        const trip=this.d[0]===this.d[1]&&this.d[1]===this.d[2];
        this.msg=(trip?'TRIPLE! '+this.d[0]:'Total '+s+(s>10?' BIG':' SMALL'))+(this.demo?' (DEMO)':''); this.sfx('win'); } }
    _die(ctx,x,y,sz,n){ ctx.fillStyle='#f8fafc';ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,sz,sz,10):ctx.rect(x,y,sz,sz);ctx.fill();ctx.stroke();
      ctx.fillStyle='#b91c1c';(PIPS[n]||[]).forEach(([px,py])=>{ctx.beginPath();ctx.arc(x+px*sz,y+py*sz,sz*0.075,0,7);ctx.fill();}); }
    render(ctx){ this.clear('#0B0C10'); const sz=56,gap=16,tw=sz*3+gap*2,sx=(this.width-tw)/2,sy=this.height/2-50;
      for(let i=0;i<3;i++) this._die(ctx,sx+i*(sz+gap),sy,sz,this.d[i]);
      ctx.fillStyle='#FFD700';ctx.font='800 16px system-ui';ctx.textAlign='center';ctx.fillText('SIC BO',this.width/2,sy-18);
      ctx.fillStyle='#50C878';ctx.font='700 15px system-ui';ctx.fillText(this.msg,this.width/2,this.height-18); }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Sic Bo']=SicBo;
})();
