// ============================================
// EMERALD KING CASINO - GAME 4: ROULETTE
// Full Real Casino Visual Design
// European Wheel, Ball Physics, Betting Table
// File: js/games/roulette.js
// ============================================

class RouletteFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = 'red'; // red, black, even, odd, low, high, dozen1, dozen2, dozen3, number
        this.betNumber = null;
        this.selectedNumber = null;
        
        // Wheel state
        this.ballAngle = 0;
        this.ballRadius = 0;
        this.wheelRotation = 0;
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 0;
        this.resultNumber = null;
        this.resultColor = null;
        this.showResult = false;
        this.resultDisplayTimer = 0;
        
        // Ball trail
        this.ballTrail = [];
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Wheel segments (European)
        this.numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
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
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.wheelRadius = Math.min(this.w, this.h) * 0.34;
        this.wheelX = this.w / 2;
        this.wheelY = this.h / 2 - 15;
        this.ballRadius = this.wheelRadius - 18;
        this.drawFullScreen();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.4 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    resize() {
        this.wheelRadius = Math.min(this.w, this.h) * 0.34;
        this.wheelX = this.w / 2;
        this.wheelY = this.h / 2 - 15;
        this.ballRadius = this.wheelRadius - 18;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type, number = null) {
        if (this.isSpinning) return;
        this.betType = type;
        this.betNumber = number;
        this.selectedNumber = number;
        this.drawFullScreen();
    }
    
    play(bet) {
        if (this.isSpinning) return;
        
        this.bet = bet;
        this.isSpinning = true;
        this.showResult = false;
        this.resultNumber = null;
        this.ballTrail = [];
        
        // Generate result with house edge
        this.resultNumber = this.generateResult();
        this.resultColor = this.colors[this.resultNumber];
        
        // Calculate target angle
        const targetAngle = this.getNumberAngle(this.resultNumber);
        
        // Random starting angle
        this.ballAngle = Math.random() * Math.PI * 2;
        
        // Spin physics
        this.spinDuration = 4000 + Math.random() * 3000; // 4-7 seconds
        this.spinStartTime = performance.now();
        this.startBallAngle = this.ballAngle;
        this.targetBallAngle = targetAngle + (5 + Math.random() * 3) * Math.PI * 2;
        
        // Clear result display
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎡 Spinning...</span>';
        }
    }
    
    generateResult() {
        // RTP ~97.3% (European roulette)
        return this.numbers[Math.floor(Math.random() * this.numbers.length)];
    }
    
    getNumberAngle(number) {
        const index = this.numbers.indexOf(number);
        return (index / this.numbers.length) * Math.PI * 2 - Math.PI / 2;
    }
    
    checkWin() {
        const num = this.resultNumber;
        const color = this.resultColor;
        let won = false;
        let multiplier = 0;
        
        switch (this.betType) {
            case 'red':
                won = color === 'red';
                multiplier = 2;
                break;
            case 'black':
                won = color === 'black';
                multiplier = 2;
                break;
            case 'even':
                won = num !== 0 && num % 2 === 0;
                multiplier = 2;
                break;
            case 'odd':
                won = num !== 0 && num % 2 === 1;
                multiplier = 2;
                break;
            case 'low':
                won = num >= 1 && num <= 18;
                multiplier = 2;
                break;
            case 'high':
                won = num >= 19 && num <= 36;
                multiplier = 2;
                break;
            case 'dozen1':
                won = num >= 1 && num <= 12;
                multiplier = 3;
                break;
            case 'dozen2':
                won = num >= 13 && num <= 24;
                multiplier = 3;
                break;
            case 'dozen3':
                won = num >= 25 && num <= 36;
                multiplier = 3;
                break;
            case 'number':
                won = num === this.betNumber;
                multiplier = 36;
                break;
        }
        
        const resultDisplay = document.getElementById('game-result-display');
        
        if (won) {
            const payout = Math.floor(this.bet * multiplier);
            this.chips += payout;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${num} ${color.toUpperCase()}</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 YOU LOST</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${num} ${color.toUpperCase()}</span>
                    </div>`;
            }
        }
        
        this.showResult = true;
        this.resultDisplayTimer = performance.now();
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.isSpinning) {
            const elapsed = timestamp - this.spinStartTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);
            
            // Easing function (deceleration)
            const eased = 1 - Math.pow(1 - progress, 4);
            
            // Update ball angle
            this.ballAngle = this.startBallAngle + (this.targetBallAngle - this.startBallAngle) * eased;
            
            // Update wheel rotation (slight rotation for realism)
            this.wheelRotation = eased * Math.PI * 3;
            
            // Ball trail
            if (progress < 0.95) {
                this.ballTrail.push({
                    angle: this.ballAngle,
                    opacity: 0.6,
                    size: 3
                });
                if (this.ballTrail.length > 15) this.ballTrail.shift();
            } else {
                this.ballTrail = [];
            }
            
            // Fade trail
            this.ballTrail.forEach(t => t.opacity -= 0.04);
            this.ballTrail = this.ballTrail.filter(t => t.opacity > 0);
            
            // Spin complete
            if (progress >= 1) {
                this.isSpinning = false;
                this.ballTrail = [];
                this.checkWin();
            }
        }
        
        // Result display timer
        if (this.showResult) {
            const elapsed = timestamp - this.resultDisplayTimer;
            if (elapsed > 4000) {
                this.showResult = false;
            }
        }
        
        // Win cascade
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
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Wheel
        this.drawWheel(ctx);
        
        // Ball
        if (this.isSpinning || this.resultNumber) {
            this.drawBall(ctx);
        }
        
        // Betting table
        this.drawBettingTable(ctx, w, h);
        
        // Result indicator
        if (this.showResult && this.resultNumber) {
            this.drawResultIndicator(ctx);
        }
        
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
        
        // Green felt pattern
        ctx.fillStyle = 'rgba(0, 50, 30, 0.3)';
        for (let x = 0; x < w; x += 30) {
            for (let y = 0; y < h; y += 30) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.25, 8, w * 0.5, 28, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.25, 8, w * 0.5, 28, 14);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎡 EUROPEAN ROULETTE', w / 2, 22);
    }
    
    drawWheel(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        const r = this.wheelRadius;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelRotation);
        
        // Outer wooden rim
        const rimGrad = ctx.createRadialGradient(0, 0, r + 5, 0, 0, r + 18);
        rimGrad.addColorStop(0, '#8B4513');
        rimGrad.addColorStop(0.5, '#6B3410');
        rimGrad.addColorStop(1, '#3d1c08');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold trim
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Number segments
        this.numbers.forEach((num, i) => {
            const startAngle = (i / this.numbers.length) * Math.PI * 2 - Math.PI / 2;
            const endAngle = ((i + 1) / this.numbers.length) * Math.PI * 2 - Math.PI / 2;
            const color = this.colors[num];
            
            // Segment fill
            ctx.fillStyle = color === 'red' ? '#cc0000' : color === 'black' ? '#1a1a1a' : '#006633';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Segment border
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Number text
            const midAngle = (startAngle + endAngle) / 2;
            const textX = Math.cos(midAngle) * (r * 0.78);
            const textY = Math.sin(midAngle) * (r * 0.78);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString(), textX, textY);
        });
        
        // Inner ring
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center diamond
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawBall(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        
        // Ball trail
        this.ballTrail.forEach((t, i) => {
            const bx = cx + Math.cos(t.angle) * this.ballRadius;
            const by = cy + Math.sin(t.angle) * this.ballRadius;
            ctx.fillStyle = `rgba(255, 255, 255, ${t.opacity * (i / this.ballTrail.length)})`;
            ctx.beginPath();
            ctx.arc(bx, by, t.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Main ball
        const bx = cx + Math.cos(this.ballAngle) * this.ballRadius;
        const by = cy + Math.sin(this.ballAngle) * this.ballRadius;
        
        // Ball glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball body
        const ballGrad = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, 5);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.6, '#dddddd');
        ballGrad.addColorStop(1, '#999999');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(bx - 1.5, by - 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBettingTable(ctx, w, h) {
        const tableY = h - 85;
        const tableH = 70;
        const tableX = 15;
        const tableW = w - 30;
        
        // Table background
        ctx.fillStyle = 'rgba(0, 30, 20, 0.8)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, tableX, tableY, tableW, tableH, 10);
        ctx.fill();
        ctx.stroke();
        
        // Number grid
        const cellW = (tableW - 80) / 12;
        const cellH = (tableH - 30) / 3;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const num = this.tableNumbers[row][col];
                const cx = tableX + 50 + col * cellW;
                const cy = tableY + 5 + row * cellH;
                const color = this.colors[num];
                
                ctx.fillStyle = color === 'red' ? '#cc0000' : '#1a1a1a';
                ctx.strokeStyle = this.selectedNumber === num ? '#FFD700' : 'rgba(255,255,255,0.2)';
                ctx.lineWidth = this.selectedNumber === num ? 2 : 1;
                CardRenderer.roundRect(ctx, cx, cy, cellW - 2, cellH - 2, 3);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(num, cx + cellW / 2 - 1, cy + cellH / 2);
            }
        }
        
        // Zero
        const zeroX = tableX + 8;
        const zeroW = 35;
        ctx.fillStyle = '#006633';
        ctx.strokeStyle = this.selectedNumber === 0 ? '#FFD700' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = this.selectedNumber === 0 ? 2 : 1;
        CardRenderer.roundRect(ctx, zeroX, tableY + 5, zeroW, tableH - 10, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', zeroX + zeroW / 2, tableY + tableH / 2);
        
        // Bet type buttons below table
        const btnY = tableY + tableH + 5;
        const btnW = (tableW - 10) / 6;
        const btnH = 22;
        const betTypes = [
            { label: 'RED', color: '#cc0000', type: 'red' },
            { label: 'BLACK', color: '#1a1a1a', type: 'black' },
            { label: 'EVEN', color: '#0044cc', type: 'even' },
            { label: 'ODD', color: '#0044cc', type: 'odd' },
            { label: '1-18', color: '#008844', type: 'low' },
            { label: '19-36', color: '#008844', type: 'high' }
        ];
        
        betTypes.forEach((bt, i) => {
            const bx = tableX + i * (btnW + 2);
            const isSelected = this.betType === bt.type;
            
            ctx.fillStyle = isSelected ? bt.color : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, bx, btnY, btnW, btnH, 12);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bt.label, bx + btnW / 2, btnY + btnH / 2);
        });
    }
    
    drawResultIndicator(ctx) {
        const cx = this.wheelX;
        const cy = this.wheelY;
        const color = this.resultColor === 'red' ? '#ff4444' : this.resultColor === 'black' ? '#ffffff' : '#00e676';
        
        // Pulsing ring
        const pulse = Math.sin(Date.now() * 0.005) * 5 + 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, this.wheelRadius + 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Result number
        ctx.fillStyle = color;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.resultNumber, cx, cy - this.wheelRadius - 35);
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.5, sparkle.opacity));
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
        this.drawFullScreen();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.ballTrail = [];
    }
}

// Export
window.RouletteFullGame = RouletteFullGame;
console.log('✅ Game 4: Roulette - Full Casino Design Loaded');
