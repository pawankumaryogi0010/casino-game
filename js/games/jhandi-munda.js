// ============================================
// EMERALD KING CASINO - GAME 7: JHANDI MUNDA
// Full Real Casino Visual Design
// 6-Sided Dice with Traditional Symbols
// File: js/games/jhandi-munda.js
// ============================================

class JhandiMundaFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedSymbol = 'spade'; // spade, heart, diamond, club, crown, star
        this.diceResults = [];
        this.isRolling = false;
        this.showResult = false;
        this.matchCount = 0;
        
        // Dice animation
        this.diceAnimations = [];
        this.rollStartTime = 0;
        this.rollDuration = 2500;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Symbols
        this.symbols = {
            spade: { name: 'SPADE', icon: '♠', color: '#ffffff', payout: 2 },
            heart: { name: 'HEART', icon: '♥', color: '#ff4444', payout: 2 },
            diamond: { name: 'DIAMOND', icon: '♦', color: '#ff4444', payout: 2 },
            club: { name: 'CLUB', icon: '♣', color: '#ffffff', payout: 2 },
            crown: { name: 'CROWN', icon: '👑', color: '#FFD700', payout: 3 },
            star: { name: 'STAR', icon: '⭐', color: '#FFD700', payout: 3 }
        };
        
        this.symbolKeys = Object.keys(this.symbols);
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.resetGame();
        this.drawFullBoard();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    resetGame() {
        this.diceResults = [];
        this.isRolling = false;
        this.showResult = false;
        this.matchCount = 0;
        this.diceAnimations = [
            { symbol: 'spade', rotation: 0, scale: 1 },
            { symbol: 'heart', rotation: 0, scale: 1 },
            { symbol: 'diamond', rotation: 0, scale: 1 },
            { symbol: 'club', rotation: 0, scale: 1 },
            { symbol: 'crown', rotation: 0, scale: 1 },
            { symbol: 'star', rotation: 0, scale: 1 }
        ];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    selectSymbol(symbol) {
        if (this.isRolling) return;
        this.selectedSymbol = symbol;
        this.drawFullBoard();
    }
    
    play(bet) {
        if (this.isRolling) return;
        
        this.bet = bet;
        this.isRolling = true;
        this.showResult = false;
        this.diceResults = [];
        this.matchCount = 0;
        
        // Roll 6 dice
        for (let i = 0; i < 6; i++) {
            this.diceResults.push(this.symbolKeys[Math.floor(Math.random() * this.symbolKeys.length)]);
        }
        
        // Count matches
        this.matchCount = this.diceResults.filter(s => s === this.selectedSymbol).length;
        
        // Animate
        this.rollStartTime = performance.now();
        this.animateRoll();
        
        // Clear result
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎲 Rolling...</span>';
        }
    }
    
    animateRoll() {
        const rollInterval = setInterval(() => {
            // Randomize dice during animation
            this.diceAnimations.forEach(d => {
                d.symbol = this.symbolKeys[Math.floor(Math.random() * this.symbolKeys.length)];
                d.rotation = (Math.random() - 0.5) * 0.5;
                d.scale = 0.9 + Math.random() * 0.2;
            });
            
            this.drawFullBoard();
            
            const elapsed = performance.now() - this.rollStartTime;
            if (elapsed >= this.rollDuration) {
                clearInterval(rollInterval);
                this.isRolling = false;
                this.showResult = true;
                
                // Set final dice
                this.diceAnimations.forEach((d, i) => {
                    d.symbol = this.diceResults[i];
                    d.rotation = 0;
                    d.scale = 1;
                });
                
                this.resolveGame();
                this.drawFullBoard();
            }
        }, 80);
    }
    
    resolveGame() {
        const symbolData = this.symbols[this.selectedSymbol];
        const resultDisplay = document.getElementById('game-result-display');
        
        let payout = 0;
        let message = '';
        
        if (this.matchCount >= 1) {
            payout = Math.floor(this.bet * symbolData.payout * this.matchCount);
            this.chips += payout;
            message = `<span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                       <span style="color:#00e676;">+${payout} CHIPS</span><br>
                       <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.matchCount}x ${symbolData.name} matched</span>`;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 50 + this.matchCount * 20);
        } else {
            message = `<span style="color:#ff4444;font-size:16px;">😞 NO MATCH</span><br>
                       <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>`;
        }
        
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out;">${message}</div>`;
        }
        
        setTimeout(() => { this.showResult = false; this.resetGame(); }, 4000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING - FULL BOARD
    // ============================================
    
    drawFullBoard() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Table border
        this.drawTableBorder(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Dice area
        this.drawDiceArea(ctx, w, h);
        
        // Symbol selector
        this.drawSymbolSelector(ctx, w, h);
        
        // Odds display
        this.drawOddsDisplay(ctx, w, h);
        
        // Sparkles
        this.drawSparkles(ctx);
        
        // Win particles
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w);
        bgGrad.addColorStop(0, '#033826');
        bgGrad.addColorStop(0.5, '#02231c');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 16, 16, w - 32, h - 32, 14);
        ctx.stroke();
        
        // Inner decorative border
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, 22, 22, w - 44, h - 44, 11);
        ctx.stroke();
    }
    
    drawTitle(ctx, w, h) {
        // Title banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎲 JHANDI MUNDA', w / 2, 41);
        
        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px Arial';
        ctx.fillText('6 Dice Game', w / 2, 58);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 70;
        const areaW = w - 50;
        const areaX = 25;
        const areaH = 130;
        
        // Dice zone background
        const diceBgGrad = ctx.createLinearGradient(0, areaY, 0, areaY + areaH);
        diceBgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        diceBgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = diceBgGrad;
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, areaH, 15);
        ctx.fill();
        ctx.stroke();
        
        // Dice grid (2 rows x 3 columns)
        const diceSize = 50;
        const gap = 12;
        const gridW = diceSize * 3 + gap * 2;
        const gridH = diceSize * 2 + gap;
        const startX = (w - gridW) / 2;
        const startY = areaY + (areaH - gridH) / 2;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const dx = startX + col * (diceSize + gap);
                const dy = startY + row * (diceSize + gap);
                
                this.drawSingleDice(ctx, dx, dy, diceSize, index);
            }
        }
        
        // Match counter
        if (this.showResult) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            CardRenderer.roundRect(ctx, w / 2 - 40, areaY + areaH + 5, 80, 24, 12);
            ctx.fill();
            
            ctx.fillStyle = this.matchCount > 0 ? '#00e676' : '#ff4444';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.matchCount} MATCH${this.matchCount !== 1 ? 'ES' : ''}`, w / 2, areaY + areaH + 17);
        }
    }
    
    drawSingleDice(ctx, x, y, size, index) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        
        const anim = this.diceAnimations[index];
        if (anim) {
            ctx.rotate(anim.rotation);
            ctx.scale(anim.scale, anim.scale);
        }
        
        // Dice shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Dice body
        const diceGrad = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        diceGrad.addColorStop(0, '#f5f5f5');
        diceGrad.addColorStop(0.5, '#e8e8e8');
        diceGrad.addColorStop(1, '#cccccc');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, -size / 2, -size / 2, size, size, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Symbol on dice
        const symbolData = this.symbols[anim?.symbol || 'spade'];
        ctx.fillStyle = symbolData.color;
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbolData.icon, 0, 0);
        
        // Inner border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, 6);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawSymbolSelector(ctx, w, h) {
        const selectorY = h - 195;
        const btnSize = 52;
        const gap = 6;
        const totalW = btnSize * 6 + gap * 5;
        const startX = (w - totalW) / 2;
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT YOUR SYMBOL', w / 2, selectorY - 8);
        
        this.symbolKeys.forEach((key, i) => {
            const sx = startX + i * (btnSize + gap);
            const sy = selectorY;
            const sym = this.symbols[key];
            const isSelected = this.selectedSymbol === key;
            
            // Button background
            ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, sx, sy, btnSize, btnSize, 10);
            ctx.fill();
            ctx.stroke();
            
            // Symbol
            ctx.fillStyle = sym.color;
            ctx.font = `${btnSize * 0.45}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sym.icon, sx + btnSize / 2, sy + btnSize / 2 - 6);
            
            // Name
            ctx.fillStyle = isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(sym.name, sx + btnSize / 2, sy + btnSize / 2 + 18);
            
            // Selection indicator
            if (isSelected) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(sx + btnSize / 2, sy - 6);
                ctx.lineTo(sx + btnSize / 2 - 6, sy - 14);
                ctx.lineTo(sx + btnSize / 2 + 6, sy - 14);
                ctx.closePath();
                ctx.fill();
            }
        });
    }
    
    drawOddsDisplay(ctx, w, h) {
        const oddsY = h - 48;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        CardRenderer.roundRect(ctx, w * 0.15, oddsY, w * 0.7, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const sym = this.symbols[this.selectedSymbol];
        ctx.fillText(`♠♥ 1 Match: ${sym.payout}x | 2: ${sym.payout * 2}x | 3: ${sym.payout * 3}x | 4: ${sym.payout * 4}x | 5: ${sym.payout * 5}x | 6: ${sym.payout * 6}x`, w / 2, oddsY + 15);
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.4, sparkle.opacity));
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle.opacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    render() {
        this.drawFullBoard();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.diceAnimations = [];
    }
}

// Export
window.JhandiMundaFullGame = JhandiMundaFullGame;
console.log('✅ Game 7: Jhandi Munda - Full Casino Design Loaded');
