// ============================================
// EMERALD KING CASINO - GAME 14: WHEEL OF FORTUNE
// Full Real Casino Visual Design
// Spinning Prize Wheel with Segments
// File: js/games/wheel-fortune.js
// ============================================

class WheelOfFortuneFullGame {
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
        this.resultSegment = null;
        this.wheelRotation = 0;
        this.targetRotation = 0;
        this.spinStartTime = 0;
        this.spinDuration = 4000;
        
        // Wheel configuration
        this.segments = [
            { label: '10', value: 10, color: '#ff4444', icon: '💰' },
            { label: '50', value: 50, color: '#00b0ff', icon: '💎' },
            { label: '5', value: 5, color: '#00e676', icon: '🪙' },
            { label: '100', value: 100, color: '#FFD700', icon: '👑' },
            { label: '20', value: 20, color: '#c084fc', icon: '🎁' },
            { label: '200', value: 200, color: '#ff8800', icon: '🌟' },
            { label: '2', value: 2, color: '#888888', icon: '🍀' },
            { label: '500', value: 500, color: '#ff4444', icon: '🏆' }
        ];
        
        this.wheelRadius = 0;
        this.wheelX = 0;
        this.wheelY = 0;
        this.pointerAngle = -Math.PI / 2; // Point up
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Light particles around wheel
        this.lightParticles = [];
        
        // Colors
        this.colors = {
            bg: '#011713',
            wheelRim: '#1a1a1a',
            gold: '#FFD700',
            pointer: '#ff4444'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.generateLightParticles();
        this.wheelRadius = Math.min(this.w, this.h) * 0.35;
        this.wheelX = this.w / 2;
        this.wheelY = this.h / 2 - 10;
        this.resetGame();
        this.drawFullWheel();
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
    
    generateLightParticles() {
        this.lightParticles = [];
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const dist = this.wheelRadius + 15 + Math.random() * 20;
            this.lightParticles.push({
                angle: angle,
                dist: dist,
                size: 1 + Math.random() * 2,
                speed: 0.01 + Math.random() * 0.02,
                opacity: Math.random() * 0.5 + 0.3,
                color: ['#FFD700', '#00e676', '#00b0ff', '#ff4444', '#ffffff'][Math.floor(Math.random() * 5)]
            });
        }
    }
    
    resetGame() {
        this.isSpinning = false;
        this.showResult = false;
        this.resultSegment = null;
        this.wheelRotation = 0;
        this.targetRotation = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    play(bet) {
        if (this.isSpinning) return;
        
        this.bet = bet;
        this.isSpinning = true;
        this.showResult = false;
        this.resultSegment = null;
        
        // Determine result with weighted probability
        const totalWeight = 1000;
        const weights = [150, 100, 200, 50, 120, 30, 250, 10]; // Higher = more likely
        let random = Math.random() * totalWeight;
        let resultIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) { resultIndex = i; break; }
        }
        this.resultSegment = this.segments[resultIndex];
        
        // Calculate target rotation
        const segmentAngle = (2 * Math.PI) / this.segments.length;
        const targetSegmentCenter = resultIndex * segmentAngle + segmentAngle / 2;
        const extraRotations = 5 + Math.random() * 5;
        this.targetRotation = this.wheelRotation + extraRotations * 2 * Math.PI + (2 * Math.PI - targetSegmentCenter + this.wheelRotation % (2 * Math.PI));
        
