// ============================================
// EMERALD KING CASINO - KENO JACKPOT
// Real Casino UI - Number Lottery Game
// Full Redesign v3.0.0
// File: js/games/keno-jackpot.js
// ============================================

class KenoJackpotFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedNumbers = [];
        this.maxSelections = 10;
        this.drawnNumbers = [];
        this.totalDraws = 20;
        this.matches = [];
        this.matchCount = 0;
        this.isDrawing = false;
        this.showResult = false;
        this.winnings = 0;
        this.gamePhase = 'select';
        this.currentDrawIndex = 0;
        
        // Keno board
        this.boardRows = 8;
        this.boardCols = 10;
        this.cellSize = 0;
        this.boardStartX = 0;
        this.boardStartY = 0;
        
        // Payout table
        this.payoutTable = {
            0: 0, 1: 0, 2: 0,
            3: 1, 4: 2, 5: 5, 6: 15,
            7: 50, 8: 200, 9: 1000, 10: 10000
        };
        
        // Animation
        this.drawAnimParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.revealAnimProgress = 0;
        
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
            bg: '#0a0806',
            boardBg: '#111122',
            cellDefault: '#1a1a3a',
            cellSelected: '#00e676',
            cellMatched: '#FFD700',
            cellDrawn: '#ff4444',
            cellHighlight: '#ff8800',
            gold: '#d4a843',
            goldLight: '#f0d078',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            felt: '#0d5e2e',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c'
        };
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
        this.calculateBoardDimensions();
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
        this.calculateBoardDimensions();
        this.drawFullBoard();
    }
    
    calculateBoardDimensions() {
        this.cellSize = Math.min((this.w - 50) / this.boardCols, (this.h - 260) / this.boardRows);
        const boardW = this.cellSize * this.boardCols;
        const boardH = this.cellSize * this.boardRows;
        this.boardStartX = (this.w - boardW) / 2;
        this.boardStartY = 72;
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
        this.selectedNumbers = [];
        this.drawnNumbers = [];
        this.matches = [];
        this.matchCount = 0;
        this.isDrawing = false;
        this.showResult = false;
        this.winnings = 0;
        this.gamePhase = 'select';
        this.currentDrawIndex = 0;
        this.drawAnimParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    toggleNumber(num) {
        if (this.gamePhase !== 'select' || this.isDrawing) return;
        if (num < 1 || num > 80) return;
        
        const index = this.selectedNumbers.indexOf(num);
        if (index >= 0) {
            this.selectedNumbers.splice(index, 1);
        } else if (this.selectedNumbers.length < this.maxSelections) {
            this.selectedNumbers.push(num);
            this.selectedNumbers.sort(function(a, b) { return a - b; });
        }
        
        this.drawFullBoard();
    }
    
    quickPick() {
        if (this.gamePhase !== 'select' || this.isDrawing) return;
        
        this.selectedNumbers = [];
        const available = [];
        for (let i = 1; i <= 80; i++) available.push(i);
        
        for (let i = 0; i < this.maxSelections; i++) {
            const idx = Math.floor(Math.random() * available.length);
            this.selectedNumbers.push(available.splice(idx, 1)[0]);
        }
        this.selectedNumbers.sort(function(a, b) { return a - b; });
        
        this.drawFullBoard();
    }
    
    clearAll() {
        if (this.gamePhase !== 'select' || this.isDrawing) return;
        this.selectedNumbers = [];
        this.drawFullBoard();
    }
    
    play(bet) {
        if (this.isDrawing) return;
        if (this.gamePhase === 'select' && this.selectedNumbers.length === 0) {
            const resultDisplay = document.getElementById('game-info-overlay');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;">Select at least 1 number!</div>';
            }
            return;
        }
        
        if (this.gamePhase === 'select') {
            this.startDraw(bet);
        } else if (this.gamePhase === 'result') {
            this.resetGame();
            this.drawFullBoard();
        }
    }
    
    startDraw(bet) {
        this.bet = bet || this.bet;
        this.isDrawing = true;
        this.showResult = false;
        this.drawnNumbers = [];
        this.matches = [];
        this.matchCount = 0;
        this.winnings = 0;
        this.gamePhase = 'drawing';
        this.currentDrawIndex = 0;
        
        // Generate drawn numbers
        const available = [];
        for (let i = 1; i <= 80; i++) available.push(i);
        
        for (let i = 0; i < this.totalDraws; i++) {
            const idx = Math.floor(Math.random() * available.length);
            this.drawnNumbers.push(available.splice(idx, 1)[0]);
        }
        this.drawnNumbers.sort(function(a, b) { return a - b; });
        
        // Find matches
        this.selectedNumbers.forEach(function(num) {
            if (this.drawnNumbers.indexOf(num) >= 0) {
                this.matches.push(num);
            }
        }.bind(this));
        this.matchCount = this.matches.length;
        
        // Calculate payout
        const basePayout = this.payoutTable[this.matchCount] || 0;
        this.winnings = Math.floor(this.bet * basePayout);
        
        if (this.winnings > 0) this.chips += this.winnings;
        
        this.animateDraw();
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Drawing numbers...</div>';
        }
    }
    
    animateDraw() {
        const self = this;
        const drawInterval = setInterval(function() {
            if (self.currentDrawIndex >= self.totalDraws) {
                clearInterval(drawInterval);
                self.isDrawing = false;
                self.showResult = true;
                self.gamePhase = 'result';
                self.showFinalResult();
                self.drawFullBoard();
                return;
            }
            
            self.currentDrawIndex++;
            
            // Spawn particle
            const drawnNum = self.drawnNumbers[self.currentDrawIndex - 1];
            const row = Math.floor((drawnNum - 1) / self.boardCols);
            const col = (drawnNum - 1) % self.boardCols;
            const cx = self.boardStartX + col * self.cellSize + self.cellSize / 2;
            const cy = self.boardStartY + row * self.cellSize + self.cellSize / 2;
            
            for (let i = 0; i < 4; i++) {
                self.drawAnimParticles.push({
                    x: cx, y: cy,
                    size: 1 + Math.random() * 2.5,
                    opacity: 1,
                    life: 0, maxLife: 18 + Math.random() * 25,
                    color: '#FFD700'
                });
            }
            
            self.drawFullBoard();
        }, 120);
    }
    
    showFinalResult() {
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.matchCount >= 6) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 120);
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:16px;">JACKPOT! ' + this.matchCount + '/10 +RS ' + this.winnings + '</div>';
            }
        } else if (this.matchCount >= 3) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! ' + this.matchCount + '/10 +RS ' + this.winnings + '</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">No win ' + this.matchCount + '/10 -RS ' + this.bet + '</div>';
            }
        }
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8,
                y: -20 - Math.random() * 100,
                w: 4 + Math.random() * 8, h: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2, opacity: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        this.drawAnimParticles.forEach(function(p) {
            p.life++; p.opacity -= 0.03;
        });
        this.drawAnimParticles = this.drawAnimParticles.filter(function(p) { return p.opacity > 0 && p.life < p.maxLife; });
        
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
        this.drawTitle(ctx, w, h);
        this.drawBoard(ctx);
        this.drawDrawParticles(ctx);
        this.drawSelectedDisplay(ctx, w, h);
        this.drawMatchCounter(ctx, w, h);
        this.drawPayoutTable(ctx, w, h);
        this.drawActionButtons(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.render();
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410'); bgGrad.addColorStop(0.5, '#0f0b08'); bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)'; ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.3, 24, w * 0.4, 30, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('KENO JACKPOT', w / 2, 39);
    }
    
    drawBoard(ctx) {
        const cs = this.cellSize;
        const sx = this.boardStartX;
        const sy = this.boardStartY;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.15)'; ctx.lineWidth = 1.5;
        this.roundRect(ctx, sx - 5, sy - 5, cs * this.boardCols + 10, cs * this.boardRows + 10, 8);
        ctx.fill(); ctx.stroke();
        
        for (let row = 0; row < this.boardRows; row++) {
            for (let col = 0; col < this.boardCols; col++) {
                const num = row * this.boardCols + col + 1;
                const cx = sx + col * cs, cy = sy + row * cs;
                this.drawCell(ctx, cx, cy, cs, num);
            }
        }
    }
    
    drawCell(ctx, x, y, size, num) {
        const padding = 2;
        const isSelected = this.selectedNumbers.indexOf(num) >= 0;
        const isDrawn = this.drawnNumbers.indexOf(num) >= 0;
        const isMatch = this.matches.indexOf(num) >= 0;
        const isCurrentlyDrawing = this.isDrawing && 
            this.drawnNumbers.slice(0, this.currentDrawIndex).indexOf(num) >= 0;
        
        let fillColor = this.palette.cellDefault;
        let borderColor = 'rgba(255,255,255,0.08)';
        let textColor = 'rgba(255,255,255,0.5)';
        let glowColor = null;
        
        if (isMatch) {
            fillColor = 'rgba(255,215,0,0.3)'; borderColor = '#FFD700'; textColor = '#FFD700'; glowColor = '#FFD700';
        } else if (isCurrentlyDrawing) {
            fillColor = 'rgba(255,68,68,0.2)'; borderColor = '#ff4444'; textColor = '#ff4444';
        } else if (isDrawn) {
            fillColor = 'rgba(255,68,68,0.1)'; borderColor = 'rgba(255,68,68,0.3)'; textColor = 'rgba(255,68,68,0.6)';
        } else if (isSelected) {
            fillColor = 'rgba(0,230,118,0.2)'; borderColor = '#00e676'; textColor = '#00e676'; glowColor = '#00e676';
        }
        
        if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 5; }
        
        ctx.fillStyle = fillColor; ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected || isMatch ? 1.5 : 0.5;
        this.roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, 3);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold ' + Math.floor(size * 0.32) + 'px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(num, x + size / 2, y + size / 2);
    }
    
    drawDrawParticles(ctx) {
        this.drawAnimParticles.forEach(function(p) {
            ctx.fillStyle = 'rgba(255,215,0,' + p.opacity + ')';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
    }
    
    drawSelectedDisplay(ctx, w, h) {
        const sy = this.boardStartY + this.cellSize * this.boardRows + 12;
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.roundRect(ctx, 18, sy, w - 36, 26, 8); ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('YOUR PICKS (' + this.selectedNumbers.length + '/' + this.maxSelections + ')', w / 2, sy + 10);
        
        if (this.selectedNumbers.length > 0) {
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 9px Georgia';
            ctx.fillText(this.selectedNumbers.join(', '), w / 2, sy + 22);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '8px Georgia';
            ctx.fillText('Click numbers on the board', w / 2, sy + 22);
        }
    }
    
    drawMatchCounter(ctx, w, h) {
        if (!this.showResult) return;
        
        const my = this.boardStartY + this.cellSize * this.boardRows + 45;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = this.matchCount >= 3 ? '#00e676' : '#ff4444'; ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 45, my, 90, 30, 12); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('MATCHES', w / 2, my + 10);
        
        ctx.fillStyle = this.matchCount >= 3 ? '#00e676' : '#ff4444';
        ctx.font = 'bold 14px Georgia';
        ctx.fillText(this.matchCount + '/10', w / 2, my + 24);
    }
    
    drawPayoutTable(ctx, w, h) {
        const py = h - 110;
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.roundRect(ctx, 14, py, w - 28, 38, 8); ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('PAYOUT TABLE (x bet)', w / 2, py + 10);
        
        const showMatches = [3, 4, 5, 6, 7, 8, 9, 10];
        const colW = (w - 36) / showMatches.length;
        
        showMatches.forEach(function(m, i) {
            const px = 16 + i * colW;
            const highlight = this.matchCount === m;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
            ctx.fillText(m, px + colW / 2, py + 22);
            ctx.fillText(this.payoutTable[m] + 'x', px + colW / 2, py + 33);
        }.bind(this));
    }
    
    drawActionButtons(ctx, w, h) {
        const by = h - 58;
        const btnW = (w - 50) / 3, btnH = 30, gap = 6;
        
        // Quick Pick
        ctx.fillStyle = 'rgba(0,176,255,0.15)'; ctx.strokeStyle = '#00b0ff'; ctx.lineWidth = 1.5;
        this.roundRect(ctx, 18, by, btnW, btnH, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#00b0ff'; ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('QUICK', 18 + btnW / 2, by + btnH / 2);
        
        // Clear
        ctx.fillStyle = 'rgba(255,68,68,0.15)'; ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1.5;
        this.roundRect(ctx, 24 + btnW * 1 + gap, by, btnW, btnH, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('CLEAR', 24 + btnW * 1 + gap + btnW / 2, by + btnH / 2);
        
        // Play
        const playLabel = this.gamePhase === 'result' ? 'NEW' : 'PLAY';
        ctx.fillStyle = 'rgba(0,230,118,0.2)'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        this.roundRect(ctx, 30 + btnW * 2 + gap * 2, by, btnW, btnH, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#00e676'; ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(playLabel, 30 + btnW * 2 + gap * 2 + btnW / 2, by + btnH / 2);
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
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
        // Check action buttons
        const by = this.h - 58;
        const btnW = (this.w - 50) / 3, btnH = 30, gap = 6;
        
        if (clickY >= by && clickY <= by + btnH) {
            if (clickX >= 18 && clickX <= 18 + btnW) { this.quickPick(); return; }
            if (clickX >= 24 + btnW + gap && clickX <= 24 + btnW * 2 + gap) { this.clearAll(); return; }
            if (clickX >= 30 + btnW * 2 + gap * 2 && clickX <= 30 + btnW * 3 + gap * 2) {
                this.play(this.bet); return;
            }
        }
        
        // Check board cells
        const col = Math.floor((clickX - this.boardStartX) / this.cellSize);
        const row = Math.floor((clickY - this.boardStartY) / this.cellSize);
        
        if (row >= 0 && row < this.boardRows && col >= 0 && col < this.boardCols) {
            const num = row * this.boardCols + col + 1;
            this.toggleNumber(num);
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullBoard(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = []; this.confettiParticles = [];
        this.drawAnimParticles = []; this.selectedNumbers = []; this.drawnNumbers = [];
    }
}

// Export
window.KenoJackpotFullGame = KenoJackpotFullGame;
console.log('Keno Jackpot v3.0.0 - Real Casino Design Loaded');
