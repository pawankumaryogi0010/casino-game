// ============================================
// EMERALD KING CASINO - GAME 3: AVIATOR CRASH
// Full Real Casino Visual Design
// Exponential Curve, Neon Jet, Explosion Effects
// File: js/games/aviator.js
// ============================================

class AviatorFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.multiplier = 1.00;
        this.crashPoint = 1.00;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.cashOutMultiplier = 0;
        this.gamePhase = 'waiting'; // waiting, flying, crashed, cashedout
        
        // Graph data
        this.pathPoints = [];
        this.maxPathPoints = 300;
        this.graphStartTime = 0;
        this.elapsedTime = 0;
        
        // Jet position
        this.jetX = 0;
        this.jetY = 0;
        this.jetAngle = 0;
        this.jetScale = 1;
        this.jetFlame = 0;
        
        // Explosion
        this.explosionParticles = [];
        this.explosionRadius = 0;
        this.explosionOpacity = 0;
        this.isExploding = false;
        
        // Background particles
        this.bgParticles = [];
        this.stars = [];
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Colors
        this.colors = {
            bg: '#011713',
            grid: 'rgba(0, 230, 118, 0.08)',
            line: '#00e676',
            lineGlow: '#00ff88',
            jet: '#00b0ff',
            jetGlow: '#00d4ff',
            gold: '#FFD700',
            red: '#ff4444',
            explosion: '#ff6600'
        };
        
        // Graph dimensions
        this.graphX = 60;
        this.graphY = 30;
        this.graphW = 0;
        this.graphH = 0;
        this.maxMultiplier = 10;
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.graphW = this.w - this.graphX - 80;
        this.graphH = this.h - this.graphY - 50;
        this.generateBackgroundParticles();
        this.generateStars();
        this.resetGame();
        this.drawFullScreen();
    }
    
    generateBackgroundParticles() {
        this.bgParticles = [];
        for (let i = 0; i < 40; i++) {
            this.bgParticles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.3 + 0.05,
                opacity: Math.random() * 0.3 + 0.05,
                color: Math.random() > 0.5 ? '#00e676' : '#00b0ff'
            });
        }
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.2 + 0.2,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.03 + 0.01
            });
        }
    }
    
    resetGame() {
        this.multiplier = 1.00;
        this.crashPoint = 1.00;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.cashOutMultiplier = 0;
        this.gamePhase = 'waiting';
        this.pathPoints = [];
        this.elapsedTime = 0;
        this.jetX = this.graphX;
        this.jetY = this.graphY + this.graphH;
        this.jetAngle = -0.3;
        this.jetScale = 1;
        this.explosionParticles = [];
        this.explosionRadius = 0;
        this.explosionOpacity = 0;
        this.isExploding = false;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    play(bet) {
        if (this.isFlying || this.gamePhase === 'flying') return;
        
        this.resetGame();
        this.bet = bet;
        this.isFlying = true;
        this.gamePhase = 'flying';
        this.graphStartTime = performance.now();
        
        // Generate crash point (exponential distribution)
        this.crashPoint = this.generateCrashPoint();
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#00b0ff;">✈️ FLYING...</span>';
        }
    }
    
    generateCrashPoint() {
        // House edge: 1% (RTP ~99%)
        const r = Math.random();
        if (r < 0.01) return 1.00; // Instant crash 1%
        
        // Exponential distribution
        const lambda = 0.12;
        const crashPoint = 1 + (-Math.log(Math.random()) / lambda);
        
        // Cap at reasonable values
        if (crashPoint > 100) return 100;
        if (crashPoint < 1.01) return 1.01;
        
        return crashPoint;
    }
    
    cashOut() {
        if (!this.isFlying || this.hasCrashed || this.hasCashedOut) return;
        
        this.hasCashedOut = true;
        this.gamePhase = 'cashedout';
        this.cashOutMultiplier = this.multiplier;
        
        const payout = Math.floor(this.bet * this.multiplier);
        this.chips += payout;
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <div style="animation: casinoSlideUp 0.5s ease-out;">
                    <span style="color:#FFD700;font-size:18px;">✅ CASHED OUT!</span><br>
                    <span style="color:#00e676;">${this.multiplier.toFixed(2)}x = +${payout} CHIPS</span>
                </div>`;
        }
        
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        
        setTimeout(() => { this.resetGame(); }, 3000);
    }
    
    triggerCrash() {
        this.hasCrashed = true;
        this.isFlying = false;
        this.gamePhase = 'crashed';
        this.isExploding = true;
        this.explosionRadius = 0;
        this.explosionOpacity = 1;
        
        // Generate explosion particles
        this.explosionParticles = [];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.explosionParticles.push({
                x: this.jetX,
                y: this.jetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: ['#ff4400', '#ff8800', '#ffaa00', '#ffdd00', '#ffffff'][Math.floor(Math.random() * 5)],
                life: 1,
                decay: 0.01 + Math.random() * 0.03
            });
        }
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <div style="animation: shake 0.5s ease-out;">
                    <span style="color:#ff4444;font-size:18px;">💥 CRASHED!</span><br>
                    <span style="color:rgba(255,255,255,0.6);">at ${this.crashPoint.toFixed(2)}x</span>
                </div>`;
        }
        
        setTimeout(() => { this.isExploding = false; }, 2000);
        setTimeout(() => { this.resetGame(); }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        // Update background particles
        this.bgParticles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -5) { p.y = this.h + 5; p.x = Math.random() * this.w; }
        });
        
        // Update stars
        this.stars.forEach(s => {
            s.twinkle += s.speed;
        });
        
        // Update game state
        if (this.isFlying && !this.hasCrashed && !this.hasCashedOut) {
            this.elapsedTime = (timestamp - this.graphStartTime) / 1000;
            
            // Exponential multiplier curve
            this.multiplier = Math.pow(Math.E, this.elapsedTime * 0.14);
            
            // Calculate position on graph
            const progress = (this.multiplier - 1) / (this.maxMultiplier - 1);
            const px = this.graphX + progress * this.graphW;
            const py = this.graphY + this.graphH - (progress * this.graphH);
            
            // Add to path
            this.pathPoints.push({ x: px, y: py, m: this.multiplier });
            if (this.pathPoints.length > this.maxPathPoints) {
                this.pathPoints.shift();
            }
            
            // Update jet position
            this.jetX = px;
            this.jetY = py - 25;
            this.jetAngle = -0.2 - progress * 0.6;
            this.jetFlame = Math.sin(timestamp * 0.02) * 0.3 + 0.7;
            
            // Check crash
            if (this.multiplier >= this.crashPoint) {
                this.triggerCrash();
            }
        }
        
        // Update explosion
        if (this.isExploding) {
            this.explosionRadius += 3;
            this.explosionOpacity -= 0.008;
            this.explosionParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // gravity
                p.life -= p.decay;
            });
            this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);
        }
        
        // Update win cascade
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING - FULL SCREEN
    // ============================================
    
    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Grid
        this.drawGrid(ctx);
        
        // Graph curve
        this.drawGraphCurve(ctx);
        
        // Multiplier markers
        this.drawMultiplierMarkers(ctx);
        
        // Crash point line (if crashed)
        if (this.hasCrashed || this.gamePhase === 'crashed') {
            this.drawCrashLine(ctx);
        }
        
        // Jet
        if (!this.hasCrashed || this.isExploding) {
            this.drawJet(ctx, this.jetX, this.jetY, this.jetAngle);
        }
        
        // Explosion
        if (this.isExploding) {
            this.drawExplosion(ctx);
        }
        
        // Current multiplier display
        this.drawMultiplierDisplay(ctx, w, h);
        
        // Cash out indicator
        if (this.hasCashedOut) {
            this.drawCashOutMarker(ctx);
        }
        
        // Win particles
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        // Dark space background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w);
        bgGrad.addColorStop(0, '#02231c');
        bgGrad.addColorStop(0.5, '#011a15');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Stars
        this.stars.forEach(s => {
            const twinkle = Math.sin(s.twinkle) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6 + 0.1})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Rising particles
        this.bgParticles.forEach(p => {
            ctx.fillStyle = `rgba(0, 230, 118, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawGrid(ctx) {
        const gx = this.graphX;
        const gy = this.graphY;
        const gw = this.graphW;
        const gh = this.graphH;
        
        // Grid area background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, gx - 5, gy - 5, gw + 10, gh + 10, 8);
        ctx.fill();
        ctx.stroke();
        
        // Horizontal grid lines
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i <= 10; i++) {
            const y = gy + gh - (i / 10) * gh;
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + gw, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 1; i <= 10; i++) {
            const x = gx + (i / 10) * gw;
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.lineTo(x, gy + gh);
            ctx.stroke();
        }
    }
    
    drawGraphCurve(ctx) {
        if (this.pathPoints.length < 2) return;
        
        // Curve glow
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Curve main line
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Curve bright center
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
    }
    
    drawMultiplierMarkers(ctx) {
        const gx = this.graphX;
        const gy = this.graphY;
        const gh = this.graphH;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px Arial';
        ctx.textAlign = 'right';
        
        for (let i = 1; i <= 10; i++) {
            const multiplier = i;
            const y = gy + gh - ((multiplier - 1) / (this.maxMultiplier - 1)) * gh;
            ctx.fillText(multiplier.toFixed(1) + 'x', gx - 8, y + 3);
            
            // Dash
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([3, 6]);
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + this.graphW, y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawCrashLine(ctx) {
        const gx = this.graphX;
        const gy = this.graphY;
        const gh = this.graphH;
        const gw = this.graphW;
        
        const crashProgress = (this.crashPoint - 1) / (this.maxMultiplier - 1);
        const cy = gy + gh - (crashProgress * gh);
        const cx = gx + crashProgress * gw;
        
        // Horizontal crash line
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(gx, cy);
        ctx.lineTo(gx + gw, cy);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        
        // Crash label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('💥 CRASH ' + this.crashPoint.toFixed(2) + 'x', gx + 5, cy - 8);
        
        // X marker
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', cx, cy);
    }
    
    drawJet(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        const scale = this.jetScale;
        
        // Engine glow
        const flameLength = 15 + this.jetFlame * 12;
        const flameGrad = ctx.createLinearGradient(-flameLength, 0, 0, 0);
        flameGrad.addColorStop(0, 'rgba(0, 200, 255, 0)');
        flameGrad.addColorStop(0.5, 'rgba(0, 200, 255, 0.8)');
        flameGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');
        
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-flameLength, -3);
        ctx.lineTo(0, 0);
        ctx.lineTo(-flameLength, 3);
        ctx.closePath();
        ctx.fill();
        
        // Small flames
        ctx.fillStyle = 'rgba(255, 150, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-flameLength * 0.6, -2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-flameLength * 0.6, 2);
        ctx.closePath();
        ctx.fill();
        
        // Jet body glow
        ctx.shadowColor = '#00b0ff';
        ctx.shadowBlur = 15;
        
        // Fuselage
        const bodyGrad = ctx.createLinearGradient(0, -6, 0, 6);
        bodyGrad.addColorStop(0, '#00d4ff');
        bodyGrad.addColorStop(0.5, '#ffffff');
        bodyGrad.addColorStop(1, '#0088cc');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.quadraticCurveTo(10, -7, -2, -5);
        ctx.lineTo(-6, -3);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-6, 3);
        ctx.lineTo(-2, 5);
        ctx.quadraticCurveTo(10, 7, 18, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Cockpit window
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(10, 0, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wing top
        ctx.fillStyle = '#0088cc';
        ctx.beginPath();
        ctx.moveTo(5, -1);
        ctx.lineTo(-2, -12);
        ctx.lineTo(-4, -10);
        ctx.lineTo(2, -1);
        ctx.closePath();
        ctx.fill();
        
        // Wing bottom
        ctx.beginPath();
        ctx.moveTo(5, 1);
        ctx.lineTo(-2, 12);
        ctx.lineTo(-4, 10);
        ctx.lineTo(2, 1);
        ctx.closePath();
        ctx.fill();
        
        // Tail fin
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-7, -6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawExplosion(ctx) {
        // Explosion circle
        const alpha = Math.max(0, this.explosionOpacity);
        const grad = ctx.createRadialGradient(this.jetX, this.jetY, 0, this.jetX, this.jetY, this.explosionRadius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.2, `rgba(255, 200, 0, ${alpha * 0.8})`);
        grad.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.jetX, this.jetY, this.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Explosion particles
        this.explosionParticles.forEach(p => {
            ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawMultiplierDisplay(ctx, w, h) {
        const mx = w - 75;
        const my = h - 40;
        
        // Display background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = this.hasCrashed ? '#ff4444' : this.hasCashedOut ? '#00e676' : '#00b0ff';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, mx - 10, my - 10, 80, 35, 12);
        ctx.fill();
        ctx.stroke();
        
        // Multiplier text
        const color = this.hasCrashed ? '#ff4444' : this.hasCashedOut ? '#00e676' : '#ffffff';
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', mx + 30, my + 7);
        
        // Status text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '8px Arial';
        const status = this.hasCrashed ? 'CRASHED' : this.hasCashedOut ? 'CASHED OUT' : this.isFlying ? 'FLYING' : 'WAITING';
        ctx.fillText(status, mx + 30, my + 20);
    }
    
    drawCashOutMarker(ctx) {
        if (this.pathPoints.length === 0) return;
        
        const lastPoint = this.pathPoints[this.pathPoints.length - 1];
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y - 25, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('💰 ' + this.cashOutMultiplier.toFixed(2) + 'x', lastPoint.x + 12, lastPoint.y - 22);
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
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    render() {
        this.drawFullScreen();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    resize() {
        this.graphW = this.w - this.graphX - 80;
        this.graphH = this.h - this.graphY - 50;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.pathPoints = [];
        this.explosionParticles = [];
        this.bgParticles = [];
        this.stars = [];
    }
}

// Export
window.AviatorFullGame = AviatorFullGame;
console.log('✅ Game 3: Aviator Crash - Full Casino Design Loaded');
