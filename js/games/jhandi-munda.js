// ============================================
// EMERALD KING CASINO - JHANDI MUNDA
// Real Casino UI - Traditional 6-Dice Game
// Full Redesign v3.0.0
// File: js/games/jhandi-munda.js
// ============================================

class JhandiMundaFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedSymbol = 'spade';
        this.diceResults = [];
        this.isRolling = false;
        this.showResult = false;
        this.matchCount = 0;
        this.winnings = 0;
        
        // Symbols
        this.symbols = {
            spade: { name: 'SPADE', icon: 'S', color: '#ffffff', payout: 2 },
            heart: { name: 'HEART', icon: 'H', color: '#ff4444', payout: 2 },
            diamond: { name: 'DIAMOND', icon: 'D', color: '#ff4444', payout: 2 },
            club: { name: 'CLUB', icon: 'C', color: '#ffffff', payout: 2 },
            crown: { name: 'CROWN', icon: 'K', color: '#FFD700', payout: 3 },
            star: { name: 'STAR', icon: '*', color: '#FFD700', payout: 3 }
        };
        this.symbolKeys = Object.keys(this.symbols);
        
        // Dice animation
        this.diceAnims = [
            { symbol: 'spade', rotation: 0, scale: 1 },
            { symbol: 'heart', rotation: 0, scale: 1 },
            { symbol: 'diamond', rotation: 0, scale: 1 },
            { symbol: 'club', rotation: 0, scale: 1 },
            { symbol: 'crown', rotation: 0, scale: 1 },
            { symbol: 'star', rotation: 0, scale: 1 }
        ];
        this.rollStartTime = 0;
        this.rollDuration = 2500;
        
        // Animation
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors
        this.palette = {
            felt: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            goldLight: '#f0d078',
            diceWhite: '#f5f5f0',
            diceBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#cc0000'
        };
        
        this.diceSize = 48;
    }
    
    // ============================================
    // INIT
    // ============================================
    
    init() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.diceSize = Math.min((this.w - 60) / 3.5, 48);
        this.generateSparkles();
        this.resetGame();
        this.drawFullBoard();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.diceSize = Math.min((this.w - 60) / 3.5, 48);
        this.drawFullBoard();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.0 + 0.2,
                speed: Math.random() * 0.012 + 0.003,
                opacity: Math.random() * 0.25 + 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    resetGame() {
        this.diceResults = [];
        this.isRolling = false;
        this.showResult = false;
        this.matchCount = 0;
        this.winnings = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.diceAnims = [
            { symbol: 'spade', rotation: 0, scale: 1 },
            { symbol: 'heart', rotation: 0, scale: 1 },
            { symbol: 'diamond', rotation: 0, scale: 1 },
            { symbol: 'club', rotation: 0, scale: 1 },
            { symbol: 'crown', rotation: 0, scale: 1 },
            { symbol: 'star', rotation: 0, scale: 1 }
        ];
        this.diceParticles = [];
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
        
        this.bet = bet || this.bet;
        this.isRolling = true;
        this.showResult = false;
        this.diceResults = [];
        this.matchCount = 0;
        this.winnings = 0;
        this.confettiParticles = [];
        
        // Roll 6 dice
        for (let i = 0; i < 6; i++) {
            this.diceResults.push(this.symbolKeys[Math.floor(Math.random() * this.symbolKeys.length)]);
        }
        
        // Count matches
        this.matchCount = this.diceResults.filter(function(s) { return s === this.selectedSymbol; }.bind(this)).length;
        
        this.rollStartTime = performance.now();
        this.animateRoll();
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Rolling...</div>';
        }
    }
    
    animateRoll() {
        const self = this;
        const rollInterval = setInterval(function() {
            self.diceAnims.forEach(function(d) {
                d.symbol = self.symbolKeys[Math.floor(Math.random() * self.symbolKeys.length)];
                d.rotation = (Math.random() - 0.5) * 0.5;
                d.scale = 0.9 + Math.random() * 0.2;
            });
            
            if (Math.random() > 0.4) {
                self.diceParticles.push({
                    x: self.w / 2 + (Math.random() - 0.5) * 140,
                    y: self.h * 0.3 + (Math.random() - 0.5) * 70,
                    size: 1 + Math.random() * 2,
                    opacity: 0.6,
                    life: 0,
                    maxLife: 15 + Math.random() * 20
                });
            }
            
            self.drawFullBoard();
            
            const elapsed = performance.now() - self.rollStartTime;
            if (elapsed >= self.rollDuration) {
                clearInterval(rollInterval);
                self.isRolling = false;
                self.showResult = true;
                
                self.diceAnims.forEach(function(d, i) {
                    d.symbol = self.diceResults[i];
                    d.rotation = 0;
                    d.scale = 1;
                });
                
                self.resolveGame();
                self.drawFullBoard();
            }
        }, 70);
    }
    
    resolveGame() {
        const symbolData = this.symbols[this.selectedSymbol];
        
        if (this.matchCount >= 1) {
            this.winnings = Math.floor(this.bet * symbolData.payout * this.matchCount);
            this.chips += this.winnings;
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h * 0.3, 50 + this.matchCount * 20);
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            if (this.matchCount >= 1) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + this.matchCount + 'x ' + symbolData.name + ' +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">No Match -RS ' + this.bet + '</div>';
            }
        }
        
        this.drawFullBoard();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullBoard();
        }, 5000);
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8,
                y: -20 - Math.random() * 100,
                w: 4 + Math.random() * 8,
                h: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: 1 + Math.random() * 3,
                vx: (Math.random() - 0.5) * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        this.diceParticles.forEach(function(p) {
            p.life++; p.opacity -= 0.04;
        });
        this.diceParticles = this.diceParticles.filter(function(p) { return p.opacity > 0 && p.life < p.maxLife; });
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy; p.x += p.vx; p.vy += 0.03; p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        }.bind(this));
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.showResult) this.winGlowAlpha -= 0.01;
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.update();
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    drawFullBoard() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTableBorder(ctx, w, h);
        this.drawTableFelt(ctx, w, h);
        this.drawTitle(ctx, w, h);
        this.drawDiceArea(ctx, w, h);
        this.drawMatchCounter(ctx, w, h);
        this.drawSymbolSelector(ctx, w, h);
        this.drawOddsDisplay(ctx, w, h);
        this.drawDiceParticles(ctx);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) this.drawWinGlow(ctx, w, h);
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.render();
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410'); bgGrad.addColorStop(0.5, '#0f0b08'); bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        const m = 12, tw = w - m * 2, th = h - m * 2;
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder; ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16); ctx.fill();
        ctx.strokeStyle = this.palette.gold; ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 12); ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad; this.roundRect(ctx, fx, fy, fw, fh, 10); ctx.fill();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)'; ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.25, 28, w * 0.5, 30, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('JHANDI MUNDA', w / 2, 43);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 66, areaH = 120;
        
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeStyle = 'rgba(0,230,118,0.2)'; ctx.lineWidth = 1.5;
        this.roundRect(ctx, 22, areaY, w - 44, areaH, 14); ctx.fill(); ctx.stroke();
        
        const ds = this.diceSize, gap = 10;
        const gridW = ds * 3 + gap * 2, gridH = ds * 2 + gap;
        const startX = (w - gridW) / 2, startY = areaY + (areaH - gridH) / 2;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const dx = startX + col * (ds + gap);
                const dy = startY + row * (ds + gap);
                this.drawSingleDice(ctx, dx, dy, ds, index);
            }
        }
    }
    
    drawSingleDice(ctx, x, y, size, index) {
        const anim = this.diceAnims[index];
        if (!anim) return;
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(anim.rotation); ctx.scale(anim.scale, anim.scale);
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        
        const diceGrad = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        diceGrad.addColorStop(0, '#ffffff'); diceGrad.addColorStop(0.5, '#f0f0f0'); diceGrad.addColorStop(1, '#d8d8d8');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = this.palette.diceBorder; ctx.lineWidth = 1.5;
        this.roundRect(ctx, -size / 2, -size / 2, size, size, 8); ctx.fill(); ctx.stroke();
        
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        
        const symbolData = this.symbols[anim.symbol];
        if (symbolData) {
            ctx.fillStyle = symbolData.color;
            ctx.font = 'bold ' + Math.floor(size * 0.45) + 'px Georgia';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(symbolData.icon, 0, 0);
        }
        
        ctx.restore();
    }
    
    drawMatchCounter(ctx, w, h) {
        if (!this.showResult) return;
        
        const my = 196;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = this.matchCount > 0 ? '#00e676' : '#ff4444'; ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 40, my, 80, 26, 13); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.matchCount > 0 ? '#00e676' : '#ff4444';
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.matchCount + ' MATCH' + (this.matchCount !== 1 ? 'ES' : ''), w / 2, my + 13);
    }
    
    drawSymbolSelector(ctx, w, h) {
        const sy = h - 168;
        const btnSize = 50, gap = 5;
        const totalW = btnSize * 6 + gap * 5;
        const startX = (w - totalW) / 2;
        
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('SELECT SYMBOL', w / 2, sy - 6);
        
        this.symbolKeys.forEach(function(key, i) {
            const sx = startX + i * (btnSize + gap);
            const sym = this.symbols[key];
            const isSelected = this.selectedSymbol === key;
            
            ctx.fillStyle = isSelected ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? this.palette.gold : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, sx, sy, btnSize, btnSize, 8); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = sym.color;
            ctx.font = 'bold ' + Math.floor(btnSize * 0.45) + 'px Georgia';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(sym.icon, sx + btnSize / 2, sy + btnSize / 2 - 6);
            
            ctx.fillStyle = isSelected ? this.palette.gold : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 7px Georgia';
            ctx.fillText(sym.name, sx + btnSize / 2, sy + btnSize / 2 + 16);
            
            if (isSelected) {
                ctx.fillStyle = this.palette.gold;
                ctx.beginPath();
                ctx.moveTo(sx + btnSize / 2, sy - 4);
                ctx.lineTo(sx + btnSize / 2 - 5, sy - 10);
                ctx.lineTo(sx + btnSize / 2 + 5, sy - 10);
                ctx.closePath(); ctx.fill();
            }
        }.bind(this));
    }
    
    drawOddsDisplay(ctx, w, h) {
        const oy = h - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.roundRect(ctx, w * 0.12, oy, w * 0.76, 26, 12); ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const sym = this.symbols[this.selectedSymbol];
        ctx.fillText('1 Match: ' + sym.payout + 'x | 2: ' + (sym.payout * 2) + 'x | 3: ' + (sym.payout * 3) + 'x | 4: ' + (sym.payout * 4) + 'x | 5: ' + (sym.payout * 5) + 'x | 6: ' + (sym.payout * 6) + 'x', w / 2, oy + 13);
    }
    
    drawDiceParticles(ctx) {
        this.diceParticles.forEach(function(p) {
            ctx.fillStyle = 'rgba(212,168,67,' + p.opacity + ')';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const glowGrad = ctx.createRadialGradient(w / 2, 126, 30, w / 2, 126, 180);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(w / 2, 126, 180, 0, Math.PI * 2); ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sp.opacity + ')';
            ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    
    // ============================================
    // UTILS
    // ============================================
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
    
    // ============================================
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isRolling) return;
        
        const sy = this.h - 168;
        const btnSize = 50, gap = 5;
        const totalW = btnSize * 6 + gap * 5;
        const startX = (this.w - totalW) / 2;
        
        for (let i = 0; i < this.symbolKeys.length; i++) {
            const sx = startX + i * (btnSize + gap);
            if (clickX >= sx && clickX <= sx + btnSize && clickY >= sy && clickY <= sy + btnSize) {
                this.selectSymbol(this.symbolKeys[i]);
                return;
            }
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullBoard(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = []; this.confettiParticles = []; this.diceParticles = [];
        this.diceAnims = [];
    }
}

// Export
window.JhandiMundaFullGame = JhandiMundaFullGame;
console.log('Jhandi Munda v3.0.0 - Real Casino Design Loaded');
