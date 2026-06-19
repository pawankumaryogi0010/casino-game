// ============================================
// EMERALD KING CASINO - GAME 9: 7 UP 7 DOWN
// Full Real Casino Visual Design
// Two Dice Sum Betting Game
// File: js/games/7up-7down.js
// ============================================

class SevenUpSevenDownFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = '7up'; // '7up', '7down', 'exact7'
        this.dice1 = 1;
        this.dice2 = 1;
        this.diceSum = 2;
        this.isRolling = false;
        this.showResult = false;
        this.result = null; // 'win', 'lose'
        
        // Dice animation
        this.dice1Anim = { value: 1, rotation: 0, scale: 1, x: 0, y: 0 };
        this.dice2Anim = { value: 1, rotation: 0, scale: 1, x: 0, y: 0 };
        this.rollStartTime = 0;
        this.rollDuration = 2000;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Number particles
        this.numberParticles = [];
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            up: '#00e676',
            down: '#ff4444',
            exact: '#FFD700',
            gold: '#FFD700',
            diceWhite: '#f5f5f5'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.resetGame();
        this.drawFullTable();
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
    
    resetGame() {
        this.dice1 = 1;
        this.dice2 = 1;
        this.diceSum = 2;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.dice1Anim = { value: 1, rotation: 0, scale: 1, x: 0, y: 0 };
        this.dice2Anim = { value: 1, rotation: 0, scale: 1, x: 0, y: 0 };
        this.numberParticles = [];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type) {
        if (this.isRolling) return;
        this.betType = type;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isRolling) return;
        
        this.bet = bet;
        this.isRolling = true;
        this.showResult = false;
        this.result = null;
        
        // Generate dice results
        this.dice1 = Math.floor(Math.random() * 6) + 1;
        this.dice2 = Math.floor(Math.random() * 6) + 1;
        this.diceSum = this.dice1 + this.dice2;
        
        // Determine result
        if (this.diceSum > 7) {
            this.result = this.betType === '7up' ? 'win' : 'lose';
        } else if (this.diceSum < 7) {
            this.result = this.betType === '7down' ? 'win' : 'lose';
        } else {
            this.result = this.betType === 'exact7' ? 'win' : 'lose';
        }
        
        // Animate
        this.rollStartTime = performance.now();
        this.animateRoll();
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎲 Rolling...</span>';
        }
    }
    
    animateRoll() {
        const rollInterval = setInterval(() => {
            // Randomize dice during animation
            this.dice1Anim.value = Math.floor(Math.random() * 6) + 1;
            this.dice2Anim.value = Math.floor(Math.random() * 6) + 1;
            this.dice1Anim.rotation = (Math.random() - 0.5) * 1.5;
            this.dice2Anim.rotation = (Math.random() - 0.5) * 1.5;
            this.dice1Anim.scale = 0.9 + Math.random() * 0.2;
            this.dice2Anim.scale = 0.9 + Math.random() * 0.2;
            
            this.drawFullTable();
            
            const elapsed = performance.now() - this.rollStartTime;
            if (elapsed >= this.rollDuration) {
                clearInterval(rollInterval);
                this.isRolling = false;
                this.showResult = true;
                
                // Set final dice
                this.dice1Anim.value = this.dice1;
                this.dice2Anim.value = this.dice2;
                this.dice1Anim.rotation = 0;
                this.dice2Anim.rotation = 0;
                this.dice1Anim.scale = 1;
                this.dice2Anim.scale = 1;
                
                this.resolveGame();
                this.drawFullTable();
            }
        }, 60);
    }
    
    resolveGame() {
        const resultDisplay = document.getElementById('game-result-display');
        
        let payout = 0;
        let message = '';
        let winType = '';
        
        if (this.diceSum > 7) winType = '7 UP';
        else if (this.diceSum < 7) winType = '7 DOWN';
        else winType = 'EXACT 7';
        
        if (this.result === 'win') {
            if (this.betType === 'exact7') {
                payout = Math.floor(this.bet * 5); // 5:1 for exact 7
                this.chips += payout;
                message = `<span style="color:#FFD700;font-size:20px;">🎯 EXACT 7!</span><br>
                           <span style="color:#00e676;">+${payout} CHIPS (5:1)</span><br>
                           <span style="color:rgba(255,255,255,0.5);font-size:9px;">Sum: ${this.diceSum}</span>`;
                if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
            } else {
                payout = Math.floor(this.bet * 2); // 1:1
                this.chips += payout;
                message = `<span style="color:#00e676;font-size:18px;">🎉 ${winType} WINS!</span><br>
                           <span style="color:#00e676;">+${payout} CHIPS</span><br>
                           <span style="color:rgba(255,255,255,0.5);font-size:9px;">Sum: ${this.diceSum}</span>`;
                if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
            }
        } else {
            message = `<span style="color:#ff4444;font-size:16px;">😞 ${winType}</span><br>
                       <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                       <span style="color:rgba(255,255,255,0.4);font-size:9px;">Sum: ${this.diceSum}</span>`;
        }
        
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out;">${message}</div>`;
        }
        
        // Spawn number particles
        this.spawnNumberParticles();
        
        setTimeout(() => { this.showResult = false; this.resetGame(); }, 4000);
    }
    
    spawnNumberParticles() {
        this.numberParticles = [];
        for (let i = 0; i < 20; i++) {
            this.numberParticles.push({
                x: this.w / 2 + (Math.random() - 0.5) * 100,
                y: this.h / 2 + (Math.random() - 0.5) * 80,
                number: this.diceSum,
                size: 10 + Math.random() * 20,
                opacity: 1,
                fade: 0.01 + Math.random() * 0.02,
                vy: -1 - Math.random() * 2
            });
        }
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update number particles
        this.numberParticles.forEach(p => {
            p.y += p.vy;
            p.opacity -= p.fade;
        });
        this.numberParticles = this.numberParticles.filter(p => p.opacity > 0);
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING - FULL TABLE
    // ============================================
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Table border
        this.drawTableBorder(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Dice area
        this.drawDiceArea(ctx, w, h);
        
        // Sum display
        this.drawSumDisplay(ctx, w, h);
        
        // Betting areas
        this.drawBettingAreas(ctx, w, h);
        
        // Number particles
        this.drawNumberParticles(ctx);
        
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
    
    drawTableBorder(ctx, w, h) {
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 16, 16, w - 32, h - 32, 14);
        ctx.stroke();
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
        ctx.fillText('🎲 7 UP 7 DOWN', w / 2, 41);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 72;
        const areaH = 160;
        const areaX = 30;
        const areaW = w - 60;
        
        // Dice zone background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, areaH, 15);
        ctx.fill();
        ctx.stroke();
        
        // Dice 1
        const dice1X = w / 2 - 65;
        const dice1Y = areaY + 25;
        const diceSize = 80;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DICE 1', dice1X + diceSize / 2, dice1Y - 8);
        
        this.drawSingleDice(ctx, dice1X, dice1Y, diceSize, this.dice1Anim);
        
        // Dice 2
        const dice2X = w / 2 + 65 - diceSize;
        const dice2Y = areaY + 25;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillText('DICE 2', dice2X + diceSize / 2, dice2Y - 8);
        
        this.drawSingleDice(ctx, dice2X, dice2Y, diceSize, this.dice2Anim);
        
        // Plus sign between dice
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', w / 2, dice1Y + diceSize / 2);
    }
    
    drawSingleDice(ctx, x, y, size, anim) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(anim.rotation);
        ctx.scale(anim.scale, anim.scale);
        
        // Dice shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        // Dice body
        const diceGrad = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        diceGrad.addColorStop(0, '#ffffff');
        diceGrad.addColorStop(0.4, '#f0f0f0');
        diceGrad.addColorStop(1, '#d0d0d0');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2.5;
        CardRenderer.roundRect(ctx, -size / 2, -size / 2, size, size, 14);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Inner border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, -size / 2 + 6, -size / 2 + 6, size - 12, size - 12, 10);
        ctx.stroke();
        
        // Dots based on value
        this.drawDiceDots(ctx, size, anim.value);
        
        ctx.restore();
    }
    
    drawDiceDots(ctx, size, value) {
        const dotSize = size * 0.12;
        const offset = size * 0.25;
        
        ctx.fillStyle = '#1a1a1a';
        
        const drawDot = (dx, dy) => {
            ctx.beginPath();
            ctx.arc(dx, dy, dotSize, 0, Math.PI * 2);
            ctx.fill();
        };
        
        // Dot patterns for 1-6
        if (value === 1 || value === 3 || value === 5) drawDot(0, 0); // Center
        if (value >= 2) { drawDot(-offset, -offset); drawDot(offset, offset); } // Top-left, Bottom-right
        if (value >= 4) { drawDot(-offset, offset); drawDot(offset, -offset); } // Bottom-left, Top-right
        if (value === 6) { drawDot(-offset, 0); drawDot(offset, 0); } // Middle-left, Middle-right
    }
    
    drawSumDisplay(ctx, w, h) {
        const sumY = 245;
        
        // Sum background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = this.showResult ? (this.result === 'win' ? '#00e676' : '#ff4444') : 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 50, sumY, 100, 50, 15);
        ctx.fill();
        ctx.stroke();
        
        // Sum label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SUM', w / 2, sumY + 14);
        
        // Sum value
        const displaySum = this.showResult ? this.diceSum : (this.isRolling ? '?' : '?');
        ctx.fillStyle = this.showResult ? (this.result === 'win' ? '#00e676' : '#ff4444') : '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(displaySum, w / 2, sumY + 38);
        
        // Win type indicator
        if (this.showResult) {
            let indicator = '';
            let indicatorColor = '';
            if (this.diceSum > 7) { indicator = '▲ 7 UP'; indicatorColor = '#00e676'; }
            else if (this.diceSum < 7) { indicator = '▼ 7 DOWN'; indicatorColor = '#ff4444'; }
            else { indicator = '● EXACT 7'; indicatorColor = '#FFD700'; }
            
            ctx.fillStyle = indicatorColor;
            ctx.font = 'bold 9px Arial';
            ctx.fillText(indicator, w / 2, sumY + 62);
        }
    }
    
    drawBettingAreas(ctx, w, h) {
        const betY = h - 130;
        const btnW = (w - 60) / 3;
        const btnH = 55;
        const gap = 8;
        
        const bets = [
            { label: '▲ 7 UP', sub: '(8-12) 1:1', color: '#00e676', type: '7up', icon: '🔼' },
            { label: '7 EXACT', sub: '(7) 5:1', color: '#FFD700', type: 'exact7', icon: '🎯' },
            { label: '▼ 7 DOWN', sub: '(2-6) 1:1', color: '#ff4444', type: '7down', icon: '🔽' }
        ];
        
        bets.forEach((bet, i) => {
            const bx = 22 + i * (btnW + gap);
            const isSelected = this.betType === bet.type;
            
            ctx.fillStyle = isSelected ? `${bet.color}25` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            CardRenderer.roundRect(ctx, bx, betY, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            // Icon
            ctx.fillStyle = bet.color;
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.icon, bx + btnW / 2, betY + btnH / 2 - 12);
            
            // Label
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(bet.label, bx + btnW / 2, betY + btnH / 2 + 8);
            
            // Sub
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(bet.sub, bx + btnW / 2, betY + btnH / 2 + 22);
        });
    }
    
    drawNumberParticles(ctx) {
        this.numberParticles.forEach(p => {
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.font = `bold ${p.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.number, p.x, p.y);
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
        this.drawFullTable();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.numberParticles = [];
    }
}

// Export
window.SevenUpSevenDownFullGame = SevenUpSevenDownFullGame;
console.log('✅ Game 9: 7 Up 7 Down - Full Casino Design Loaded');
