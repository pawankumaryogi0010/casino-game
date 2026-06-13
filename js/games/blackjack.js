// Blackjack - Hit/Stand/Split UI; the shoe order is server-authoritative
// (resolveBet returns the card sequence). Dealer hits below 17.
(function () {
  'use strict';
  const Base = window.CasinoGameEngine, CU = window.CardUtil;
  function val(hand){ let t=0,a=0; hand.forEach(c=>{ if(c.r==='A'){a++;t+=11;} else if(['K','Q','J','10'].includes(c.r)) t+=10; else t+=parseInt(c.r,10);}); while(t>21&&a){t-=10;a--;} return t; }
  class Blackjack extends Base {
    async setup() {
      this.player=[]; this.dealer=[]; this.state='idle'; this.msg='Tap to deal'; this.holeUp=false;
      this.canvas.addEventListener('pointerdown', this._tap=(e)=>this._click(e));
    }
    async _deal(){ this.sfx('spin');
      const res = await this.resolveBet(10, { game:'blackjack' }); const o=res.outcome||{};
      const rnd=()=>({r:CU.RANKS[(Math.random()*13)|0],s:CU.SUITS[(Math.random()*4)|0]});
      this.shoe = o.shoe || Array.from({length:12},rnd); this.demo=o.demo!==false; this.si=0;
      this.player=[this.shoe[this.si++],this.shoe[this.si++]];
      this.dealer=[this.shoe[this.si++],this.shoe[this.si++]]; this.holeUp=false; this.state='player';
      this.msg='HIT / STAND';
    }
    _hit(){ if(this.state!=='player')return; this.player.push(this.shoe[this.si++]); this.sfx('click'); if(val(this.player)>21){this.state='done';this.msg='Bust!'+(this.demo?' (DEMO)':'');this.sfx('lose');} }
    _stand(){ if(this.state!=='player')return; this.state='dealer'; this.holeUp=true;
      while(val(this.dealer)<17) this.dealer.push(this.shoe[this.si++]);
      const pv=val(this.player),dv=val(this.dealer); const win=dv>21||pv>dv;
      this.state='done'; this.msg=(win?'You win '+pv+' v '+dv:'Dealer '+dv+' v '+pv)+(this.demo?' (DEMO)':''); this.sfx(win?'win':'lose'); }
    _click(e){ if(this.state==='idle'||this.state==='done'){ this._deal(); return; }
      const r=this.canvas.getBoundingClientRect(); const x=e.clientX-r.left;
      if(x<this.width/2) this._hit(); else this._stand(); }
    update(){}
    render(ctx){ this.clear('#0B0C10'); const cx=this.width/2;
      const row=(label,hand,y,hideHole)=>{ ctx.fillStyle='#FFD700';ctx.font='700 12px system-ui';ctx.textAlign='left';ctx.fillText(label,12,y-6);
        hand.forEach((c,i)=>{const up=!(hideHole&&i===1&&!this.holeUp);CU.drawCard(ctx,12+i*40,y,36,52,c.r,c.s,up);}); };
      row('DEALER',this.dealer,40,true); row('YOU',this.player,150,false);
      if(this.state==='player'||this.state==='done'){ctx.fillStyle='#50C878';ctx.font='600 12px system-ui';ctx.textAlign='left';ctx.fillText('Total: '+val(this.player),12,150+70);}
      if(this.state==='player'){ctx.fillStyle='rgba(255,215,0,0.12)';ctx.fillRect(0,this.height-46,this.width/2-2,46);ctx.fillRect(this.width/2+2,this.height-46,this.width/2,46);
        ctx.fillStyle='#FFD700';ctx.textAlign='center';ctx.font='700 14px system-ui';ctx.fillText('HIT',this.width/4,this.height-18);ctx.fillText('STAND',this.width*0.75,this.height-18);}
      else{ctx.fillStyle='#50C878';ctx.font='600 14px system-ui';ctx.textAlign='center';ctx.fillText(this.msg,cx,this.height-16);} }
    teardown(){ this.canvas.removeEventListener('pointerdown',this._tap); }
  }
  window.CasinoGames['Blackjack']=Blackjack;
})();
