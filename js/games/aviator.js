// ============================================
// EMERALD KING CASINO - AVIATOR
// Real Casino UI - Crash Game Style
// Full Redesign v3.0.0
// File: js/games/aviator.js
// ============================================

class AviatorFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.gamePhase = 'betting'; // betting, flying, crashed, cashedOut
        this.potentialWin = 0;
        this.winnings = 0;
        this.betPlaced = false;
        
        // Round history
        this.roundHistory = [];
        this.maxHistory = 8;
        
        // Graph
        this.graphPoints = [];
        this.graphStartTime = 0;
        this.flightTime = 0;
        this.maxGraphPoints = 300;
        
        // Jet
        this.jetX = 60;
        this.jetY = 0;
        this.jetAngle = 0;
        this.jetTrail = [];
        
        // Animation
        this.confettiParticles = [];
        this.explosionParticles = [];
        this.winGlowAlpha = 0;
        this.crashShakeAmount = 0;
        this.bgStars = [];
        
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
            bg: '#0a0a1a',
            bgDark: '#060612',
            graphBg: '#0d0d24',
            gridLine: 'rgba(255,255,255,0.04)',
            curveGreen: '#00e676',
            curveGlow: 'rgba(0,230,118,0.4)',
            curveRed: '#ff4444',
            curveGlowRed: 'rgba(255,68,68,0.4)',
            jetColor: '#00b0ff',
            jetGlow: 'rgba(0,176,255,0.5)',
            gold: '#FFD700',
            goldLight: '#f0d078',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#ff4444',
            green: '#00e676',
            white: '#ffffff'
        };
        
        // Graph dimensions
        this.graphX = 55;
        this.graphY = 35;
        this.graphW = 0;
        this.graphH = 0;
        
        // Generate background stars
        this.generateStars();
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
        this.graphW = this.w - 120;
        this.graphH = this.h - 200;
        this.calculateJetStart();
        this.loadHistory();
        this.generateSparkles();
        this.drawFullScreen();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.graphW = this.w - 120;
        this.graphH = this.h - 200;
        this.calculateJetStart();
        this.drawFullScreen();
    }
    
    calculateJetStart() {
        this.jetX = this.graphX + 10;
        this.jetY = this.graphY + this.graphH;
    }
    
    generateStars() {
        this.bgStars = [];
        for (let i = 0; i < 80; i++) {
            this.bgStars.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.3,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.005
            });
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
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('aviator_history');
            if (saved) {
                this.roundHistory = JSON.parse(saved);
                if (this.roundHistory.length > this.maxHistory) {
                    this.roundHistory = this.roundHistory.slice(-this.maxHistory);
                }
            }
        } catch (e) {
            this.roundHistory = [
                { multiplier: 1.52, crashed: true },
                { multiplier: 3.81, crashed: true },
                { multiplier: 1.03, crashed: true },
                { multiplier: 2.15, crashed: true },
                { multiplier: 1.00, crashed: true }
            ];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('aviator_history', JSON.stringify(this.roundHistory));
        } catch (e) {}
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    generateCrashPoint() {
        const r = Math.random();
        if (r < 0.01) return 1.00;
        const lambda = 0.10;
        const raw = 1 + (-Math.log(Math.random()) / lambda);
        return Math.min(100, Math.max(1.01, raw));
    }
    
    calculateMultiplier(seconds) {
        return Math.pow(Math.E, seconds * 0.13);
    }
    
    placeBet(amount) {
        if (this.gamePhase === 'flying' || this.gamePhase === 'crashed') return;
        
        this.bet = amount || this.bet;
        this.betPlaced = true;
        this.gamePhase = 'betting';
        this.drawFullScreen();
    }
    
    play(bet) {
        if (this.isFlying) return;
        
        if (bet) this.bet = bet;
        if (!this.betPlaced) this.placeBet(this.bet);
        
        this.isFlying = true;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.multiplier = 1.00;
        this.potentialWin = 0;
        this.winnings = 0;
        this.graphPoints = [];
        this.jetTrail = [];
        this.confettiParticles = [];
        this.explosionParticles = [];
        this.winGlowAlpha = 0;
        this.crashShakeAmount = 0;
        this.gamePhase = 'flying';
        
        this.crashPoint = this.generateCrashPoint();
        this.graphStartTime = performance.now();
        this.flightTime = 0;
        this.jetAngle = -0.3;
        
        // First graph point
        this.graphPoints.push({ x: this.graphX, y: this.graphY + this.graphH });
        this.jetTrail.push({ x: this.jetX, y: this.jetY });
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#00b0ff;">FLYING...</div>';
        }
        
        this.drawFullScreen();
    }
    
    cashOut() {
        if (!this.isFlying || this.hasCrashed || this.hasCashedOut) return;
        
        this.hasCashedOut = true;
        this.isFlying = false;
        this.gamePhase = 'cashedOut';
        this.winnings = Math.floor(this.bet * this.multiplier);
        this.chips += this.winnings;
        
        // Add to history
        this.roundHistory.push({ multiplier: this.multiplier, crashed: false });
        if (this.roundHistory.length > this.maxHistory) this.roundHistory.shift();
        this.saveHistory();
        
        this.generateConfetti();
        this.winGlowAlpha = 1.0;
        
        if (window.GameLoaderSystem) {
            GameLoaderSystem.showWinOverlay(this.winnings);
            GameLoaderSystem.updateBalance(this.chips);
        }
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:16px;">CASHED OUT! ' + this.multiplier.toFixed(2) + 'x +RS ' + this.winnings + '</div>';
        }
        
        this.drawFullScreen();
        
        setTimeout(() => {
            this.resetRound();
        }, 4000);
    }
    
    crash() {
        if (this.hasCrashed) return;
        
        this.hasCrashed = true;
        this.isFlying = false;
        this.gamePhase = 'crashed';
        this.crashShakeAmount = 15;
        
        // Add to history
        this.roundHistory.push({ multiplier: this.multiplier, crashed: true });
        if (this.roundHistory.length > this.maxHistory) this.roundHistory.shift();
        this.saveHistory();
        
        // Explosion particles
        const lastPoint = this.graphPoints[this.graphPoints.length - 1];
        if (lastPoint) {
            this.generateExplosion(lastPoint.x, lastPoint.y);
        }
        
        if (window.GameLoaderSystem) {
            GameLoaderSystem.showLoseOverlay(this.bet);
            GameLoaderSystem.updateBalance(this.chips);
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff4444;font-size:16px;">CRASHED! ' + this.multiplier.toFixed(2) + 'x -RS ' + this.bet + '</div>';
        }
        
        this.drawFullScreen();
        
        setTimeout(() => {
            this.resetRound();
        }, 4000);
    }
    
    resetRound() {
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.betPlaced = false;
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.potentialWin = 0;
        this.winnings = 0;
        this.graphPoints = [];
        this.jetTrail = [];
        this.confettiParticles = [];
        this.explosionParticles = [];
        this.winGlowAlpha = 0;
        this.crashShakeAmount = 0;
        this.gamePhase = 'betting';
        this.calculateJetStart();
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) resultDisplay.innerHTML = '';
        
        this.drawFullScreen();
    }
    
    generateExplosion(x, y) {
        this.explosionParticles = [];
        const colors = ['#ff4444', '#ff8800', '#ffaa00', '#FFD700', '#ffffff'];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.explosionParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: 0.01 + Math.random() * 0.03
            });
        }
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
        
        if (this.isFlying) {
            const elapsed = timestamp - this.graphStartTime;
            this.flightTime = elapsed / 1000;
            
            // Calculate multiplier
            this.multiplier = this.calculateMultiplier(this.flightTime);
            this.potentialWin = Math.floor(this.bet * this.multiplier);
            
            // Add graph point
            const progress = Math.min(this.flightTime / 8, 1);
            const gx = this.graphX + progress * this.graphW;
            const logMult = Math.log(this.multiplier) / Math.log(100);
            const gy = this.graphY + this.graphH - (logMult * this.graphH * 0.7);
            
            if (gx < this.graphX + this.graphW) {
                this.graphPoints.push({ x: gx, y: Math.max(this.graphY, gy) });
                if (this.graphPoints.length > this.maxGraphPoints) {
                    this.graphPoints.shift();
                }
            }
            
            // Update jet position
            if (this.graphPoints.length > 0) {
                const lastPoint = this.graphPoints[this.graphPoints.length - 1];
                this.jetX = lastPoint.x;
                this.jetY = lastPoint.y - 10;
                this.jetAngle = -0.3 + (this.multiplier - 1) * 0.02;
                this.jetAngle = Math.min(this.jetAngle, 0.8);
                
                this.jetTrail.push({ x: this.jetX, y: this.jetY + 5 });
                if (this.jetTrail.length > 40) this.jetTrail.shift();
            }
            
            // Check crash
            if (this.multiplier >= this.crashPoint) {
                this.multiplier = this.crashPoint;
                this.crash();
            }
        }
        
        // Crash shake decay
        if (this.crashShakeAmount > 0) {
            this.crashShakeAmount *= 0.9;
            if (this.crashShakeAmount < 0.5) this.crashShakeAmount = 0;
        }
        
        // Update explosion particles
        this.explosionParticles.forEach(function(p) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
        });
        this.explosionParticles = this.explosionParticles.filter(function(p) { return p.life > 0; });
        
        // Update confetti
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        }.bind(this));
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        // Win glow fade
        if (this.winGlowAlpha > 0 && this.gamePhase !== 'cashedOut') {
            this.winGlowAlpha -= 0.01;
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawGraph(ctx, w, h);
        this.drawJet(ctx);
        this.drawExplosionParticles(ctx);
        this.drawMultiplierDisplay(ctx, w, h);
        this.drawHistoryPanel(ctx, w, h);
        this.drawCashOutButton(ctx, w, h);
        this.drawBetInfo(ctx, w, h);
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
        // Dark space background
        const bgGrad = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w);
        bgGrad.addColorStop(0, '#0d0d24');
        bgGrad.addColorStop(0.5, '#080818');
        bgGrad.addColorStop(1, '#020208');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Stars
        for (const star of this.bgStars) {
            const twinkle = Math.sin(Date.now() * star.speed + star.twinkle) * 0.4 + 0.6;
            ctx.fillStyle = 'rgba(255,255,255,' + (twinkle * 0.6) + ')';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGraph(ctx, w, h) {
        const gx = this.graphX;
        const gy = this.graphY;
        const gw = this.graphW;
        const gh = this.graphH;
        
        // Graph background
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, gx - 5, gy - 5, gw + 10, gh + 10, 8);
        ctx.fill();
        ctx.stroke();
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const py = gy + (gh / 4) * i;
            ctx.beginPath();
            ctx.moveTo(gx, py);
            ctx.lineTo(gx + gw, py);
            ctx.stroke();
        }
        
        // Y-axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '8px Georgia';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const mult = 1 + i * 2;
            const py = gy + gh - (gh / 4) * i;
            ctx.fillText(mult.toFixed(1) + 'x', gx - 8, py + 3);
        }
        
        // Draw graph curve
        if (this.graphPoints.length > 1) {
            // Glow under curve
            ctx.strokeStyle = this.hasCrashed ? 'rgba(255,68,68,0.3)' : 'rgba(0,230,118,0.3)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
            
            // Main line
            ctx.strokeStyle = this.hasCrashed ? '#ff4444' : '#00e676';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
            
            // End point
            const last = this.graphPoints[this.graphPoints.length - 1];
            ctx.fillStyle = this.hasCrashed ? '#ff4444' : '#00e676';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // End point glow
            ctx.fillStyle = this.hasCrashed ? 'rgba(255,68,68,0.5)' : 'rgba(0,230,118,0.5)';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawJet(ctx) {
        if (!this.isFlying && !this.hasCrashed) return;
        if (this.jetTrail.length === 0) return;
        
        // Jet trail
        for (let i = 0; i < this.jetTrail.length; i++) {
            const t = this.jetTrail[i];
            const alpha = (i / this.jetTrail.length) * 0.4;
            ctx.fillStyle = 'rgba(0,176,255,' + alpha + ')';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Jet glow
        ctx.fillStyle = 'rgba(0,176,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.jetX, this.jetY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Jet body
        ctx.save();
        ctx.translate(this.jetX, this.jetY);
        ctx.rotate(this.jetAngle);
        
        ctx.fillStyle = '#00b0ff';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        
        // Jet highlight
        ctx.fillStyle = '#66d0ff';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-2, -3);
        ctx.lineTo(0, 0);
        ctx.lineTo(-2, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawMultiplierDisplay(ctx, w, h) {
        const mx = w - 80;
        const my = this.graphY + 5;
        
        // Box
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.isFlying ? '#00e676' : (this.hasCrashed ? '#ff4444' : 'rgba(255,255,255,0.2)');
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, mx - 10, my - 5, 75, 45, 8);
        ctx.fill();
        ctx.stroke();
        
        // Multiplier
        ctx.fillStyle = this.isFlying ? '#00e676' : (this.hasCrashed ? '#ff4444' : '#ffffff');
        ctx.font = 'bold 20px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', mx + 28, my + 14);
        
        // Potential win
        if (this.isFlying) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 9px Georgia';
            ctx.fillText('RS ' + this.potentialWin, mx + 28, my + 32);
        }
    }
    
    drawHistoryPanel(ctx, w, h) {
        const hx = 10;
        const hy = this.graphY;
        const hw = 40;
        const hh = this.graphH;
        
        // Panel
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, hx, hy, hw, hh, 6);
        ctx.fill();
        ctx.stroke();
        
        // Title
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 6px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('HISTORY', hx + hw / 2, hy + 10);
        
        // History items
        const recentHistory = this.roundHistory.slice(-6);
        for (let i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const iy = hy + 20 + i * 18;
            
            let color = item.crashed ? '#ff4444' : '#00e676';
            if (item.multiplier >= 5) color = '#FFD700';
            
            ctx.fillStyle = color;
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(item.multiplier.toFixed(1) + 'x', hx + hw / 2, iy);
        }
    }
    
    drawCashOutButton(ctx, w, h) {
        if (!this.isFlying || this.hasCrashed) return;
        
        const btnX = w / 2 - 60;
        const btnY = this.graphY + this.graphH + 15;
        const btnW = 120;
        const btnH = 40;
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.005) * 3 + 12;
        
        ctx.fillStyle = 'rgba(0,230,118,0.2)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,230,118,0.5)';
        ctx.shadowBlur = pulse;
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CASH OUT', btnX + btnW / 2, btnY + btnH / 2 - 5);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Georgia';
        ctx.fillText('RS ' + this.potentialWin, btnX + btnW / 2, btnY + btnH / 2 + 12);
    }
    
    drawBetInfo(ctx, w, h) {
        const biY = this.graphY + this.graphH + 70;
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        
        if (this.gamePhase === 'betting') {
            ctx.fillText('Bet: RS ' + this.bet + ' | Press DEAL to fly', w / 2, biY);
        } else if (this.gamePhase === 'cashedOut') {
            ctx.fillText('Cashed Out: +RS ' + this.winnings, w / 2, biY);
        } else if (this.gamePhase === 'crashed') {
            ctx.fillText('Crashed at ' + this.multiplier.toFixed(2) + 'x', w / 2, biY);
        }
    }
    
    drawExplosionParticles(ctx) {
        for (const p of this.explosionParticles) {
            ctx.fillStyle = p.color.replace(')', ', ' + p.life + ')').replace('rgb', 'rgba');
            if (p.color.startsWith('#')) {
                ctx.fillStyle = 'rgba(255,68,68,' + p.life + ')';
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
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
        const glowGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.6);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(255, 215, 0, ' + sp.opacity + ')';
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
    // LOOP
    // ============================================
    
    render() { this.drawFullScreen(); }
    setBet(amount) { this.bet = amount; this.placeBet(amount); }
    
    destroy() {
        this.isFlying = false;
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.explosionParticles = [];
        this.graphPoints = [];
        this.jetTrail = [];
    }
}

// Export
window.AviatorFullGame = AviatorFullGame;
console.log('Aviator v3.0.0 - Real Casino Crash Game Design Loaded');
