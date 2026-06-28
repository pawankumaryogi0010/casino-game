// ============================================
// EMERALD KING CASINO - LUDO BETTING
// Real Casino UI - 1v1 Dice Race Game
// Full Redesign v3.0.0
// File: js/games/ludo-betting.js
// ============================================

class LudoBettingFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.isPlaying = false;
        this.showResult = false;
        this.winner = null;
        this.winnings = 0;
        this.turns = 0;
        this.maxTurns = 30;
        this.currentTurn = 0;
        this.waitingForPlayer = false;
        
        // Players
        this.players = [
            { id: 'player', name: 'YOU', color: '#38bdf8', icon: 'P', position: 0, score: 0, dice: 1, home: false },
            { id: 'ai', name: 'AI', color: '#a855f7', icon: 'A', position: 0, score: 0, dice: 1, home: false }
        ];
        
        // Board
        this.boardCells = 20;
        this.cellSize = 0;
        this.boardStartX = 0;
        this.boardStartY = 0;
        this.boardSize = 0;
        this.pathCoords = [];
        
        // Animation
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.boardPulse = 0;
        
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
            playerColor: '#38bdf8',
            playerGlow: '#66d0ff',
            aiColor: '#a855f7',
            aiGlow: '#c084fc',
            diceWhite: '#f5f5f0',
            diceBorder: '#cccccc',
            diceDot: '#1a1a1a',
            boardBg: '#1a1a2e',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)'
        };
        
        this.diceSize = 55;
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
        this.buildPathCoords();
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
        this.buildPathCoords();
        this.drawFullBoard();
    }
    
    calculateBoardDimensions() {
        const maxSize = Math.min(this.w - 60, this.h - 240);
        this.cellSize = maxSize / 11;
        this.boardSize = this.cellSize * 11;
        this.boardStartX = (this.w - this.boardSize) / 2;
        this.boardStartY = 60;
        this.boardCenterX = this.boardStartX + this.boardSize / 2;
        this.boardCenterY = this.boardStartY + this.boardSize / 2;
    }
    
    buildPathCoords() {
        this.pathCoords = [];
        const steps = this.boardCells;
        const radius = this.boardSize * 0.38;
        for (let i = 0; i < steps; i++) {
            const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
            const x = this.boardCenterX + Math.cos(a) * radius;
            const y = this.boardCenterY + Math.sin(a) * radius;
            this.pathCoords.push({ x, y });
        }
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
        this.players.forEach(function(p) {
            p.position = 0;
            p.score = 0;
            p.dice = 1;
            p.home = false;
        });
        this.isPlaying = false;
        this.showResult = false;
        this.winner = null;
        this.winnings = 0;
        this.turns = 0;
        this.currentTurn = 0;
        this.waitingForPlayer = false;
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    provablyFairRoll() {
        const nonce = (window.__gameNonce = (window.__gameNonce || 0) + 1);
        const seed = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + nonce;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i), hash |= 0;
        return Math.abs(hash) % 6 + 1;
    }
    
    play(bet) {
        if (this.isPlaying) return;
        
        this.bet = bet || this.bet;
        this.resetGame();
        this.isPlaying = true;
        this.showResult = false;
        this.turns = 0;
        this.currentTurn = 0;
        
        this.drawFullBoard();
        this.stepLoop();
    }
    
    stepLoop() {
        if (!this.isPlaying) return;
        
        if (this.turns >= this.maxTurns || this.winner !== null) {
            this.isPlaying = false;
            this.showResult = true;
            this.determineWinner();
            this.resolveGame();
            return;
        }
        
        if (this.currentTurn === 0) {
            this.waitingForPlayer = true;
            this.drawFullBoard();
            return;
        }
        
        // AI turn
        const ai = this.players[1];
        this.doRoll(ai);
        this.turns++;
        this.currentTurn = 0;
        this.drawFullBoard();
        
        setTimeout(() => this.stepLoop(), 400);
    }
    
    playerRoll() {
        if (!this.isPlaying || !this.waitingForPlayer) return;
        
        this.waitingForPlayer = false;
        const player = this.players[0];
        this.doRoll(player);
        this.turns++;
        this.currentTurn = 1;
        this.drawFullBoard();
        
        setTimeout(() => this.stepLoop(), 400);
    }
    
    doRoll(actor) {
        const roll = this.provablyFairRoll();
        actor.dice = roll;
        actor.position += roll;
        actor.score += roll;
        
        const opponent = this.players.find(function(p) { return p !== actor; });
        if (actor.position < this.boardCells && actor.position === opponent.position) {
            opponent.position = 0;
            actor.score += 20;
        }
        
        if (actor.position >= this.boardCells) {
            actor.position = this.boardCells;
            actor.home = true;
            actor.score += 50;
            if (this.winner === null) this.winner = this.players.indexOf(actor);
        }
        
        // Dice particles
        const idx = Math.max(0, Math.min(this.pathCoords.length - 1, Math.floor(actor.position) % this.pathCoords.length));
        const pt = this.pathCoords[idx] || { x: this.boardCenterX, y: this.boardCenterY };
        for (let i = 0; i < 5; i++) {
            this.diceParticles.push({
                x: pt.x + (Math.random() - 0.5) * this.cellSize,
                y: pt.y + (Math.random() - 0.5) * this.cellSize,
                size: 1 + Math.random() * 2,
                opacity: 0.8,
                life: 0,
                maxLife: 10 + Math.random() * 12
            });
        }
    }
    
    determineWinner() {
        if (this.winner !== null) return;
        let best = 0;
        this.players.forEach(function(p, i) {
            if (p.score > best) { best = p.score; this.winner = i; }
        }.bind(this));
        if (this.winner === null) this.winner = 0;
    }
    
    resolveGame() {
        const winnerObj = this.players[this.winner];
        const playerWon = winnerObj.id === 'player';
        
        if (playerWon) {
            this.winnings = Math.floor(this.bet * 1.95);
            this.chips += this.winnings;
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            if (playerWon) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">YOU WIN! +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">AI WINS -RS ' + this.bet + '</div>';
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
        }, 4000);
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
        this.boardPulse += 0.015;
        
        this.diceParticles.forEach(function(p) {
            p.life++; p.opacity -= 0.06;
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
        this.drawTitle(ctx, w, h);
        this.drawBoard(ctx);
        this.drawPlayers(ctx);
        this.drawDiceDisplay(ctx, w, h);
        this.drawLeaderboard(ctx, w, h);
        this.drawStatusText(ctx, w, h);
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
        const m = 10, tw = w - m * 2, th = h - m * 2;
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder; ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16); ctx.fill();
        ctx.strokeStyle = this.palette.gold; ctx.lineWidth = 2;
        this.roundRect(ctx, m + 6, m + 6, tw - 12, th - 12, 12); ctx.stroke();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)'; ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.3, 24, w * 0.4, 28, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('LUDO DICE RACE', w / 2, 38);
    }
    
    drawBoard(ctx) {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const sx = this.boardStartX;
        const sy = this.boardStartY;
        
        // Board outer
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeStyle = 'rgba(255,215,0,0.1)'; ctx.lineWidth = 2;
        this.roundRect(ctx, sx, sy, this.boardSize, this.boardSize, 12); ctx.fill(); ctx.stroke();
        
        // Center emblem
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        this.roundRect(ctx, this.boardCenterX - cs * 1.5, this.boardCenterY - cs * 1.5, cs * 3, cs * 3, 6);
        ctx.fill();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('LUDO', this.boardCenterX, this.boardCenterY);
        
        // Path dots
        ctx.fillStyle = 'rgba(255,215,0,0.06)';
        for (let i = 0; i < this.pathCoords.length; i++) {
            const p = this.pathCoords[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(5, cs * 0.26), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Start marker
        const start = this.pathCoords[0];
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.arc(start.x, start.y, cs * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('GO', start.x, start.y);
        
        // Finish marker
        const finish = this.pathCoords[this.pathCoords.length - 1];
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(finish.x, finish.y, cs * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Georgia';
        ctx.fillText('END', finish.x, finish.y);
    }
    
    drawPlayers(ctx) {
        const cs = this.cellSize;
        
        this.players.forEach(function(player) {
            if (player.position >= this.boardCells) {
                const idx = this.pathCoords.length - 1;
                const pt = this.pathCoords[idx];
                
                ctx.fillStyle = player.color;
                ctx.shadowColor = player.color; ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, cs * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(player.icon, pt.x, pt.y);
            } else {
                const idx = Math.min(this.pathCoords.length - 1, Math.max(0, Math.floor(player.position)));
                const pt = this.pathCoords[idx];
                
                ctx.fillStyle = player.color;
                ctx.shadowColor = player.color; ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, cs * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(player.icon, pt.x, pt.y);
            }
        }.bind(this));
    }
    
    drawDiceDisplay(ctx, w, h) {
        const dx = w / 2;
        const dy = this.boardStartY + this.boardSize + 30;
        const ds = this.diceSize;
        
        // Player dice
        const player = this.players[0];
        this.drawSingleDice(ctx, dx - ds - 10, dy - ds / 2, ds, player.dice, player.color, this.waitingForPlayer);
        
        // AI dice
        const ai = this.players[1];
        this.drawSingleDice(ctx, dx + 10, dy - ds / 2, ds, ai.dice, ai.color, false);
        
        // Labels
        ctx.fillStyle = player.color;
        ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('YOU', dx - ds - 10 + ds / 2, dy + ds / 2 + 14);
        
        ctx.fillStyle = ai.color;
        ctx.fillText('AI', dx + 10 + ds / 2, dy + ds / 2 + 14);
        
        // VS
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 11px Georgia';
        ctx.fillText('VS', dx, dy);
    }
    
    drawSingleDice(ctx, x, y, size, value, color, emphasize) {
        // Glow when emphasized
        if (emphasize) {
            ctx.fillStyle = 'rgba(56,189,248,0.2)';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        
        const diceGrad = ctx.createLinearGradient(x, y, x + size, y + size);
        diceGrad.addColorStop(0, '#ffffff'); diceGrad.addColorStop(0.5, '#f0f0f0'); diceGrad.addColorStop(1, '#d8d8d8');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = this.palette.diceBorder; ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, size, size, 10); ctx.fill(); ctx.stroke();
        
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        
        // Dots
        const dotSize = size * 0.1;
        const offset = size * 0.22;
        const cx = x + size / 2, cy = y + size / 2;
        
        ctx.fillStyle = this.palette.diceDot;
        
        const dot = function(dx, dy) {
            ctx.beginPath(); ctx.arc(dx, dy, dotSize, 0, Math.PI * 2); ctx.fill();
        };
        
        if (value === 1 || value === 3 || value === 5) dot(cx, cy);
        if (value >= 2) { dot(cx - offset, cy - offset); dot(cx + offset, cy + offset); }
        if (value >= 4) { dot(cx - offset, cy + offset); dot(cx + offset, cy - offset); }
        if (value === 6) { dot(cx - offset, cy); dot(cx + offset, cy); }
    }
    
    drawLeaderboard(ctx, w, h) {
        const lx = w - 65;
        const ly = this.boardStartY + 5;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1;
        this.roundRect(ctx, lx, ly, 50, 75, 8); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('SCORE', lx + 25, ly + 12);
        
        const sorted = [...this.players].sort(function(a, b) { return b.score - a.score; });
        sorted.forEach(function(player, i) {
            const sy = ly + 25 + i * 16;
            ctx.fillStyle = player.color;
            ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
            ctx.fillText((i + 1) + '. ' + player.score, lx + 25, sy);
        });
    }
    
    drawStatusText(ctx, w, h) {
        const sy = this.boardStartY + this.boardSize + 100;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
        
        if (this.showResult) {
            const winnerObj = this.players[this.winner];
            ctx.fillStyle = winnerObj.color;
            ctx.fillText(winnerObj.name + ' WINS!', w / 2, sy);
        } else if (this.waitingForPlayer) {
            ctx.fillText('Tap ROLL to play your turn', w / 2, sy);
        } else if (this.isPlaying) {
            ctx.fillText('AI is rolling...', w / 2, sy);
        } else {
            ctx.fillText('Place bet & press DEAL', w / 2, sy);
        }
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
            ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const glowGrad = ctx.createRadialGradient(w / 2, this.boardCenterY, 40, w / 2, this.boardCenterY, 200);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(w / 2, this.boardCenterY, 200, 0, Math.PI * 2); ctx.fill();
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
    // LOOP
    // ============================================
    
    render() { this.drawFullBoard(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = []; this.confettiParticles = [];
        this.diceParticles = []; this.pathCoords = [];
    }
}

// Export
window.LudoBettingFullGame = LudoBettingFullGame;
console.log('Ludo Betting v3.0.0 - Real Casino Design Loaded');
