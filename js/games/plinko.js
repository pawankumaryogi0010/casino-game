// ============================================
// EMERALD KING CASINO - GAME 12: PLINKO
// Full Real Casino Visual Design
// Gravity Physics Ball Drop with Peg Board
// File: js/games/plinko.js
// ============================================

class PlinkoFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.riskLevel = 'medium'; // low, medium, high
        this.rows = 12;
        this.cols = 13;
        this.balls = [];
        this.isDropping = false;
        this.showResult = false;
        this.lastMultiplier = 0;
        this.totalWin = 0;
        
        // Peg board
        this.pegs = [];
        this.pegRadius = 3;
        this.boardStartX = 0;
        this.boardStartY = 0;
        this.boardWidth = 0;
        this.boardHeight = 0;
        this.slotWidth = 0;
        
        // Multiplier slots at bottom
        this.multipliers = [];
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Trail particles
        this.trailParticles = [];
        
        // Colors
        this.colors = {
            board: '#1a1a2e',
            peg: '#00e676',
            pegGlow: '#00ff88',
            ball: '#FFD700',
            slotLow: '#00e676',
            slotMed: '#FFD700',
            slotHigh: '#ff4444'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateBoardDimensions();
        this.generatePegs();
        this.generateMultipliers();
        this.drawFullBoard();
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
        this.boardWidth = this.w - 40;
        this.boardHeight = this.h - 180;
        this.boardStartX = 20;
        this.boardStartY = 70;
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
                    hitTimer: 0
                });
            }
        }
    }
    
    generateMultipliers() {
        this.multipliers = [];
        
        const multiplierSets = {
            low: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0],
            medium: [3.0, 2.0, 1.5, 1.0, 0.7, 0.5, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0],
            high: [10.0, 5.0, 3.0, 2.0, 1.0, 0.5, 0.2, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0]
        };
        
        const multipliers = multiplierSets[this.riskLevel];
        
        for (let i = 0; i < this.cols; i++) {
            this.multipliers.push({
                value: multipliers[i],
                x: this.boardStartX + i * this.slotWidth,
                width: this.slotWidth
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
        
        this.bet = bet;
        this.isDropping = true;
        this.showResult = false;
        this.lastMultiplier = 0;
        this.totalWin = 0;
        this.balls = [];
        this.trailParticles = [];
        
        // Create ball at random position at top
        const startCol = Math.floor(Math.random() * this.cols);
        const ball = {
            x: this.boardStartX + startCol * this.slotWidth + this.slotWidth / 2,
            y: this.boardStartY + 15,
            vy: 1.5,
            vx: 0,
            radius: 5,
            active: true,
            trail: [],
            targetSlot: null,
            landed: false
        };
        
        this.balls.push(ball);
        
        // Simulate physics
        this.simulateBallDrop(ball);
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🔵 Dropping...</span>';
        }
    }
    
    simulateBallDrop(ball) {
        const dropInterval = setInterval(() => {
            if (!ball.active) {
                clearInterval(dropInterval);
                return;
            }
            
            // Gravity
            ball.vy += 0.3;
            ball.y += ball.vy;
            
            // Friction
            ball.vx *= 0.98;
            
            // Collision with pegs
            this.pegs.forEach(peg => {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < ball.radius + this.pegRadius && ball.y > peg.y - 5) {
                    // Bounce
                    const angle = Math.atan2(dy, dx);
                    const force = 2 + Math.random() * 3;
                    ball.vx += Math.cos(angle) * force;
                    ball.vy = Math.sin(angle) * force * 0.5;
                    ball.y = peg.y - ball.radius - this.pegRadius;
                    
                    // Peg hit effect
                    peg.hit = true;
                    peg.hitTimer = 10;
                    
                    // Trail
                    ball.trail.push({ x: ball.x, y: ball.y, opacity: 0.6, size: 2 });
                    if (ball.trail.length > 20) ball.trail.shift();
                }
            });
            
            // Wall collision
            if (ball.x < this.boardStartX + ball.radius) {
                ball.x = this.boardStartX + ball.radius;
                ball.vx *= -0.5;
            }
            if (ball.x > this.boardStartX + this.boardWidth - ball.radius) {
                ball.x = this.boardStartX + this.boardWidth - ball.radius;
                ball.vx *= -0.5;
            }
            
            // Bottom reached
            if (ball.y > this.boardStartY + this.boardHeight - ball.radius) {
                ball.active = false;
                ball.landed = true;
                ball.y = this.boardStartY + this.boardHeight - ball.radius;
                
                // Find which slot
                const slotIndex = Math.floor((ball.x - this.boardStartX) / this.slotWidth);
                const clampedIndex = Math.max(0, Math.min(this.cols - 1, slotIndex));
                ball.targetSlot = clampedIndex;
                this.lastMultiplier = this.multipliers[clampedIndex].value;
                this.totalWin = Math.floor(this.bet * this.lastMultiplier);
                
                // Resolve
                this.isDropping = false;
                this.showResult = true;
                this.resolveGame();
            }
            
            // Update trail fade
            ball.trail.forEach(t => t.opacity -= 0.03);
            ball.trail = ball.trail.filter(t => t.opacity > 0);
            
            // Update peg hits
            this.pegs.forEach(p => {
                if (p.hit) {
                    p.hitTimer--;
                    if (p.hitTimer <= 0) p.hit = false;
                }
            });
            
            this.drawFullBoard();
        }, 16); // ~60fps
    }
    
    resolveGame() {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.totalWin > this.bet) {
            this.chips += this.totalWin;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${this.totalWin} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.lastMultiplier.toFixed(1)}x Multiplier</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        } else if (this.totalWin > 0) {
            this.chips += this.totalWin;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:16px;">Partial Win</span><br>
                        <span style="color:#FFD700;">+${this.totalWin} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.lastMultiplier.toFixed(1)}x Multiplier</span>
                    </div>`;
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 YOU LOST</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${this.lastMultiplier.toFixed(1)}x Multiplier</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.showResult = false; }, 4000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
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
        
        // Pegs
        this.drawPegs(ctx);
        
        // Multiplier slots
        this.drawSlots(ctx);
        
        // Balls
        this.drawBalls(ctx);
        
        // Risk selector
        this.drawRiskSelector(ctx, w, h);
        
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
        ctx.fillText('🔵 PLINKO', w / 2, 41);
    }
    
    drawBoard(ctx) {
        const bx = this.boardStartX;
        const by = this.boardStartY;
        const bw = this.boardWidth;
        const bh = this.boardHeight;
        
        // Board background
        const boardGrad = ctx.createLinearGradient(0, by, 0, by + bh);
        boardGrad.addColorStop(0, '#0a0a1a');
        boardGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = boardGrad;
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, bx - 3, by - 3, bw + 6, bh + 6, 10);
        ctx.fill();
        ctx.stroke();
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        for (let x = bx; x <= bx + bw; x += this.slotWidth) {
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x, by + bh);
            ctx.stroke();
        }
    }
    
    drawPegs(ctx) {
        this.pegs.forEach(peg => {
            // Peg glow
            if (peg.hit) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
                ctx.beginPath();
                ctx.arc(peg.x, peg.y, this.pegRadius + 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Peg body
            const pegGrad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, this.pegRadius);
            pegGrad.addColorStop(0, '#ffffff');
            pegGrad.addColorStop(0.5, peg.hit ? '#00ff88' : '#00e676');
            pegGrad.addColorStop(1, '#008844');
            ctx.fillStyle = pegGrad;
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, this.pegRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Peg shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(peg.x - 1, peg.y - 1, 1, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawSlots(ctx) {
        const sy = this.boardStartY + this.boardHeight + 2;
        const sh = 28;
        
        this.multipliers.forEach((slot, i) => {
            const sx = slot.x;
            const sw = slot.width;
            
            // Slot color based on value
            let slotColor;
            if (slot.value >= 3) slotColor = '#ff4444';
            else if (slot.value >= 1.5) slotColor = '#FFD700';
            else if (slot.value >= 1.0) slotColor = '#00e676';
            else slotColor = '#888888';
            
            ctx.fillStyle = `${slotColor}20`;
            ctx.strokeStyle = slotColor;
            ctx.lineWidth = 1;
            CardRenderer.roundRect(ctx, sx + 1, sy, sw - 2, sh, 5);
            ctx.fill();
            ctx.stroke();
            
            // Multiplier text
            ctx.fillStyle = slotColor;
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.value.toFixed(1) + 'x', sx + sw / 2, sy + sh / 2);
            
            // Ball landed indicator
            this.balls.forEach(ball => {
                if (ball.landed && ball.targetSlot === i) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                    CardRenderer.roundRect(ctx, sx + 1, sy, sw - 2, sh, 5);
                    ctx.fill();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    CardRenderer.roundRect(ctx, sx + 1, sy, sw - 2, sh, 5);
                    ctx.stroke();
                }
            });
        });
    }
    
    drawBalls(ctx) {
        this.balls.forEach(ball => {
            // Trail
            ball.trail.forEach((t, i) => {
                ctx.fillStyle = `rgba(255, 215, 0, ${t.opacity * (i / ball.trail.length)})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Ball glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball body
            const ballGrad = ctx.createRadialGradient(ball.x - 1.5, ball.y - 1.5, 0, ball.x, ball.y, ball.radius);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(0.3, '#FFD700');
            ballGrad.addColorStop(1, '#cc8800');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(ball.x - 1.5, ball.y - 1.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawRiskSelector(ctx, w, h) {
        const ry = h - 60;
        const btnW = (w - 60) / 3;
        const btnH = 32;
        
        const risks = [
            { label: '🟢 LOW', value: 'low', color: '#00e676' },
            { label: '🟡 MED', value: 'medium', color: '#FFD700' },
            { label: '🔴 HIGH', value: 'high', color: '#ff4444' }
        ];
        
        risks.forEach((risk, i) => {
            const rx = 22 + i * (btnW + 8);
            const isSelected = this.riskLevel === risk.value;
            
            ctx.fillStyle = isSelected ? `${risk.color}25` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? risk.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, rx, ry, btnW, btnH, 16);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? risk.color : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(risk.label, rx + btnW / 2, ry + btnH / 2);
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
        this.balls = [];
        this.pegs = [];
    }
}

// Export
window.PlinkoFullGame = PlinkoFullGame;
console.log('✅ Game 12: Plinko - Full Casino Design Loaded');