        this.spinStartTime = performance.now();
        this.spinDuration = 4000 + Math.random() * 3000;
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎡 Spinning...</span>';
        }
    }
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.isSpinning) {
            const elapsed = timestamp - this.spinStartTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);
            
            // Easing function (deceleration)
            const eased = 1 - Math.pow(1 - progress, 4);
            this.wheelRotation = this.wheelRotation + (this.targetRotation - this.wheelRotation) * eased * 0.1;
            
            // Final position
            if (progress >= 0.95) {
                this.wheelRotation = this.targetRotation;
            }
            
            // Spin complete
            if (progress >= 1) {
                this.isSpinning = false;
                this.showResult = true;
                this.resolveGame();
            }
        }
        
        // Update light particles
        this.lightParticles.forEach(p => {
            p.angle += p.speed;
            p.opacity = 0.3 + Math.sin(Date.now() * 0.003 + p.angle) * 0.2;
        });
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    resolveGame() {
        const multiplier = this.resultSegment.value / this.bet;
        const payout = this.resultSegment.value;
        this.chips += payout;
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <div style="animation: casinoSlideUp 0.5s ease-out;">
                    <span style="color:#FFD700;font-size:20px;">${this.resultSegment.icon} ${this.resultSegment.label}!</span><br>
                    <span style="color:#00e676;">+${payout} CHIPS</span>
                </div>`;
        }
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        
        setTimeout(() => { this.showResult = false; }, 4000);
    }
    
    // ============================================
    // RENDERING - FULL WHEEL
    // ============================================
    
    drawFullWheel() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Wheel
        this.drawWheel(ctx);
        
        // Pointer
        this.drawPointer(ctx);
        
        // Center hub
        this.drawCenterHub(ctx);
        
        // Light particles
        this.drawLightParticles(ctx);
        
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
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎡 WHEEL OF FORTUNE', w / 2, 41);
    }
    
    drawWheel(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        const r = this.wheelRadius;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelRotation);
        
        // Outer rim glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        // Outer rim
        const rimGrad = ctx.createRadialGradient(0, 0, r - 10, 0, 0, r + 12);
        rimGrad.addColorStop(0, '#3d1c08');
        rimGrad.addColorStop(0.5, '#6B3410');
        rimGrad.addColorStop(1, '#8B4513');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Gold trim outer
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Gold trim inner
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Segments
        const segmentAngle = (2 * Math.PI) / this.segments.length;
        
        this.segments.forEach((segment, i) => {
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
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Highlight on segment
            const midAngle = startAngle + segmentAngle / 2;
            const highlightGrad = ctx.createRadialGradient(
                Math.cos(midAngle) * r * 0.3,
                Math.sin(midAngle) * r * 0.3,
                0,
                0, 0, r
            );
            highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Label
            const labelAngle = midAngle;
            const labelDist = r * 0.65;
            const lx = Math.cos(labelAngle) * labelDist;
            const ly = Math.sin(labelAngle) * labelDist;
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(segment.icon, lx, ly - 8);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(segment.label, lx, ly + 10);
        });
        
        ctx.restore();
    }
    
    drawPointer(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        const r = this.wheelRadius;
        
        // Pointer (at top)
        const px = cx;
        const py = cy - r - 8;
        
        // Pointer shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px - 10, py - 24);
        ctx.lineTo(px + 10, py - 24);
        ctx.closePath();
        ctx.fill();
        
        // Pointer body
        const pointerGrad = ctx.createLinearGradient(px, py, px, py - 24);
        pointerGrad.addColorStop(0, '#ff4444');
        pointerGrad.addColorStop(1, '#cc0000');
        ctx.fillStyle = pointerGrad;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 8, py - 20);
        ctx.lineTo(px + 8, py - 20);
        ctx.closePath();
        ctx.fill();
        
        // Pointer tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 3, py + 10);
        ctx.lineTo(px + 3, py + 10);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCenterHub(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        const r = this.wheelRadius;
        
        // Hub shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub body
        const hubGrad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r * 0.18);
        hubGrad.addColorStop(0, '#FFD700');
        hubGrad.addColorStop(0.5, '#cc8800');
        hubGrad.addColorStop(1, '#886600');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub ring
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hub star
        ctx.fillStyle = '#ffffff';
        ctx.font = `${r * 0.18}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', cx, cy);
    }
    
    drawLightParticles(ctx) {
        this.lightParticles.forEach(p => {
            const px = this.wheelX + Math.cos(p.angle) * p.dist;
            const py = this.wheelY + Math.sin(p.angle) * p.dist;
            
            ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
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
        this.drawFullWheel();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.lightParticles = [];
    }
}

// Export
window.WheelOfFortuneFullGame = WheelOfFortuneFullGame;
console.log('✅ Game 14: Wheel of Fortune - Full Casino Design Loaded');
