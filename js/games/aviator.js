// ============================================
// AVIATOR GAME - COMPLETE REAL VERSION v4.0
// Professional Casino Crash Game
// ============================================

class AviatorFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas setup
        this.w = canvas.width;
        this.h = canvas.height;
        
        // Game state
        this.gameState = 'idle'; // idle, betting, flying, crashed
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.elapsedTime = 0;
        this.gameStartTime = 0;
        
        // Bets
        this.bet1 = {
            amount: 1.00,
            isActive: false,
            autoCashout: 0,
            hasCashedOut: false,
            winAmount: 0,
            status: 'idle' // idle, active, won, lost
        };
        
        this.bet2 = {
            amount: 1.00,
            isActive: false,
            autoCashout: 0,
            hasCashedOut: false,
            winAmount: 0,
            status: 'idle'
        };
        
        this.balance = 100.00;
        this.currency = 'USD';
        
        // Graph & Animation
        this.graphPoints = [];
        this.graphHistory = [];
        this.maxHistory = 12;
        this.bettingTimeRemaining = 5; // 5 seconds to place bets
        this.bettingTimer = null;
        
        // Jet animation
        this.jetX = 0;
        this.jetY = 0;
        this.jetAngle = 0;
        this.jetTrail = [];
        
        // Particles
        this.particles = {
            explosion: [],
            confetti: [],
            smoke: []
        };
        
        // UI State
        this.uiState = {
            bet1Visible: true,
            bet2Visible: true,
            selectedTab: 'all' // all, previous, top
        };
        
        // Player stats
        this.playersData = [
            { name: 'Player_X2K', amount: 2365.98, multiplier: 12.5, avatar: '👤' },
            { name: 'Pro_Gambler', amount: 1850.50, multiplier: 8.3, avatar: '👤' },
            { name: 'Lucky_One', amount: 1420.00, multiplier: 6.8, avatar: '👤' }
        ];
        
        this.historyRounds = [];
        
        // Colors matching image
        this.colors = {
            bg: '#000000',
            darkBg: '#0a0a0a',
            gold: '#FFD700',
            goldDark: '#D4AF37',
            green: '#00FF41',
            red: '#FF3333',
            blue: '#00BFFF',
            text: '#FFFFFF',
            textGray: '#999999',
            cardBg: 'rgba(255, 215, 0, 0.08)',
            cardBorder: 'rgba(255, 215, 0, 0.3)'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.loadGameData();
        this.generateRandomHistory();
        this.drawFullScreen();
    }
    
    loadGameData() {
        try {
            const saved = localStorage.getItem('aviator_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.balance = data.balance || 100;
                this.historyRounds = data.history || [];
            }
        } catch (e) {
            console.warn('Could not load saved data');
        }
    }
    
    saveGameData() {
        try {
            localStorage.setItem('aviator_data', JSON.stringify({
                balance: this.balance,
                history: this.historyRounds.slice(-this.maxHistory)
            }));
        } catch (e) {}
    }
    
    generateRandomHistory() {
        if (this.historyRounds.length === 0) {
            for (let i = 0; i < 6; i++) {
                this.historyRounds.push({
                    multiplier: (1 + Math.random() * 10).toFixed(2),
                    crashed: true
                });
            }
        }
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBet(amount) {
        if (this.gameState !== 'idle') return;
        this.bet1.amount = amount;
        this.bet2.amount = amount;
    }
    
    setAutoCashout(bet, amount) {
        if (bet === 1) {
            this.bet1.autoCashout = amount;
        } else {
            this.bet2.autoCashout = amount;
        }
    }
    
    placeBet(betNumber) {
        const bet = betNumber === 1 ? this.bet1 : this.bet2;
        
        // Check balance
        if (bet.amount > this.balance) {
            alert('Insufficient balance! You have ' + this.balance.toFixed(2) + ' ' + this.currency);
            return;
        }
        
        // Deduct from balance
        this.balance -= bet.amount;
        bet.isActive = true;
        bet.status = 'active';
        bet.hasCashedOut = false;
        bet.winAmount = 0;
        
        // Start game if both bets placed or after delay
        if (this.bet1.isActive && this.bet2.isActive) {
            this.startGame();
        } else if (this.bet1.isActive && !this.bet2.isActive) {
            // Start with just bet1
            setTimeout(() => {
                if (this.gameState === 'betting') {
                    this.startGame();
                }
            }, 2000);
        }
    }
    
    startGame() {
        if (this.gameState !== 'betting' && this.gameState !== 'idle') return;
        
        this.gameState = 'flying';
        this.multiplier = 1.00;
        this.elapsedTime = 0;
        this.gameStartTime = performance.now();
        this.graphPoints = [];
        this.jetTrail = [];
        this.particles = { explosion: [], confetti: [], smoke: [] };
        
        // Generate crash point (realistic distribution)
        this.crashPoint = this.generateCrashPoint();
        
        // Reset bets
        this.bet1.hasCashedOut = false;
        this.bet2.hasCashedOut = false;
    }
    
    generateCrashPoint() {
        const rand = Math.random();
        
        // Weighted distribution
        if (rand < 0.10) return 1.00 + Math.random() * 0.20; // 10% instant crash
        if (rand < 0.30) return 1.20 + Math.random() * 0.80; // 20% early crash
        if (rand < 0.60) return 2.00 + Math.random() * 3.00; // 30% mid crash
        if (rand < 0.85) return 5.00 + Math.random() * 5.00; // 25% high crash
        return 10.00 + Math.random() * 40.00; // 15% very high crash
    }
    
    calculateMultiplier(seconds) {
        // e^(0.13 * t) - realistic crash game formula
        return Math.pow(Math.E, seconds * 0.13);
    }
    
    cashout(betNumber) {
        const bet = betNumber === 1 ? this.bet1 : this.bet2;
        
        if (!bet.isActive || bet.hasCashedOut) return false;
        if (this.gameState !== 'flying') return false;
        
        bet.hasCashedOut = true;
        bet.winAmount = Math.floor(bet.amount * this.multiplier * 100) / 100;
        bet.status = 'won';
        this.balance += bet.winAmount;
        
        // Check if both cashed out
        if (this.bet1.hasCashedOut && this.bet2.hasCashedOut) {
            this.endGame(false);
        }
        
        this.saveGameData();
        return true;
    }
    
    crash() {
        if (this.gameState !== 'flying') return;
        
        this.gameState = 'crashed';
        
        // Handle bets
        if (this.bet1.isActive && !this.bet1.hasCashedOut) {
            this.bet1.status = 'lost';
        }
        if (this.bet2.isActive && !this.bet2.hasCashedOut) {
            this.bet2.status = 'lost';
        }
        
        this.generateExplosion(this.jetX, this.jetY);
        
        setTimeout(() => {
            this.endGame(true);
        }, 1500);
    }
    
    endGame(crashed) {
        // Save to history
        const round = {
            multiplier: this.multiplier.toFixed(2),
            crashed: crashed,
            timestamp: Date.now()
        };
        this.historyRounds.unshift(round);
        if (this.historyRounds.length > this.maxHistory) {
            this.historyRounds.pop();
        }
        
        // Reset for next round
        setTimeout(() => {
            this.gameState = 'betting';
            this.bet1 = { ...this.bet1, isActive: false, hasCashedOut: false, status: 'idle', winAmount: 0 };
            this.bet2 = { ...this.bet2, isActive: false, hasCashedOut: false, status: 'idle', winAmount: 0 };
            this.multiplier = 1.00;
            this.graphPoints = [];
            this.jetTrail = [];
            this.saveGameData();
        }, 2000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        if (this.gameState === 'flying') {
            const elapsed = timestamp - this.gameStartTime;
            this.elapsedTime = elapsed / 1000;
            this.multiplier = this.calculateMultiplier(this.elapsedTime);
            
            // Add graph point
            if (this.graphPoints.length === 0 || this.elapsedTime % 0.05 < 0.06) {
                const progress = Math.min(this.elapsedTime / 10, 1);
                const x = 50 + progress * 280; // Graph width
                const y = 250 - Math.log(this.multiplier) * 30; // Logarithmic scale
                this.graphPoints.push({ x, y, mult: this.multiplier });
            }
            
            // Update jet position
            if (this.graphPoints.length > 0) {
                const lastPoint = this.graphPoints[this.graphPoints.length - 1];
                this.jetX = lastPoint.x;
                this.jetY = lastPoint.y;
                this.jetAngle = Math.min(Math.atan2(this.jetY - 250, this.jetX - 50) + Math.PI, 0.8);
            }
            
            // Auto cashout
            if (this.bet1.autoCashout > 0 && this.multiplier >= this.bet1.autoCashout && !this.bet1.hasCashedOut) {
                this.cashout(1);
            }
            if (this.bet2.autoCashout > 0 && this.multiplier >= this.bet2.autoCashout && !this.bet2.hasCashedOut) {
                this.cashout(2);
            }
            
            // Check crash
            if (this.multiplier >= this.crashPoint) {
                this.crash();
            }
        }
        
        // Update particles
        this.particles.explosion.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.03;
        });
        this.particles.explosion = this.particles.explosion.filter(p => p.life > 0);
        
        this.particles.confetti.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.015;
        });
        this.particles.confetti = this.particles.confetti.filter(p => p.opacity > 0);
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    render() {
        this.drawFullScreen();
    }
    
    drawFullScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.w, this.h);
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.w, this.h);
        
        // Draw sections
        this.drawHeader(ctx);
        this.drawGameArea(ctx);
        this.drawBettingArea(ctx);
        this.drawBottomStats(ctx);
        this.drawParticles(ctx);
    }
    
    drawHeader(ctx) {
        // Title
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 28px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Aviator', 20, 35);
        
        // Current multiplier
        ctx.fillStyle = this.gameState === 'flying' ? this.colors.green : 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', this.w - 20, 40);
        
        // Balance
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 13px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('Balance: $' + this.balance.toFixed(2), this.w - 20, 65);
        
        // Divider
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, 75);
        ctx.lineTo(this.w - 10, 75);
        ctx.stroke();
    }
    
    drawGameArea(ctx) {
        // Graph area
        const gx = 30, gy = 85, gw = 300, gh = 180;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = this.colors.cardBorder;
        ctx.lineWidth = 1;
        ctx.fillRect(gx, gy, gw, gh);
        ctx.strokeRect(gx, gy, gw, gh);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 1; i < 4; i++) {
            const y = gy + (gh / 4) * i;
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + gw, y);
            ctx.stroke();
        }
        
        // Axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const mult = 1 + i * 3;
            const y = gy + gh - (gh / 4) * i;
            ctx.fillText(mult + 'x', gx - 8, y + 3);
        }
        
        // Draw graph curve
        if (this.graphPoints.length > 1) {
            ctx.strokeStyle = this.gameState === 'crashed' ? this.colors.red : this.colors.green;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
        }
        
        // Draw jet
        if (this.gameState === 'flying' && this.graphPoints.length > 0) {
            const lastPoint = this.graphPoints[this.graphPoints.length - 1];
            ctx.save();
            ctx.translate(lastPoint.x, lastPoint.y);
            ctx.rotate(this.jetAngle);
            
            // Jet body
            ctx.fillStyle = this.colors.blue;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-3, -4);
            ctx.lineTo(-1, 0);
            ctx.lineTo(-3, 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Game state text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        const stateText = this.gameState === 'flying' ? '✈️ FLYING' : 
                         this.gameState === 'crashed' ? '💥 CRASHED' : 'Waiting...';
        ctx.fillText(stateText, gx + gw / 2, gy + gh + 20);
    }
    
    drawBettingArea(ctx) {
        const startY = 280;
        const cardWidth = (this.w - 40) / 2 - 10;
        const cardHeight = 140;
        
        // BET 1
        this.drawBetCard(ctx, 20, startY, cardWidth, cardHeight, this.bet1, '1');
        
        // BET 2
        this.drawBetCard(ctx, 20 + cardWidth + 20, startY, cardWidth, cardHeight, this.bet2, '2');
    }
    
    drawBetCard(ctx, x, y, w, h, bet, num) {
        // Card background
        ctx.fillStyle = bet.status === 'won' ? 'rgba(0, 255, 65, 0.1)' : 
                       bet.status === 'lost' ? 'rgba(255, 51, 51, 0.1)' : this.colors.cardBg;
        ctx.strokeStyle = bet.status === 'won' ? this.colors.green :
                         bet.status === 'lost' ? this.colors.red : this.colors.cardBorder;
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        // Title
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 13px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Bet ' + num, x + 12, y + 20);
        
        // Amount display
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 18px Inter';
        ctx.fillText('$' + bet.amount.toFixed(2), x + 12, y + 45);
        
        // Auto button
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 1;
        ctx.fillRect(x + 12, y + 55, 50, 20);
        ctx.strokeRect(x + 12, y + 55, 50, 20);
        
        ctx.fillStyle = this.colors.gold;
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Auto', x + 37, y + 68);
        
        // Status
        if (bet.status === 'won') {
            ctx.fillStyle = this.colors.green;
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText('Won: $' + bet.winAmount.toFixed(2), x + w - 12, y + 120);
        } else if (bet.status === 'lost') {
            ctx.fillStyle = this.colors.red;
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText('Lost', x + w - 12, y + 120);
        } else if (bet.status === 'active') {
            ctx.fillStyle = this.colors.green;
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'right';
            const potential = bet.amount * this.multiplier;
            ctx.fillText('Potential: $' + potential.toFixed(2), x + w - 12, y + 120);
        }
    }
    
    drawBottomStats(ctx) {
        const y = 430;
        
        // Divider
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(this.w - 10, y);
        ctx.stroke();
        
        // Tabs
        const tabs = ['All Bets', 'Previous', 'Top'];
        const tabX = 20;
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'left';
        for (let i = 0; i < tabs.length; i++) {
            const x = tabX + i * 80;
            ctx.fillText(tabs[i], x, y + 25);
        }
        
        // Stats
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('299/430 Bets', this.w - 20, y + 25);
        
        // Players section
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Recent Wins', 20, y + 60);
        
        let playerY = y + 80;
        for (let i = 0; i < Math.min(3, this.playersData.length); i++) {
            const p = this.playersData[i];
            
            // Avatar
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(35 + i * 100, playerY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = this.colors.gold;
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p.avatar, 35 + i * 100, playerY + 4);
            
            // Name & amount
            ctx.fillStyle = this.colors.text;
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p.name.substring(0, 8), 35 + i * 100, playerY + 25);
            
            ctx.fillStyle = this.colors.green;
            ctx.font = 'bold 9px Inter';
            ctx.fillText('$' + p.amount.toFixed(2), 35 + i * 100, playerY + 37);
        }
        
        // Total wins
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('Total: $2,365.98 USD', this.w - 20, this.h - 15);
    }
    
    drawParticles(ctx) {
        // Explosion particles
        for (const p of this.particles.explosion) {
            ctx.fillStyle = 'rgba(255, 51, 51, ' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Confetti
        for (const p of this.particles.confetti) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    generateExplosion(x, y) {
        const colors = ['#FF3333', '#FF8800', '#FFD700', '#FFFFFF'];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.particles.explosion.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 3,
                life: 1
            });
        }
    }
    
    generateConfetti(x, y) {
        const colors = ['#FF3333', '#00FF41', '#FFD700', '#00BFFF'];
        for (let i = 0; i < 50; i++) {
            this.particles.confetti.push({
                x: x + (Math.random() - 0.5) * 100,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -3 - Math.random() * 3,
                w: 4 + Math.random() * 6,
                h: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                opacity: 1
            });
        }
    }
    
    // ============================================
    // PUBLIC METHODS
    // ============================================
    
    setBetAmount(amount) {
        this.bet1.amount = parseFloat(amount);
        this.bet2.amount = parseFloat(amount);
    }
    
    placeBet1() {
        this.placeBet(1);
    }
    
    placeBet2() {
        this.placeBet(2);
    }
    
    cashOut1() {
        if (this.cashout(1)) {
            this.generateConfetti(this.w / 2, 300);
        }
    }
    
    cashOut2() {
        if (this.cashout(2)) {
            this.generateConfetti(this.w / 2, 300);
        }
    }
    
    destroy() {
        this.gameState = 'idle';
        this.saveGameData();
    }
    
    resize() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
    }
}

window.AviatorFullGame = AviatorFullGame;
console.log('✅ Aviator Game v4.0 - Complete Real Version Loaded');
