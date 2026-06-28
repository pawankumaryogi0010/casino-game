// ============================================
// EMERALD KING CASINO - 7 UP 7 DOWN
// Real Casino UI - Two Dice Sum Betting Game
// Full Redesign v3.0.0
// File: js/games/7up-7down.js
// ============================================

class SevenUpSevenDownFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = '7up';
        this.dice1 = 1;
        this.dice2 = 1;
        this.diceSum = 2;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.totalBet = 0;
        
        // Multiple bets
        this.bets = { '7up': 0, '7down': 0, 'exact7': 0 };
        
        // Dice animation
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.rollStartTime = 0;
        this.rollDuration = 2000;
        
        // Animation
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.numberParticles = [];
        
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
            felt: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            goldLight: '#f0d078',
            upColor: '#00e676',
            downColor: '#ff4444',
            exactColor: '#FFD700',
            diceWhite: '#f5f5f0',
            diceBorder: '#cccccc',
            diceDot: '#1a1a1a',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#cc0000'
        };
        
        this.diceSize = 75;
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
        this.diceSize = Math.min((this.w - 80) / 2.5, 80);
        this.generateSparkles();
        this.resetGame();
        this.drawFullTable();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.diceSize = Math.min((this.w - 80) / 2.5, 80);
        this.drawFullTable();
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
    
    resetGame() {
        this.dice1 = 1;
        this.dice2 = 1;
        this.diceSum = 2;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.totalBet = 0;
        this.bets = { '7up': 0, '7down': 0, 'exact7': 0 };
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.diceParticles = [];
        this.numberParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type) {
        if (this.isRolling) return;
        
        if (this.bets[type] > 0) {
            this.totalBet -= this.bets[type];
            this.bets[type] = 0;
        } else {
            this.bets[type] = this.bet;
            this.totalBet += this.bet;
        }
        
        this.betType = type;
        this.drawFullTable();
    }
    
    clearAllBets() {
        if (this.isRolling) return;
        this.bets = { '7up': 0, '7down': 0, 'exact7': 0 };
        this.totalBet = 0;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isRolling) return;
        if (this.totalBet === 0) {
            this.bets['7up'] = bet || this.bet;
            this.totalBet = bet || this.bet;
            this.betType = '7up';
        }
        
        this.bet = bet || this.bet;
        this.isRolling = true;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.confettiParticles = [];
        this.numberParticles = [];
        
        // Roll dice
        this.dice1 = Math.floor(Math.random() * 6) + 1;
        this.dice2 = Math.floor(Math.random() * 6) + 1;
        this.diceSum = this.dice1 + this.dice2;
        
        this.rollStartTime = performance.now();
        this.animateRoll();
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Rolling...</div>';
        }
    }
    
    animateRoll() {
        const self = this;
        const rollInterval = setInterval(function() {
            self.diceAnims[0].value = Math.floor(Math.random() * 6) + 1;
            self.diceAnims[1].value = Math.floor(Math.random() * 6) + 1;
            self.diceAnims.forEach(function(d) {
                d.rotation = (Math.random() - 0.5) * 1.5;
                d.scale = 0.85 + Math.random() * 0.3;
            });
            
            if (Math.random() > 0.4) {
                self.diceParticles.push({
                    x: self.w / 2 + (Math.random() - 0.5) * 140,
                    y: self.h * 0.32 + (Math.random() - 0.5) * 60,
                    size: 1 + Math.random() * 2,
                    opacity: 0.6,
                    life: 0,
                    maxLife: 15 + Math.random() * 20
                });
            }
            
            self.drawFullTable();
            
            const elapsed = performance.now() - self.rollStartTime;
            if (elapsed >= self.rollDuration) {
                clearInterval(rollInterval);
                self.isRolling = false;
                self.showResult = true;
                
                self.diceAnims[0].value = self.dice1;
                self.diceAnims[1].value = self.dice2;
                self.diceAnims.forEach(function(d) { d.rotation = 0; d.scale = 1; });
                
                self.resolveGame();
                self.drawFullTable();
            }
        }, 60);
    }
    
    resolveGame() {
        this.winnings = 0;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        // 7 UP bet
        if (this.bets['7up'] > 0 && this.diceSum > 7) {
            this.winnings += Math.floor(this.bets['7up'] * 2);
        }
        
        // 7 DOWN bet
        if (this.bets['7down'] > 0 && this.diceSum < 7) {
            this.winnings += Math.floor(this.bets['7down'] * 2);
        }
        
        // EXACT 7 bet
        if (this.bets['exact7'] > 0 && this.diceSum === 7) {
            this.winnings += Math.floor(this.bets['exact7'] * 5);
        }
        
        this.chips += this.winnings;
        this.result = this.winnings > 0 ? 'win' : 'lose';
        
        // Spawn number particles
        this.spawnNumberParticles();
        
        if (this.winnings > 0) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h * 0.32, 80);
        } else if (this.totalBet > 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            let winType = this.diceSum > 7 ? '7 UP' : this.diceSum < 7 ? '7 DOWN' : 'EXACT 7';
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + winType + '! Sum ' + this.diceSum + ' +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + winType + ' Sum ' + this.diceSum + ' -RS ' + this.totalBet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            this.numberParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullTable();
        }, 5000);
    }
    
    spawnNumberParticles() {
        this.numberParticles = [];
        for (let i = 0; i < 20; i++) {
            this.numberParticles.push({
                x: this.w / 2 + (Math.random() - 0.5) * 100,
                y: this.h * 0.32 + (Math.random() - 0.5) * 60,
                number: this.diceSum,
                size: 10 + Math.random() * 20,
                opacity: 1,
                fade: 0.01 + Math.random() * 0.02,
                vy: -1 - Math.random() * 2
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
        
        this.diceParticles.forEach(function(p) {
            p.life++;
            p.opacity -= 0.04;
        });
        this.diceParticles = this.diceParticles.filter(function(p) { return p.opacity > 0 && p.life < p.maxLife; });
        
        this.numberParticles.forEach(function(p) {
            p.y += p.vy;
            p.opacity -= p.fade;
        });
        this.numberParticles = this.numberParticles.filter(function(p) { return p.opacity > 0; });
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        }.bind(this));
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
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTableBorder(ctx, w, h);
        this.drawTableFelt(ctx, w, h);
        this.drawTitle(ctx, w, h);
        this.drawDiceArea(ctx, w, h);
        this.drawSumDisplay(ctx, w, h);
        this.drawBettingAreas(ctx, w, h);
        this.drawDiceParticles(ctx);
        this.drawNumberParticles(ctx);
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
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410');
        bgGrad.addColorStop(0.5, '#0f0b08');
        bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        const m = 12;
        const tw = w - m * 2;
        const th = h - m * 2;
        
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder;
        ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16);
        ctx.fill();
        
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 12);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, fx, fy, fw, fh, 10);
        ctx.fill();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.25, 28, w * 0.5, 30, 14);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('7 UP 7 DOWN', w / 2, 43);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 68;
        const areaH = 140;
        
        // Dice zone
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeStyle = 'rgba(0,230,118,0.2)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, 28, areaY, w - 56, areaH, 14);
        ctx.fill();
        ctx.stroke();
        
        // Dice labels
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('DICE 1', w * 0.28, areaY - 4);
        ctx.fillText('DICE 2', w * 0.72, areaY - 4);
        
        // Two dice
        const ds = this.diceSize;
        const dice1X = w * 0.28 - ds / 2;
        const dice2X = w * 0.72 - ds / 2;
        const diceY = areaY + (areaH - ds) / 2;
        
        this.drawSingleDice(ctx, dice1X, diceY, ds, this.diceAnims[0]);
        this.drawSingleDice(ctx, dice2X, diceY, ds, this.diceAnims[1]);
        
        // Plus sign
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 20px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', w / 2, diceY + ds / 2);
    }
    
    drawSingleDice(ctx, x, y, size, anim) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(anim.rotation);
        ctx.scale(anim.scale, anim.scale);
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        const diceGrad = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        diceGrad.addColorStop(0, '#ffffff');
        diceGrad.addColorStop(0.5, '#f0f0f0');
        diceGrad.addColorStop(1, '#d8d8d8');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = this.palette.diceBorder;
        ctx.lineWidth = 2;
        this.roundRect(ctx, -size / 2, -size / 2, size, size, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, 7);
        ctx.stroke();
        
        this.drawDiceDots(ctx, size, anim.value);
        
        ctx.restore();
    }
    
    drawDiceDots(ctx, size, value) {
        const dotSize = size * 0.1;
        const offset = size * 0.22;
        
        ctx.fillStyle = this.palette.diceDot;
        
        const dot = function(dx, dy) {
            ctx.beginPath();
            ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
            ctx.fill();
        };
        
        if (value === 1 || value === 3 || value === 5) dot(0, 0);
        if (value >= 2) { dot(-offset, -offset); dot(offset, offset); }
        if (value >= 4) { dot(-offset, offset); dot(offset, -offset); }
        if (value === 6) { dot(-offset, 0); dot(offset, 0); }
    }
    
    drawSumDisplay(ctx, w, h) {
        const sy = 218;
        
        // Glow
        if (this.showResult) {
            const glowColor = this.winnings > 0 ? '#00e676' : '#ff4444';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeStyle = this.showResult ? (this.winnings > 0 ? '#00e676' : '#ff4444') : 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 50, sy, 100, 48, 15);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('SUM', w / 2, sy + 14);
        
        const displaySum = this.showResult ? this.diceSum : '?';
        ctx.fillStyle = this.showResult ? (this.winnings > 0 ? '#00e676' : '#ff4444') : this.palette.gold;
        ctx.font = 'bold 24px Georgia';
        ctx.fillText(displaySum, w / 2, sy + 36);
        
        // Win type
        if (this.showResult) {
            let indicator = '';
            let indicatorColor = '';
            if (this.diceSum > 7) { indicator = '7 UP'; indicatorColor = this.palette.upColor; }
            else if (this.diceSum < 7) { indicator = '7 DOWN'; indicatorColor = this.palette.downColor; }
            else { indicator = 'EXACT 7'; indicatorColor = this.palette.exactColor; }
            
            ctx.fillStyle = indicatorColor;
            ctx.font = 'bold 10px Georgia';
            ctx.fillText(indicator, w / 2, sy + 60);
        }
    }
    
    drawBettingAreas(ctx, w, h) {
        const areaY = h * 0.52;
        
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', w / 2, areaY - 8);
        
        const betBtns = [
            { label: '7 UP', sub: '(8-12) 1:1', color: this.palette.upColor, type: '7up' },
            { label: 'EXACT 7', sub: '(7) 5:1', color: this.palette.exactColor, type: 'exact7' },
            { label: '7 DOWN', sub: '(2-6) 1:1', color: this.palette.downColor, type: '7down' }
        ];
        
        const btnW = (w - 80) / 3;
        const btnH = 55;
        const gap = 8;
        const btnY = areaY + 4;
        
        for (let i = 0; i < betBtns.length; i++) {
            const bet = betBtns[i];
            const bx = 28 + i * (btnW + gap);
            const isSelected = this.bets[bet.type] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 12);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 14px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, btnY + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia';
            ctx.fillText(bet.sub, bx + btnW / 2, btnY + btnH / 2 + 16);
        }
    }
    
    drawDiceParticles(ctx) {
        for (const p of this.diceParticles) {
            ctx.fillStyle = 'rgba(212,168,67,' + p.opacity + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawNumberParticles(ctx) {
        for (const p of this.numberParticles) {
            ctx.fillStyle = 'rgba(212,168,67,' + p.opacity + ')';
            ctx.font = 'bold ' + p.size + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.number, p.x, p.y);
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
        const glowGrad = ctx.createRadialGradient(w / 2, 138, 30, w / 2, 138, 180);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, 138, 180, 0, Math.PI * 2);
        ctx.fill();
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
        if (this.isRolling) return;
        
        const areaY = this.h * 0.52;
        const btnW = (this.w - 80) / 3;
        const gap = 8;
        const btnY = areaY + 4;
        const btnH = 55;
        const types = ['7up', 'exact7', '7down'];
        
        for (let i = 0; i < 3; i++) {
            const bx = 28 + i * (btnW + gap);
            if (clickX >= bx && clickX <= bx + btnW && clickY >= btnY && clickY <= btnY + btnH) {
                this.setBetType(types[i]);
                return;
            }
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullTable(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.diceParticles = [];
        this.numberParticles = [];
    }
}

// Export
window.SevenUpSevenDownFullGame = SevenUpSevenDownFullGame;
console.log('7 Up 7 Down v3.0.0 - Real Casino Design Loaded');
