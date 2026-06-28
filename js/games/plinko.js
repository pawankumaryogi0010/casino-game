// ============================================
// EMERALD KING CASINO - PLINKO
// Real Physics-Based Ball Drop Game
// Full Redesign v3.0.0
// File: js/games/plinko.js
// ============================================

class PlinkoFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.riskLevel = 'medium';
        this.rows = 12;
        this.cols = 13;
        this.balls = [];
        this.isDropping = false;
        this.showResult = false;
        this.lastMultiplier = 0;
        this.totalWin = 0;
        this.maxBalls = 5;
        this.activeBalls = 0;
        this.roundComplete = false;
        
        // Physics
        this.gravity = 0.35;
        this.bounceEnergy = 0.6;
        this.friction = 0.98;
        this.pegRadius = 3;
        this.ballRadius = 5;
        
        // Board dimensions
        this.pegs = [];
        this.boardStartX = 0;
        this.boardStartY = 0;
        this.boardWidth = 0;
        this.boardHeight = 0;
        this.slotWidth = 0;
        
        // Multiplier slots
        this.multipliers = [];
        
        // Animation
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.pegHitGlows = [];
        this.dropIntervalId = null;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Multiplier sets
        this.multiplierSets = {
            low: [1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
            medium: [3.5, 2.5, 1.8, 1.2, 0.9, 0.6, 0.4, 0.6, 0.9, 1.2, 1.8, 2.5, 3.5],
            high: [12, 7, 4, 2.5, 1.5, 0.8, 0.3, 0.8, 1.5, 2.5, 4, 7, 12]
        };
        
        // Color palette
        this.palette = {
            bg: '#0a0806',
            boardBg: '#0d1117',
            boardBorder: '#1e2844',
            pegDefault: '#00e676',
            pegHit: '#00ff88',
            pegGlow: 'rgba(0,255,136,0.4)',
            ballGold: '#FFD700',
            ballGlow: 'rgba(255,215,0,0.4)',
            slotGreen: '#00e676',
            slotYellow: '#FFD700',
            slotRed: '#ff4444',
            slotGrey: '#666666',
            gold: '#d4a843',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            felt: '#0d5e2e',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c'
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
        this.calculateBoardDimensions();
        this.generatePegs();
        this.generateMultipliers();
        this.generateSparkles();
        this.drawFullBoard();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateBoardDimensions();
        this.generatePegs();
        this.generateMultipliers();
        this.drawFullBoard();
    }
    
    calculateBoardDimensions() {
        this.boardWidth = this.w - 40;
        this.boardHeight = this.h - 220;
        this.boardStartX = 20;
        this.boardStartY = 75;
        this.slotWidth = this.boardWidth / this.cols;
    }
    
    generatePegs() {
        this.pegs = [];
        const pegSpacingX = this.boardWidth / (this.cols + 1);
        const pegSpacingY = this.boardHeight / (this.rows + 2);
        
        for (let row = 0; row < this.rows; row++) {
            const offsetX = row % 2 === 0 ? 0 : pegSpacingX / 2;
            const pegsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
            
            for (let col = 0; col < pegsInRow; col++) {
                this.pegs.push({
                    x: this.boardStartX + pegSpacingX + col * pegSpacingX + offsetX,
                    y: this.boardStartY + pegSpacingY * 2 + row * pegSpacingY,
                    hit: false,
                    hitTimer: 0,
                    hitIntensity: 0
                });
            }
        }
    }
    
    generateMultipliers() {
        this.multipliers = [];
        const multipliers = this.multiplierSets[this.riskLevel];
        
        for (let i = 0; i < this.cols; i++) {
            this.multipliers.push({
                value: multipliers[i],
                x: this.boardStartX + i * this.slotWidth,
                width: this.slotWidth
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
    
    setRiskLevel(level) {
        if (this.isDropping) return;
        this.riskLevel = level;
        this.generateMultipliers();
        this.drawFullBoard();
    }
    
    play(bet) {
        if (this.isDropping) return;
        
        this.bet = bet || this.bet;
        this.isDropping = true;
        this.showResult = false;
        this.lastMultiplier = 0;
        this.totalWin = 0;
        this.balls = [];
        this.activeBalls = 0;
        this.roundComplete = false;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.pegHitGlows = [];
        
        // Drop multiple balls
        const numBalls = Math.min(this.maxBalls, Math.floor(Math.random() * 3) + 2);
        
        for (let b = 0; b < numBalls; b++) {
            setTimeout(() => {
                this.dropSingleBall();
            }, b * 400);
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Dropping ' + numBalls + ' balls...</div>';
        }
    }
    
    dropSingleBall() {
        const startCol = Math.floor(Math.random() * (this.cols - 2)) + 1;
        const ball = {
            x: this.boardStartX + startCol * this.slotWidth + this.slotWidth / 2,
            y: this.boardStartY + 10,
            vy: 0,
            vx: (Math.random() - 0.5) * 2,
            radius: this.ballRadius,
            active: true,
            trail: [],
            targetSlot: null,
            landed: false,
            color: ['#FFD700', '#FFA500', '#FF8C00', '#FFD700'][Math.floor(Math.random() * 4)]
        };
        
        this.balls.push(ball);
        this.activeBalls++;
    }
    
    updatePhysics() {
        let allLanded = this.balls.length > 0;
        
        for (const ball of this.balls) {
            if (!ball.active) continue;
            
            allLanded = false;
            
            // Apply gravity
            ball.vy += this.gravity;
            
            // Apply friction
            ball.vx *= this.friction;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Peg collision
            for (const peg of this.pegs) {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = ball.radius + this.pegRadius;
                
                if (dist < minDist && ball.y > peg.y - 5 && ball.vy > 0) {
                    // Calculate collision normal
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Push ball out of peg
                    ball.x = peg.x + nx * minDist;
                    ball.y = peg.y + ny * minDist;
                    
                    // Reflect velocity with energy loss
                    const dot = ball.vx * nx + ball.vy * ny;
                    const bounceStrength = this.bounceEnergy + Math.random() * 0.3;
                    
                    ball.vx -= 2 * dot * nx * bounceStrength;
                    ball.vy -= 2 * dot * ny * bounceStrength;
                    
                    // Add random horizontal deflection
                    ball.vx += (Math.random() - 0.5) * 3;
                    
                    // Clamp velocity
                    ball.vy = Math.min(ball.vy, 8);
                    
                    // Peg hit effect
                    peg.hit = true;
                    peg.hitTimer = 12;
                    peg.hitIntensity = Math.min(1, Math.abs(ball.vy) / 8);
                    
                    this.pegHitGlows.push({
                        x: peg.x,
                        y: peg.y,
                        radius: 0,
                        maxRadius: 12,
                        opacity: 0.7,
                        decay: 0.05
                    });
                    
                    // Trail
                    ball.trail.push({ x: ball.x, y: ball.y, opacity: 0.6, size: 2 });
                    if (ball.trail.length > 15) ball.trail.shift();
                }
            }
            
            // Wall collision
            if (ball.x - ball.radius < this.boardStartX) {
                ball.x = this.boardStartX + ball.radius;
                ball.vx = Math.abs(ball.vx) * this.bounceEnergy;
            }
            if (ball.x + ball.radius > this.boardStartX + this.boardWidth) {
                ball.x = this.boardStartX + this.boardWidth - ball.radius;
                ball.vx = -Math.abs(ball.vx) * this.bounceEnergy;
            }
            
            // Bottom slot detection
            const bottomY = this.boardStartY + this.boardHeight - ball.radius;
            if (ball.y >= bottomY) {
                ball.y = bottomY;
                ball.active = false;
                ball.landed = true;
                this.activeBalls--;
                
                // Find slot
                const slotIndex = Math.floor((ball.x - this.boardStartX) / this.slotWidth);
                const clampedIndex = Math.max(0, Math.min(this.cols - 1, slotIndex));
                ball.targetSlot = clampedIndex;
            }
            
            // Trail fade
            ball.trail.forEach(function(t) { t.opacity -= 0.03; });
            ball.trail = ball.trail.filter(function(t) { return t.opacity > 0; });
        }
        
        // Update peg hit states
        for (const peg of this.pegs) {
            if (peg.hit) {
                peg.hitTimer--;
                if (peg.hitTimer <= 0) peg.hit = false;
            }
        }
        
        // Update peg glows
        this.pegHitGlows.forEach(function(g) {
            g.radius += (g.maxRadius - g.radius) * 0.3;
            g.opacity -= g.decay;
        });
        this.pegHitGlows = this.pegHitGlows.filter(function(g) { return g.opacity > 0; });
        
        // Check if all balls landed
        if (allLanded && this.activeBalls === 0 && this.balls.length > 0) {
            this.isDropping = false;
            this.showResult = true;
            this.roundComplete = true;
            this.calculateTotalWin();
            this.resolveGame();
        }
        
        this.drawFullBoard();
    }
    
    calculateTotalWin() {
        this.totalWin = 0;
        this.lastMultiplier = 0;
        
        for (const ball of this.balls) {
            if (ball.landed && ball.targetSlot !== null) {
                const slotMultiplier = this.multipliers[ball.targetSlot].value;
                this.totalWin += Math.floor(this.bet * slotMultiplier);
                this.lastMultiplier = Math.max(this.lastMultiplier, slotMultiplier);
            }
        }
    }
    
    resolveGame() {
        this.chips += this.totalWin;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.totalWin > this.bet * this.balls.length) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.totalWin);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.boardStartY + this.boardHeight, 80);
            
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! Best: ' + this.lastMultiplier.toFixed(1) + 'x Total: +RS ' + this.totalWin + '</div>';
            }
        } else if (this.totalWin > 0) {
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">Partial: ' + this.lastMultiplier.toFixed(1) + 'x +RS ' + this.totalWin + '</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet * this.balls.length);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">Lost RS ' + (this.bet * this.balls.length) + '</div>';
            }
        }
        
        setTimeout(() => {
            this.showResult = false;
            this.roundComplete = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            this.balls = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.drawFullBoard();
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
        
        if (this.isDropping) {
            this.updatePhysics();
        }
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
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
    
    drawFullBoard() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTitle(ctx, w, h);
        this.drawBoard(ctx, w, h);
        this.drawPegs(ctx);
        this.drawSlots(ctx, w, h);
        this.drawPegGlows(ctx);
        this.drawBalls(ctx);
        this.drawRiskSelector(ctx, w, h);
        this.drawBallCount(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
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
        this.roundRect(ctx, w * 0.25, 24, w * 0.5, 34, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLINKO', w / 2, 41);
    }
    
    drawBoard(ctx, w, h) {
        const bx = this.boardStartX;
        const by = this.boardStartY;
        const bw = this.boardWidth;
        const bh = this.boardHeight;
        
        // Board background
        const boardGrad = ctx.createLinearGradient(0, by, 0, by + bh);
        boardGrad.addColorStop(0, '#0a0a1a');
        boardGrad.addColorStop(1, '#0d1117');
        ctx.fillStyle = boardGrad;
        ctx.strokeStyle = 'rgba(0,230,118,0.2)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, bx - 4, by - 4, bw + 8, bh + 8, 10);
        ctx.fill();
        ctx.stroke();
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.cols; i++) {
            const x = bx + i * this.slotWidth;
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x, by + bh);
            ctx.stroke();
        }
    }
    
    drawPegs(ctx) {
        for (const peg of this.pegs) {
            // Peg glow when hit
            if (peg.hit) {
                const alpha = peg.hitTimer / 12 * peg.hitIntensity;
                ctx.fillStyle = 'rgba(0,255,136,' + alpha * 0.5 + ')';
                ctx.beginPath();
                ctx.arc(peg.x, peg.y, this.pegRadius + 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Peg body
            const pegGrad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, this.pegRadius);
            pegGrad.addColorStop(0, '#ffffff');
            pegGrad.addColorStop(0.4, peg.hit ? '#00ff88' : '#00e676');
            pegGrad.addColorStop(1, '#006633');
            ctx.fillStyle = pegGrad;
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, this.pegRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Peg shine
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(peg.x - 0.8, peg.y - 0.8, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPegGlows(ctx) {
        for (const glow of this.pegHitGlows) {
            ctx.strokeStyle = 'rgba(0,255,136,' + glow.opacity + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawSlots(ctx, w, h) {
        const sy = this.boardStartY + this.boardHeight + 4;
        const sh = 30;
        
        for (let i = 0; i < this.multipliers.length; i++) {
            const slot = this.multipliers[i];
            const sx = slot.x;
            const sw = slot.width;
            
            let slotColor;
            if (slot.value >= 3) slotColor = '#ff4444';
            else if (slot.value >= 1.5) slotColor = '#FFD700';
            else if (slot.value >= 1.0) slotColor = '#00e676';
            else slotColor = '#666666';
            
            ctx.fillStyle = slotColor + '15';
            ctx.strokeStyle = slotColor;
            ctx.lineWidth = 1;
            this.roundRect(ctx, sx + 1, sy, sw - 2, sh, 4);
            ctx.fill();
            ctx.stroke();
            
            // Multiplier text
            ctx.fillStyle = slotColor;
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.value.toFixed(1) + 'x', sx + sw / 2, sy + sh / 2);
            
            // Ball landed indicator
            for (const ball of this.balls) {
                if (ball.landed && ball.targetSlot === i) {
                    ctx.fillStyle = 'rgba(255,215,0,0.3)';
                    this.roundRect(ctx, sx + 1, sy, sw - 2, sh, 4);
                    ctx.fill();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    this.roundRect(ctx, sx + 1, sy, sw - 2, sh, 4);
                    ctx.stroke();
                }
            }
        }
    }
    
    drawBalls(ctx) {
        for (const ball of this.balls) {
            if (!ball.active && !ball.landed) continue;
            
            // Trail
            for (let i = 0; i < ball.trail.length; i++) {
                const t = ball.trail[i];
                ctx.fillStyle = 'rgba(255,215,0,' + (t.opacity * (i / ball.trail.length)) + ')';
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Ball glow
            ctx.fillStyle = 'rgba(255,215,0,0.25)';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball body
            const ballGrad = ctx.createRadialGradient(ball.x - 1, ball.y - 1.5, 0, ball.x, ball.y, ball.radius);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(0.3, ball.color || '#FFD700');
            ballGrad.addColorStop(1, '#996600');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball shine
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.arc(ball.x - 1.5, ball.y - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawRiskSelector(ctx, w, h) {
        const ry = this.boardStartY + this.boardHeight + 50;
        const btnW = (w - 60) / 3;
        const btnH = 34;
        
        const risks = [
            { label: 'LOW', value: 'low', color: '#00e676' },
            { label: 'MEDIUM', value: 'medium', color: '#FFD700' },
            { label: 'HIGH', value: 'high', color: '#ff4444' }
        ];
        
        for (let i = 0; i < risks.length; i++) {
            const risk = risks[i];
            const rx = 22 + i * (btnW + 8);
            const isSelected = this.riskLevel === risk.value;
            
            ctx.fillStyle = isSelected ? risk.color + '25' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? risk.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, rx, ry, btnW, btnH, 17);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? risk.color : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 10px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(risk.label, rx + btnW / 2, ry + btnH / 2);
        }
    }
    
    drawBallCount(ctx, w, h) {
        const by = this.boardStartY + this.boardHeight + 50;
        const bx = w - 80;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.roundRect(ctx, bx, by, 60, 34, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('BALLS', bx + 30, by + 12);
        
        ctx.fillStyle = this.palette.ballGold;
        ctx.font = 'bold 12px Georgia';
        ctx.fillText(this.balls.length, bx + 30, by + 28);
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
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isDropping) return;
        
        // Check risk buttons
        const ry = this.boardStartY + this.boardHeight + 50;
        const btnW = (this.w - 60) / 3;
        const btnH = 34;
        const risks = ['low', 'medium', 'high'];
        
        for (let i = 0; i < 3; i++) {
            const rx = 22 + i * (btnW + 8);
            if (clickX >= rx && clickX <= rx + btnW && clickY >= ry && clickY <= ry + btnH) {
                this.setRiskLevel(risks[i]);
                return;
            }
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullBoard(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        this.isDropping = false;
        if (this.dropIntervalId) clearInterval(this.dropIntervalId);
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.balls = [];
        this.pegs = [];
        this.pegHitGlows = [];
    }
}

// Export
window.PlinkoFullGame = PlinkoFullGame;
console.log('Plinko v3.0.0 - Physics-Based Real Casino Design Loaded');
