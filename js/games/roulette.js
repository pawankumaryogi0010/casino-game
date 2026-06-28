// ============================================
// EMERALD KING CASINO - ROULETTE
// Real Casino UI - European Wheel + Betting Table
// Full Redesign v3.0.0
// File: js/games/roulette.js
// ============================================

class RouletteFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas display dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = 'red';
        this.betNumber = null;
        this.selectedNumber = null;
        this.lastResults = [];
        this.maxResults = 10;
        
        // Wheel state
        this.wheelRotation = 0;
        this.ballAngle = 0;
        this.ballDistance = 0;
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 0;
        this.resultNumber = null;
        this.resultColor = null;
        this.showResult = false;
        this.winnings = 0;
        
        // Wheel dimensions
        this.wheelCenterX = 0;
        this.wheelCenterY = 0;
        this.wheelRadius = 0;
        
        // Animation
        this.ballTrail = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Table sparks
        this.sparkles = [];
        this.glowPulse = 0;
        
        // European wheel numbers
        this.numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        
        // Number colors
        this.colors = {
            0: 'green', 32: 'red', 15: 'black', 19: 'red', 4: 'black', 21: 'red', 2: 'black', 25: 'red',
            17: 'black', 34: 'red', 6: 'black', 27: 'red', 13: 'black', 36: 'red', 11: 'black', 30: 'red',
            8: 'black', 23: 'red', 10: 'black', 5: 'red', 24: 'black', 16: 'red', 33: 'black', 1: 'red',
            20: 'black', 14: 'red', 31: 'black', 9: 'red', 22: 'black', 18: 'red', 29: 'black', 7: 'red',
            28: 'black', 12: 'red', 35: 'black', 3: 'red', 26: 'black'
        };
        
        // Betting table layout
        this.tableNumbers = [
            [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
            [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
            [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
        ];
        
        // Payout multipliers
        this.payouts = {
            'number': 36,
            'red': 2, 'black': 2,
            'even': 2, 'odd': 2,
            'low': 2, 'high': 2,
            'dozen1': 3, 'dozen2': 3, 'dozen3': 3,
            'column1': 3, 'column2': 3, 'column3': 3
        };
        
        // Color palette
        this.palette = {
            felt: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            goldLight: '#f0d078',
            wheelGold: '#d4a843',
            wheelRim: '#3d1c08',
            red: '#cc0000',
            black: '#1a1a1a',
            green: '#006633',
            ballColor: '#ffffff',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        if (this.canvas) {
            const styleWidth = parseFloat(this.canvas.style.width);
            const styleHeight = parseFloat(this.canvas.style.height);
            if (styleWidth && styleHeight) {
                this.w = styleWidth;
                this.h = styleHeight;
            }
        }
        
        this.calculateWheelDimensions();
        this.generateSparkles();
        this.loadHistory();
        this.drawFullScreen();
    }
    
    resize() {
        if (this.canvas) {
            const styleWidth = parseFloat(this.canvas.style.width);
            const styleHeight = parseFloat(this.canvas.style.height);
            if (styleWidth && styleHeight) {
                this.w = styleWidth;
                this.h = styleHeight;
            }
        }
        this.calculateWheelDimensions();
        this.drawFullScreen();
    }
    
    calculateWheelDimensions() {
        this.wheelCenterX = this.w / 2;
        this.wheelCenterY = this.h * 0.25;
        this.wheelRadius = Math.min(this.w, this.h) * 0.2;
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 25; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.2 + 0.3,
                speed: Math.random() * 0.015 + 0.003,
                opacity: Math.random() * 0.3 + 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('roulette_history');
            if (saved) {
                this.lastResults = JSON.parse(saved);
                if (this.lastResults.length > this.maxResults) {
                    this.lastResults = this.lastResults.slice(-this.maxResults);
                }
            }
        } catch (e) {
            this.lastResults = [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('roulette_history', JSON.stringify(this.lastResults));
        } catch (e) {}
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type, number) {
        if (this.isSpinning) return;
        this.betType = type;
        this.betNumber = number || null;
        this.selectedNumber = number || null;
        this.drawFullScreen();
    }
    
    play(bet) {
        if (this.isSpinning) return;
        
        this.bet = bet || this.bet;
        this.isSpinning = true;
        this.showResult = false;
        this.resultNumber = null;
        this.winnings = 0;
        this.ballTrail = [];
        this.confettiParticles = [];
        
        // Generate result
        this.resultNumber = this.numbers[Math.floor(Math.random() * this.numbers.length)];
        this.resultColor = this.colors[this.resultNumber];
        
        // Add to history
        this.lastResults.push({ number: this.resultNumber, color: this.resultColor });
        if (this.lastResults.length > this.maxResults) {
            this.lastResults.shift();
        }
        this.saveHistory();
        
        // Calculate target angle
        const targetIndex = this.numbers.indexOf(this.resultNumber);
        const segmentAngle = (2 * Math.PI) / 37;
        const targetAngle = targetIndex * segmentAngle;
        const extraRotations = 5 + Math.random() * 5;
        this.targetRotation = this.wheelRotation + extraRotations * 2 * Math.PI + (2 * Math.PI - targetAngle);
        
        this.spinStartTime = performance.now();
        this.spinDuration = 4000 + Math.random() * 3000;
        this.ballDistance = this.wheelRadius * 0.85;
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Spinning...</div>';
        }
    }
    
    checkWin() {
        const num = this.resultNumber;
        const color = this.resultColor;
        let won = false;
        let multiplier = 0;
        
        switch (this.betType) {
            case 'red': won = color === 'red'; multiplier = 2; break;
            case 'black': won = color === 'black'; multiplier = 2; break;
            case 'even': won = num !== 0 && num % 2 === 0; multiplier = 2; break;
            case 'odd': won = num !== 0 && num % 2 === 1; multiplier = 2; break;
            case 'low': won = num >= 1 && num <= 18; multiplier = 2; break;
            case 'high': won = num >= 19 && num <= 36; multiplier = 2; break;
            case 'dozen1': won = num >= 1 && num <= 12; multiplier = 3; break;
            case 'dozen2': won = num >= 13 && num <= 24; multiplier = 3; break;
            case 'dozen3': won = num >= 25 && num <= 36; multiplier = 3; break;
            case 'number': won = num === this.betNumber; multiplier = 36; break;
        }
        
        return { won, multiplier };
    }
    
    resolveGame() {
        const result = this.checkWin();
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (result.won) {
            this.winnings = Math.floor(this.bet * result.multiplier);
            this.chips += this.winnings;
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            
            if (this.winCascade) {
                this.winCascade.spawn(this.wheelCenterX, this.wheelCenterY, 80);
            }
            
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + this.resultNumber + ' ' + this.resultColor.toUpperCase() + ' - WIN +RS ' + this.winnings + '</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
            
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + this.resultNumber + ' ' + this.resultColor.toUpperCase() + ' - Lost RS ' + this.bet + '</div>';
            }
        }
        
        this.showResult = true;
        this.resultDisplayTimer = performance.now();
        this.drawFullScreen();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.drawFullScreen();
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
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.isSpinning) {
            const elapsed = timestamp - this.spinStartTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            
            this.wheelRotation = this.wheelRotation + (this.targetRotation - this.wheelRotation) * 0.15;
            
            // Ball position
            this.ballAngle = this.wheelRotation * (-1.2) + Math.PI / 2;
            this.ballDistance = this.wheelRadius * (0.85 - eased * 0.1);
            
            // Ball trail
            if (progress < 0.9) {
                this.ballTrail.push({
                    angle: this.ballAngle,
                    distance: this.ballDistance,
                    opacity: 0.6
                });
                if (this.ballTrail.length > 20) this.ballTrail.shift();
            } else {
                this.ballTrail = [];
            }
            
            this.ballTrail.forEach(function(t) { t.opacity -= 0.03; });
            this.ballTrail = this.ballTrail.filter(function(t) { return t.opacity > 0; });
            
            if (progress >= 1) {
                this.isSpinning = false;
                this.wheelRotation = this.targetRotation;
                this.resolveGame();
            }
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
    // RENDERING - FULL SCREEN
    // ============================================
    
    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawWheel(ctx, w, h);
        this.drawBall(ctx, w, h);
        this.drawResultHistory(ctx, w, h);
        this.drawBettingTable(ctx, w, h);
        this.drawBetTypeButtons(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.showResult && this.resultNumber !== null) {
            this.drawResultIndicator(ctx, w, h);
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
    
    drawWheel(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        const r = this.wheelRadius;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelRotation);
        
        // Outer wooden rim
        const rimGrad = ctx.createRadialGradient(0, 0, r + 2, 0, 0, r + 20);
        rimGrad.addColorStop(0, '#8B4513');
        rimGrad.addColorStop(0.5, '#6B3410');
        rimGrad.addColorStop(1, '#3d1c08');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold trim
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Number segments
        for (let i = 0; i < 37; i++) {
            const num = this.numbers[i];
            const startAngle = (i / 37) * Math.PI * 2 - Math.PI / 2;
            const endAngle = ((i + 1) / 37) * Math.PI * 2 - Math.PI / 2;
            const color = this.colors[num];
            
            ctx.fillStyle = color === 'red' ? '#cc0000' : color === 'black' ? '#1a1a1a' : '#006633';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Segment border
            ctx.strokeStyle = 'rgba(255,215,0,0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Number text
            const midAngle = (startAngle + endAngle) / 2;
            const textX = Math.cos(midAngle) * (r * 0.78);
            const textY = Math.sin(midAngle) * (r * 0.78);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString(), textX, textY);
        }
        
        // Inner ring
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center diamond
        ctx.fillStyle = this.palette.gold;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Pocket frets (metal dividers)
        for (let i = 0; i < 37; i++) {
            const angle = (i / 37) * Math.PI * 2 - Math.PI / 2;
            ctx.strokeStyle = 'rgba(192,192,192,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r * 0.85, Math.sin(angle) * r * 0.85);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawBall(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        
        // Ball trail
        this.ballTrail.forEach(function(t, i) {
            const bx = cx + Math.cos(t.angle) * t.distance;
            const by = cy + Math.sin(t.angle) * t.distance;
            ctx.fillStyle = 'rgba(255,255,255,' + (t.opacity * (i / this.ballTrail.length)) + ')';
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
        }.bind(this));
        
        // Main ball
        const bx = cx + Math.cos(this.ballAngle) * this.ballDistance;
        const by = cy + Math.sin(this.ballAngle) * this.ballDistance;
        
        if (this.isSpinning) {
            // Ball glow
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball body
            const ballGrad = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, 6);
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(0.6, '#dddddd');
            ballGrad.addColorStop(1, '#999999');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawResultHistory(ctx, w, h) {
        const rhx = w - 70;
        const rhy = this.wheelCenterY - this.wheelRadius - 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, rhx - 5, rhy - 5, 60, 28, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('HISTORY', rhx + 25, rhy + 6);
        
        // Show last 6 results
        const recentResults = this.lastResults.slice(-6);
        for (let i = 0; i < recentResults.length; i++) {
            const result = recentResults[i];
            const rx = rhx + i * 10;
            const ry = rhy + 14;
            
            let color;
            if (result.color === 'red') color = '#cc0000';
            else if (result.color === 'black') color = '#1a1a1a';
            else color = '#006633';
            
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(rx + 3, ry, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    drawResultIndicator(ctx, w, h) {
        const cx = this.wheelCenterX;
        const cy = this.wheelCenterY;
        const color = this.resultColor === 'red' ? '#ff4444' : this.resultColor === 'black' ? '#ffffff' : '#00e676';
        
        // Pulsing ring
        const pulse = Math.sin(Date.now() * 0.005) * 5 + 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, this.wheelRadius + 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Result number
        ctx.fillStyle = color;
        ctx.font = 'bold 28px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.resultNumber, cx, cy - this.wheelRadius - 30);
    }
    
    drawBettingTable(ctx, w, h) {
        const tableX = 15;
        const tableY = this.wheelCenterY + this.wheelRadius + 40;
        const tableW = w - 30;
        const tableH = h - tableY - 80;
        
        // Table background
        ctx.fillStyle = 'rgba(0,30,20,0.8)';
        ctx.strokeStyle = 'rgba(0,230,118,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, tableX, tableY, tableW, tableH, 10);
        ctx.fill();
        ctx.stroke();
        
        // Number grid
        const cellW = (tableW - 60) / 12;
        const cellH = (tableH - 20) / 3;
        const gridStartX = tableX + 38;
        const gridStartY = tableY + 8;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const num = this.tableNumbers[row][col];
                const cx = gridStartX + col * cellW;
                const cy = gridStartY + row * cellH;
                const color = this.colors[num];
                
                ctx.fillStyle = color === 'red' ? '#cc0000' : '#1a1a1a';
                ctx.strokeStyle = this.selectedNumber === num ? '#FFD700' : 'rgba(255,255,255,0.2)';
                ctx.lineWidth = this.selectedNumber === num ? 2 : 1;
                this.roundRect(ctx, cx, cy, cellW - 2, cellH - 2, 4);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 7px Georgia';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(num, cx + cellW / 2, cy + cellH / 2);
                
                // Highlight result number
                if (this.showResult && num === this.resultNumber) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 10;
                    this.roundRect(ctx, cx - 2, cy - 2, cellW + 2, cellH + 2, 6);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }
        
        // Zero
        const zeroX = tableX + 6;
        const zeroW = 28;
        ctx.fillStyle = '#006633';
        ctx.strokeStyle = this.selectedNumber === 0 ? '#FFD700' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = this.selectedNumber === 0 ? 2 : 1;
        this.roundRect(ctx, zeroX, gridStartY, zeroW, cellH * 3, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', zeroX + zeroW / 2, gridStartY + cellH * 1.5);
    }
    
    drawBetTypeButtons(ctx, w, h) {
        const btnY = h - 70;
        const btnW = (w - 40) / 6;
        const btnH = 28;
        
        const betTypes = [
            { label: 'RED', color: '#cc0000', type: 'red' },
            { label: 'BLACK', color: '#1a1a1a', type: 'black' },
            { label: 'EVEN', color: '#0044cc', type: 'even' },
            { label: 'ODD', color: '#0044cc', type: 'odd' },
            { label: '1-18', color: '#008844', type: 'low' },
            { label: '19-36', color: '#008844', type: 'high' }
        ];
        
        betTypes.forEach(function(bt, i) {
            const bx = 16 + i * (btnW + 2);
            const isSelected = this.betType === bt.type;
            
            ctx.fillStyle = isSelected ? bt.color : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bt.label, bx + btnW / 2, btnY + btnH / 2);
        }.bind(this));
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
            const sparkle = this.sparkles[i];
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.004;
            sparkle.opacity = Math.max(0.03, Math.min(0.3, sparkle.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sparkle.opacity + ')';
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ============================================
    // UTILITIES
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
    // CANVAS CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isSpinning) return;
        
        // Check betting table numbers
        const tableX = 15;
        const tableY = this.wheelCenterY + this.wheelRadius + 40;
        const tableW = this.w - 30;
        const cellW = (tableW - 60) / 12;
        const cellH = (this.h - tableY - 80 - 20) / 3;
        const gridStartX = tableX + 38;
        const gridStartY = tableY + 8;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const cx = gridStartX + col * cellW;
                const cy = gridStartY + row * cellH;
                
                if (clickX >= cx && clickX <= cx + cellW && clickY >= cy && clickY <= cy + cellH) {
                    const num = this.tableNumbers[row][col];
                    this.setBetType('number', num);
                    return;
                }
            }
        }
        
        // Check zero
        const zeroX = tableX + 6;
        const zeroW = 28;
        if (clickX >= zeroX && clickX <= zeroX + zeroW && clickY >= gridStartY && clickY <= gridStartY + cellH * 3) {
            this.setBetType('number', 0);
            return;
        }
        
        // Check bet type buttons
        const btnY = this.h - 70;
        const btnW = (this.w - 40) / 6;
        const btnH = 28;
        const betTypes = ['red', 'black', 'even', 'odd', 'low', 'high'];
        
        for (let i = 0; i < 6; i++) {
            const bx = 16 + i * (btnW + 2);
            if (clickX >= bx && clickX <= bx + btnW && clickY >= btnY && clickY <= btnY + btnH) {
                this.setBetType(betTypes[i]);
                return;
            }
        }
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
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.ballTrail = [];
        this.lastResults = [];
    }
}

// Export
window.RouletteFullGame = RouletteFullGame;
console.log('Roulette v3.0.0 - Real Casino Design Loaded');
