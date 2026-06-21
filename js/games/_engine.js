// ============================================
// EMERALD KING CASINO - GAME BASE CLASS
// File: js/games/_engine.js
// Version: 1.0.1 - Fixed (no duplicate classes)
// ============================================

/**
 * Base Game Class - Extended by specific game implementations
 * Uses classes from matrix.js (NeonGlowContext, WinParticleCascade, etc.)
 */
class CasinoGame {
    constructor(canvas, ctx, gameId) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameId = gameId;
        this.bet = 50;
        this.isPlaying = false;
        this.result = null;
        this.winCascade = new WinParticleCascade(ctx);
        this.animations = [];
        this.frameCount = 0;
        this.width = canvas.width / 2;
        this.height = canvas.height / 2;
        this.colors = {
            background: '#011713',
            surface: 'rgba(3, 56, 38, 0.5)',
            border: 'rgba(0, 230, 118, 0.3)',
            neon: '#00e676',
            gold: '#FFD700',
            blue: '#00b0ff',
            red: '#ff4444',
            white: '#ffffff',
            textDim: 'rgba(255, 255, 255, 0.5)'
        };
    }

    init() { this.clearCanvas(); this.drawBackground(); this.drawGameTitle(); }

    setBet(amount) { this.bet = amount; }

    play(bet) { console.log('⚠️ Base play() - override in game class'); }

    update(timestamp) {
        this.frameCount++;
        if (this.winCascade.isAlive()) this.winCascade.update();
        this.animations = this.animations.filter(anim => {
            anim.progress += anim.speed;
            if (anim.progress >= 1) { if (anim.onComplete) anim.onComplete(); return false; }
            return true;
        });
    }

    render() {
        if (!this.ctx) return;
        this.clearCanvas(); this.drawBackground();
        if (this.winCascade.isAlive()) this.winCascade.render();
    }

    clearCanvas() { this.ctx.fillStyle = this.colors.background; this.ctx.fillRect(0, 0, this.width, this.height); }

    drawBackground() {
        const ctx = this.ctx; const w = this.width; const h = this.height; const m = 10;
        ctx.fillStyle = this.colors.surface; ctx.strokeStyle = this.colors.border; ctx.lineWidth = 2;
        ctx.beginPath(); this.roundRect(m, m, w-m*2, h-m*2, 12); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,230,118,0.05)'; ctx.lineWidth = 1;
        for (let x=m; x<w-m; x+=40) { ctx.beginPath(); ctx.moveTo(x,m); ctx.lineTo(x,h-m); ctx.stroke(); }
        for (let y=m; y<h-m; y+=40) { ctx.beginPath(); ctx.moveTo(m,y); ctx.lineTo(w-m,y); ctx.stroke(); }
    }

    drawGameTitle() {
        const g = window.GameMatrix?.GAME_CLASS_MAP ? null : null;
        const t = this.gameId || 'Game'; const e = '🎮';
        const ctx = this.ctx; const w = this.width; const h = this.height;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(20, h-45, w-40, 35);
        ctx.fillStyle = '#00e676'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(e + ' ' + t, w/2, h-20);
    }

    showWin(amount) {
        const rd = document.getElementById('game-result-display');
        if (rd) rd.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${amount}</span>`;
        this.winCascade.spawn(this.width/2, this.height/2, 80);
    }

    showLose(amount) {
        const rd = document.getElementById('game-result-display');
        if (rd) rd.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${amount}</span>`;
    }

    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
        ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
        ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    }

    resize() { this.width = this.canvas.width/2; this.height = this.canvas.height/2; }

    destroy() { this.winCascade.destroy(); this.animations = []; this.isPlaying = false; }
}

window.CasinoGame = CasinoGame;
console.log('🎨 Game Base Class v1.0.1 Loaded (No Duplicates)');
