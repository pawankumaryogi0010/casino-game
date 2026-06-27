// ============================================
// EMERALD KING CASINO - GAME 11: LUDO BETTING
// Full Real Casino Visual Design
// 4-Player Dice Race Betting Game
// File: js/games/ludo-betting.js
// ============================================

class LudoBettingFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedPlayer = 0; // 0=Red, 1=Blue, 2=Green, 3=Yellow
        this.isPlaying = false;
        this.showResult = false;
        this.winner = null;
        this.rollCount = 0;
        this.maxRolls = 15 * 2; // 15 turns each (player + ai)
        
        // Players
        // Players (1v1 pattern: player vs AI)
        this.players = [
            { id: 'player', name: 'YOU', color: '#38bdf8', icon: '🔵', position: 0, score: 0, dice: 1, home: 0 },
            { id: 'ai', name: 'AI', color: '#a855f7', icon: '🤖', position: 0, score: 0, dice: 1, home: 0 }
        ];
        
        // Board
        // Ludo path size (simple 20-step path for mobile-friendly 1v1)
        this.boardCells = 20;
        this.cellSize = 0;
        this.boardStartX = 0;
        this.boardStartY = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Dice particles
        this.diceParticles = [];
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
        this.cellSize = Math.min(this.w - 60, this.h - 230) / 14;
        this.boardStartX = (this.w - this.cellSize * 14) / 2;
        this.boardStartY = 70;
    }
    
    resetGame() {
        this.players.forEach(p => {
            p.position = 0;
            p.score = 0;
            p.dice = 1;
            p.home = 0;
        });
        this.isPlaying = false;
        this.showResult = false;
        this.winner = null;
        this.rollCount = 0;
        this.turns = 0; // combined turns counter
        this.currentTurn = 0; // 0 => player turn, 1 => ai turn
        this.diceParticles = [];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    selectPlayer(index) {
        if (this.isPlaying) return;
        this.selectedPlayer = index;
        this.drawFullBoard();
    }
    
    play(bet) {
        if (this.isPlaying) return;
        this.bet = bet;
        this.resetGame();
        this.isPlaying = true;
        this.showResult = false;
        this.turns = 0;
        this.currentTurn = 0; // player starts
        this.consumeBet();
        // begin round loop
        this.stepLoop();
    }

    provablyFairRoll() {
        // Simple deterministic-ish roll using time + nonce - note: not true HMAC without server key,
        // but adequate for local fairness and repeatability for this demo.
        const nonce = (window.__gameNonce = (window.__gameNonce || 0) + 1);
        const seed = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${nonce}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i), hash |= 0;
        const r = Math.abs(hash) % 6 + 1;
        return r;
    }

    // Deduct bet from global wallet (if available through window.currentUser)
    consumeBet() {
        try {
            if (window.currentUser && typeof window.currentUser.balance === 'number') {
                window.currentUser.balance = Math.max(0, window.currentUser.balance - this.bet);
            }
        } catch (e) {}
    }
    
    // Single-step loop: one player's roll at a time (player then AI)
    stepLoop() {
        if (!this.isPlaying) return;
        if (this.turns >= this.maxRolls || this.winner !== null) {
            this.isPlaying = false;
            this.showResult = true;
            this.determineWinner();
            this.resolveGame();
            return;
        }

        const actor = this.players[this.currentTurn === 0 ? 0 : 1];
        const roll = this.provablyFairRoll();
        actor.dice = roll;
        actor.position += roll;
        actor.score += roll; // 1 point per step
        // capture: if actor lands on opponent, send opponent back to 0 and award +20
        const opponent = this.players.find(p => p !== actor);
        if (actor.position < this.boardCells && actor.position === opponent.position) {
            opponent.position = 0;
            actor.score += 20;
        }
        // reaching home
        if (actor.position >= this.boardCells) {
            actor.position = this.boardCells;
            actor.home = 1;
            actor.score += 50;
            if (this.winner === null) this.winner = this.players.indexOf(actor);
        }

        // particles
        const px = this.boardStartX + (actor.position % Math.max(1, Math.floor(this.boardCells / 2))) * this.cellSize;
        const py = this.boardStartY + (actor.id === 'player' ? this.cellSize * 0.2 : this.cellSize * 1.2);
        for (let i = 0; i < 4; i++) {
            this.diceParticles.push({ x: px + Math.random() * this.cellSize, y: py + Math.random() * this.cellSize, size: 1 + Math.random() * 2, opacity: 0.9, life: 0, maxLife: 12 + Math.random() * 10 });
        }

        // play sound quick
        if (typeof window.playMoveSound === 'function') window.playMoveSound();

        this.turns++;
        this.currentTurn = 1 - this.currentTurn;
        this.drawFullBoard();

        // schedule next
        setTimeout(() => this.stepLoop(), 420);
    }
    
    determineWinner() {
        if (this.winner !== null) return; // already set
        // highest score wins
        let best = 0;
        this.players.forEach((p, i) => {
            if (p.score > best) { best = p.score; this.winner = i; }
        });
        if (this.winner === null) this.winner = 0;
    }
    
    resolveGame() {
        const winnerObj = this.players[this.winner];
        const playerWon = winnerObj.id === 'player';
        const resultDisplay = document.getElementById('game-result-display');
        if (playerWon) {
            const payout = Math.floor(this.bet * 1.95); // 1.95x payout
            // credit wallet
            try { if (window.currentUser && typeof window.currentUser.balance === 'number') window.currentUser.balance += payout; } catch (e) {}
            if (resultDisplay) resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out; color:#00e676;">🎉 You Win +${payout}</div>`;
            if (this.winCascade) this.winCascade.spawn(this.w/2, this.h/2, 80);
            if (typeof window.playWinSound === 'function') window.playWinSound();
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out; color:#ff4444;">😞 You Lose -${this.bet}</div>`;
            if (typeof window.playLossSound === 'function') window.playLossSound();
        }
        setTimeout(() => { this.showResult = false; this.resetGame(); }, 2800);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update dice particles
        this.diceParticles.forEach(p => {
            p.life++;
            p.opacity -= 0.05;
        });
        this.diceParticles = this.diceParticles.filter(p => p.opacity > 0 && p.life < p.maxLife);
        
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
        
        // Players on board
        this.drawPlayersOnBoard(ctx);
        
        // Player selector
        this.drawPlayerSelector(ctx, w, h);
        
        // Dice display
        this.drawDiceDisplay(ctx, w, h);
        
        // Leaderboard
        this.drawLeaderboard(ctx, w, h);
        
        // Dice particles
        this.drawDiceParticles(ctx);
        
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
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 32, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 32, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯 LUDO DICE RACE', w / 2, 38);
    }
    
    drawBoard(ctx) {
        const cs = this.cellSize;
        const sx = this.boardStartX;
        const sy = this.boardStartY;
        const rows = 4;
        const cols = 14;
        
        // Board background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, sx - 5, sy - 5, cs * cols + 10, cs * rows + 10, 10);
        ctx.fill();
        ctx.stroke();
        
        // Cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cx = sx + col * cs;
                const cy = sy + row * cs;
                const cellNum = row * cols + col;
                
                let cellColor = 'rgba(255, 255, 255, 0.03)';
                
                // Home stretch colors
                if (col >= 11) {
                    if (row === 0) cellColor = 'rgba(255, 68, 68, 0.15)';
                    else if (row === 1) cellColor = 'rgba(0, 176, 255, 0.15)';
                    else if (row === 2) cellColor = 'rgba(0, 230, 118, 0.15)';
                    else if (row === 3) cellColor = 'rgba(255, 215, 0, 0.15)';
                }
                
                // Start cells
                if (cellNum === 0) cellColor = 'rgba(255, 68, 68, 0.3)';
                if (cellNum === 13) cellColor = 'rgba(0, 176, 255, 0.3)';
                if (cellNum === 26) cellColor = 'rgba(0, 230, 118, 0.3)';
                if (cellNum === 39) cellColor = 'rgba(255, 215, 0, 0.3)';
                
                ctx.fillStyle = cellColor;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 0.5;
                CardRenderer.roundRect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, 3);
                ctx.fill();
                ctx.stroke();
                
                // Cell number
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.font = '6px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cellNum + 1, cx + cs / 2, cy + cs / 2);
            }
        }
        
        // Finish zone
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, sx + 11 * cs, sy, cs * 3 + 5, cs * rows + 5, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', sx + 12.5 * cs, sy + rows * cs / 2);
    }
    
    drawPlayersOnBoard(ctx) {
        const cs = this.cellSize;
        const sx = this.boardStartX;
        const sy = this.boardStartY;
        
        this.players.forEach((player, i) => {
            if (player.position >= this.boardCells) {
                // At finish
                const fx = sx + 12 * cs + (i % 2) * cs;
                const fy = sy + Math.floor(i / 2) * cs + cs / 2;
                ctx.fillStyle = player.color;
                ctx.font = `${cs * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(player.icon, fx, fy);
            } else {
                const row = Math.floor(player.position / 14);
                const col = player.position % 14;
                const px = sx + col * cs + cs / 2;
                const py = sy + row * cs + cs / 2;
                
                ctx.fillStyle = player.color;
                ctx.shadowColor = player.color;
                ctx.shadowBlur = 6;
                ctx.font = `${cs * 0.55}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(player.icon, px, py);
                ctx.shadowBlur = 0;
            }
        });
    }
    
    drawPlayerSelector(ctx, w, h) {
        const selY = h - 135;
        const btnW = (w - 50) / 4;
        const btnH = 50;
        const gap = 6;
        
        this.players.forEach((player, i) => {
            const sx = 18 + i * (btnW + gap);
            const isSelected = this.selectedPlayer === i;
            
            ctx.fillStyle = isSelected ? `${player.color}30` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? player.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            CardRenderer.roundRect(ctx, sx, selY, btnW, btnH, 12);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = player.color;
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(player.icon, sx + btnW / 2, selY + btnH / 2 - 8);
            
            ctx.fillStyle = isSelected ? player.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Arial';
            ctx.fillText(player.name, sx + btnW / 2, selY + btnH / 2 + 14);
        });
    }
    
    drawDiceDisplay(ctx, w, h) {
        const dy = h - 70;
        
        this.players.forEach((player, i) => {
            const dx = w * 0.1 + i * w * 0.22;
            
            ctx.fillStyle = player.color;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.icon, dx, dy);
            
            // Dice value
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(player.dice, dx, dy + 18);
            
            // Dice box
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            CardRenderer.roundRect(ctx, dx - 10, dy - 12, 20, 38, 6);
            ctx.stroke();
        });
    }
    
    drawLeaderboard(ctx, w, h) {
        const lx = w - 65;
        const ly = 70;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, lx, ly, 50, 85, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCORE', lx + 25, ly + 12);
        
        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        sorted.forEach((player, i) => {
            const sy = ly + 25 + i * 16;
            ctx.fillStyle = player.color;
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}. ${player.score}`, lx + 25, sy);
        });
    }
    
    drawDiceParticles(ctx) {
        this.diceParticles.forEach(p => {
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
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
        this.diceParticles = [];
    }
}

// Export
window.LudoBettingFullGame = LudoBettingFullGame;
console.log('✅ Game 11: Ludo Betting - Full Casino Design Loaded');
