// ============================================
// EMERALD KING CASINO - MINES
// Real Casino UI - Grid Mine Detection Game
// Full Redesign v3.0.0
// File: js/games/mines.js
// ============================================

class MinesFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.mineCount = 3;
        this.gridSize = 5;
        this.grid = [];
        this.revealed = [];
        this.gameOver = false;
        this.gameWon = false;
        this.isPlaying = false;
        this.revealCount = 0;
        this.currentMultiplier = 1.0;
        this.winnings = 0;
        
        // Grid dimensions
        this.cellSize = 0;
        this.gridStartX = 0;
        this.gridStartY = 0;
        
        // Animation
        this.revealAnimations = [];
        this.explosionParticles = [];
        this.confettiParticles = [];
        this.isExploding = false;
        this.explosionCell = null;
        this.winGlowAlpha = 0;
        this.revealScaleAnim = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Multiplier table
        this.multiplierTable = {
            1: 1.20, 2: 1.45, 3: 1.75, 4: 2.10, 5: 2.55,
            6: 3.10, 7: 3.80, 8: 4.65, 9: 5.70, 10: 7.00,
            11: 8.60, 12: 10.6, 13: 13.1, 14: 16.2, 15: 20.0,
            16: 24.8, 17: 30.7, 18: 38.0, 19: 47.1, 20: 58.4,
            21: 72.4, 22: 89.8
        };
        
        // Colors
        this.palette = {
            bg: '#0a0806',
            boardBg: '#111122',
            cellHidden: '#1a1a3a',
            cellHover: '#252550',
            cellRevealed: '#0a2a1a',
            cellRevealedBorder: 'rgba(0,230,118,0.4)',
            mine: '#ff4444',
            mineGlow: 'rgba(255,68,68,0.5)',
            safeIcon: '#00e676',
            gold: '#d4a843',
            goldLight: '#f0d078',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            multiplierGreen: '#00e676',
            multiplierGold: '#FFD700',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            felt: '#0d5e2e'
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
        this.calculateGridDimensions();
        this.resetGame();
        this.generateSparkles();
        this.drawFullBoard();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateGridDimensions();
        this.drawFullBoard();
    }
    
    calculateGridDimensions() {
        this.cellSize = Math.min(this.w - 60, this.h - 280) / this.gridSize;
        this.gridStartX = (this.w - this.cellSize * this.gridSize) / 2;
        this.gridStartY = 75;
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
        this.grid = [];
        this.revealed = [];
        this.gameOver = false;
        this.gameWon = false;
        this.isPlaying = false;
        this.revealCount = 0;
        this.currentMultiplier = 1.0;
        this.winnings = 0;
        this.explosionParticles = [];
        this.confettiParticles = [];
        this.isExploding = false;
        this.explosionCell = null;
        this.winGlowAlpha = 0;
        this.revealAnimations = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = { status: 'hidden', isMine: false, hasGem: false };
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
        
        this.bet = bet || this.bet;
        this.resetGame();
        this.isPlaying = true;
        this.gameOver = false;
        this.gameWon = false;
        this.placeMines();
        this.placeGems();
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Select cells to reveal...</div>';
        }
        
        this.drawFullBoard();
    }
    
    placeMines() {
        const totalCells = this.gridSize * this.gridSize;
        const minePositions = new Set();
        
        while (minePositions.size < this.mineCount) {
            const pos = Math.floor(Math.random() * totalCells);
            minePositions.add(pos);
        }
        
        minePositions.forEach(function(pos) {
            const row = Math.floor(pos / this.gridSize);
            const col = pos % this.gridSize;
            this.grid[row][col].isMine = true;
        }.bind(this));
    }
    
    placeGems() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col].isMine) {
                    this.grid[row][col].hasGem = Math.random() < 0.15;
                }
            }
        }
    }
    
    revealCell(row, col) {
        if (!this.isPlaying || this.gameOver) return;
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) return;
        if (this.grid[row][col].status !== 'hidden') return;
        
        if (this.grid[row][col].isMine) {
            // BOOM!
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
            
            this.spawnExplosion(row, col);
            this.resolveGame();
        } else {
            // Safe cell
            this.grid[row][col].status = 'revealed';
            this.revealed.push({ row, col });
            this.revealCount++;
            
            this.revealAnimations.push({
                row, col,
                progress: 0,
                startTime: performance.now()
            });
            
            // Update multiplier
            this.currentMultiplier = this.multiplierTable[this.revealCount] || this.currentMultiplier * 1.35;
            
            // Gem bonus
            if (this.grid[row][col].hasGem) {
                this.currentMultiplier *= 1.5;
            }
            
            // Check win
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
        if (!this.isPlaying || this.revealCount === 0 || this.gameOver) return;
        
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
        
        this.winnings = Math.floor(this.bet * this.currentMultiplier);
        this.chips += this.winnings;
        this.resolveGame(true);
    }
    
    spawnExplosion(row, col) {
        const cx = this.gridStartX + col * this.cellSize + this.cellSize / 2;
        const cy = this.gridStartY + row * this.cellSize + this.cellSize / 2;
        
        const colors = ['#ff4400', '#ff8800', '#ffaa00', '#FFD700', '#ffffff'];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.explosionParticles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: 0.01 + Math.random() * 0.03
            });
        }
    }
    
    resolveGame(cashedOut) {
        if (cashedOut === undefined) cashedOut = false;
        
        if (this.gameWon) {
            this.winnings = Math.floor(this.bet * this.currentMultiplier);
            this.chips += this.winnings;
            
            if (this.winnings > this.bet) {
                this.generateConfetti();
                this.winGlowAlpha = 1.0;
                if (window.GameLoaderSystem) {
                    GameLoaderSystem.showWinOverlay(this.winnings);
                    GameLoaderSystem.updateBalance(this.chips);
                }
                if (this.winCascade) this.winCascade.spawn(this.w / 2, this.gridStartY + this.cellSize * 2.5, 80);
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (this.gameWon) {
            const winType = cashedOut ? 'CASHED OUT!' : 'ALL CLEAR!';
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + winType + ' ' + this.currentMultiplier.toFixed(1) + 'x +RS ' + this.winnings + '</div>';
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">BOOM! Mine hit -RS ' + this.bet + '</div>';
            }
        }
        
        this.drawFullBoard();
        
        setTimeout(() => {
            this.winGlowAlpha = 0;
            this.explosionParticles = [];
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullBoard();
        }, 4000);
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
        
        // Reveal animations
        this.revealAnimations.forEach(function(anim) {
            const elapsed = timestamp - anim.startTime;
            anim.progress = Math.min(1, elapsed / 250);
        });
        this.revealAnimations = this.revealAnimations.filter(function(a) { return a.progress < 1; });
        
        // Explosion particles
        this.explosionParticles.forEach(function(p) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
        });
        this.explosionParticles = this.explosionParticles.filter(function(p) { return p.life > 0; });
        
        // Confetti
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.gameOver) {
            this.winGlowAlpha -= 0.01;
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
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
        this.drawGrid(ctx);
        this.drawExplosionParticles(ctx);
        this.drawMineSelector(ctx, w, h);
        this.drawMultiplierDisplay(ctx, w, h);
        this.drawMultiplierLadder(ctx, w, h);
        this.drawCashOutButton(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) {
            this.drawWinGlow(ctx, w, h);
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410');
        bgGrad.addColorStop(0.5, '#0f0b08');
        bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.3, 24, w * 0.4, 34, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MINES', w / 2, 41);
    }
    
    drawGrid(ctx) {
        const cs = this.cellSize;
        const sx = this.gridStartX;
        const sy = this.gridStartY;
        const gs = this.gridSize;
        
        // Grid background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, sx - 8, sy - 8, cs * gs + 16, cs * gs + 16, 10);
        ctx.fill();
        ctx.stroke();
        
        // Cells
        for (let row = 0; row < gs; row++) {
            for (let col = 0; col < gs; col++) {
                const cx = sx + col * cs;
                const cy = sy + row * cs;
                const cell = this.grid[row][col];
                
                this.drawSingleCell(ctx, cx, cy, cs, cell, row, col);
            }
        }
    }
    
    drawSingleCell(ctx, x, y, size, cell, row, col) {
        const padding = 3;
        
        // Animation progress
        let animProgress = 1;
        const anim = this.revealAnimations.find(function(a) { return a.row === row && a.col === col; });
        if (anim) animProgress = anim.progress;
        
        let fillColor = this.palette.cellHidden;
        let borderColor = 'rgba(255,255,255,0.1)';
        let glowColor = null;
        let icon = '';
        let iconColor = '';
        
        if (cell.status === 'revealed') {
            fillColor = this.palette.cellRevealed;
            borderColor = this.palette.cellRevealedBorder;
            icon = cell.hasGem ? 'G' : 'S';
            iconColor = cell.hasGem ? '#FFD700' : this.palette.safeIcon;
        } else if (cell.status === 'mine') {
            fillColor = 'rgba(255,68,68,0.15)';
            borderColor = 'rgba(255,68,68,0.4)';
            icon = 'M';
            iconColor = this.palette.mine;
        } else if (cell.status === 'exploded') {
            fillColor = 'rgba(255,68,68,0.35)';
            borderColor = '#ff4444';
            glowColor = this.palette.mineGlow;
            icon = 'M';
            iconColor = '#ffffff';
        } else {
            icon = '?';
            iconColor = 'rgba(255,255,255,0.3)';
        }
        
        ctx.save();
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(animProgress, animProgress);
        ctx.translate(-centerX, -centerY);
        
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
        }
        
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, 7);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = iconColor;
        ctx.font = 'bold ' + Math.floor(size * 0.35) + 'px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, centerX, centerY);
        
        ctx.restore();
    }
    
    drawExplosionParticles(ctx) {
        for (const p of this.explosionParticles) {
            const alpha = p.life;
            ctx.fillStyle = 'rgba(255,' + Math.floor(100 + alpha * 100) + ',0,' + alpha + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawMineSelector(ctx, w, h) {
        const sy = this.gridStartY + this.cellSize * this.gridSize + 15;
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('MINES', w / 2, sy - 5);
        
        const counts = [1, 2, 3, 5, 7];
        const btnW = 44;
        const gap = 6;
        const totalW = counts.length * btnW + (counts.length - 1) * gap;
        const startX = (w - totalW) / 2;
        
        for (let i = 0; i < counts.length; i++) {
            const count = counts[i];
            const mx = startX + i * (btnW + gap);
            const isSelected = this.mineCount === count && !this.isPlaying;
            
            ctx.fillStyle = isSelected ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, mx, sy, btnW, 28, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 10px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count, mx + btnW / 2, sy + 14);
        }
    }
    
    drawMultiplierDisplay(ctx, w, h) {
        const my = this.gridStartY + this.cellSize * this.gridSize + 60;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = this.isPlaying ? '#00e676' : 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 60, my, 120, 35, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('MULTIPLIER', w / 2, my + 12);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 15px Georgia';
        ctx.fillText(this.currentMultiplier.toFixed(1) + 'x', w / 2, my + 28);
    }
    
    drawMultiplierLadder(ctx, w, h) {
        if (!this.isPlaying) return;
        
        const lx = w - 55;
        const ly = this.gridStartY;
        const lw = 42;
        const lh = this.cellSize * this.gridSize;
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, lx, ly, lw, lh, 6);
        ctx.fill();
        ctx.stroke();
        
        // Show next 4 multipliers
        for (let i = 0; i < 4; i++) {
            const nextCount = this.revealCount + i + 1;
            const mult = this.multiplierTable[nextCount] || (this.currentMultiplier * Math.pow(1.35, i + 1));
            const iy = ly + 10 + i * 28;
            
            ctx.fillStyle = i === 0 ? '#FFD700' : 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(nextCount + ':' + mult.toFixed(1) + 'x', lx + lw / 2, iy);
        }
    }
    
    drawCashOutButton(ctx, w, h) {
        if (!this.isPlaying || this.revealCount === 0 || this.gameOver) return;
        
        const btnX = w / 2 - 55;
        const btnY = this.gridStartY + this.cellSize * this.gridSize + 105;
        const btnW = 110;
        const btnH = 36;
        const cashOutAmt = Math.floor(this.bet * this.currentMultiplier);
        
        ctx.fillStyle = 'rgba(0,230,118,0.2)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,230,118,0.3)';
        ctx.shadowBlur = 8;
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 18);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CASH OUT', btnX + btnW / 2, btnY + btnH / 2 - 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Georgia';
        ctx.fillText('RS ' + cashOutAmt, btnX + btnW / 2, btnY + btnH / 2 + 10);
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const glowGrad = ctx.createRadialGradient(w / 2, this.gridStartY + this.cellSize * 2.5, 50, w / 2, this.gridStartY + this.cellSize * 2.5, 200);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, this.gridStartY + this.cellSize * 2.5, 200, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sp.opacity + ')';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ============================================
    // UTILS
    // ============================================
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
    
    // ============================================
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (!this.isPlaying || this.gameOver) {
            // Check mine selector
            const sy = this.gridStartY + this.cellSize * this.gridSize + 15;
            const counts = [1, 2, 3, 5, 7];
            const btnW = 44;
            const gap = 6;
            const totalW = counts.length * btnW + (counts.length - 1) * gap;
            const startX = (this.w - totalW) / 2;
            
            for (let i = 0; i < counts.length; i++) {
                const mx = startX + i * (btnW + gap);
                if (clickX >= mx && clickX <= mx + btnW && clickY >= sy && clickY <= sy + 28) {
                    this.setMineCount(counts[i]);
                    return;
                }
            }
            return;
        }
        
        // Check cash out button
        const btnX = this.w / 2 - 55;
        const btnY = this.gridStartY + this.cellSize * this.gridSize + 105;
        if (this.revealCount > 0 && clickX >= btnX && clickX <= btnX + 110 && clickY >= btnY && clickY <= btnY + 36) {
            this.cashOut();
            return;
        }
        
        // Check grid cells
        const col = Math.floor((clickX - this.gridStartX) / this.cellSize);
        const row = Math.floor((clickY - this.gridStartY) / this.cellSize);
        
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            this.revealCell(row, col);
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullBoard(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.explosionParticles = [];
        this.revealAnimations = [];
        this.grid = [];
    }
}

// Export
window.MinesFullGame = MinesFullGame;
console.log('Mines v3.0.0 - Real Casino Design Loaded');
