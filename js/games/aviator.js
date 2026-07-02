// ============================================
// EMERALD KING CASINO - AVIATOR v3.1
// Real Casino UI - Crash Game with Full Logic
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
        this.bet1 = 0;
        this.bet2 = 0;
        this.chips = 3000;
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.isFlying = false;
        this.hasCrashed = false;
        this.isCashedOut = false;
        this.gamePhase = 'betting'; // betting, flying, crashed, cashedOut
        this.potentialWin1 = 0;
        this.potentialWin2 = 0;
        this.winnings1 = 0;
        this.winnings2 = 0;
        
        // Bet state tracking
        this.bet1Placed = false;
        this.bet2Placed = false;
        this.cashoutCount = 0;
        
        // Round history
        this.roundHistory = [];
        this.maxHistory = 8;
        this.playersList = [];
        
        // Graph
        this.graphPoints = [];
        this.graphStartTime = 0;
        this.flightTime = 0;
        this.maxGraphPoints = 300;
        
        // Jet animation
        this.jetX = 60;
        this.jetY = 0;
        this.jetAngle = 0;
        this.jetTrail = [];
        
        // Particle effects
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
        
        // Colors - Dark gold theme matching image
        this.palette = {
            bg: '#0a0a0a',
            bgDark: '#050505',
            graphBg: '#1a1a2e',
            gridLine: 'rgba(255, 215, 0, 0.1)',
            curveGreen: '#00e676',
            curveGold: '#FFD700',
            curveRed: '#ff4444',
            jetColor: '#00b0ff',
            gold: '#FFD700',
            goldLight: '#f0d078',
            textPrimary: '#ffffff',
            textDim: 'rgba(255, 255, 255, 0.5)',
            red: '#ff4444',
            green: '#00e676',
            white: '#ffffff'
        };
        
        // Graph dimensions
        this.graphX = 55;
        this.graphY = 35;
        this.graphW = 0;
        this.graphH = 0;
        
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
        this.graphH = this.h - 220;
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
        this.graphH = this.h - 220;
        this.calculateJetStart();
        this.drawFullScreen();
    }
    
    calculateJetStart() {
        this.jetX = this.graphX + 10;
        this.jetY = this.graphY + this.graphH;
    }
    
    generateStars() {
        this.bgStars = [];
        for (let i = 0; i < 50; i++) {
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
        for (let i = 0; i < 15; i++) {
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
                { multiplier: 2.15, crashed: true }
            ];
        }
        
        // Generate sample player list
        this.playersList = [
            { name: 'Player 1', payout: 2365.98, avatar: '👤' },
            { name: 'Player 2', payout: 1855.50, avatar: '👤' },
            { name: 'Player 3', payout: 1420.00, avatar: '👤' }
        ];
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
    
    setBet(amount) {
        this.bet1 = amount;
        this.bet2 = amount;
        this.bet1Placed = true;
        this.bet2Placed = true;
    }
    
    play(bet) {
        if (this.isFlying) return;
        
        if (bet) this.setBet(bet);
        
        if (!this.bet1Placed && !this.bet2Placed) return;
        
        this.isFlying = true;
        this.hasCrashed = false;
        this.isCashedOut = false;
        this.multiplier = 1.00;
        this.potentialWin1 = 0;
        this.potentialWin2 = 0;
        this.winnings1 = 0;
        this.winnings2 = 0;
        this.cashoutCount = 0;
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
        
        this.graphPoints.push({ x: this.graphX, y: this.graphY + this.graphH });
        this.jetTrail.push({ x: this.jetX, y: this.jetY });
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">✈️ FLYING...</div>';
        }
        
        this.drawFullScreen();
    }
    
    cashOut() {
        if (!this.isFlying || this.hasCrashed || this.isCashedOut) return;
        
        this.isCashedOut = true;
        this.cashoutCount++;
        
        if (this.bet1Placed && this.bet1 > 0) {
            this.winnings1 = Math.floor(this.bet1 * this.multiplier);
            this.chips += this.winnings1;
        }
        
        if (this.bet2Placed && this.bet2 > 0) {
            this.winnings2 = Math.floor(this.bet2 * this.multiplier);
            this.chips += this.winnings2;
        }
        
        const totalWin = this.winnings1 + this.winnings2;
        
        this.roundHistory.push({ multiplier: this.multiplier, crashed: false });
        if (this.roundHistory.length > this.maxHistory) this.roundHistory.shift();
        this.saveHistory();
        
        this.generateConfetti();
        this.winGlowAlpha = 1.0;
        
        if (window.GameLoaderSystem) {
            GameLoaderSystem.showWinOverlay(totalWin);
            GameLoaderSystem.updateBalance(this.chips);
        }
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div class="info-badge" style="color:#00e676;font-size:16px;">✅ CASHED OUT! ${this.multiplier.toFixed(2)}x +₹${totalWin}</div>`;
        }
        
        this.isFlying = false;
        this.gamePhase = 'cashedOut';
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
        
        let lostAmount = 0;
        if (this.bet1Placed && this.bet1 > 0 && !this.isCashedOut) lostAmount += this.bet1;
        if (this.bet2Placed && this.bet2 > 0 && !this.isCashedOut) lostAmount += this.bet2;
        
        this.roundHistory.push({ multiplier: this.multiplier, crashed: true });
        if (this.roundHistory.length > this.maxHistory) this.roundHistory.shift();
        this.saveHistory();
        
        const lastPoint = this.graphPoints[this.graphPoints.length - 1];
        if (lastPoint) {
            this.generateExplosion(lastPoint.x, lastPoint.y);
        }
        
        if (window.GameLoaderSystem && lostAmount > 0) {
            GameLoaderSystem.showLoseOverlay(lostAmount);
            GameLoaderSystem.updateBalance(this.chips);
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div class="info-badge" style="color:#ff4444;font-size:16px;">💥 CRASHED! ${this.multiplier.toFixed(2)}x ${lostAmount > 0 ? '-₹' + lostAmount : ''}</div>`;
        }
        
        this.drawFullScreen();
        
        setTimeout(() => {
            this.resetRound();
        }, 4000);
    }
    
    resetRound() {
        this.isFlying = false;
        this.hasCrashed = false;
        this.isCashedOut = false;
        this.bet1Placed = false;
        this.bet2Placed = false;
        this.bet1 = 0;
        this.bet2 = 0;
        this.multiplier = 1.00;
        this.crashPoint = 0;
        this.potentialWin1 = 0;
        this.potentialWin2 = 0;
        this.winnings1 = 0;
        this.winnings2 = 0;
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
            
            this.multiplier = this.calculateMultiplier(this.flightTime);
            
            if (this.bet1Placed && this.bet1 > 0) {
                this.potentialWin1 = Math.floor(this.bet1 * this.multiplier);
            }
            if (this.bet2Placed && this.bet2 > 0) {
                this.potentialWin2 = Math.floor(this.bet2 * this.multiplier);
            }
            
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
            
            if (this.graphPoints.length > 0) {
                const lastPoint = this.graphPoints[this.graphPoints.length - 1];
                this.jetX = lastPoint.x;
                this.jetY = lastPoint.y - 10;
                this.jetAngle = -0.3 + (this.multiplier - 1) * 0.02;
                this.jetAngle = Math.min(this.jetAngle, 0.8);
                
                this.jetTrail.push({ x: this.jetX, y: this.jetY + 5 });
                if (this.jetTrail.length > 40) this.jetTrail.shift();
            }
            
            if (this.multiplier >= this.crashPoint) {
                this.multiplier = this.crashPoint;
                this.crash();
            }
        }
        
        if (this.crashShakeAmount > 0) {
            this.crashShakeAmount *= 0.9;
            if (this.crashShakeAmount < 0.5) this.crashShakeAmount = 0;
        }
        
        this.explosionParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
        });
        this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);
        
        this.confettiParticles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(p => p.opacity > 0);
        
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
        this.drawBettingCards(ctx, w, h);
        this.drawHistoryPanel(ctx, w, h);
        this.drawCashOutButton(ctx, w, h);
        this.drawPlayersSection(ctx, w, h);
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
        const bgGrad = ctx.createRadialGradient(w / 2, h * 0.3, 10, w / 2, h * 0.3, w);
        bgGrad.addColorStop(0, '#1a0000');
        bgGrad.addColorStop(0.5, '#0d0000');
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
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
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, gx - 5, gy - 5, gw + 10, gh + 10, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const py = gy + (gh / 4) * i;
            ctx.beginPath();
            ctx.moveTo(gx, py);
            ctx.lineTo(gx + gw, py);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px Inter';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const mult = 1 + i * 2;
            const py = gy + gh - (gh / 4) * i;
            ctx.fillText(mult.toFixed(1) + 'x', gx - 8, py + 3);
        }
        
        if (this.graphPoints.length > 1) {
            ctx.strokeStyle = this.hasCrashed ? 'rgba(255,68,68,0.3)' : 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
            
            ctx.strokeStyle = this.hasCrashed ? '#ff4444' : '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
            
            const last = this.graphPoints[this.graphPoints.length - 1];
            ctx.fillStyle = this.hasCrashed ? '#ff4444' : '#FFD700';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = this.hasCrashed ? 'rgba(255,68,68,0.5)' : 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawJet(ctx) {
        if (!this.isFlying && !this.hasCrashed) return;
        if (this.jetTrail.length === 0) return;
        
        for (let i = 0; i < this.jetTrail.length; i++) {
            const t = this.jetTrail[i];
            const alpha = (i / this.jetTrail.length) * 0.4;
            ctx.fillStyle = 'rgba(0,176,255,' + alpha + ')';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(0,176,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.jetX, this.jetY, 12, 0, Math.PI * 2);
        ctx.fill();
        
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
        const mx = w - 100;
        const my = this.graphY + 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.isFlying ? '#FFD700' : (this.hasCrashed ? '#ff4444' : 'rgba(255,215,0,0.3)');
        ctx.lineWidth = 2;
        this.roundRect(ctx, mx - 15, my, 100, 60, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.isFlying ? '#FFD700' : (this.hasCrashed ? '#ff4444' : '#ffffff');
        ctx.font = 'bold 32px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', mx + 35, my + 35);
    }
    
    drawBettingCards(ctx, w, h) {
        const cards = [
            { label: 'Bet 1', value: this.bet1, potential: this.potentialWin1, x: 20, y: this.graphY + this.graphH + 20 },
            { label: 'Bet 2', value: this.bet2, potential: this.potentialWin2, x: w / 2 + 10, y: this.graphY + this.graphH + 20 }
        ];
        
        for (const card of cards) {
            const cw = 180;
            const ch = 80;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeStyle = 'rgba(255,215,0,0.2)';
            ctx.lineWidth = 1;
            this.roundRect(ctx, card.x, card.y, cw, ch, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(card.label, card.x + 10, card.y + 16);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Inter';
            ctx.fillText('₹' + card.value.toFixed(2), card.x + 10, card.y + 35);
            
            if (this.isFlying) {
                ctx.fillStyle = 'rgba(0,230,118,0.8)';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'right';
                ctx.fillText('Potential: ₹' + card.potential, card.x + cw - 10, card.y + 55);
            }
        }
    }
    
    drawHistoryPanel(ctx, w, h) {
        const hx = 10;
        const hy = this.graphY + 10;
        const hw = 35;
        const hh = this.graphH - 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.15)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, hx, hy, hw, hh, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.font = 'bold 8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('HISTORY', hx + hw / 2, hy + 12);
        
        const recentHistory = this.roundHistory.slice(-6);
        for (let i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const iy = hy + 28 + i * 18;
            
            let color = item.crashed ? '#ff4444' : '#FFD700';
            if (item.multiplier >= 5) color = '#00e676';
            
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(item.multiplier.toFixed(1) + 'x', hx + hw / 2, iy);
        }
    }
    
    drawCashOutButton(ctx, w, h) {
        if (!this.isFlying || this.hasCrashed) return;
        
        const btnX = w / 2 - 70;
        const btnY = this.graphY + this.graphH + 120;
        const btnW = 140;
        const btnH = 50;
        
        const pulse = Math.sin(Date.now() * 0.005) * 3 + 12;
        
        ctx.fillStyle = 'rgba(0,230,118,0.2)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,230,118,0.5)';
        ctx.shadowBlur = pulse;
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 25);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CASHOUT', btnX + btnW / 2, btnY + btnH / 2 - 6);
        
        const totalPotential = this.potentialWin1 + this.potentialWin2;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter';
        ctx.fillText(this.multiplier.toFixed(2) + 'x  ₹' + totalPotential, btnX + btnW / 2, btnY + btnH / 2 + 14);
    }
    
    drawPlayersSection(ctx, w, h) {
        const py = this.graphY + this.graphH + 220;
        
        ctx.fillStyle = 'rgba(255,215,0,0.5)';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Bets  /  Payouts', 20, py - 5);
        
        const playerBoxes = [
            { name: 'P1', payout: '₹2,365.98', x: 20 },
            { name: 'P2', payout: '₹1,855.50', x: w / 3 + 5 },
            { name: 'P3', payout: '₹1,420.00', x: 2 * w / 3 - 10 }
        ];
        
        for (const p of playerBoxes) {
            if (py < h - 10) {
                ctx.fillStyle = 'rgba(255,215,0,0.08)';
                ctx.strokeStyle = 'rgba(255,215,0,0.15)';
                ctx.lineWidth = 1;
                this.roundRect(ctx, p.x, py, 70, 55, 6);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(p.name, p.x + 35, py + 15);
                
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 9px Inter';
                ctx.fillText(p.payout, p.x + 35, py + 40);
            }
        }
    }
    
    drawExplosionParticles(ctx) {
        for (const p of this.explosionParticles) {
            ctx.fillStyle = p.color.replace(')', ', ' + p.life + ')').replace('rgb', 'rgba');
            if (p.color.startsWith('#')) {
                const rgb = p.color === '#ff4444' ? '255,68,68' : '255,215,0';
                ctx.fillStyle = 'rgba(' + rgb + ',' + p.life + ')';
            }
            ctx.beginPath();
            ctx.arc(p.x + (Math.random() - 0.5) * this.crashShakeAmount, p.y + (Math.random() - 0.5) * this.crashShakeAmount, p.size * p.life, 0, Math.PI * 2);
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
    
    render() { this.drawFullScreen(); }
    
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
console.log('✅ Aviator v3.1 - Full Casino Crash Game Loaded');
