// ============================================
// EMERALD KING CASINO - WHEEL OF FORTUNE
// Real Casino UI - Prize Wheel Game
// Full Redesign v3.0.0
// File: js/games/wheel-fortune.js
// ============================================

class WheelOfFortuneFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.isSpinning = false;
        this.showResult = false;
        this.resultSegment = null;
        this.winnings = 0;
        this.spinStartTime = 0;
        this.spinDuration = 0;
        this.wheelRotation = 0;
        this.targetRotation = 0;
        this.pointerAngle = -Math.PI / 2;
        
        // Wheel configuration
        this.segments = [
            { label: '2x', value: 2, color: '#ff4444', icon: '$', weight: 200 },
            { label: '5x', value: 5, color: '#00b0ff', icon: '$', weight: 120 },
            { label: '1x', value: 1, color: '#00e676', icon: '$', weight: 250 },
            { label: '10x', value: 10, color: '#FFD700', icon: '$', weight: 40 },
            { label: '3x', value: 3, color: '#c084fc', icon: '$', weight: 150 },
            { label: '20x', value: 20, color: '#ff8800', icon: '$', weight: 15 },
            { label: '1x', value: 1, color: '#888888', icon: '$', weight: 180 },
            { label: '50x', value: 50, color: '#ff4444', icon: '$', weight: 5 }
        ];
        
        // Calculate total weight
        this.totalWeight = 0;
        for (const seg of this.segments) {
            this.totalWeight += seg.weight;
        }
        
        // Wheel dimensions
        this.wheelRadius = 0;
        this.wheelCenterX = 0;
        this.wheelCenterY = 0;
        
        // Animation
        this.lightParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.pointerBounce = 0;
        this.flashAlpha = 0;
        
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
            bg: '#0a0806',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            wheelRim: '#3d1c08',
            gold: '#d4a843',
            goldLight: '#f0d078',
            pointerColor: '#ff4444',
            pointerGold: '#FFD700',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
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
        this.calculateWheelDimensions();
        this.generateLightParticles();
        this.generateSparkles();
        this.drawFullWheel();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateWheelDimensions();
        this.drawFullWheel();
    }
    
    calculateWheelDimensions() {
        this.wheelRadius = Math.min(this.w, this.h) * 0.32;
        this.wheelCenterX = this.w / 2;
        this.wheelCenterY = this.h * 0.42;
    }
    
    generateLightParticles() {
        this.lightParticles = [];
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const distance = this.wheelRadius + 18 + Math.random() * 25;
            this.lightParticles.push({
                angle: angle,
                distance: distance,
                size: 1 + Math.random() * 2,
                speed: 0.01 + Math.random() * 0.02,
                opacity: Math.random() * 0.5 + 0.3,
                color: ['#FFD700', '#00e676', '#00b0ff', '#ff4444', '#ffffff'][Math.floor(Math.random() * 5)]
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
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    getWeightedRandom() {
        let random = Math.random() * this.totalWeight;
        for (let i = 0; i < this.segments.length; i++) {
            random -= this.segments[i].weight;
            if (random <= 0) return i;
        }
        return 0;
    }
    
    play(bet) {
        if (this.isSpinning) return;
        
        this.bet = bet || this.bet;
        this.isSpinning = true;
        this.showResult = false;
        this.resultSegment = null;
        this.winnings = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.flashAlpha = 0;
        
        // Determine result
        const resultIndex = this.getWeightedRandom();
        this.resultSegment = this.segments[resultIndex];
        
        // Calculate target rotation
        const segmentAngle = (2 * Math.PI) / this.segments.length;
        const targetSegmentCenter = resultIndex * segmentAngle + segmentAngle / 2;
        const extraRotations = 6 + Math.random() * 6;
        this.targetRotation = this.wheelRotation + extraRotations * 2 * Math.PI + (2 * Math.PI - targetSegmentCenter);
        
        this.spinStartTime = performance.now();
        this.spinDuration = 4000 + Math.random() * 3000;
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Spinning...</div>';
        }
        
        this.drawFullWheel();
    }
    
    resolveGame() {
        this.winnings = Math.floor(this.bet * this.resultSegment.value);
        this.chips += this.winnings;
        
        if (this.winnings > this.bet) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            this.flashAlpha = 1.0;
            
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.wheelCenterX, this.wheelCenterY, 100);
        } else if (this.winnings < this.bet) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet - this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            if (this.winnings > this.bet) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:16px;">' + this.resultSegment.label + '! +RS ' + this.winnings + '</div>';
            } else if (this.winnings === this.bet) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">' + this.resultSegment.label + ' - Break even</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + this.resultSegment.label + ' - Lost RS ' + (this.bet - this.winnings) + '</div>';
            }
        }
        
        this.showResult = true;
        this.drawFullWheel();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.flashAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.drawFullWheel();
        }, 5000);
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
        
        if (this.isSpinning) {
            const elapsed = timestamp - this.spinStartTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            
            // Smooth wheel rotation
            this.wheelRotation += (this.targetRotation - this.wheelRotation) * 0.08 * eased;
            
            // Pointer bounce near end
            if (progress > 0.8) {
                this.pointerBounce = Math.sin(progress * 40) * (1 - progress) * 3;
            }
            
            if (progress >= 1) {
                this.isSpinning = false;
                this.wheelRotation = this.targetRotation;
                this.pointerBounce = 0;
                this.resolveGame();
            }
        }
        
        // Light particles
        this.lightParticles.forEach(function(p) {
            p.angle += p.speed;
            p.opacity = 0.3 + Math.sin(Date.now() * 0.003 + p.angle) * 0.2;
        });
        
        // Flash fade
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.02;
        }
        
        // Confetti
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        // Win glow fade
        if (this.winGlowAlpha > 0 && !this.showResult) {
            this.winGlowAlpha -= 0.01;
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    drawFullWheel() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTitle(ctx, w, h);
        this.drawWheelStand(ctx, w, h);
        this.drawWheel(ctx, w, h);
        this.drawLightParticles(ctx);
        this.drawPointer(ctx, w, h);
        this.drawCenterHub(ctx, w, h);
        this.drawResultDisplay(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.flashAlpha > 0) {
            this.drawFlash(ctx, w, h);
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
        this.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WHEEL OF FORTUNE', w / 2, 41);
    }
    
    drawWheelStand(ctx, w, h) {
        // Stand base
        const standY = this.wheelCenterY + this.wheelRadius + 60;
        const standW = 100;
        
        ctx.fillStyle = this.palette.woodDark;
        this.roundRect(ctx, w / 2 - standW / 2, standY - 10, standW, 20, 8);
        ctx.fill();
        
        // Stand pole
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(w / 2 - 8, this.wheelCenterY + this.wheelRadius - 5, 16, standY - this.wheelCenterY - this.wheelRadius + 15);
        
        // Gold ring on pole
        ctx.fillStyle = this.palette.gold;
        ctx.fillRect(w / 2 - 10, this.wheelCenterY + this.wheelRadius + 5, 20, 4);
    }
    
    drawWheel(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        const r = this.wheelRadius;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelRotation);
        
        // Outer rim glow
        ctx.shadowColor = 'rgba(212,168,67,0.4)';
        ctx.shadowBlur = 25;
        
        // Outer rim
        const rimGrad = ctx.createRadialGradient(0, 0, r - 8, 0, 0, r + 14);
        rimGrad.addColorStop(0, '#3d1c08');
        rimGrad.addColorStop(0.5, '#6B3410');
        rimGrad.addColorStop(1, '#8B4513');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Gold trim outer
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gold trim inner
        ctx.strokeStyle = this.palette.goldLight;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Segments
        const segmentAngle = (2 * Math.PI) / this.segments.length;
        
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            
            // Segment fill
            ctx.fillStyle = segment.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Segment border
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Highlight
            const midAngle = startAngle + segmentAngle / 2;
            const highlightGrad = ctx.createRadialGradient(
                Math.cos(midAngle) * r * 0.25,
                Math.sin(midAngle) * r * 0.25,
                0, 0, 0, r
            );
            highlightGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
            highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Label
            const labelAngle = midAngle;
            const labelDist = r * 0.62;
            const lx = Math.cos(labelAngle) * labelDist;
            const ly = Math.sin(labelAngle) * labelDist;
            
            // Label background
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.arc(lx, ly, 16, 0, Math.PI * 2);
            ctx.fill();
            
            // Label text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(segment.label, lx, ly);
        }
        
        // Inner decoration ring
        ctx.strokeStyle = 'rgba(212,168,67,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    drawLightParticles(ctx) {
        for (const p of this.lightParticles) {
            const px = this.wheelCenterX + Math.cos(p.angle) * p.distance;
            const py = this.wheelCenterY + Math.sin(p.angle) * p.distance;
            
            ctx.fillStyle = p.color.replace(')', ', ' + p.opacity + ')');
            if (p.color.startsWith('#')) {
                ctx.fillStyle = 'rgba(255,215,0,' + p.opacity + ')';
            }
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPointer(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        const r = this.wheelRadius;
        
        const px = cx;
        const py = cy - r - 6 + this.pointerBounce;
        
        // Pointer shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 10, py - 26);
        ctx.lineTo(px + 10, py - 26);
        ctx.closePath();
        ctx.fill();
        
        // Pointer body
        const pointerGrad = ctx.createLinearGradient(px, py, px, py - 28);
        pointerGrad.addColorStop(0, '#ff4444');
        pointerGrad.addColorStop(1, '#aa0000');
        ctx.fillStyle = pointerGrad;
        ctx.beginPath();
        ctx.moveTo(px, py + 2);
        ctx.lineTo(px - 8, py - 22);
        ctx.lineTo(px + 8, py - 22);
        ctx.closePath();
        ctx.fill();
        
        // Gold tip
        ctx.fillStyle = this.palette.gold;
        ctx.beginPath();
        ctx.moveTo(px, py + 4);
        ctx.lineTo(px - 4, py - 6);
        ctx.lineTo(px + 4, py - 6);
        ctx.closePath();
        ctx.fill();
        
        // Pointer shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 3, py - 16);
        ctx.lineTo(px, py - 18);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCenterHub(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        const r = this.wheelRadius;
        
        // Hub outer ring
        ctx.fillStyle = this.palette.wheelRim;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hub inner
        const hubGrad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r * 0.18);
        hubGrad.addColorStop(0, '#f0d078');
        hubGrad.addColorStop(0.5, '#d4a843');
        hubGrad.addColorStop(1, '#8B6914');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub star
        ctx.fillStyle = '#ffffff';
        ctx.font = Math.floor(r * 0.18) + 'px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('*', cx, cy);
    }
    
    drawResultDisplay(ctx, w, h) {
        if (!this.showResult || !this.resultSegment) return;
        
        const ry = this.wheelCenterY + this.wheelRadius + 90;
        
        // Banner
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.resultSegment.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = this.resultSegment.color;
        ctx.shadowBlur = 15;
        this.roundRect(ctx, w / 2 - 80, ry - 5, 160, 40, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.resultSegment.label + ' = RS ' + this.winnings, w / 2, ry + 15);
    }
    
    drawFlash(ctx, w, h) {
        ctx.fillStyle = 'rgba(255,255,255,' + (this.flashAlpha * 0.3) + ')';
        ctx.fillRect(0, 0, w, h);
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
    // LOOP
    // ============================================
    
    render() { this.drawFullWheel(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.lightParticles = [];
    }
}

// Export
window.WheelOfFortuneFullGame = WheelOfFortuneFullGame;
console.log('Wheel of Fortune v3.0.0 - Real Casino Design Loaded');
