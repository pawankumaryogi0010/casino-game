// ============================================
// EMERALD KING CASINO - GAME 15: CLASSIC SLOTS
// Full Real Casino Visual Design
// 3-Reel Slot Machine with Symbols
// File: js/games/classic-slots.js
// ============================================

class ClassicSlotsFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.isSpinning = false;
        this.showResult = false;
        this.reels = [[], [], []];
        this.reelPositions = [0, 0, 0];
        this.reelTargets = [0, 0, 0];
        this.reelSpeeds = [0, 0, 0];
        this.reelStopped = [false, false, false];
        this.result = null;
        this.winAmount = 0;
        
        // Symbols with payouts
        this.symbols = [
            { name: 'STAR', icon: '⭐', color: '#FFD700', payout3: 50, payout2: 10, payout1: 2 },
            { name: 'BELL', icon: '🔔', color: '#FFD700', payout3: 30, payout2: 8, payout1: 0 },
            { name: 'SEVEN', icon: '7️⃣', color: '#ff4444', payout3: 25, payout2: 5, payout1: 0 },
            { name: 'DIAMOND', icon: '💎', color: '#00b0ff', payout3: 20, payout2: 4, payout1: 0 },
            { name: 'CHERRY', icon: '🍒', color: '#ff4444', payout3: 15, payout2: 3, payout1: 0 },
            { name: 'LEMON', icon: '🍋', color: '#FFD700', payout3: 10, payout2: 2, payout1: 0 },
            { name: 'CLOVER', icon: '🍀', color: '#00e676', payout3: 8, payout2: 0, payout1: 0 },
            { name: 'GRAPE', icon: '🍇', color: '#c084fc', payout3: 5, payout2: 0, payout1: 0 }
        ];
        
        // Machine dimensions
        this.machineX = 0;
        this.machineY = 0;
        this.machineW = 0;
        this.machineH = 0;
        this.reelW = 0;
        this.reelH = 0;
        this.visibleRows = 3;
        this.totalRows = 20; // Virtual reel length
        
        // Virtual reels (pre-generated)
        this.virtualReels = [[], [], []];
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Win line animation
        this.winLineFlash = 0;
        this.winningLines = [];
        
        // Jackpot display
        this.jackpotAmount = 10000;
        
        // Colors
        this.colors = {
            machineBody: '#1a1a1a',
            machineTrim: '#FFD700',
            screen: '#0a0a0a',
            reelBg: '#1a1a2e',
            button: '#cc0000',
            lever: '#888888'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateDimensions();
        this.generateVirtualReels();
        this.resetGame();
        this.drawFullMachine();
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
    
    calculateDimensions() {
        this.machineW = this.w - 30;
        this.machineH = this.h - 80;
        this.machineX = 15;
        this.machineY = 55;
        this.reelW = (this.machineW - 80) / 3;
        this.reelH = this.machineH - 100;
    }
    
    generateVirtualReels() {
        for (let reel = 0; reel < 3; reel++) {
            this.virtualReels[reel] = [];
            for (let i = 0; i < this.totalRows; i++) {
                this.virtualReels[reel].push(Math.floor(Math.random() * this.symbols.length));
            }
        }
    }
    
    resetGame() {
        this.isSpinning = false;
        this.showResult = false;
        this.reelPositions = [0, 0, 0];
        this.reelTargets = [0, 0, 0];
        this.reelSpeeds = [0, 0, 0];
        this.reelStopped = [true, true, true];
        this.result = null;
        this.winAmount = 0;
        this.winningLines = [];
        
        // Set initial visible symbols
        for (let reel = 0; reel < 3; reel++) {
            this.reels[reel] = [];
            for (let row = 0; row < this.visibleRows; row++) {
                this.reels[reel][row] = Math.floor(Math.random() * this.symbols.length);
            }
        }
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    play(bet) {
        if (this.isSpinning) return;
        
        this.bet = bet;
        this.isSpinning = true;
        this.showResult = false;
        this.result = null;
        this.winAmount = 0;
        this.winningLines = [];
        
        // Set random stop positions
        for (let reel = 0; reel < 3; reel++) {
            this.reelTargets[reel] = Math.floor(Math.random() * this.totalRows);
            this.reelSpeeds[reel] = 15 + reel * 3 + Math.random() * 5;
            this.reelStopped[reel] = false;
        }
        
        // Stop reels sequentially
        setTimeout(() => { this.reelStopped[0] = true; }, 800);
        setTimeout(() => { this.reelStopped[1] = true; }, 1400);
        setTimeout(() => { 
            this.reelStopped[2] = true;
            this.isSpinning = false;
            this.checkWin();
        }, 2000);
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎰 Spinning...</span>';
        }
    }
    
    checkWin() {
        // Get center row symbols
        const centerSymbols = [
            this.reels[0][1],
            this.reels[1][1],
            this.reels[2][1]
        ];
        
        // Check for 3 of a kind
        if (centerSymbols[0] === centerSymbols[1] && centerSymbols[1] === centerSymbols[2]) {
            const symbol = this.symbols[centerSymbols[0]];
            this.winAmount = Math.floor(this.bet * symbol.payout3);
            this.winningLines = [1]; // Center line
            this.result = 'bigwin';
        }
        // Check for 2 of a kind (first two)
        else if (centerSymbols[0] === centerSymbols[1]) {
            const symbol = this.symbols[centerSymbols[0]];
            this.winAmount = Math.floor(this.bet * symbol.payout2);
            this.winningLines = [1];
            this.result = 'win';
        }
        // Check for any cherry
        else if (centerSymbols.includes(4)) { // Cherry is index 4
            this.winAmount = Math.floor(this.bet * 2);
            this.result = 'win';
        }
        else {
            this.result = 'lose';
        }
        
        this.showResult = true;
        this.resolveGame();
    }
    
    resolveGame() {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.result === 'bigwin') {
            this.chips += this.winAmount;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:20px;">🎉 JACKPOT!</span><br>
                        <span style="color:#00e676;">+${this.winAmount} CHIPS</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
        } else if (this.result === 'win') {
            this.chips += this.winAmount;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${this.winAmount} CHIPS</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 50);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 NO WIN</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.showResult = false; }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        this.winLineFlash += 0.1;
        
        // Update reel positions
        for (let reel = 0; reel < 3; reel++) {
            if (!this.reelStopped[reel]) {
                this.reelPositions[reel] += this.reelSpeeds[reel] * 0.5;
                
                // Slow down when approaching target
                if (this.reelStopped[reel - 1] || reel === 0) {
                    const diff = this.reelTargets[reel] - (this.reelPositions[reel] % this.totalRows);
                    if (Math.abs(diff) < 3) {
                        this.reelSpeeds[reel] *= 0.85;
                    }
                }
            }
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING - FULL MACHINE
    // ============================================
    
    drawFullMachine() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Machine body
        this.drawMachineBody(ctx);
        
        // Reels
        this.drawReels(ctx);
        
        // Payline indicators
        this.drawPaylines(ctx);
        
        // Paytable
        this.drawPaytable(ctx);
        
        // Spin button
        this.drawSpinButton(ctx);
        
        // Win line animation
        if (this.winningLines.length > 0 && this.showResult) {
            this.drawWinLines(ctx);
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
    
    drawMachineBody(ctx) {
        const mx = this.machineX;
        const my = this.machineY;
        const mw = this.machineW;
        const mh = this.machineH;
        
        // Main body
        const bodyGrad = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
        bodyGrad.addColorStop(0, '#2a2a2a');
        bodyGrad.addColorStop(0.3, '#1a1a1a');
        bodyGrad.addColorStop(0.7, '#1a1a1a');
        bodyGrad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        CardRenderer.roundRect(ctx, mx, my, mw, mh, 18);
        ctx.fill();
        ctx.stroke();
        
        // Inner gold trim
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, mx + 8, my + 8, mw - 16, mh - 16, 14);
        ctx.stroke();
        
        // Top crown
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', mx + mw / 2, my - 8);
        
        // Title on machine
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CLASSIC SLOTS', mx + mw / 2, my + 22);
    }
    
    drawReels(ctx) {
        const mx = this.machineX;
        const my = this.machineY;
        const mw = this.machineW;
        const reelY = my + 40;
        const reelAreaH = this.reelH;
        
        // Reel area background
        ctx.fillStyle = '#0a0a0a';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, mx + 15, reelY, mw - 30, reelAreaH, 10);
        ctx.fill();
        ctx.stroke();
        
        // Reels
        for (let reel = 0; reel < 3; reel++) {
            const rx = mx + 20 + reel * this.reelW + reel * 8;
            
            for (let row = 0; row < this.visibleRows; row++) {
                const ry = reelY + 8 + row * (reelAreaH - 16) / this.visibleRows;
                const cellH = (reelAreaH - 16) / this.visibleRows;
                
                // Cell background
                ctx.fillStyle = row === 1 ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1;
                CardRenderer.roundRect(ctx, rx, ry, this.reelW, cellH - 4, 6);
                ctx.fill();
                ctx.stroke();
                
                // Symbol
                const symbolIndex = this.getSymbolAtPosition(reel, row);
                const symbol = this.symbols[symbolIndex];
                
                // Win highlight
                if (this.showResult && this.winningLines.includes(row) && 
                    row === 1 && this.reelStopped.every(s => s)) {
                    ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
                    CardRenderer.roundRect(ctx, rx, ry, this.reelW, cellH - 4, 6);
                    ctx.fill();
                }
                
                ctx.fillStyle = symbol.color;
                ctx.font = `${this.reelW * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(symbol.icon, rx + this.reelW / 2, ry + cellH / 2 - 2);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = 'bold 7px Arial';
                ctx.fillText(symbol.name, rx + this.reelW / 2, ry + cellH / 2 + 14);
            }
        }
    }
    
    getSymbolAtPosition(reel, row) {
        // Calculate position on virtual reel
        let pos = Math.floor(this.reelPositions[reel] + row) % this.totalRows;
        if (pos < 0) pos += this.totalRows;
        
        if (this.reelStopped[reel]) {
            // Use pre-generated virtual reel
            return this.virtualReels[reel][pos];
        } else {
            // Random during spin
            return Math.floor(Math.random() * this.symbols.length);
        }
    }
    
    drawPaylines(ctx) {
        const mx = this.machineX;
        const my = this.machineY;
        const mw = this.machineW;
        const lineY = my + this.reelH + 50;
        
        // Payline indicators
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        CardRenderer.roundRect(ctx, mx + 20, lineY, mw - 40, 14, 7);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('━━━ CENTER LINE ━━━', mx + mw / 2, lineY + 7);
    }
    
    drawPaytable(ctx) {
        const px = this.machineX + 10;
        const py = this.machineY + this.machineH - 55;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        CardRenderer.roundRect(ctx, px, py, this.machineW - 20, 40, 8);
        ctx.fill();
        
        // Show top 4 symbols
        const topSymbols = this.symbols.slice(0, 4);
        topSymbols.forEach((sym, i) => {
            const sx = px + 15 + i * (this.machineW - 20) / 4;
            
            ctx.fillStyle = sym.color;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(sym.icon, sx, py + 14);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(`x${sym.payout3}`, sx, py + 30);
        });
    }
    
    drawSpinButton(ctx) {
        const mx = this.machineX;
        const my = this.machineY;
        const mw = this.machineW;
        const mh = this.machineH;
        const btnY = my + mh - 12;
        
        // Lever base
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(mx + mw - 25, btnY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Lever stick
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(mx + mw - 27, btnY - 25, 4, 20);
        
        // Lever ball
        const ballGrad = ctx.createRadialGradient(mx + mw - 25, btnY - 25, 0, mx + mw - 25, btnY - 25, 7);
        ballGrad.addColorStop(0, '#ff4444');
        ballGrad.addColorStop(1, '#990000');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(mx + mw - 25, btnY - 28, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // SPIN text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPIN', mx + mw - 45, btnY + 2);
    }
    
    drawWinLines(ctx) {
        const flash = Math.sin(this.winLineFlash * 3) * 0.5 + 0.5;
        const mx = this.machineX;
        const my = this.machineY;
        const reelY = my + 40;
        const lineY = reelY + this.reelH / 2;
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + flash * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(mx + 20, lineY);
        ctx.lineTo(mx + this.machineW - 20, lineY);
        ctx.stroke();
        ctx.shadowBlur = 0;
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
        this.drawFullMachine();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
    }
}

// Export
window.ClassicSlotsFullGame = ClassicSlotsFullGame;
console.log('✅ Game 15: Classic Slots - Full Casino Design Loaded');
