// ============================================
// EMERALD KING CASINO - GAME 17: RED DOG
// Full Real Casino Visual Design
// Card Spread Betting Game
// File: js/games/red-dog.js
// ============================================

class RedDogFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.cards = []; // [card1, card2, card3]
        this.spread = 0;
        this.result = null;
        this.payout = 0;
        this.gamePhase = 'bet'; // bet, dealt, draw, result
        this.isAnimating = false;
        
        // Deck
        this.deck = [];
        
        // Card dimensions
        this.cardW = 55;
        this.cardH = 76;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.dealAnimations = [];
        
        // Spread payout table
        this.spreadPayouts = {
            1: 5,
            2: 4,
            3: 2,
            4: 1,
            5: 1,
            6: 1,
            7: 1,
            8: 1,
            9: 1,
            10: 1,
            11: 1
        };
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            gold: '#FFD700',
            red: '#ff4444',
            green: '#00e676',
            blue: '#00b0ff',
            white: '#ffffff'
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
        for (let i = 0; i < 18; i++) {
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
        this.cards = [];
        this.spread = 0;
        this.result = null;
        this.payout = 0;
        this.gamePhase = 'bet';
        this.isAnimating = false;
        this.deck = [];
        this.dealAnimations = [];
    }
    
    // ============================================
    // DECK OPERATIONS
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let d = 0; d < 2; d++) {
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
    
    getRankValue(rank) {
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    play(bet) {
        if (this.isAnimating) return;
        
        if (this.gamePhase === 'bet' || this.gamePhase === 'result') {
            this.dealInitial(bet);
        } else if (this.gamePhase === 'dealt') {
            this.drawThirdCard();
        }
    }
    
    dealInitial(bet) {
        this.bet = bet;
        this.isAnimating = true;
        this.resetGame();
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        
        // Deal two cards
        this.cards = [this.deck.pop(), this.deck.pop()];
        
        // Sort by rank
        this.cards.sort((a, b) => this.getRankValue(a.rank) - this.getRankValue(b.rank));
        
        // Calculate spread
        const val1 = this.getRankValue(this.cards[0].rank);
        const val2 = this.getRankValue(this.cards[1].rank);
        this.spread = val2 - val1 - 1;
        
        // Check for pair
        if (this.spread === -1) {
            // Consecutive cards - push
            this.result = 'push';
            this.payout = this.bet;
            this.chips += this.payout;
            this.gamePhase = 'result';
            this.showResult();
        } else if (this.spread === 0) {
            // Pair - auto draw third card
            this.drawThirdCard(true);
        } else {
            this.gamePhase = 'dealt';
        }
        
        this.dealAnimations = [
            { index: 0, progress: 0, startTime: performance.now() },
            { index: 1, progress: 0, startTime: performance.now() + 200 }
        ];
        
        setTimeout(() => {
            this.isAnimating = false;
            this.dealAnimations = [];
        }, 800);
    }
    
    drawThirdCard(autoDraw = false) {
        this.isAnimating = true;
        this.cards.push(this.deck.pop());
        const val3 = this.getRankValue(this.cards[2].rank);
        const val1 = this.getRankValue(this.cards[0].rank);
        const val2 = this.getRankValue(this.cards[1].rank);
        
        this.dealAnimations = [
            { index: 2, progress: 0, startTime: performance.now() }
        ];
        
        // Determine result
        if (autoDraw && val3 === val1) {
            // Three of a kind on pair!
            this.result = 'triple';
            this.payout = Math.floor(this.bet * 11);
        } else if (val3 > val1 && val3 < val2) {
            // Card between - win
            this.result = 'win';
            const payoutMultiplier = this.spreadPayouts[this.spread] || 1;
            this.payout = Math.floor(this.bet * payoutMultiplier);
        } else {
            // Card outside - lose
            this.result = 'lose';
            this.payout = 0;
        }
        
        if (this.payout > 0) {
            this.chips += this.payout;
        }
        
        this.gamePhase = 'result';
        
        setTimeout(() => {
            this.isAnimating = false;
            this.dealAnimations = [];
            this.showResult();
        }, 600);
    }
    
    raiseBet() {
        if (this.gamePhase !== 'dealt' || this.isAnimating) return;
        if (this.spread <= 0) return;
        
        this.bet *= 2;
        this.drawThirdCard();
    }
    
    showResult() {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.result === 'triple') {
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:20px;">👑 THREE OF A KIND!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS (11:1)</span>
                    </div>`;
            }
        } else if (this.result === 'win') {
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 50);
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">Spread: ${this.spread}</span>
                    </div>`;
            }
        } else if (this.result === 'push') {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:16px;">🤝 PUSH</span><br>
                        <span style="color:rgba(255,255,255,0.6);">Consecutive cards - Bet returned</span>
                    </div>`;
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 YOU LOST</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.resetGame(); }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        // Update deal animations
        this.dealAnimations.forEach(anim => {
            const elapsed = timestamp - anim.startTime;
            anim.progress = Math.min(1, elapsed / 400);
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
        
        // Cards area
        this.drawCardsArea(ctx, w, h);
        
        // Spread info
        this.drawSpreadInfo(ctx, w, h);
        
        // Payout table
        this.drawPayoutTable(ctx, w, h);
        
        // Action buttons
        this.drawActionButtons(ctx, w, h);
        
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
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 34, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 22, w * 0.6, 34, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐕 RED DOG', w / 2, 39);
    }
    
    drawCardsArea(ctx, w, h) {
        const areaY = 75;
        const areaH = 120;
        
        // Card zone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, 20, areaY, w - 40, areaH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Card 1 (left)
        if (this.cards.length >= 1) {
            const cx1 = w / 2 - this.cardW - 20;
            const cy1 = areaY + (areaH - this.cardH) / 2;
            
            let scale1 = 1;
            const anim1 = this.dealAnimations.find(a => a.index === 0);
            if (anim1) scale1 = anim1.progress;
            
            ctx.save();
            ctx.translate(cx1 + this.cardW / 2, cy1 + this.cardH / 2);
            ctx.scale(scale1, scale1);
            ctx.translate(-(cx1 + this.cardW / 2), -(cy1 + this.cardH / 2));
            CardRenderer.drawCard(ctx, cx1, cy1, this.cardW, this.cardH, this.cards[0].suit, this.cards[0].rank, true);
            ctx.restore();
        }
        
        // Card 2 (right)
        if (this.cards.length >= 2) {
            const cx2 = w / 2 + 20;
            const cy2 = areaY + (areaH - this.cardH) / 2;
            
            let scale2 = 1;
            const anim2 = this.dealAnimations.find(a => a.index === 1);
            if (anim2) scale2 = anim2.progress;
            
            ctx.save();
            ctx.translate(cx2 + this.cardW / 2, cy2 + this.cardH / 2);
            ctx.scale(scale2, scale2);
            ctx.translate(-(cx2 + this.cardW / 2), -(cy2 + this.cardH / 2));
            CardRenderer.drawCard(ctx, cx2, cy2, this.cardW, this.cardH, this.cards[1].suit, this.cards[1].rank, true);
            ctx.restore();
        }
        
        // Card 3 (center, between)
        if (this.cards.length >= 3) {
            const cx3 = w / 2 - this.cardW / 2;
            const cy3 = areaY + areaH + 15;
            
            let scale3 = 1;
            const anim3 = this.dealAnimations.find(a => a.index === 2);
            if (anim3) scale3 = anim3.progress;
            
            ctx.save();
            ctx.translate(cx3 + this.cardW / 2, cy3 + this.cardH / 2);
            ctx.scale(scale3, scale3);
            ctx.translate(-(cx3 + this.cardW / 2), -(cy3 + this.cardH / 2));
            CardRenderer.drawCard(ctx, cx3, cy3, this.cardW, this.cardH, this.cards[2].suit, this.cards[2].rank, true);
            ctx.restore();
            
            // Result highlight
            if (this.gamePhase === 'result') {
                const isWin = this.result === 'win' || this.result === 'triple';
                ctx.strokeStyle = isWin ? '#00e676' : '#ff4444';
                ctx.lineWidth = 3;
                ctx.shadowColor = isWin ? '#00e676' : '#ff4444';
                ctx.shadowBlur = 12;
                CardRenderer.roundRect(ctx, cx3 - 4, cy3 - 4, this.cardW + 8, this.cardH + 8, 10);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }
    
    drawSpreadInfo(ctx, w, h) {
        if (this.gamePhase === 'dealt' || this.gamePhase === 'result') {
            const sy = 210;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            CardRenderer.roundRect(ctx, w / 2 - 60, sy, 120, 32, 16);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SPREAD', w / 2, sy + 12);
            
            ctx.fillStyle = this.spread > 0 ? '#00e676' : '#ff4444';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(this.spread > 0 ? `${this.spread} cards` : 'NONE', w / 2, sy + 28);
        }
    }
    
    drawPayoutTable(ctx, w, h) {
        const py = h - 130;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        CardRenderer.roundRect(ctx, 20, py, w - 40, 55, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPREAD PAYOUTS', w / 2, py + 12);
        
        const spreads = [1, 2, 3, 4, 5, 6, 7];
        spreads.forEach((s, i) => {
            const sx = 35 + i * (w - 80) / 7;
            const highlight = this.spread === s;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${s}`, sx, py + 28);
            ctx.fillText(`${this.spreadPayouts[s]}x`, sx, py + 44);
        });
    }
    
    drawActionButtons(ctx, w, h) {
        const by = h - 60;
        
        let label = 'DEAL';
        let color = '#ff4444';
        
        if (this.gamePhase === 'dealt') {
            label = 'DRAW';
            color = '#00b0ff';
        }
        
        // Main button
        ctx.fillStyle = `${color}25`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 50, by, 100, 34, 17);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, by + 17);
        
        // Raise button (only during dealt phase with spread)
        if (this.gamePhase === 'dealt' && this.spread > 0) {
            const rx = w / 2 + 60;
            ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 1.5;
            CardRenderer.roundRect(ctx, rx, by, 70, 34, 17);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RAISE 2x', rx + 35, by + 17);
        }
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
        this.dealAnimations = [];
    }
}

// Export
window.RedDogFullGame = RedDogFullGame;
console.log('✅ Game 17: Red Dog - Full Casino Design Loaded');
