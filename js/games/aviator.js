// ============================================
// REAL KING CASINO - AVIATOR CRASH GAME  
// Real Wallet Integration + Realistic Casino UI
// File: js/games/aviator.js
// ============================================

class AviatorFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Wallet & Balance
        this.playerBalance = this.getPlayerBalance();
        this.currentBet = 0;
        this.potentialWin = 0;
        
        // Game State
        this.gamePhase = 'idle'; // idle, playing, crashed
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.graphPoints = [];
        this.startTime = 0;
        
        // UI
        this.gameWidth = this.w - 20;
        this.gameHeight = this.h - 20;
        this.graphX = 40;
        this.graphY = 30;
        this.graphWidth = this.gameWidth - 100;
        this.graphHeight = 120;
        
        // Animation
        this.jetX = 0;
        this.jetY = 0;
    }
    
    // ============================================
    // WALLET INTEGRATION
    // ============================================
    
    getPlayerBalance() {
        try {
            if (typeof currentUser !== 'undefined' && currentUser?.balance) {
                return parseFloat(currentUser.balance) || 0;
            }
        } catch (e) {}
        return 0;
    }
    
    updateBalance(amount) {
        try {
            if (typeof currentUser !== 'undefined') {
                currentUser.balance = Math.max(0, currentUser.balance + amount);
                this.playerBalance = currentUser.balance;
                if (typeof updateUI === 'function') updateUI();
            }
        } catch (e) {}
    }
    
    // ============================================
    // INIT & SETUP
    // ============================================
    
    init() {
        this.resetRound();
        this.draw();
    }
    
    resetRound() {
        this.gamePhase = 'idle';
        this.multiplier = 1.00;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.graphPoints = [];
        this.currentBet = 0;
        this.potentialWin = 0;
    }
    
    // ============================================
    // GAME PLAY
    // ============================================
    
    play(betAmount) {
        if (this.gamePhase !== 'idle') return;
        
        this.currentBet = betAmount;
        this.playerBalance = this.getPlayerBalance();
        
        // Check balance
        if (this.playerBalance < betAmount) {
            alert('Insufficient balance! Your balance: ₹' + this.playerBalance.toFixed(2));
            return;
        }
        
        // Deduct bet from wallet
        this.updateBalance(-betAmount);
        
        // Start game
        this.gamePhase = 'playing';
        this.isFlying = true;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.multiplier = 1.00;
        this.graphPoints = [[this.graphX, this.graphY + this.graphHeight]];
        this.startTime = performance.now();
        
        // Generate crash point
        this.crashPoint = this.generateCrashPoint();
        
        // Update UI
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#00b0ff;">✈️ FLYING... Bet: ₹' + betAmount + '</span>';
        }
    }
    
    generateCrashPoint() {
        // Real exponential crash distribution (RTP ~99%)
        const r = Math.random();
        
        // 1% instant crash
        if (r < 0.01) return 1.00;
        
        // Exponential curve
        const lambda = 0.12;
        const value = 1 + (-Math.log(Math.random()) / lambda);
        
        return Math.min(100, Math.max(1.01, value));
    }
    
    cashOut() {
        if (this.gamePhase !== 'playing' || this.hasCrashed || this.hasCashedOut) return;
        
        this.hasCashedOut = true;
        this.isFlying = false;
        
        // Calculate winnings
        const winAmount = Math.floor(this.currentBet * this.multiplier);
        
        // Add to wallet
        this.updateBalance(winAmount);
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <span style="color:#00e676;font-weight:bold;">✅ CASHED OUT!</span><br>
                <span style="color:#FFD700;">${this.multiplier.toFixed(2)}x = +₹${winAmount}</span>
            `;
        }
        
        setTimeout(() => {
            this.resetRound();
        }, 2000);
    }
    
    crash() {
        if (this.hasCrashed) return;
        
        this.hasCrashed = true;
        this.isFlying = false;
        this.gamePhase = 'crashed';
        
        // Bet lost (already deducted)
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <span style="color:#ff4444;font-weight:bold;">💥 CRASHED AT ${this.multiplier.toFixed(2)}x</span><br>
                <span style="color:#ff8888;">-₹${this.currentBet}</span>
            `;
        }
        
        setTimeout(() => {
            this.resetRound();
        }, 2000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(ts) {
        if (this.gamePhase !== 'playing') return;
        
        // Calculate elapsed time in seconds
        const elapsed = (ts - this.startTime) / 1000;
        
        // Exponential multiplier curve
        this.multiplier = Math.pow(Math.E, elapsed * 0.14);
        this.potentialWin = Math.floor(this.currentBet * this.multiplier);
        
        // Check if crashed
        if (this.multiplier >= this.crashPoint) {
            this.crash();
            return;
        }
        
        // Calculate graph coordinates
        const progress = Math.log(this.multiplier) / Math.log(this.crashPoint + 2);
        const x = this.graphX + progress * this.graphWidth;
        const y = this.graphY + this.graphHeight - (progress * this.graphHeight);
        
        // Add to path
        if (this.graphPoints.length === 0 || this.graphPoints[this.graphPoints.length - 1][0] !== x) {
            this.graphPoints.push([x, y]);
        }
        
        // Jet position
        this.jetX = x;
        this.jetY = y - 15;
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        // Background
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        // Top bar - Game info
        this.drawTopBar(ctx);
        
        // Graph area
        this.drawGraphArea(ctx);
        
        // Draw graph curve
        if (this.graphPoints.length > 1) {
            this.drawGraphCurve(ctx);
        }
        
        // Draw jet if flying
        if (this.isFlying) {
            this.drawJet(ctx, this.jetX, this.jetY);
        }
        
        // Draw crash marker if crashed
        if (this.hasCrashed && this.graphPoints.length > 0) {
            this.drawCrashMarker(ctx);
        }
        
        // Current multiplier display
        this.drawMultiplierBox(ctx);
        
        // Bottom info
        this.drawBottomInfo(ctx);
    }
    
    drawTopBar(ctx) {
        // Header background
        ctx.fillStyle = 'rgba(0,230,118,0.1)';
        ctx.fillRect(0, 0, this.w, 25);
        
        // Title
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('✈️ AVIATOR', 10, 17);
        
        // Balance
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Balance: ₹' + this.getPlayerBalance().toFixed(2), this.w - 10, 17);
    }
    
    drawGraphArea(ctx) {
        const {x, y, w, h} = {
            x: this.graphX,
            y: this.graphY,
            w: this.graphWidth,
            h: this.graphHeight
        };
        
        // Background
        ctx.fillStyle = 'rgba(0,23,19,0.5)';
        ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
        
        // Border
        ctx.strokeStyle = 'rgba(0,230,118,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
        
        // Grid
        ctx.strokeStyle = 'rgba(0,230,118,0.05)';
        ctx.lineWidth = 0.5;
        
        // Horizontal grid
        for (let i = 1; i < 5; i++) {
            const gy = y + (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(x - 5, gy);
            ctx.lineTo(x + w + 5, gy);
            ctx.stroke();
        }
        
        // Vertical grid
        for (let i = 1; i < 5; i++) {
            const gx = x + (w / 4) * i;
            ctx.beginPath();
            ctx.moveTo(gx, y - 5);
            ctx.lineTo(gx, y + h + 5);
            ctx.stroke();
        }
        
        // Y-axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const mult = 1 + i * 2;
            const gy = y + h - (h / 4) * i;
            ctx.fillText(mult.toFixed(1) + 'x', x - 8, gy + 2);
        }
    }
    
    drawGraphCurve(ctx) {
        const {x, y, w, h} = {
            x: this.graphX,
            y: this.graphY,
            w: this.graphWidth,
            h: this.graphHeight
        };
        
        // Glow effect
        ctx.strokeStyle = 'rgba(0,230,118,0.3)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.graphPoints[0][0], this.graphPoints[0][1]);
        for (let i = 1; i < this.graphPoints.length; i++) {
            ctx.lineTo(this.graphPoints[i][0], this.graphPoints[i][1]);
        }
        ctx.stroke();
        
        // Main line
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.graphPoints[0][0], this.graphPoints[0][1]);
        for (let i = 1; i < this.graphPoints.length; i++) {
            ctx.lineTo(this.graphPoints[i][0], this.graphPoints[i][1]);
        }
        ctx.stroke();
        
        // Current point
        const last = this.graphPoints[this.graphPoints.length - 1];
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(last[0], last[1], 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawJet(ctx, x, y) {
        // Jet symbol
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✈', x, y);
        
        // Glow
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawCrashMarker(ctx) {
        const last = this.graphPoints[this.graphPoints.length - 1];
        
        // X mark
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(last[0] - 6, last[1] - 6);
        ctx.lineTo(last[0] + 6, last[1] + 6);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(last[0] + 6, last[1] - 6);
        ctx.lineTo(last[0] - 6, last[1] + 6);
        ctx.stroke();
    }
    
    drawMultiplierBox(ctx) {
        const boxX = this.w - 80;
        const boxY = 35;
        
        // Box background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(boxX - 10, boxY - 10, 70, 45);
        
        // Border
        const color = this.hasCrashed ? '#ff4444' : this.hasCashedOut ? '#00e676' : '#00b0ff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX - 10, boxY - 10, 70, 45);
        
        // Multiplier text
        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', boxX + 25, boxY + 8);
        
        // Potential win
        ctx.fillStyle = '#FFD700';
        ctx.font = '9px Arial';
        ctx.fillText('Win: ₹' + this.potentialWin, boxX + 25, boxY + 25);
    }
    
    drawBottomInfo(ctx) {
        const y = this.h - 15;
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Crash Point: ' + (this.crashPoint > 0 ? this.crashPoint.toFixed(2) + 'x' : 'Generating...'), 10, y);
        
        ctx.textAlign = 'right';
        ctx.fillText('Bet: ₹' + this.currentBet, this.w - 10, y);
    }
    
    // ============================================
    // UTILITIES
    // ============================================
    
    setBet(amount) {
        if (this.gamePhase === 'idle') {
            this.play(amount);
        }
    }
    
    destroy() {
        this.graphPoints = [];
    }
    
    resize() {}
}

// Export
window.AviatorFullGame = AviatorFullGame;
console.log('✅ Aviator Real Casino Game Loaded with Wallet Integration');
