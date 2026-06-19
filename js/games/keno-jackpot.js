// ============================================
// EMERALD KING CASINO - GAME 20: KENO JACKPOT
// Full Real Casino Visual Design
// Number Selection Lottery Game
// File: js/games/keno-jackpot.js
// ============================================

class KenoJackpotFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedNumbers = []; // Max 10 numbers
        this.maxSelections = 10;
        this.drawnNumbers = [];
        this.totalDraws = 20;
        this.matches = [];
        this.matchCount = 0;
        this.isDrawing = false;
        this.showResult = false;
        this.payout = 0;
        this.gamePhase = 'select'; // select, drawing, result
        this.drawProgress = 0;
        this.currentDrawIndex = 0;
        
        // Keno board (1-80 numbers)
        this.boardRows = 8;
        this.boardCols = 10;
        this.cellSize = 0;
        this.boardStartX = 0;
        this.boardStartY = 0;
        
        // Payout table (based on matches out of 10 picks)
        this.payoutTable = {
            0: 0,
            1: 0,
            2: 0,
            3: 1,
            4: 2,
            5: 5,
            6: 15,
            7: 50,
            8: 200,
            9: 1000,
            10: 10000
        };
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.drawAnimParticles = [];
        
        // Colors
        this.colors = {
            boardBg: '#1a1a2e',
            cellDefault: '#2a2a4a',
            cellSelected: '#00e676',
            cellMatched: '#FFD700',
            cellDrawn: '#ff4444',
            cellHighlight: '#ff8800',
            gold: '#FFD700'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateBoardDimensions();
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
    
    calculateBoardDimensions() {
        this.cellSize = Math.min((this.w - 50) / this.boardCols, (this.h - 260) / this.boardRows);
        const boardW = this.cellSize * this.boardCols;
        const boardH = this.cellSize * this.boardRows;
        this.boardStartX = (this.w - boardW) / 2;
        this.boardStartY = 70;
    }
    
    resetGame() {
        this.selectedNumbers = [];
        this.drawnNumbers = [];
        this.matches = [];
        this.matchCount = 0;
        this.isDrawing = false;
        this.showResult = false;
        this.payout = 0;
        this.gamePhase = 'select';
        this.drawProgress = 0;
        this.currentDrawIndex = 0;
        this.drawAnimParticles = [];
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
        } else {
            if (this.selectedNumbers.length < this.maxSelections) {
                this.selectedNumbers.push(num);
                this.selectedNumbers.sort((a, b) => a - b);
            }
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
        this.selectedNumbers.sort((a, b) => a - b);
        
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
            const resultDisplay = document.getElementById('game-result-display');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<span style="color:#FFD700;">Select at least 1 number!</span>';
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
        this.bet = bet;
        this.isDrawing = true;
        this.showResult = false;
        this.drawnNumbers = [];
        this.matches = [];
        this.matchCount = 0;
        this.payout = 0;
        this.gamePhase = 'drawing';
        this.currentDrawIndex = 0;
        
        // Generate drawn numbers
        const available = [];
        for (let i = 1; i <= 80; i++) available.push(i);
        
        for (let i = 0; i < this.totalDraws; i++) {
            const idx = Math.floor(Math.random() * available.length);
            this.drawnNumbers.push(available.splice(idx, 1)[0]);
        }
        this.drawnNumbers.sort((a, b) => a - b);
        
        // Find matches
        this.selectedNumbers.forEach(num => {
            if (this.drawnNumbers.includes(num)) {
                this.matches.push(num);
            }
        });
        this.matchCount = this.matches.length;
        
        // Calculate payout
        const basePayout = this.payoutTable[this.matchCount] || 0;
        this.payout = Math.floor(this.bet * basePayout);
        
        if (this.payout > 0) {
            this.chips += this.payout;
        }
        
        // Animate draw
        this.animateDraw();
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🔢 Drawing numbers...</span>';
        }
    }
    
    animateDraw() {
        const drawInterval = setInterval(() => {
            if (this.currentDrawIndex >= this.totalDraws) {
                clearInterval(drawInterval);
                this.isDrawing = false;
                this.showResult = true;
                this.gamePhase = 'result';
                this.showFinalResult();
                this.drawFullBoard();
                return;
            }
            
            this.currentDrawIndex++;
            
            // Spawn particle at drawn number position
            const drawnNum = this.drawnNumbers[this.currentDrawIndex - 1];
            const row = Math.floor((drawnNum - 1) / this.boardCols);
            const col = (drawnNum - 1) % this.boardCols;
            const cx = this.boardStartX + col * this.cellSize + this.cellSize / 2;
            const cy = this.boardStartY + row * this.cellSize + this.cellSize / 2;
            
            for (let i = 0; i < 5; i++) {
                this.drawAnimParticles.push({
                    x: cx,
                    y: cy,
                    size: 1 + Math.random() * 3,
                    opacity: 1,
                    life: 0,
                    maxLife: 20 + Math.random() * 30,
                    color: '#FFD700'
                });
            }
            
            this.drawFullBoard();
        }, 150);
    }
    
    showFinalResult() {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.matchCount >= 6) {
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 120);
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:20px;">🎉 JACKPOT!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.matchCount}/10 matches</span>
                    </div>`;
            }
        } else if (this.matchCount >= 3) {
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.matchCount}/10 matches</span>
                    </div>`;
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 NO WIN</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${this.matchCount}/10 matches</span>
                    </div>`;
            }
        }
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update draw particles
        this.drawAnimParticles.forEach(p => {
            p.life++;
            p.opacity -= 0.03;
        });
        this.drawAnimParticles = this.drawAnimParticles.filter(p => p.opacity > 0 && p.life < p.maxLife);
        
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
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Board
        this.drawBoard(ctx);
        
        // Draw particles
        this.drawAnimParticlesOnBoard(ctx);
        
        // Selected numbers display
        this.drawSelectedDisplay(ctx, w, h);
        
        // Match counter
        if (this.showResult) {
            this.drawMatchCounter(ctx, w, h);
        }
        
        // Payout table
        this.drawPayoutTable(ctx, w, h);
        
        // Action buttons
        this.drawActionButtons(ctx, w, h);
        
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
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 34, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 34, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔢 KENO JACKPOT', w / 2, 39);
    }
    
    drawBoard(ctx) {
        const cs = this.cellSize;
        const sx = this.boardStartX;
        const sy = this.boardStartY;
        
        // Board background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, sx - 5, sy - 5, cs * this.boardCols + 10, cs * this.boardRows + 10, 8);
        ctx.fill();
        ctx.stroke();
        
        // Cells
        for (let row = 0; row < this.boardRows; row++) {
            for (let col = 0; col < this.boardCols; col++) {
                const num = row * this.boardCols + col + 1;
                const cx = sx + col * cs;
                const cy = sy + row * cs;
                
                this.drawCell(ctx, cx, cy, cs, num);
            }
        }
    }
    
    drawCell(ctx, x, y, size, num) {
        const padding = 2;
        const isSelected = this.selectedNumbers.includes(num);
        const isDrawn = this.drawnNumbers.includes(num);
        const isMatch = this.matches.includes(num);
        const isCurrentlyDrawing = this.isDrawing && 
            this.drawnNumbers.slice(0, this.currentDrawIndex).includes(num);
        
        let fillColor = this.colors.cellDefault;
        let borderColor = 'rgba(255, 255, 255, 0.08)';
        let textColor = 'rgba(255, 255, 255, 0.5)';
        let glowColor = null;
        
        if (isMatch) {
            fillColor = 'rgba(255, 215, 0, 0.3)';
            borderColor = '#FFD700';
            textColor = '#FFD700';
            glowColor = '#FFD700';
        } else if (isCurrentlyDrawing) {
            fillColor = 'rgba(255, 68, 68, 0.2)';
            borderColor = '#ff4444';
            textColor = '#ff4444';
        } else if (isDrawn) {
            fillColor = 'rgba(255, 68, 68, 0.1)';
            borderColor = 'rgba(255, 68, 68, 0.3)';
            textColor = 'rgba(255, 68, 68, 0.6)';
        } else if (isSelected) {
            fillColor = 'rgba(0, 230, 118, 0.2)';
            borderColor = '#00e676';
            textColor = '#00e676';
            glowColor = '#00e676';
        }
        
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 6;
        }
        
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected || isMatch ? 1.5 : 0.5;
        CardRenderer.roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, 4);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.floor(size * 0.35)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num, x + size / 2, y + size / 2);
    }
    
    drawAnimParticlesOnBoard(ctx) {
        this.drawAnimParticles.forEach(p => {
            ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawSelectedDisplay(ctx, w, h) {
        const sy = this.boardStartY + this.cellSize * this.boardRows + 15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        CardRenderer.roundRect(ctx, 20, sy, w - 40, 30, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`YOUR PICKS (${this.selectedNumbers.length}/${this.maxSelections})`, w / 2, sy + 10);
        
        if (this.selectedNumbers.length > 0) {
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(this.selectedNumbers.join(', '), w / 2, sy + 24);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '9px Arial';
            ctx.fillText('Click numbers on the board', w / 2, sy + 24);
        }
    }
    
    drawMatchCounter(ctx, w, h) {
        const my = this.boardStartY + this.cellSize * this.boardRows + 50;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = this.matchCount >= 3 ? '#00e676' : '#ff4444';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 50, my, 100, 35, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MATCHES', w / 2, my + 10);
        
        ctx.fillStyle = this.matchCount >= 3 ? '#00e676' : '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${this.matchCount}/10`, w / 2, my + 28);
    }
    
    drawPayoutTable(ctx, w, h) {
        const py = h - 115;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        CardRenderer.roundRect(ctx, 15, py, w - 30, 45, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAYOUT TABLE (x bet)', w / 2, py + 10);
        
        const showMatches = [3, 4, 5, 6, 7, 8, 9, 10];
        const colW = (w - 40) / showMatches.length;
        
        showMatches.forEach((m, i) => {
            const px = 22 + i * colW;
            const highlight = this.matchCount === m;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${m}`, px + colW / 2, py + 22);
            ctx.fillText(`${this.payoutTable[m]}x`, px + colW / 2, py + 36);
        });
    }
    
    drawActionButtons(ctx, w, h) {
        const by = h - 55;
        const btnW = (w - 55) / 3;
        const btnH = 32;
        const gap = 8;
        
        // Quick Pick
        ctx.fillStyle = 'rgba(0, 176, 255, 0.15)';
        ctx.strokeStyle = '#00b0ff';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, 20, by, btnW, btnH, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎲 QUICK', 20 + btnW / 2, by + btnH / 2);
        
        // Clear
        ctx.fillStyle = 'rgba(255, 68, 68, 0.15)';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, 28 + btnW, by, btnW, btnH, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕ CLEAR', 28 + btnW + btnW / 2, by + btnH / 2);
        
        // Play
        const playLabel = this.gamePhase === 'result' ? 'NEW GAME' : 'PLAY';
        const playColor = '#00e676';
        ctx.fillStyle = `${playColor}25`;
        ctx.strokeStyle = playColor;
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 36 + btnW * 2, by, btnW, btnH, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = playColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`▶ ${playLabel}`, 36 + btnW * 2 + btnW / 2, by + btnH / 2);
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
    // UTILITIES
    // ============================================
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        return '255, 255, 255';
    }
    
    // Handle canvas click for number selection
    handleClick(clickX, clickY) {
        if (this.gamePhase !== 'select' || this.isDrawing) return;
        
        const col = Math.floor((clickX - this.boardStartX) / this.cellSize);
        const row = Math.floor((clickY - this.boardStartY) / this.cellSize);
        
        if (row >= 0 && row < this.boardRows && col >= 0 && col < this.boardCols) {
            const num = row * this.boardCols + col + 1;
            this.toggleNumber(num);
        }
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
        this.drawAnimParticles = [];
    }
}

// Export
window.KenoJackpotFullGame = KenoJackpotFullGame;
console.log('✅ Game 20: Keno Jackpot - Full Casino Design Loaded');
