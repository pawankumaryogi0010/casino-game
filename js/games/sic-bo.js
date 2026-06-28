// ============================================
// EMERALD KING CASINO - SIC BO
// Real Casino UI - Three Dice Betting Game
// Full Redesign v3.0.0
// File: js/games/sic-bo.js
// ============================================

class SicBoFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = 'big';
        this.betValue = null;
        this.dice1 = 1;
        this.dice2 = 1;
        this.dice3 = 1;
        this.diceSum = 3;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.totalBet = 0;
        
        // Multiple bets
        this.bets = {};
        
        // Dice animation
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.rollStartTime = 0;
        this.rollDuration = 2500;
        
        // Animation
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Betting options
        this.betOptions = {
            big: { name: 'BIG', desc: 'Sum 11-17', payout: 1, color: '#00e676' },
            small: { name: 'SMALL', desc: 'Sum 4-10', payout: 1, color: '#00b0ff' },
            even: { name: 'EVEN', desc: 'Even sum', payout: 1, color: '#c084fc' },
            odd: { name: 'ODD', desc: 'Odd sum', payout: 1, color: '#ff8800' },
            triple: { name: 'ANY TRIPLE', desc: 'All same', payout: 30, color: '#FFD700' },
            specific_triple: { name: 'SPEC. TRIPLE', desc: 'Pick number', payout: 180, color: '#ff4444' },
            specific_double: { name: 'SPEC. DOUBLE', desc: 'Pick number', payout: 10, color: '#ff8800' },
            total_4: { name: 'TOTAL 4', desc: 'Sum = 4', payout: 60, color: '#ff4444' },
            total_5: { name: 'TOTAL 5', desc: 'Sum = 5', payout: 30, color: '#ff4444' },
            total_6: { name: 'TOTAL 6', desc: 'Sum = 6', payout: 17, color: '#ff8800' },
            total_7: { name: 'TOTAL 7', desc: 'Sum = 7', payout: 12, color: '#ff8800' },
            total_8: { name: 'TOTAL 8', desc: 'Sum = 8', payout: 8, color: '#FFD700' },
            total_9: { name: 'TOTAL 9', desc: 'Sum = 9', payout: 6, color: '#FFD700' },
            total_10: { name: 'TOTAL 10', desc: 'Sum = 10', payout: 6, color: '#FFD700' },
            total_11: { name: 'TOTAL 11', desc: 'Sum = 11', payout: 6, color: '#FFD700' },
            total_12: { name: 'TOTAL 12', desc: 'Sum = 12', payout: 6, color: '#FFD700' },
            total_13: { name: 'TOTAL 13', desc: 'Sum = 13', payout: 8, color: '#FFD700' },
            total_14: { name: 'TOTAL 14', desc: 'Sum = 14', payout: 12, color: '#ff8800' },
            total_15: { name: 'TOTAL 15', desc: 'Sum = 15', payout: 17, color: '#ff8800' },
            total_16: { name: 'TOTAL 16', desc: 'Sum = 16', payout: 30, color: '#ff4444' },
            total_17: { name: 'TOTAL 17', desc: 'Sum = 17', payout: 60, color: '#ff4444' }
        };
        
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
            diceWhite: '#f5f5f0',
            diceBorder: '#cccccc',
            diceDot: '#1a1a1a',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#cc0000'
        };
        
        this.diceSize = 60;
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
        this.diceSize = Math.min((this.w - 60) / 3.5, 60);
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
        this.diceSize = Math.min((this.w - 60) / 3.5, 60);
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
        this.dice3 = 1;
        this.diceSum = 3;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.totalBet = 0;
        this.bets = {};
        this.betType = 'big';
        this.betValue = null;
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.diceParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type, value) {
        if (this.isRolling) return;
        
        // Toggle bet
        const betKey = value !== null && value !== undefined ? type + '_' + value : type;
        
        if (this.bets[betKey]) {
            this.totalBet -= this.bets[betKey];
            delete this.bets[betKey];
        } else {
            this.bets[betKey] = this.bet;
            this.totalBet += this.bet;
        }
        
        this.betType = type;
        this.betValue = value !== undefined ? value : null;
        this.drawFullTable();
    }
    
    clearAllBets() {
        if (this.isRolling) return;
        this.bets = {};
        this.totalBet = 0;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isRolling) return;
        if (Object.keys(this.bets).length === 0) {
            this.bets['big'] = bet || this.bet;
            this.totalBet = bet || this.bet;
            this.betType = 'big';
        }
        
        this.bet = bet || this.bet;
        this.isRolling = true;
        this.showResult = false;
        this.result = null;
        this.winnings = 0;
        this.confettiParticles = [];
        
        // Roll dice
        this.dice1 = Math.floor(Math.random() * 6) + 1;
        this.dice2 = Math.floor(Math.random() * 6) + 1;
        this.dice3 = Math.floor(Math.random() * 6) + 1;
        this.diceSum = this.dice1 + this.dice2 + this.dice3;
        
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
            self.diceAnims[2].value = Math.floor(Math.random() * 6) + 1;
            self.diceAnims.forEach(function(d) {
                d.rotation = (Math.random() - 0.5) * 2;
                d.scale = 0.85 + Math.random() * 0.3;
            });
            
            if (Math.random() > 0.4) {
                self.diceParticles.push({
                    x: self.w / 2 + (Math.random() - 0.5) * 120,
                    y: self.h * 0.28 + (Math.random() - 0.5) * 60,
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
                self.diceAnims[2].value = self.dice3;
                self.diceAnims.forEach(function(d) { d.rotation = 0; d.scale = 1; });
                
                self.resolveGame();
                self.drawFullTable();
            }
        }, 60);
    }
    
    resolveGame() {
        const isTriple = this.dice1 === this.dice2 && this.dice2 === this.dice3;
        this.winnings = 0;
        
        // Evaluate each bet
        for (const betKey in this.bets) {
            const betAmount = this.bets[betKey];
            let won = false;
            let multiplier = 0;
            
            if (betKey === 'big') {
                won = this.diceSum >= 11 && this.diceSum <= 17 && !isTriple;
                multiplier = 1;
            } else if (betKey === 'small') {
                won = this.diceSum >= 4 && this.diceSum <= 10 && !isTriple;
                multiplier = 1;
            } else if (betKey === 'even') {
                won = this.diceSum % 2 === 0 && !isTriple;
                multiplier = 1;
            } else if (betKey === 'odd') {
                won = this.diceSum % 2 === 1 && !isTriple;
                multiplier = 1;
            } else if (betKey === 'triple') {
                won = isTriple;
                multiplier = 30;
            } else if (betKey.startsWith('specific_triple_')) {
                const val = parseInt(betKey.split('_')[2]);
                won = isTriple && this.dice1 === val;
                multiplier = 180;
            } else if (betKey.startsWith('specific_double_')) {
                const val = parseInt(betKey.split('_')[2]);
                const counts = {};
                [this.dice1, this.dice2, this.dice3].forEach(function(d) { counts[d] = (counts[d] || 0) + 1; });
                won = counts[val] >= 2;
                multiplier = 10;
            } else if (betKey.startsWith('total_')) {
                const targetSum = parseInt(betKey.split('_')[1]);
                won = this.diceSum === targetSum;
                const opt = this.betOptions[betKey];
                multiplier = opt ? opt.payout : 6;
            }
            
            if (won) {
                this.winnings += Math.floor(betAmount * multiplier);
            }
        }
        
        this.chips += this.winnings;
        this.result = this.winnings > 0 ? 'win' : 'lose';
        
        if (this.winnings > 0) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h * 0.3, 80);
        } else if (this.totalBet > 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! Sum ' + this.diceSum + ' +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">Sum ' + this.diceSum + ' - Lost RS ' + this.totalBet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullTable();
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
        
        this.diceParticles.forEach(function(p) {
            p.life++;
            p.opacity -= 0.04;
        });
        this.diceParticles = this.diceParticles.filter(function(p) { return p.opacity > 0 && p.life < p.maxLife; });
        
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
        this.drawQuickBets(ctx, w, h);
        this.drawTotalBets(ctx, w, h);
        this.drawSpecificNumbers(ctx, w, h);
        this.drawDiceParticles(ctx);
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
        this.roundRect(ctx, w * 0.3, 28, w * 0.4, 30, 14);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SIC BO', w / 2, 43);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 65;
        const areaH = 100;
        
        // Dice zone
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeStyle = 'rgba(0,230,118,0.2)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, 25, areaY, w - 50, areaH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Three dice
        const ds = this.diceSize;
        const spacing = 10;
        const totalW = ds * 3 + spacing * 2;
        const startX = (w - totalW) / 2;
        const diceY = areaY + (areaH - ds) / 2;
        
        for (let i = 0; i < 3; i++) {
            const dx = startX + i * (ds + spacing);
            this.drawSingleDice(ctx, dx, diceY, ds, this.diceAnims[i]);
        }
    }
    
    drawSingleDice(ctx, x, y, size, anim) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(anim.rotation);
        ctx.scale(anim.scale, anim.scale);
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Dice body
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
        
        // Inner border
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, 7);
        ctx.stroke();
        
        // Dots
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
        const sy = 178;
        
        // Glow
        if (this.showResult) {
            const glowColor = this.winnings > 0 ? '#00e676' : '#ff4444';
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = this.showResult ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = this.showResult ? (this.winnings > 0 ? '#00e676' : '#ff4444') : 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 40, sy, 80, 40, 15);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('SUM', w / 2, sy + 12);
        
        ctx.fillStyle = this.showResult ? (this.winnings > 0 ? '#00e676' : '#ff4444') : this.palette.gold;
        ctx.font = 'bold 20px Georgia';
        ctx.fillText(this.showResult ? this.diceSum : '?', w / 2, sy + 32);
    }
    
    drawQuickBets(ctx, w, h) {
        const by = 232;
        
        const quickBets = [
            { type: 'big', label: 'BIG', sub: '11-17', color: '#00e676' },
            { type: 'small', label: 'SMALL', sub: '4-10', color: '#00b0ff' },
            { type: 'even', label: 'EVEN', color: '#c084fc' },
            { type: 'odd', label: 'ODD', color: '#ff8800' },
            { type: 'triple', label: 'TRIPLE', sub: '30:1', color: '#FFD700' }
        ];
        
        const btnW = (w - 50) / 5;
        const gap = 4;
        const btnH = 38;
        
        for (let i = 0; i < quickBets.length; i++) {
            const bet = quickBets[i];
            const bx = 20 + i * (btnW + gap);
            const betKey = bet.type;
            const isSelected = this.bets[betKey] !== undefined;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, bx, by, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, by + btnH / 2 - (bet.sub ? 6 : 0));
            
            if (bet.sub) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = 'bold 7px Georgia';
                ctx.fillText(bet.sub, bx + btnW / 2, by + btnH / 2 + 10);
            }
        }
    }
    
    drawTotalBets(ctx, w, h) {
        const ty = 280;
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('TOTAL BETS', w / 2, ty - 5);
        
        const totalBets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
        const btnW = (w - 40) / totalBets.length;
        
        for (let i = 0; i < totalBets.length; i++) {
            const num = totalBets[i];
            const tx = 16 + i * btnW;
            const betKey = 'total_' + num;
            const opt = this.betOptions[betKey];
            const isSelected = this.bets[betKey] !== undefined;
            const color = opt ? opt.color : '#888888';
            
            ctx.fillStyle = isSelected ? color + '30' : 'rgba(255,255,255,0.02)';
            ctx.strokeStyle = isSelected ? color : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = isSelected ? 1.5 : 0.5;
            this.roundRect(ctx, tx, ty, btnW - 2, 20, 5);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? color : 'rgba(255,255,255,0.45)';
            ctx.font = 'bold 8px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num, tx + btnW / 2 - 1, ty + 10);
        }
    }
    
    drawSpecificNumbers(ctx, w, h) {
        const ny = 310;
        
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('SPECIFIC TRIPLE (180:1) / DOUBLE (10:1)', w / 2, ny - 5);
        
        const btnW = (w - 50) / 6;
        
        for (let i = 1; i <= 6; i++) {
            const nx = 20 + (i - 1) * btnW;
            const tripKey = 'specific_triple_' + i;
            const doubKey = 'specific_double_' + i;
            const isSelected = this.bets[tripKey] !== undefined || this.bets[doubKey] !== undefined;
            
            ctx.fillStyle = isSelected ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isSelected ? 1.5 : 0.5;
            this.roundRect(ctx, nx, ny, btnW - 4, 26, 6);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 11px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, nx + btnW / 2 - 2, ny + 13);
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
        const glowGrad = ctx.createRadialGradient(w / 2, 115, 30, w / 2, 115, 180);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, 115, 180, 0, Math.PI * 2);
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
        
        const w = this.w;
        
        // Quick bets
        const qby = 232;
        const qbw = (w - 50) / 5;
        const qgap = 4;
        const qbh = 38;
        const quickTypes = ['big', 'small', 'even', 'odd', 'triple'];
        
        for (let i = 0; i < 5; i++) {
            const bx = 20 + i * (qbw + qgap);
            if (clickX >= bx && clickX <= bx + qbw && clickY >= qby && clickY <= qby + qbh) {
                this.setBetType(quickTypes[i]);
                return;
            }
        }
        
        // Total bets
        const tty = 280;
        const tbw = (w - 40) / 14;
        for (let i = 0; i < 14; i++) {
            const tx = 16 + i * tbw;
            if (clickX >= tx && clickX <= tx + tbw - 2 && clickY >= tty && clickY <= tty + 20) {
                const num = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17][i];
                this.setBetType('total_' + num, num);
                return;
            }
        }
        
        // Specific numbers
        const sny = 310;
        const sbw = (w - 50) / 6;
        for (let i = 1; i <= 6; i++) {
            const nx = 20 + (i - 1) * sbw;
            if (clickX >= nx && clickX <= nx + sbw - 4 && clickY >= sny && clickY <= sny + 26) {
                this.setBetType('specific_double', i);
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
    }
}

// Export
window.SicBoFullGame = SicBoFullGame;
console.log('Sic Bo v3.0.0 - Real Casino Design Loaded');
