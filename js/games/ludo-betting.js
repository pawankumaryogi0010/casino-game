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
        this.pathCoords = [];
        
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
        this.waitingForPlayer = false;
        this.controlsEl = null;
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateBoardDimensions();
        this.resetGame();
        this.drawFullBoard();
        this.createControls();
    }

    createControls() {
        // create simple overlay controls if not present
        if (this.controlsEl) return;
        const container = document.createElement('div');
        container.id = 'ludo-controls';
        container.style.position = 'fixed';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.bottom = '18px';
        container.style.zIndex = '1000';
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.alignItems = 'center';

        const rollBtn = document.createElement('button');
        rollBtn.id = 'ludo-roll-btn';
        rollBtn.textContent = 'ROLL';
        rollBtn.className = 'btn btn-gold';
        rollBtn.style.padding = '12px 26px';
        rollBtn.style.fontSize = '14px';
        rollBtn.style.display = 'none';
        rollBtn.addEventListener('click', () => { this.playerRoll(); });

        const exitBtn = document.createElement('button');
        exitBtn.id = 'ludo-exit-btn';
        exitBtn.textContent = '← Lobby';
        exitBtn.className = 'btn btn-ghost';
        exitBtn.style.padding = '10px 18px';
        exitBtn.addEventListener('click', () => {
            this.showResult = false;
            this.isPlaying = false;
            this.resetGame();
            this.destroy();
        });

        container.appendChild(rollBtn);
        container.appendChild(exitBtn);
        document.body.appendChild(container);
        this.controlsEl = container;
        this.updateControlsVisibility();
    }

    updateControlsVisibility() {
        if (!this.controlsEl) return;
        const rollBtn = this.controlsEl.querySelector('#ludo-roll-btn');
        if (!rollBtn) return;
        if (this.isPlaying && this.waitingForPlayer) rollBtn.style.display = 'inline-flex';
        else rollBtn.style.display = 'none';
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
        // use a square board area (11x11 grid visual) and compute circle-based path
        const maxSize = Math.min(this.w - 60, this.h - 240);
        this.cellSize = maxSize / 11;
        const boardSize = this.cellSize * 11;
        this.boardStartX = (this.w - boardSize) / 2;
        this.boardStartY = 60;
        this.boardCenterX = this.boardStartX + boardSize / 2;
        this.boardCenterY = this.boardStartY + boardSize / 2;
        this.boardSize = boardSize;
        this.buildPathCoords();
    }

    buildPathCoords() {
        this.pathCoords = [];
        const steps = this.boardCells || 20;
        const radius = this.boardSize * 0.38;
        for (let i = 0; i < steps; i++) {
            const a = (i / steps) * Math.PI * 2 - Math.PI / 2; // start at top
            const x = this.boardCenterX + Math.cos(a) * radius;
            const y = this.boardCenterY + Math.sin(a) * radius;
            this.pathCoords.push({ x, y });
        }
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
        // restore page scrolling
        try { document.body.style.overflow = ''; } catch (e) {}
        // remove controls visibility
        if (this.controlsEl) this.updateControlsVisibility();
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
        // disable page scroll for fullscreen mobile feel
        try { document.body.style.overflow = 'hidden'; } catch (e) {}
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
        // If it's player's turn, wait for user action
        if (this.currentTurn === 0) {
            this.waitingForPlayer = true;
            this.updateControlsVisibility();
            // draw to show waiting state
            this.drawFullBoard();
            return;
        }

        // AI turn: perform roll and continue
        const ai = this.players[1];
        this.doRoll(ai);
        this.turns++;
        this.currentTurn = 0; // back to player
        this.drawFullBoard();
        setTimeout(() => this.stepLoop(), 480);
    }

    // perform a roll for an actor (player or ai)
    doRoll(actor) {
        const roll = this.provablyFairRoll();
        actor.dice = roll;
        actor.position += roll;
        actor.score += roll;
        const opponent = this.players.find(p => p !== actor);
        if (actor.position < this.boardCells && actor.position === opponent.position) {
            opponent.position = 0;
            actor.score += 20;
        }
        if (actor.position >= this.boardCells) {
            actor.position = this.boardCells;
            actor.home = 1;
            actor.score += 50;
            if (this.winner === null) this.winner = this.players.indexOf(actor);
        }
        const px = this.pathCoords[Math.max(0, Math.min(this.pathCoords.length - 1, Math.floor(actor.position) % this.pathCoords.length))] || { x: this.boardCenterX, y: this.boardCenterY };
        for (let i = 0; i < 4; i++) this.diceParticles.push({ x: px.x + Math.random() * this.cellSize, y: px.y + Math.random() * this.cellSize, size: 1 + Math.random() * 2, opacity: 0.9, life: 0, maxLife: 12 + Math.random() * 10 });
        if (typeof window.playMoveSound === 'function') window.playMoveSound();
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
            try { if (window.currentUser && typeof window.currentUser.balance === 'number') { window.currentUser.balance += payout; if (typeof updateUI === 'function') updateUI(); const wb = document.getElementById('wallet-balance'); if (wb) wb.innerText = '₹' + window.currentUser.balance; } } catch (e) {}
            if (resultDisplay) resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out; color:#00e676;">🎉 You Win +${payout}</div>`;
            if (this.winCascade) this.winCascade.spawn(this.w/2, this.h/2, 80);
            if (typeof window.playWinSound === 'function') window.playWinSound();
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out; color:#ff4444;">😞 You Lose -${this.bet}</div>`;
            if (typeof window.playLossSound === 'function') window.playLossSound();
        }
        setTimeout(() => { this.showResult = false; this.resetGame(); if (this.controlsEl) this.controlsEl.style.display = 'none'; }, 2800);
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
        // ensure audio helpers
        this.ensureAudio();
    }

    ensureAudio() {
        if (this._audioReady) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ac = new AudioCtx();
            this._ac = ac;
            window.playMoveSound = () => {
                const o = ac.createOscillator();
                const g = ac.createGain();
                o.type = 'sine'; o.frequency.value = 700;
                g.gain.value = 0.0015;
                o.connect(g); g.connect(ac.destination);
                o.start(); o.frequency.linearRampToValueAtTime(520, ac.currentTime + 0.12);
                g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);
                setTimeout(() => { try { o.stop(); } catch (e) {} }, 200);
            };
            window.playWinSound = () => {
                const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 880; g.gain.value = 0.002; o.connect(g); g.connect(ac.destination); o.start(); o.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5); setTimeout(()=>{try{o.stop()}catch(e){}},520);
            };
            window.playLossSound = () => {
                const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 260; g.gain.value = 0.003; o.connect(g); g.connect(ac.destination); o.start(); o.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5); setTimeout(()=>{try{o.stop()}catch(e){}},520);
            };
            this._audioReady = true;
        } catch (e) {}
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

        // Outer board
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.strokeStyle = 'rgba(255,215,0,0.08)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, sx, sy, this.boardSize, this.boardSize, 12);
        ctx.fill();
        ctx.stroke();

        // center emblem
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        CardRenderer.roundRect(ctx, this.boardCenterX - cs * 1.5, this.boardCenterY - cs * 1.5, cs * 3, cs * 3, 6);
        ctx.fill();

        // path dots
        ctx.fillStyle = 'rgba(255,215,0,0.06)';
        for (let i = 0; i < this.pathCoords.length; i++) {
            const p = this.pathCoords[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(6, cs * 0.28), 0, Math.PI * 2);
            ctx.fill();
        }
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
            const idx = Math.max(0, Math.min(this.pathCoords.length - 1, Math.floor(player.position) % this.pathCoords.length));
            const p = this.pathCoords[idx] || { x: this.boardCenterX, y: this.boardCenterY };
            // token
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cs * 0.6, 0, Math.PI * 2);
            ctx.fill();
            // outline
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();
            // icon
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(player.icon, p.x, p.y - 1);
            // small dice near token
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = '10px Arial';
            ctx.fillText(player.dice, p.x, p.y + cs * 0.7);
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
        // large die in center bottom for player focus
        const cx = w / 2;
        const dy = h - 86;
        const size = 72;
        const player = this.players[0];
        this.drawLargeDie(ctx, cx - size / 2, dy - size / 2, size, player.dice, this.waitingForPlayer);
        // small AI die
        const ai = this.players[1];
        ctx.fillStyle = ai.color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ai.icon + ' ' + ai.dice, cx + size, dy + 6);
    }

    drawLargeDie(ctx, x, y, size, value, emphasize) {
        // rounded box
        ctx.fillStyle = emphasize ? 'linear-gradient(90deg,#28c76f,#06b6d4)' : '#fff';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        CardRenderer.roundRect(ctx, x, y, size, size, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // pips
        ctx.fillStyle = '#0b1220';
        const pip = size * 0.12;
        const cx = x + size / 2;
        const cy = y + size / 2;
        const gap = size * 0.28;
        const drawP = (px, py) => { ctx.beginPath(); ctx.arc(px, py, pip, 0, Math.PI * 2); ctx.fill(); };
        // map value to pips positions
        const map = {
            1: [[cx, cy]],
            2: [[cx - gap/1.4, cy - gap/1.4], [cx + gap/1.4, cy + gap/1.4]],
            3: [[cx - gap/1.4, cy - gap/1.4], [cx, cy], [cx + gap/1.4, cy + gap/1.4]],
            4: [[cx - gap/1.4, cy - gap/1.4], [cx + gap/1.4, cy - gap/1.4], [cx - gap/1.4, cy + gap/1.4], [cx + gap/1.4, cy + gap/1.4]],
            5: [[cx - gap/1.4, cy - gap/1.4], [cx + gap/1.4, cy - gap/1.4], [cx, cy], [cx - gap/1.4, cy + gap/1.4], [cx + gap/1.4, cy + gap/1.4]],
            6: [[cx - gap/1.4, cy - gap/1.4], [cx + gap/1.4, cy - gap/1.4], [cx - gap/1.4, cy], [cx + gap/1.4, cy], [cx - gap/1.4, cy + gap/1.4], [cx + gap/1.4, cy + gap/1.4]]
        };
        (map[value] || map[1]).forEach(p => drawP(p[0], p[1]));
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
