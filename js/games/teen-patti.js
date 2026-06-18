// ============================================
// EMERALD KING CASINO - GAME 1: TEEN PATTI
// Full Real Casino Visual Design
// File: js/games/teen-patti.js
// ============================================

class TeenPattiFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.playerCards = [];
        this.dealerCards = [];
        this.playerRank = null;
        this.dealerRank = null;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.dealAnimation = 0;
        this.revealAnimation = 0;
        this.showdown = false;
        
        // Card animation
        this.cardDealProgress = 0;
        this.cardDealTarget = 0;
        this.dealingCards = [];
        
        // Win cascade
        this.winCascade = new WinParticleCascade(ctx);
        
        // Table felt colors
        this.colors = {
            felt: '#0d3320',
            feltDark: '#072218',
            feltLight: '#115235',
            border: '#00e676',
            gold: '#FFD700',
            red: '#ff4444',
            blue: '#00b0ff',
            white: '#ffffff',
            chipRed: '#cc0000',
            chipBlue: '#0044cc',
            chipGreen: '#00aa44',
            chipBlack: '#1a1a1a'
        };
        
        // Animation timers
        this.animations = [];
        this.sparkles = [];
        this.glowPulse = 0;
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.drawFullTable();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 30; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.5 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    // ============================================
    // CARD DECK OPERATIONS
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
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
        return values[rank] || 0;
    }
    
    // ============================================
    // HAND EVALUATION
    // ============================================
    
    evaluateHand(cards) {
        const values = cards.map(c => this.getCardValue(c.rank)).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        
        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isStraight = (values[0] - values[1] === 1 && values[1] - values[2] === 1) || 
                           (values[0] === 14 && values[1] === 3 && values[2] === 2);
        const isTrio = values[0] === values[1] && values[1] === values[2];
        const isPair = values[0] === values[1] || values[1] === values[2];
        
        if (isTrio) return { name: 'TRIO', icon: '👑', rank: 6, high: values[0], color: '#FFD700' };
        if (isStraight && isFlush) return { name: 'PURE SEQUENCE', icon: '🌟', rank: 5, high: values[0], color: '#ff4444' };
        if (isStraight) return { name: 'SEQUENCE', icon: '📈', rank: 4, high: values[0], color: '#00b0ff' };
        if (isFlush) return { name: 'FLUSH', icon: '🌸', rank: 3, high: values[0], color: '#ff69b4' };
        if (isPair) return { name: 'PAIR', icon: '👫', rank: 2, high: values[1], color: '#00e676' };
        return { name: 'HIGH CARD', icon: '📋', rank: 1, high: values[0], color: '#888888' };
    }
    
    // ============================================
    // GAME PLAY
    // ============================================
    
    dealCards() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards = [deck.pop(), deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop(), deck.pop()];
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.isPlaying = true;
        this.isDealing = true;
        this.bet = bet;
        this.showdown = false;
        this.result = null;
        this.playerRank = null;
        this.dealerRank = null;
        this.cardDealProgress = 0;
        this.cardDealTarget = 6;
        this.playerCards = [];
        this.dealerCards = [];
        
        // Deal cards with animation
        this.animateDeal();
    }
    
    animateDeal() {
        const dealInterval = setInterval(() => {
            this.cardDealProgress++;
            
            if (this.cardDealProgress <= 3) {
                // Dealing player cards
                const deck = this.createDeck();
                this.shuffleDeck(deck);
                const newCards = [deck.pop(), deck.pop(), deck.pop()];
                this.playerCards = newCards.slice(0, this.cardDealProgress);
            } else if (this.cardDealProgress <= 6) {
                // Dealing dealer cards
                const deck = this.createDeck();
                this.shuffleDeck(deck);
                const newCards = [deck.pop(), deck.pop(), deck.pop()];
                this.dealerCards = newCards.slice(0, this.cardDealProgress - 3);
            }
            
            if (this.cardDealProgress >= this.cardDealTarget) {
                clearInterval(dealInterval);
                this.isDealing = false;
                this.finalizeDeal();
            }
        }, 300);
    }
    
    finalizeDeal() {
        this.dealCards();
        this.playerRank = this.evaluateHand(this.playerCards);
        this.dealerRank = this.evaluateHand(this.dealerCards);
        
        // Determine winner
        if (this.playerRank.rank > this.dealerRank.rank) {
            this.result = 'win';
        } else if (this.dealerRank.rank > this.playerRank.rank) {
            this.result = 'lose';
        } else {
            this.result = this.playerRank.high >= this.dealerRank.high ? 'win' : 'lose';
        }
        
        this.showdown = true;
        this.showResult();
    }
    
    showResult() {
        const resultDisplay = document.getElementById('game-result-display');
        const payout = Math.floor(this.bet * 1.9);
        
        if (this.result === 'win') {
            this.chips += payout;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:16px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.6);font-size:9px;">${this.playerRank.name}</span>
                    </div>`;
            }
            this.winCascade.spawn(this.w / 2, this.h / 2 - 30, 80);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 DEALER WINS</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${this.dealerRank.name}</span>
                    </div>`;
            }
        }
        
        setTimeout(() => {
            this.isPlaying = false;
            this.showdown = false;
        }, 3000);
    }
    
    // ============================================
    // RENDERING - FULL CASINO TABLE
    // ============================================
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        // Clear
        ctx.clearRect(0, 0, w, h);
        
        // Background gradient
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.8);
        bgGrad.addColorStop(0, '#033826');
        bgGrad.addColorStop(0.5, '#02231c');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Table outer ring
        this.drawTableBorder(ctx, w, h);
        
        // Table felt
        this.drawTableFelt(ctx, w, h);
        
        // Dealer area
        this.drawDealerArea(ctx, w, h);
        
        // Player area
        this.drawPlayerArea(ctx, w, h);
        
        // Center logo
        this.drawCenterLogo(ctx, w, h);
        
        // Cards
        this.drawAllCards(ctx, w, h);
        
        // Hand rankings display
        if (this.showdown) {
            this.drawHandRankings(ctx, w, h);
        }
        
        // Sparkles
        this.drawSparkles(ctx);
        
        // Win particles
        if (this.winCascade.isAlive()) {
            this.winCascade.render();
        }
        
        // Glow pulse
        this.drawGlowPulse(ctx, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        // Outer wooden rim
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        this.roundRect(ctx, 8, 8, w - 16, h - 16, 20);
        ctx.fill();
        ctx.stroke();
        
        // Gold inner trim
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 16, 16, w - 32, h - 32, 16);
        ctx.stroke();
        
        // Neon glow on border
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, 18, 18, w - 36, h - 36, 15);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    drawTableFelt(ctx, w, h) {
        // Main felt
        const feltGrad = ctx.createLinearGradient(0, 0, w, h);
        feltGrad.addColorStop(0, '#0d3320');
        feltGrad.addColorStop(0.3, '#0a2a1a');
        feltGrad.addColorStop(0.7, '#0d3320');
        feltGrad.addColorStop(1, '#072218');
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, 22, 22, w - 44, h - 44, 13);
        ctx.fill();
        
        // Subtle grid pattern on felt
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 30; x < w - 30; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 30);
            ctx.lineTo(x, h - 30);
            ctx.stroke();
        }
        for (let y = 30; y < h - 30; y += 25) {
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(w - 30, y);
            ctx.stroke();
        }
    }
    
    drawDealerArea(ctx, w, h) {
        const areaY = 45;
        const areaH = 100;
        
        // Dealer zone background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.2, areaY, w * 0.6, areaH, 10);
        ctx.fill();
        ctx.stroke();
        
        // Dealer label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 DEALER', w / 2, areaY - 8);
        
        // Card placement spots
        for (let i = 0; i < 3; i++) {
            const cx = w / 2 - 55 + i * 55;
            const cy = areaY + 18;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            this.roundRect(ctx, cx - 2, cy - 2, 44, 60, 6);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawPlayerArea(ctx, w, h) {
        const areaY = h - 160;
        const areaH = 100;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.2, areaY, w * 0.6, areaH, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👤 YOUR CARDS', w / 2, areaY - 8);
        
        for (let i = 0; i < 3; i++) {
            const cx = w / 2 - 55 + i * 55;
            const cy = areaY + 18;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            this.roundRect(ctx, cx - 2, cy - 2, 44, 60, 6);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawCenterLogo(ctx, w, h) {
        const centerY = h / 2;
        
        // Glowing circle behind logo
        const glowGrad = ctx.createRadialGradient(w / 2, centerY, 5, w / 2, centerY, 40);
        glowGrad.addColorStop(0, 'rgba(0, 230, 118, 0.3)');
        glowGrad.addColorStop(1, 'rgba(0, 230, 118, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, centerY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Logo circle
        ctx.fillStyle = '#011713';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, centerY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Logo text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🃏', w / 2, centerY - 4);
        ctx.fillText('TP', w / 2, centerY + 10);
        
        // VS text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('TEEN PATTI', w / 2, centerY + 55);
    }
    
    drawAllCards(ctx, w, h) {
        const playerY = h - 140;
        const dealerY = 65;
        
        // Player cards
        for (let i = 0; i < 3; i++) {
            const cx = w / 2 - 55 + i * 55;
            const cy = playerY;
            
            if (this.playerCards[i]) {
                this.drawSingleCard(ctx, cx, cy, 44, 60, this.playerCards[i].suit, this.playerCards[i].rank, true);
            }
        }
        
        // Dealer cards
        for (let i = 0; i < 3; i++) {
            const cx = w / 2 - 55 + i * 55;
            const cy = dealerY;
            
            if (this.dealerCards[i]) {
                this.drawSingleCard(ctx, cx, cy, 44, 60, this.dealerCards[i].suit, this.dealerCards[i].rank, true);
            }
        }
    }
    
    drawSingleCard(ctx, x, y, w, h, suit, rank, faceUp) {
        ctx.save();
        
        // Card shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        
        // Card body
        const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(1, '#f0f0f0');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 7);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        if (faceUp && suit && rank) {
            const color = (suit === '♥' || suit === '♦') ? '#cc0000' : '#1a1a1a';
            
            // Top-left
            ctx.fillStyle = color;
            ctx.font = `bold ${Math.floor(w * 0.3)}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, x + 4, y + 2);
            ctx.font = `${Math.floor(w * 0.25)}px Arial`;
            ctx.fillText(suit, x + 4, y + Math.floor(w * 0.3) + 2);
            
            // Center large suit
            ctx.font = `${Math.floor(w * 0.6)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suit, x + w / 2, y + h / 2);
            
            // Bottom-right (inverted)
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.font = `bold ${Math.floor(w * 0.3)}px Arial`;
            ctx.fillText(rank, x + w - 4, y + h - 2);
            ctx.font = `${Math.floor(w * 0.25)}px Arial`;
            ctx.fillText(suit, x + w - 4, y + h - Math.floor(w * 0.3) - 2);
        }
        
        ctx.restore();
    }
    
    drawHandRankings(ctx, w, h) {
        // Player rank
        if (this.playerRank) {
            const px = w / 2;
            const py = h - 180;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.roundRect(ctx, px - 80, py - 2, 160, 20, 10);
            ctx.fill();
            
            ctx.fillStyle = this.playerRank.color;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.playerRank.icon} ${this.playerRank.name}`, px, py + 12);
        }
        
        // Dealer rank
        if (this.dealerRank) {
            const dx = w / 2;
            const dy = 155;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.roundRect(ctx, dx - 80, dy - 2, 160, 20, 10);
            ctx.fill();
            
            ctx.fillStyle = this.dealerRank.color;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.dealerRank.icon} ${this.dealerRank.name}`, dx, dy + 12);
        }
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.6, sparkle.opacity));
            
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle.opacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawGlowPulse(ctx, w, h) {
        this.glowPulse += 0.02;
        const pulse = Math.sin(this.glowPulse) * 0.3 + 0.5;
        
        ctx.strokeStyle = `rgba(0, 230, 118, ${pulse * 0.3})`;
        ctx.lineWidth = 2;
        this.roundRect(ctx, 25, 25, w - 50, h - 50, 12);
        ctx.stroke();
    }
    
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
    // GAME LOOP
    // ============================================
    
    update(timestamp) {
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    render() {
        this.drawFullTable();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        this.winCascade.destroy();
        this.sparkles = [];
        this.animations = [];
    }
}

// Export
window.TeenPattiFullGame = TeenPattiFullGame;
console.log('✅ Game 1: Teen Patti - Full Casino Design Loaded');
