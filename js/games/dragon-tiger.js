// ============================================
// EMERALD KING CASINO - GAME 8: DRAGON TIGER
// Full Real Casino Visual Design
// Two-Card Battle with Tie Option
// File: js/games/dragon-tiger.js
// ============================================

class DragonTigerFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betSide = 'dragon'; // dragon, tiger, tie
        this.dragonCard = null;
        this.tigerCard = null;
        this.dragonValue = 0;
        this.tigerValue = 0;
        this.result = null; // dragon, tiger, tie
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        
        // Animation
        this.cardRevealTimer = 0;
        this.vsPulse = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Fire particles for dragon
        this.fireParticles = [];
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            dragon: '#ff4444',
            tiger: '#00b0ff',
            tie: '#FFD700',
            gold: '#FFD700'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.generateFireParticles();
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
    
    generateFireParticles() {
        this.fireParticles = [];
        for (let i = 0; i < 30; i++) {
            this.fireParticles.push({
                x: this.w * 0.25 + Math.random() * 60 - 30,
                y: this.h * 0.55 + Math.random() * 40,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.3,
                life: Math.random(),
                maxLife: Math.random() * 0.8 + 0.2,
                opacity: Math.random() * 0.6 + 0.2
            });
        }
    }
    
    resetGame() {
        this.dragonCard = null;
        this.tigerCard = null;
        this.dragonValue = 0;
        this.tigerValue = 0;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
    }
    
    // ============================================
    // DECK OPERATIONS
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let d = 0; d < 4; d++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    deck.push({ suit, rank });
                }
            }
        }
        return deck;
    }
    
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    getCardValue(rank) {
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSide(side) {
        if (this.isPlaying) return;
        this.betSide = side;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.resetGame();
        this.bet = bet;
        this.isPlaying = true;
        this.isDealing = true;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        this.dragonCard = deck.pop();
        this.tigerCard = deck.pop();
        this.dragonValue = this.getCardValue(this.dragonCard.rank);
        this.tigerValue = this.getCardValue(this.tigerCard.rank);
        
        // Determine winner
        if (this.dragonValue > this.tigerValue) {
            this.result = 'dragon';
        } else if (this.tigerValue > this.dragonValue) {
            this.result = 'tiger';
        } else {
            this.result = 'tie';
        }
        
        // Animate reveal
        this.dealProgress = 0;
        this.animateReveal();
    }
    
    animateReveal() {
        const revealInterval = setInterval(() => {
            this.dealProgress += 0.05;
            
            if (this.dealProgress >= 1) {
                clearInterval(revealInterval);
                this.isDealing = false;
                this.showdown = true;
                this.resolveGame();
            }
            
            this.drawFullTable();
        }, 50);
    }
    
    resolveGame() {
        const playerWon = this.result === this.betSide;
        const isTie = this.result === 'tie';
        const resultDisplay = document.getElementById('game-result-display');
        
        let payout = 0;
        let message = '';
        
        if (isTie) {
            if (this.betSide === 'tie') {
                payout = Math.floor(this.bet * 11);
                this.chips += payout;
                message = `<span style="color:#FFD700;font-size:18px;">🤝 TIE!</span><br><span style="color:#00e676;">+${payout} CHIPS (11:1)</span>`;
            } else {
                payout = Math.floor(this.bet * 0.5);
                this.chips += payout;
                message = `<span style="color:#FFD700;font-size:16px;">🤝 TIE</span><br><span style="color:rgba(255,255,255,0.6);">Half bet returned</span>`;
            }
        } else if (playerWon) {
            payout = Math.floor(this.bet * 2);
            this.chips += payout;
            const winnerName = this.result === 'dragon' ? '🐉 DRAGON' : '🐯 TIGER';
            message = `<span style="color:#00e676;font-size:18px;">🎉 ${winnerName} WINS!</span><br><span style="color:#00e676;">+${payout} CHIPS</span>`;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 70);
        } else {
            const winnerName = this.result === 'dragon' ? '🐉 DRAGON' : '🐯 TIGER';
            message = `<span style="color:#ff4444;font-size:16px;">😞 ${winnerName} WINS</span><br><span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>`;
        }
        
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out;">${message}</div>`;
        }
        
        setTimeout(() => { this.resetGame(); }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        this.vsPulse = Math.sin(timestamp * 0.004) * 0.3 + 0.7;
        
        // Update fire particles
        this.fireParticles.forEach(p => {
            p.y -= p.speed;
            p.life += 0.01;
            if (p.life >= p.maxLife || p.y < this.h * 0.3) {
                p.y = this.h * 0.6 + Math.random() * 20;
                p.x = this.w * 0.25 + Math.random() * 60 - 30;
                p.life = 0;
                p.maxLife = Math.random() * 0.8 + 0.2;
            }
        });
        
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
        
        // Dragon area
        this.drawDragonArea(ctx, w, h);
        
        // Tiger area
        this.drawTigerArea(ctx, w, h);
        
        // VS display
        this.drawVSDisplay(ctx, w, h);
        
        // Betting buttons
        this.drawBettingButtons(ctx, w, h);
        
        // Fire particles
        this.drawFireParticles(ctx);
        
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
        ctx.fillText('🐉 DRAGON TIGER 🐯', w / 2, 41);
    }
    
    drawDragonArea(ctx, w, h) {
        const areaX = 22;
        const areaY = 70;
        const areaW = w / 2 - 35;
        const areaH = h - 200;
        
        // Dragon zone
        ctx.fillStyle = 'rgba(255, 68, 68, 0.04)';
        ctx.strokeStyle = this.betSide === 'dragon' ? 'rgba(255, 68, 68, 0.7)' : 'rgba(255, 68, 68, 0.2)';
        ctx.lineWidth = this.betSide === 'dragon' ? 2.5 : 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, areaH, 14);
        ctx.fill();
        ctx.stroke();
        
        // Dragon emblem
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐉', areaX + areaW / 2, areaY + 30);
        
        // Dragon label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DRAGON', areaX + areaW / 2, areaY + 55);
        
        // Card
        if (this.dragonCard) {
            const cardW = 55;
            const cardH = 76;
            const cx = areaX + (areaW - cardW) / 2;
            const cy = areaY + 70;
            
            const revealScale = Math.min(1, this.dealProgress * 2);
            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(revealScale, revealScale);
            ctx.translate(-(cx + cardW / 2), -(cy + cardH / 2));
            
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.dragonCard.suit, this.dragonCard.rank, true);
            ctx.restore();
        }
        
        // Value
        if (this.showdown) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.dragonValue, areaX + areaW / 2, areaY + areaH - 25);
        }
    }
    
    drawTigerArea(ctx, w, h) {
        const areaX = w / 2 + 13;
        const areaY = 70;
        const areaW = w / 2 - 35;
        const areaH = h - 200;
        
        // Tiger zone
        ctx.fillStyle = 'rgba(0, 176, 255, 0.04)';
        ctx.strokeStyle = this.betSide === 'tiger' ? 'rgba(0, 176, 255, 0.7)' : 'rgba(0, 176, 255, 0.2)';
        ctx.lineWidth = this.betSide === 'tiger' ? 2.5 : 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, areaH, 14);
        ctx.fill();
        ctx.stroke();
        
        // Tiger emblem
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐯', areaX + areaW / 2, areaY + 30);
        
        // Tiger label
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TIGER', areaX + areaW / 2, areaY + 55);
        
        // Card
        if (this.tigerCard) {
            const cardW = 55;
            const cardH = 76;
            const cx = areaX + (areaW - cardW) / 2;
            const cy = areaY + 70;
            
            const revealScale = Math.min(1, this.dealProgress * 2);
            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(revealScale, revealScale);
            ctx.translate(-(cx + cardW / 2), -(cy + cardH / 2));
            
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.tigerCard.suit, this.tigerCard.rank, true);
            ctx.restore();
        }
        
        // Value
        if (this.showdown) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.tigerValue, areaX + areaW / 2, areaY + areaH - 25);
        }
    }
    
    drawVSDisplay(ctx, w, h) {
        const vsY = h / 2 + 20;
        const pulse = this.vsPulse;
        
        // VS circle
        const vsGrad = ctx.createRadialGradient(w / 2, vsY, 5, w / 2, vsY, 25 * pulse);
        vsGrad.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        vsGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = vsGrad;
        ctx.beginPath();
        ctx.arc(w / 2, vsY, 25 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // VS circle border
        ctx.fillStyle = '#0a0a0a';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, vsY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // VS text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VS', w / 2, vsY);
    }
    
    drawBettingButtons(ctx, w, h) {
        const btnY = h - 110;
        const btnW = (w - 60) / 3;
        const btnH = 50;
        const gap = 8;
        
        const bets = [
            { label: '🐉 DRAGON', sub: '1:1', color: '#ff4444', side: 'dragon', x: 22 },
            { label: '🤝 TIE', sub: '11:1', color: '#FFD700', side: 'tie', x: 22 + btnW + gap },
            { label: '🐯 TIGER', sub: '1:1', color: '#00b0ff', side: 'tiger', x: 22 + (btnW + gap) * 2 }
        ];
        
        bets.forEach(bet => {
            const isSelected = this.betSide === bet.side;
            
            ctx.fillStyle = isSelected ? `${bet.color}25` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            CardRenderer.roundRect(ctx, bet.x, btnY, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bet.x + btnW / 2, btnY + btnH / 2 - 8);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 9px Arial';
            ctx.fillText(bet.sub, bet.x + btnW / 2, btnY + btnH / 2 + 14);
        });
    }
    
    drawFireParticles(ctx) {
        this.fireParticles.forEach(p => {
            const alpha = p.life < p.maxLife / 2 ? p.life / (p.maxLife / 2) : (p.maxLife - p.life) / (p.maxLife / 2);
            ctx.fillStyle = `rgba(255, ${Math.floor(100 + alpha * 100)}, 0, ${alpha * p.opacity})`;
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
        this.fireParticles = [];
    }
}

// Export
window.DragonTigerFullGame = DragonTigerFullGame;
console.log('✅ Game 8: Dragon Tiger - Full Casino Design Loaded');
