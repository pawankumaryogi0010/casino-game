// ============================================
// EMERALD KING CASINO - GAME 13: MINES
// Full Real Casino Visual Design
// 5x5 Grid Mine Detection Game
// File: js/games/mines.js
// ============================================

class MinesFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.mineCount = 3;
        this.gridSize = 5;
        this.grid = []; // 2D array: 'hidden', 'revealed', 'mine'
        this.revealed = [];
        this.gameOver = false;
        this.gameWon = false;
        this.isPlaying = false;
        this.revealCount = 0;
        this.currentMultiplier = 1.0;
        
        // Grid dimensions
        this.cellSize = 0;
        this.gridStartX = 0;
        this.gridStartY = 0;
        
        // Explosion particles
        this.explosionParticles = [];
        this.isExploding = false;
        this.explosionCell = null;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.revealAnimations = [];
        
        // Multiplier table
        this.multiplierTable = {
            1: 1.2, 2: 1.5, 3: 1.9, 4: 2.4, 5: 3.0,
            6: 3.8, 7: 4.8, 8: 6.1, 9: 7.7, 10: 9.8,
            11: 12.5, 12: 15.9, 13: 20.2, 14: 25.7, 15: 32.7,
            16: 41.6, 17: 52.9, 18: 67.3, 19: 85.6, 20: 108.9,
            21: 138.5, 22: 176.2
        };
        
        // Colors
        this.colors = {
            boardBg: '#1a1a2e',
            cellHidden: '#2a2a4a',
            cellRevealed: '#0a3a2a',
            cellHover: '#3a3a5a',
            mine: '#ff4444',
            safe: '#00e676',
            gold: '#FFD700'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateGridDimensions();
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
    
    calculateGridDimensions() {
        this.cellSize = Math.min(this.w - 80, this.h - 230) / this.gridSize;
        this.gridStartX = (this.w - this.cellSize * this.gridSize) / 2;
        this.gridStartY = 80;
    }
    
    resetGame() {
        this.grid = [];
        this.revealed = [];
        this.gameOver = false;
        this.gameWon = false;
        this.isPlaying = false;
        this.revealCount = 0;
        this.currentMultiplier = 1.0;
        this.explosionParticles = [];
        this.isExploding = false;
        this.explosionCell = null;
        this.revealAnimations = [];
        
        // Initialize grid
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = { status: 'hidden', isMine: false };
            }
        }
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setMineCount(count) {
        if (this.isPlaying) return;
        this.mineCount = Math.max(1, Math.min(10, count));
        this.drawFullBoard();
    }
    
    play(bet) {
        if (this.isPlaying) return;
        
        this.bet = bet;
        this.resetGame();
        this.isPlaying = true;
        
        // Place mines randomly
        this.placeMines();
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">💣 Select cells to reveal...</span>';
        }
        
        this.drawFullBoard();
    }
    
    placeMines() {
        const totalCells = this.gridSize * this.gridSize;
        const safeCells = totalCells - this.mineCount;
        const minePositions = new Set();
        
        while (minePositions.size < this.mineCount) {
            const pos = Math.floor(Math.random() * totalCells);
            minePositions.add(pos);
        }
        
        minePositions.forEach(pos => {
            const row = Math.floor(pos / this.gridSize);
            const col = pos % this.gridSize;
            this.grid[row][col].isMine = true;
        });
    }
    
    revealCell(row, col) {
        if (!this.isPlaying || this.gameOver) return;
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return;
        if (this.grid[row][col].status !== 'hidden') return;
        
        if (this.grid[row][col].isMine) {
            // BOOM! Game over
            this.grid[row][col].status = 'exploded';
            this.gameOver = true;
            this.gameWon = false;
            this.isPlaying = false;
            this.isExploding = true;
            this.explosionCell = { row, col };
            
            // Reveal all mines
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c].isMine) {
                        this.grid[r][c].status = 'mine';
                    }
                }
            }
            
            // Explosion particles
            this.spawnExplosion(row, col);
            this.resolveGame();
        } else {
            // Safe cell
            this.grid[row][col].status = 'revealed';
            this.revealed.push({ row, col });
            this.revealCount++;
            
            // Add reveal animation
            this.revealAnimations.push({
                row, col,
                progress: 0,
                startTime: performance.now()
            });
            
            // Update multiplier
            this.currentMultiplier = this.multiplierTable[this.revealCount] || this.currentMultiplier * 1.3;
            
            // Check win (all safe cells revealed)
            const totalSafe = (this.gridSize * this.gridSize) - this.mineCount;
            if (this.revealCount >= totalSafe) {
                this.gameOver = true;
                this.gameWon = true;
                this.isPlaying = false;
                this.resolveGame();
            }
        }
        
        this.drawFullBoard();
    }
    
    cashOut() {
        if (!this.isPlaying || this.revealCount === 0) return;
        
        this.gameOver = true;
        this.gameWon = true;
        this.isPlaying = false;
        
        // Reveal all mines
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c].isMine) {
                    this.grid[r][c].status = 'mine';
                }
            }
        }
        
        this.resolveGame(true);
    }
    
    spawnExplosion(row, col) {
        const cx = this.gridStartX + col * this.cellSize + this.cellSize / 2;
        const cy = this.gridStartY + row * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.explosionParticles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: ['#ff4400', '#ff8800', '#ffaa00', '#FFD700', '#ffffff'][Math.floor(Math.random() * 5)],
                life: 1,
                decay: 0.01 + Math.random() * 0.03
            });
        }
    }
    
    resolveGame(cashedOut = false) {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.gameWon) {
            const payout = Math.floor(this.bet * this.currentMultiplier);
            this.chips += payout;
            const winType = cashedOut ? 'CASHED OUT!' : 'ALL CLEAR!';
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:18px;">🎉 ${winType}</span><br>
                        <span style="color:#00e676;">+${payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.currentMultiplier.toFixed(1)}x | ${this.revealCount} safe cells</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: shake 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:18px;">💥 BOOM! MINE HIT!</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${this.revealCount} safe cells found</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.resetGame(); }, 4000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update reveal animations
        this.revealAnimations.forEach(anim => {
            const elapsed = timestamp - anim.startTime;
            anim.progress = Math.min(1, elapsed / 300);
        });
        this.revealAnimations = this.revealAnimations.filter(a => a.progress < 1);
        
        // Update explosion particles
        this.explosionParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
        });
        this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);
        
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
        
        // Grid
        this.drawGrid(ctx);
        
        // Explosion particles
        this.drawExplosionParticles(ctx);
        
        // Mine count selector
        this.drawMineSelector(ctx, w, h);
        
        // Multiplier display
        this.drawMultiplierDisplay(ctx, w, h);
        
        // Cash out button
        if (this.isPlaying && this.revealCount > 0) {
            this.drawCashOutButton(ctx, w, h);
        }
        
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
        ctx.fillText('💣 MINES', w / 2, 41);
    }
    
    drawGrid(ctx) {
        const cs = this.cellSize;
        const sx = this.gridStartX;
        const sy = this.gridStartY;
        
        // Grid background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, sx - 8, sy - 8, cs * this.gridSize + 16, cs * this.gridSize + 16, 12);
        ctx.fill();
        ctx.stroke();
        
        // Cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cx = sx + col * cs;
                const cy = sy + row * cs;
                const cell = this.grid[row][col];
                
                this.drawSingleCell(ctx, cx, cy, cs, cell, row, col);
            }
        }
    }
    
    drawSingleCell(ctx, x, y, size, cell, row, col) {
        const padding = 4;
        
        // Check for reveal animation
        let animProgress = 1;
        const anim = this.revealAnimations.find(a => a.row === row && a.col === col);
        if (anim) animProgress = anim.progress;
        
        // Cell background
        let fillColor = this.colors.cellHidden;
        let borderColor = 'rgba(255, 255, 255, 0.15)';
        let glowColor = null;
        
        if (cell.status === 'revealed') {
            fillColor = this.colors.cellRevealed;
            borderColor = 'rgba(0, 230, 118, 0.3)';
        } else if (cell.status === 'mine') {
            fillColor = 'rgba(255, 68, 68, 0.15)';
            borderColor = 'rgba(255, 68, 68, 0.3)';
        } else if (cell.status === 'exploded') {
            fillColor = 'rgba(255, 68, 68, 0.4)';
            borderColor = '#ff4444';
            glowColor = '#ff4444';
        }
        
        // Draw cell with scale animation
        ctx.save();
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(animProgress, animProgress);
        ctx.translate(-centerX, -centerY);
        
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Cell icon
        if (cell.status === 'revealed') {
            ctx.fillStyle = '#00e676';
            ctx.font = `${size * 0.35}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✅', centerX, centerY);
        } else if (cell.status === 'mine' || cell.status === 'exploded') {
            ctx.fillStyle = '#ff4444';
            ctx.font = `${size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', centerX, centerY);
        } else if (cell.status === 'hidden' && this.isPlaying) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = `${size * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', centerX, centerY);
        }
        
        ctx.restore();
    }
    
    drawExplosionParticles(ctx) {
        this.explosionParticles.forEach(p => {
            ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawMineSelector(ctx, w, h) {
        const sy = h - 90;
        const btnW = 40;
        const gap = 5;
        const totalW = btnW * 5 + gap * 4;
        const startX = (w - totalW) / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MINES', w / 2, sy - 5);
        
        for (let i = 0; i < 5; i++) {
            const count = i + 2;
            const mx = startX + i * (btnW + gap);
            const isSelected = this.mineCount === count && !this.isPlaying;
            
            ctx.fillStyle = isSelected ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, mx, sy, btnW, 30, 15);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count, mx + btnW / 2, sy + 15);
        }
    }
    
    drawMultiplierDisplay(ctx, w, h) {
        const my = h - 125;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = this.isPlaying ? '#00e676' : 'rgba(255,215,0,0.4)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 55, my, 110, 30, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MULTIPLIER', w / 2, my + 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(this.currentMultiplier.toFixed(1) + 'x', w / 2, my + 24);
    }
    
    drawCashOutButton(ctx, w, h) {
        const cy = h - 50;
        const cw = 100;
        
        const cashOut = Math.floor(this.bet * this.currentMultiplier);
        
        ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - cw / 2, cy, cw, 32, 16);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`💰 CASH OUT ₹${cashOut}`, w / 2, cy + 16);
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
    
    // Handle canvas click for cell selection
    handleClick(clickX, clickY) {
        if (!this.isPlaying || this.gameOver) return;
        
        const col = Math.floor((clickX - this.gridStartX) / this.cellSize);
        const row = Math.floor((clickY - this.gridStartY) / this.cellSize);
        
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            this.revealCell(row, col);
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
        this.explosionParticles = [];
        this.revealAnimations = [];
    }
}

// Export
window.MinesFullGame = MinesFullGame;
console.log('✅ Game 13: Mines - Full Casino Design Loaded');
