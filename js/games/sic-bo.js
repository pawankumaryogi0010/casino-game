// ============================================
// EMERALD KING CASINO - GAME 18: SIC BO
// Full Real Casino Visual Design
// Three Dice Betting Game
// File: js/games/sic-bo.js
// ============================================

class SicBoFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betType = 'big'; // big, small, triple, specific_triple, specific_double, total
        this.betValue = null; // For specific number bets
        this.dice1 = 1;
        this.dice2 = 1;
        this.dice3 = 1;
        this.diceSum = 3;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.payout = 0;
        
        // Dice animation
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.rollStartTime = 0;
        this.rollDuration = 2500;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.diceParticles = [];
        
        // Betting options
        this.betOptions = {
            big: { name: 'BIG', desc: 'Sum 11-17', payout: 1, color: '#00e676' },
            small: { name: 'SMALL', desc: 'Sum 4-10', payout: 1, color: '#00b0ff' },
            triple: { name: 'ANY TRIPLE', desc: 'All three same', payout: 30, color: '#FFD700' },
            specific_triple: { name: 'SPECIFIC TRIPLE', desc: 'Choose a number', payout: 180, color: '#ff4444' },
            specific_double: { name: 'SPECIFIC DOUBLE', desc: 'Choose a number', payout: 10, color: '#c084fc' },
            total_4: { name: 'TOTAL 4', desc: 'Sum = 4', payout: 60, color: '#ff8800' },
            total_5: { name: 'TOTAL 5', desc: 'Sum = 5', payout: 30, color: '#ff8800' },
            total_6: { name: 'TOTAL 6', desc: 'Sum = 6', payout: 17, color: '#ff8800' },
            total_7: { name: 'TOTAL 7', desc: 'Sum = 7', payout: 12, color: '#ff8800' },
            total_8: { name: 'TOTAL 8', desc: 'Sum = 8', payout: 8, color: '#ff8800' },
            total_9: { name: 'TOTAL 9', desc: 'Sum = 9', payout: 6, color: '#ff8800' },
            total_10: { name: 'TOTAL 10', desc: 'Sum = 10', payout: 6, color: '#ff8800' },
            total_11: { name: 'TOTAL 11', desc: 'Sum = 11', payout: 6, color: '#ff8800' },
            total_12: { name: 'TOTAL 12', desc: 'Sum = 12', payout: 6, color: '#ff8800' },
            total_13: { name: 'TOTAL 13', desc: 'Sum = 13', payout: 8, color: '#ff8800' },
            total_14: { name: 'TOTAL 14', desc: 'Sum = 14', payout: 12, color: '#ff8800' },
            total_15: { name: 'TOTAL 15', desc: 'Sum = 15', payout: 17, color: '#ff8800' },
            total_16: { name: 'TOTAL 16', desc: 'Sum = 16', payout: 30, color: '#ff8800' },
            total_17: { name: 'TOTAL 17', desc: 'Sum = 17', payout: 60, color: '#ff8800' }
        };
        
        // Colors
        this.colors = {
            felt: '#0d3320',
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
        this.dice3 = 1;
        this.diceSum = 3;
        this.isRolling = false;
        this.showResult = false;
        this.result = null;
        this.payout = 0;
        this.diceAnims = [
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 },
            { value: 1, rotation: 0, scale: 1 }
        ];
        this.diceParticles = [];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setBetType(type, value = null) {
        if (this.isRolling) return;
        this.betType = type;
        this.betValue = value;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isRolling) return;
        
        this.bet = bet;
        this.isRolling = true;
        this.showResult = false;
        this.result = null;
        this.payout = 0;
        
        // Roll dice
        this.dice1 = Math.floor(Math.random() * 6) + 1;
        this.dice2 = Math.floor(Math.random() * 6) + 1;
        this.dice3 = Math.floor(Math.random() * 6) + 1;
        this.diceSum = this.dice1 + this.dice2 + this.dice3;
        
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
            this.diceAnims.forEach(d => {
                d.value = Math.floor(Math.random() * 6) + 1;
                d.rotation = (Math.random() - 0.5) * 2;
                d.scale = 0.85 + Math.random() * 0.3;
            });
            
            // Dice particles
            if (Math.random() > 0.5) {
                this.diceParticles.push({
                    x: this.w / 2 + (Math.random() - 0.5) * 120,
                    y: this.h / 2 - 30 + (Math.random() - 0.5) * 60,
                    size: 1 + Math.random() * 2,
                    opacity: 0.6,
                    life: 0,
                    maxLife: 15 + Math.random() * 20
                });
            }
            
            this.drawFullTable();
            
            const elapsed = performance.now() - this.rollStartTime;
            if (elapsed >= this.rollDuration) {
                clearInterval(rollInterval);
                this.isRolling = false;
                this.showResult = true;
                
                // Set final dice
                this.diceAnims[0].value = this.dice1;
                this.diceAnims[1].value = this.dice2;
                this.diceAnims[2].value = this.dice3;
                this.diceAnims.forEach(d => { d.rotation = 0; d.scale = 1; });
                
                this.resolveGame();
                this.drawFullTable();
            }
        }, 70);
    }
    
    resolveGame() {
        const isTriple = this.dice1 === this.dice2 && this.dice2 === this.dice3;
        let won = false;
        let multiplier = 0;
        
        switch (this.betType) {
            case 'big':
                won = this.diceSum >= 11 && this.diceSum <= 17 && !isTriple;
                multiplier = 1;
                break;
            case 'small':
                won = this.diceSum >= 4 && this.diceSum <= 10 && !isTriple;
                multiplier = 1;
                break;
            case 'triple':
                won = isTriple;
                multiplier = 30;
                break;
            case 'specific_triple':
                won = isTriple && this.dice1 === this.betValue;
                multiplier = 180;
                break;
            case 'specific_double':
                const counts = {};
                [this.dice1, this.dice2, this.dice3].forEach(d => counts[d] = (counts[d] || 0) + 1);
                won = counts[this.betValue] >= 2;
                multiplier = 10;
                break;
            default:
                if (this.betType.startsWith('total_')) {
                    const targetSum = parseInt(this.betType.split('_')[1]);
                    won = this.diceSum === targetSum;
                    multiplier = this.betOptions[this.betType].payout;
                }
                break;
        }
        
        this.result = won ? 'win' : 'lose';
        
        if (won) {
            this.payout = Math.floor(this.bet * multiplier);
            this.chips += this.payout;
        }
        
        const resultDisplay = document.getElementById('game-result-display');
        
        if (won) {
            const particleCount = multiplier >= 30 ? 120 : multiplier >= 10 ? 80 : 50;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, particleCount);
            
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS (${multiplier}x)</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">Sum: ${this.diceSum}</span>
                    </div>`;
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 YOU LOST</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">Sum: ${this.diceSum}</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.showResult = false; this.resetGame(); }, 4000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update dice particles
        this.diceParticles.forEach(p => {
            p.life++;
            p.opacity -= 0.04;
        });
        this.diceParticles = this.diceParticles.filter(p => p.opacity > 0 && p.life < p.maxLife);
        
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
        
        // Betting options
        this.drawBettingOptions(ctx, w, h);
        
        // Dice particles
        this.drawDiceParticles(ctx);
        
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
        ctx.lineWidth = 6;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 14, 14, w - 28, h - 28, 14);
        ctx.stroke();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.25, 22, w * 0.5, 32, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.25, 22, w * 0.5, 32, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎲 SIC BO', w / 2, 38);
    }
    
    drawDiceArea(ctx, w, h) {
        const areaY = 65;
        const areaH = 110;
        
        // Dice zone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, 25, areaY, w - 50, areaH, 15);
        ctx.fill();
        ctx.stroke();
        
        // Three dice
        const diceSize = 60;
        const spacing = 15;
        const totalW = diceSize * 3 + spacing * 2;
        const startX = (w - totalW) / 2;
        const diceY = areaY + (areaH - diceSize) / 2;
        
        for (let i = 0; i < 3; i++) {
            const dx = startX + i * (diceSize + spacing);
            this.drawSingleDice(ctx, dx, diceY, diceSize, this.diceAnims[i]);
        }
    }
    
    drawSingleDice(ctx, x, y, size, anim) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(anim.rotation);
        ctx.scale(anim.scale, anim.scale);
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Dice body
        const diceGrad = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        diceGrad.addColorStop(0, '#ffffff');
        diceGrad.addColorStop(0.5, '#f0f0f0');
        diceGrad.addColorStop(1, '#d0d0d0');
        ctx.fillStyle = diceGrad;
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, -size / 2, -size / 2, size, size, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Dots
        this.drawDiceDots(ctx, size, anim.value);
        
        ctx.restore();
    }
    
    drawDiceDots(ctx, size, value) {
        const dotSize = size * 0.1;
        const offset = size * 0.22;
        
        ctx.fillStyle = '#1a1a1a';
        
        const dot = (dx, dy) => {
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
        const sy = 190;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = this.showResult ? (this.result === 'win' ? '#00e676' : '#ff4444') : 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 45, sy, 90, 45, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SUM', w / 2, sy + 14);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        const displaySum = this.showResult ? this.diceSum : '?';
        ctx.fillText(displaySum, w / 2, sy + 36);
    }
    
    drawBettingOptions(ctx, w, h) {
        const by = h - 190;
        
        // Quick bets row
        const quickBets = [
            { type: 'big', label: 'BIG', sub: '11-17', color: '#00e676' },
            { type: 'small', label: 'SMALL', sub: '4-10', color: '#00b0ff' },
            { type: 'triple', label: 'ANY TRIPLE', sub: '30:1', color: '#FFD700' }
        ];
        
        const btnW = (w - 50) / 3;
        const gap = 5;
        
        quickBets.forEach((bet, i) => {
            const bx = 20 + i * (btnW + gap);
            const isSelected = this.betType === bet.type;
            
            ctx.fillStyle = isSelected ? `${bet.color}25` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, bx, by, btnW, 42, 10);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, by + 16);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(bet.sub, bx + btnW / 2, by + 32);
        });
        
        // Total bets row
        const totalY = by + 50;
        const totalBets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
        const tBtnW = (w - 40) / totalBets.length;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TOTAL BETS', w / 2, totalY - 5);
        
        totalBets.forEach((num, i) => {
            const tx = 18 + i * tBtnW;
            const betKey = `total_${num}`;
            const isSelected = this.betType === betKey;
            
            ctx.fillStyle = isSelected ? 'rgba(255, 136, 0, 0.3)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? '#ff8800' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isSelected ? 1.5 : 0.5;
            CardRenderer.roundRect(ctx, tx, totalY + 2, tBtnW - 2, 22, 6);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? '#ff8800' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num, tx + tBtnW / 2 - 1, totalY + 13);
        });
        
        // Number buttons for specific bets
        const numY = totalY + 30;
        const numBtnW = (w - 50) / 6;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPECIFIC NUMBER', w / 2, numY - 5);
        
        for (let i = 1; i <= 6; i++) {
            const nx = 22 + (i - 1) * numBtnW;
            const isSelected = this.betValue === i && (this.betType === 'specific_triple' || this.betType === 'specific_double');
            
            ctx.fillStyle = isSelected ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isSelected ? 1.5 : 0.5;
            CardRenderer.roundRect(ctx, nx, numY + 2, numBtnW - 4, 22, 6);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? '#ff4444' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, nx + numBtnW / 2 - 2, numY + 13);
        }
    }
    
    drawDiceParticles(ctx) {
        this.diceParticles.forEach(p => {
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
        this.diceParticles = [];
    }
}

// Export
window.SicBoFullGame = SicBoFullGame;
console.log('✅ Game 18: Sic Bo - Full Casino Design Loaded');
