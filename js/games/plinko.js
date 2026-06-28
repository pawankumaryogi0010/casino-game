// ============================================
// EMERALD KING CASINO - PLINKO
// Real Casino Experience - Physics-Based
// Real 3D Physics, Coin Drop, Wallet Connect
// ============================================

class PlinkoFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.w = 0;
        this.h = 0;
        this.dpr = window.devicePixelRatio || 1;
        
        // Wallet
        this.balance = 0;
        this.bet = 0;
        this.totalWin = 0;
        
        // Game state
        this.riskLevel = 'medium';
        this.isPlaying = false;
        this.phase = 'betting'; // betting, dropping, result
        this.coin = null;
        this.settled = false;
        this.lastMultiplier = 0;
        
        // Physics
        this.gravity = 0.45;
        this.bounceDamping = 0.55;
        this.friction = 0.995;
        
        // Board
        this.rows = 14;
        this.cols = 15;
        this.pegs = [];
        this.slots = [];
        this.pegRadius = 4;
        this.coinRadius = 6;
        this.boardTop = 0;
        this.boardLeft = 0;
        this.boardWidth = 0;
        this.boardHeight = 0;
        this.slotWidth = 0;
        
        // Particles & effects
        this.particles = [];
        this.sparkles = [];
        this.celebration = false;
        this.celebrationTimer = 0;
        
        // Multiplier sets
        this.multiplierSets = {
            low: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0],
            medium: [3.5, 2.8, 2.0, 1.5, 1.1, 0.8, 0.5, 0.3, 0.5, 0.8, 1.1, 1.5, 2.0, 2.8, 3.5],
            high: [12, 8, 5, 3, 2, 1.2, 0.6, 0.2, 0.6, 1.2, 2, 3, 5, 8, 12]
        };
        
        // Sound
        this.audioCtx = null;
        this.sounds = {};
        
        // Images (generated)
        this.images = {};
        
        this.initAudio();
        this.loadBalance();
    }
    
    // ============================================
    // AUDIO
    // ============================================
    
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }
    
    playSound(freq, type, duration, vol) {
        if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq || 440;
            gain.gain.setValueAtTime((vol || 0.1), this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (duration || 0.1));
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + (duration || 0.1) + 0.05);
        } catch(e) {}
    }
    
    playPegHit() { this.playSound(200 + Math.random() * 400, 'triangle', 0.08, 0.06); }
    playDrop() { this.playSound(150, 'sine', 0.5, 0.08); }
    playWin() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playSound(f, 'square', 0.2, 0.1), i * 100);
        });
    }
    playLose() { this.playSound(150, 'sawtooth', 0.4, 0.08); }
    
    // ============================================
    // WALLET
    // ============================================
    
    loadBalance() {
        if (window.currentUser && typeof window.currentUser.balance === 'number') {
            this.balance = window.currentUser.balance;
        } else {
            this.balance = 1000;
        }
    }
    
    updateBalance(amount) {
        this.balance = Math.max(0, this.balance + amount);
        if (window.currentUser) window.currentUser.balance = this.balance;
        if (window.GameLoaderSystem) GameLoaderSystem.updateBalance(this.balance);
        if (typeof updateUI === 'function') updateUI();
    }
    
    // ============================================
    // INIT
    // ============================================
    
    init() {
        if (this.canvas) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.w = rect.width;
            this.h = rect.height;
        }
        if (!this.w || !this.h) { this.w = 500; this.h = 650; }
        
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        this.calculateBoard();
        this.buildPegs();
        this.buildSlots();
        this.generateSparkles();
        this.draw();
    }
    
    resize() {
        if (this.canvas) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.w = rect.width;
            this.h = rect.height;
        }
        if (!this.w || !this.h) { this.w = 500; this.h = 650; }
        
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        this.calculateBoard();
        this.buildPegs();
        this.buildSlots();
        this.draw();
    }
    
    calculateBoard() {
        this.boardWidth = Math.min(this.w * 0.9, 480);
        this.boardHeight = this.h * 0.58;
        this.boardLeft = (this.w - this.boardWidth) / 2;
        this.boardTop = this.h * 0.15;
        this.slotWidth = this.boardWidth / this.cols;
        this.coinRadius = Math.max(5, this.slotWidth * 0.22);
        this.pegRadius = Math.max(2.5, this.slotWidth * 0.1);
    }
    
    buildPegs() {
        this.pegs = [];
        const spacingX = this.boardWidth / (this.cols + 1);
        const spacingY = this.boardHeight / (this.rows + 2);
        
        for (let row = 0; row < this.rows; row++) {
            const offsetX = row % 2 === 0 ? 0 : spacingX / 2;
            const pegsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
            
            for (let col = 0; col < pegsInRow; col++) {
                this.pegs.push({
                    x: this.boardLeft + spacingX + col * spacingX + offsetX,
                    y: this.boardTop + spacingY * 2 + row * spacingY,
                    hit: false,
                    hitIntensity: 0
                });
            }
        }
    }
    
    buildSlots() {
        this.slots = [];
        const multipliers = this.multiplierSets[this.riskLevel];
        
        for (let i = 0; i < this.cols; i++) {
            this.slots.push({
                x: this.boardLeft + i * this.slotWidth,
                w: this.slotWidth,
                value: multipliers[i],
                active: false
            });
        }
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 30; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.01 + 0.003,
                opacity: Math.random() * 0.3 + 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setRiskLevel(level) {
        if (this.isPlaying) return;
        this.riskLevel = level;
        this.buildSlots();
        this.draw();
    }
    
    play(betAmount) {
        if (this.isPlaying) return;
        
        // Check balance
        this.loadBalance();
        const actualBet = betAmount || this.bet || 50;
        if (actualBet > this.balance) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showToast('Insufficient balance!');
            }
            return;
        }
        
        // Deduct bet
        this.bet = actualBet;
        this.updateBalance(-this.bet);
        
        this.isPlaying = true;
        this.phase = 'dropping';
        this.settled = false;
        this.totalWin = 0;
        this.lastMultiplier = 0;
        this.particles = [];
        this.celebration = false;
        
        // Reset slots
        this.slots.forEach(s => s.active = false);
        
        // Create coin
        const startSlot = Math.floor(Math.random() * (this.cols - 3)) + 1;
        this.coin = {
            x: this.boardLeft + startSlot * this.slotWidth + this.slotWidth / 2,
            y: this.boardTop + this.coinRadius + 5,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0,
            r: this.coinRadius,
            active: true,
            landed: false,
            targetSlot: null,
            trail: [],
            color: '#FFD700',
            rotation: 0,
            rotSpeed: 0
        };
        
        this.playDrop();
        this.draw();
    }
    
    updatePhysics() {
        if (!this.coin || !this.coin.active) return;
        
        const coin = this.coin;
        
        // Gravity
        coin.vy += this.gravity;
        
        // Friction
        coin.vx *= this.friction;
        
        // Update position
        coin.x += coin.vx;
        coin.y += coin.vy;
        
        // Coin rotation (visual)
        coin.rotSpeed += coin.vx * 0.05;
        coin.rotation += coin.rotSpeed;
        
        // Peg collision
        for (const peg of this.pegs) {
            const dx = coin.x - peg.x;
            const dy = coin.y - peg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = coin.r + this.pegRadius;
            
            if (dist < minDist && coin.vy > 0) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                
                // Push out
                coin.x = peg.x + nx * minDist;
                coin.y = peg.y + ny * minDist;
                
                // Reflect with damping
                const dot = coin.vx * nx + coin.vy * ny;
                const bounce = this.bounceDamping + Math.random() * 0.25;
                
                coin.vx -= 2 * dot * nx * bounce;
                coin.vy -= 2 * dot * ny * bounce;
                
                // Random deflection
                coin.vx += (Math.random() - 0.5) * 2.5;
                
                // Clamp
                const speed = Math.sqrt(coin.vx * coin.vx + coin.vy * coin.vy);
                if (speed > 10) {
                    coin.vx = (coin.vx / speed) * 10;
                    coin.vy = (coin.vy / speed) * 10;
                }
                
                // Effects
                peg.hit = true;
                peg.hitIntensity = Math.min(1, Math.abs(coin.vy) / 8);
                
                // Particles
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: peg.x, y: peg.y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2 - 1,
                        life: 1, decay: 0.03 + Math.random() * 0.04,
                        size: 1 + Math.random() * 2,
                        color: '#00ff88'
                    });
                }
                
                this.playPegHit();
            }
        }
        
        // Wall collision
        if (coin.x - coin.r < this.boardLeft) {
            coin.x = this.boardLeft + coin.r;
            coin.vx = Math.abs(coin.vx) * this.bounceDamping;
        }
        if (coin.x + coin.r > this.boardLeft + this.boardWidth) {
            coin.x = this.boardLeft + this.boardWidth - coin.r;
            coin.vx = -Math.abs(coin.vx) * this.bounceDamping;
        }
        
        // Trail
        if (Math.random() > 0.4) {
            coin.trail.push({ x: coin.x, y: coin.y, life: 1, size: coin.r * 0.6 });
        }
        coin.trail.forEach(t => t.life -= 0.05);
        coin.trail = coin.trail.filter(t => t.life > 0);
        
        // Bottom detection
        const slotY = this.boardTop + this.boardHeight - coin.r;
        if (coin.y >= slotY) {
            coin.y = slotY;
            coin.active = false;
            coin.landed = true;
            
            const slotIndex = Math.floor((coin.x - this.boardLeft) / this.slotWidth);
            coin.targetSlot = Math.max(0, Math.min(this.cols - 1, slotIndex));
            
            this.slots[coin.targetSlot].active = true;
            this.lastMultiplier = this.slots[coin.targetSlot].value;
            this.totalWin = Math.floor(this.bet * this.lastMultiplier);
            
            this.settled = true;
            this.isPlaying = false;
            this.phase = 'result';
            
            if (this.totalWin > 0) {
                this.updateBalance(this.totalWin);
            }
            
            if (this.totalWin > this.bet) {
                this.celebration = true;
                this.celebrationTimer = 0;
                this.generateCelebrationParticles();
                this.playWin();
                if (window.GameLoaderSystem) {
                    GameLoaderSystem.showWinOverlay(this.totalWin);
                }
            } else if (this.totalWin === 0) {
                this.playLose();
                if (window.GameLoaderSystem) {
                    GameLoaderSystem.showLoseOverlay(this.bet);
                }
            }
        }
        
        // Reset peg hits
        this.pegs.forEach(p => {
            if (p.hit) p.hitIntensity *= 0.85;
            if (p.hitIntensity < 0.01) p.hit = false;
        });
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);
        
        if (this.celebration) {
            this.celebrationTimer++;
            this.celebrationParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.life -= 0.008;
            });
            this.celebrationParticles = this.celebrationParticles.filter(p => p.life > 0);
            if (this.celebrationTimer > 200) {
                this.celebration = false;
                this.celebrationParticles = [];
            }
        }
    }
    
    generateCelebrationParticles() {
        this.celebrationParticles = [];
        const colors = ['#FFD700', '#00e676', '#ff4444', '#00b0ff', '#ff8800', '#ffffff'];
        for (let i = 0; i < 100; i++) {
            this.celebrationParticles.push({
                x: this.w / 2 + (Math.random() - 0.5) * this.w,
                y: this.h / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 12 - 5,
                size: 2 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        if (this.isPlaying && this.phase === 'dropping') {
            this.updatePhysics();
        }
        this.draw();
    }
    
    // ============================================
    // RENDER
    // ============================================
    
    draw() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background gradient
        const bgGrad = ctx.createRadialGradient(w/2, h*0.4, 10, w/2, h*0.4, w);
        bgGrad.addColorStop(0, '#1a1530');
        bgGrad.addColorStop(0.5, '#0d0a1a');
        bgGrad.addColorStop(1, '#050308');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Stars
        this.drawStars(ctx);
        
        // Board
        this.drawBoard(ctx);
        
        // Pegs
        this.drawPegs(ctx);
        
        // Coin trail
        if (this.coin) {
            this.coin.trail.forEach(t => {
                ctx.fillStyle = 'rgba(255,215,0,' + (t.life * 0.4) + ')';
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Coin
        if (this.coin && (this.coin.active || this.coin.landed)) {
            this.drawCoin(ctx, this.coin);
        }
        
        // Slots
        this.drawSlots(ctx);
        
        // Particles
        this.drawParticles(ctx);
        
        // Header
        this.drawHeader(ctx);
        
        // Footer
        this.drawFooter(ctx);
        
        // Celebration
        if (this.celebration) {
            this.drawCelebration(ctx);
        }
        
        // Sparkles
        this.drawSparkles(ctx);
    }
    
    drawStars(ctx) {
        for (let i = 0; i < 60; i++) {
            const x = (i * 137 + 50) % this.w;
            const y = (i * 251 + 30) % this.h;
            const twinkle = Math.sin(Date.now() * 0.002 + i) * 0.3 + 0.5;
            ctx.fillStyle = 'rgba(255,255,255,' + twinkle + ')';
            ctx.beginPath();
            ctx.arc(x, y, 0.5 + (i % 3) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawBoard(ctx) {
        const bx = this.boardLeft - 8;
        const by = this.boardTop - 8;
        const bw = this.boardWidth + 16;
        const bh = this.boardHeight + 16;
        
        // Board shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.roundRect(ctx, bx + 4, by + 4, bw, bh, 14);
        ctx.fill();
        
        // Board background
        const boardGrad = ctx.createLinearGradient(0, by, 0, by + bh);
        boardGrad.addColorStop(0, '#0d0d1a');
        boardGrad.addColorStop(0.5, '#111128');
        boardGrad.addColorStop(1, '#0a0a14');
        ctx.fillStyle = boardGrad;
        ctx.strokeStyle = 'rgba(255,215,0,0.2)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, bx, by, bw, bh, 14);
        ctx.fill();
        ctx.stroke();
        
        // Inner grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.cols; i++) {
            const x = this.boardLeft + i * this.slotWidth;
            ctx.beginPath();
            ctx.moveTo(x, this.boardTop);
            ctx.lineTo(x, this.boardTop + this.boardHeight);
            ctx.stroke();
        }
    }
    
    drawPegs(ctx) {
        for (const peg of this.pegs) {
            // Glow when hit
            if (peg.hit && peg.hitIntensity > 0.05) {
                ctx.fillStyle = 'rgba(0,255,136,' + (peg.hitIntensity * 0.5) + ')';
                ctx.beginPath();
                ctx.arc(peg.x, peg.y, this.pegRadius + 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Peg body
            const pegGrad = ctx.createRadialGradient(peg.x - 0.5, peg.y - 0.5, 0, peg.x, peg.y, this.pegRadius);
            pegGrad.addColorStop(0, '#ffffff');
            pegGrad.addColorStop(0.3, peg.hit ? '#00ff88' : '#00cc66');
            pegGrad.addColorStop(1, '#004422');
            ctx.fillStyle = pegGrad;
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, this.pegRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(peg.x - this.pegRadius * 0.3, peg.y - this.pegRadius * 0.3, this.pegRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawCoin(ctx, coin) {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);
        
        // Glow
        const glowGrad = ctx.createRadialGradient(0, 0, coin.r, 0, 0, coin.r + 5);
        glowGrad.addColorStop(0, 'rgba(255,215,0,0.3)');
        glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coin.r + 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin body
        const coinGrad = ctx.createRadialGradient(-1, -1.5, 0, 0, 0, coin.r);
        coinGrad.addColorStop(0, '#ffffff');
        coinGrad.addColorStop(0.25, '#FFE44D');
        coinGrad.addColorStop(0.6, '#FFD700');
        coinGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Dollar sign
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold ' + (coin.r * 1.2) + 'px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-coin.r * 0.3, -coin.r * 0.4, coin.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawSlots(ctx) {
        const sy = this.boardTop + this.boardHeight + 5;
        const sh = 35;
        
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            const sx = slot.x;
            const sw = slot.w;
            
            let slotColor = '#666666';
            if (slot.value >= 3) slotColor = '#ff4444';
            else if (slot.value >= 1.5) slotColor = '#FFD700';
            else if (slot.value >= 1.0) slotColor = '#00e676';
            else if (slot.value >= 0.5) slotColor = '#888888';
            
            // Active slot glow
            if (slot.active) {
                ctx.fillStyle = slotColor;
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 15;
                this.roundRect(ctx, sx + 1, sy, sw - 2, sh, 6);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            // Slot background
            ctx.fillStyle = slot.active ? slotColor : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = slotColor;
            ctx.lineWidth = slot.active ? 2 : 0.5;
            this.roundRect(ctx, sx + 1, sy, sw - 2, sh, 6);
            ctx.fill();
            ctx.stroke();
            
            // Value
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold ' + Math.min(11, sw * 0.35) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.value.toFixed(1) + 'x', sx + sw / 2, sy + sh / 2);
        }
    }
    
    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.fillStyle = 'rgba(0,255,136,' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawHeader(ctx) {
        // Title
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.roundRect(ctx, this.w * 0.25, 10, this.w * 0.5, 36, 14);
        ctx.fill();
        
        ctx.fillStyle = '#d4a843';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLINKO', this.w / 2, 26);
        
        // Balance
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, this.w - 130, 12, 110, 30, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('RS ' + this.balance.toFixed(2), this.w - 75, 32);
    }
    
    drawFooter(ctx) {
        const fy = this.boardTop + this.boardHeight + 50;
        
        // Risk buttons
        const risks = [
            { label: 'LOW', value: 'low', color: '#00e676' },
            { label: 'MED', value: 'medium', color: '#FFD700' },
            { label: 'HIGH', value: 'high', color: '#ff4444' }
        ];
        
        const btnW = 60;
        const totalW = risks.length * btnW + 20;
        const startX = (this.w - totalW) / 2;
        
        risks.forEach((risk, i) => {
            const rx = startX + i * (btnW + 10);
            const isSelected = this.riskLevel === risk.value;
            
            ctx.fillStyle = isSelected ? risk.color + '30' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? risk.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 1.5 : 1;
            this.roundRect(ctx, rx, fy, btnW, 28, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? risk.color : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(risk.label, rx + btnW / 2, fy + 14);
        });
    }
    
    drawCelebration(ctx) {
        this.celebrationParticles.forEach(p => {
            ctx.fillStyle = p.color.replace(')', ', ' + p.life + ')').replace('rgb', 'rgba');
            if (p.color.startsWith('#')) {
                const hex = p.color;
                const r = parseInt(hex.slice(1,3), 16);
                const g = parseInt(hex.slice(3,5), 16);
                const b = parseInt(hex.slice(5,7), 16);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + p.life + ')';
            }
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sp => {
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.003;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(255,215,0,' + sp.opacity + ')';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
        });
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
    // CLICK
    // ============================================
    
    handleClick(clickX, clickY) {
        // Risk buttons
        const fy = this.boardTop + this.boardHeight + 50;
        const risks = ['low', 'medium', 'high'];
        const btnW = 60;
        const totalW = risks.length * btnW + 20;
        const startX = (this.w - totalW) / 2;
        
        for (let i = 0; i < 3; i++) {
            const rx = startX + i * (btnW + 10);
            if (clickX >= rx && clickX <= rx + btnW && clickY >= fy && clickY <= fy + 28) {
                this.setRiskLevel(risks[i]);
                return;
            }
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.draw(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        this.isPlaying = false;
        this.coin = null;
        this.particles = [];
        this.celebrationParticles = [];
        this.sparkles = [];
    }
}

// Export
window.PlinkoFullGame = PlinkoFullGame;
console.log('Plinko - Real Casino Physics Version Loaded');
