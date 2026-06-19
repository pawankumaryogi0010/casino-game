// ============================================
// EMERALD KING CASINO - GAME 19: HI-LOW
// Full Real Casino Visual Design
// Card Prediction Betting Game
// File: js/games/hi-low.js
// ============================================

class HiLowFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.currentCard = null;
        this.nextCard = null;
        this.guess = null; // 'hi', 'low', 'same'
        this.result = null; // 'win', 'lose', 'push'
        this.streak = 0;
        this.multiplier = 1.0;
        this.gamePhase = 'bet'; // bet, reveal, result
        this.isAnimating = false;
        this.deck = [];
        this.cardsRemaining = 52;
        
        // Card dimensions
        this.cardW = 65;
        this.cardH = 90;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.revealAnimProgress = 0;
        this.cardFlipProgress = 0;
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            gold: '#FFD700',
            hi: '#00e676',
            low: '#ff4444',
            same: '#FFD700',
            cardBg: '#1a1a2e'
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
        this.currentCard = null;
        this.nextCard = null;
        this.guess = null;
        this.result = null;
        this.gamePhase = 'bet';
        this.isAnimating = false;
        this.revealAnimProgress = 0;
        this.cardFlipProgress = 0;
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cardsRemaining = 52;
        this.streak = 0;
        this.multiplier = 1.0;
    }
    
    // ============================================
    // DECK OPERATIONS
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
    
    getRankValue(rank) {
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setGuess(guess) {
        if (this.gamePhase !== 'bet' || this.isAnimating) return;
        this.guess = guess;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isAnimating) return;
        
        if (this.gamePhase === 'bet' || this.gamePhase === 'result') {
            this.dealNewCard(bet);
        }
    }
    
    dealNewCard(bet) {
        if (!this.guess) {
            const resultDisplay = document.getElementById('game-result-display');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<span style="color:#FFD700;">Select HI, LOW, or SAME first!</span>';
            }
            return;
        }
        
        this.bet = bet;
        this.isAnimating = true;
        
        // Check deck
        if (this.deck.length < 2) {
            this.deck = this.createDeck();
            this.shuffleDeck(this.deck);
            this.cardsRemaining = 52;
        }
        
        if (!this.currentCard) {
            // First card
            this.currentCard = this.deck.pop();
            this.cardsRemaining--;
            this.gamePhase = 'bet';
            this.isAnimating = false;
            
            const resultDisplay = document.getElementById('game-result-display');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<span style="color:#FFD700;">Now predict HI or LOW!</span>';
            }
        } else {
            // Draw next card
            this.nextCard = this.deck.pop();
            this.cardsRemaining--;
            this.cardFlipProgress = 0;
            
            // Compare
            const currentVal = this.getRankValue(this.currentCard.rank);
            const nextVal = this.getRankValue(this.nextCard.rank);
            
            if (nextVal > currentVal) {
                this.result = this.guess === 'hi' ? 'win' : 'lose';
            } else if (nextVal < currentVal) {
                this.result = this.guess === 'low' ? 'win' : 'lose';
            } else {
                this.result = this.guess === 'same' ? 'win' : 'lose';
            }
            
            // Calculate payout
            let payoutMult = 0;
            if (this.result === 'win') {
                if (this.guess === 'same') {
                    payoutMult = 12; // Same suit/rank pays 12:1
                } else {
                    const diff = Math.abs(nextVal - currentVal);
                    if (diff >= 7) payoutMult = 1.2;
                    else if (diff >= 4) payoutMult = 1.5;
                    else payoutMult = 2.0;
                }
                this.streak++;
                this.multiplier *= payoutMult;
            } else {
                this.streak = 0;
                this.multiplier = 1.0;
            }
            
            const payout = this.result === 'win' ? Math.floor(this.bet * payoutMult) : 0;
            if (payout > 0) this.chips += payout;
            
            // Animate reveal
            this.animateReveal(payout);
        }
        
        this.drawFullTable();
    }
    
    animateReveal(payout) {
        const revealInterval = setInterval(() => {
            this.cardFlipProgress += 0.06;
            
            if (this.cardFlipProgress >= 1) {
                clearInterval(revealInterval);
                this.isAnimating = false;
                this.gamePhase = 'result';
                
                // Show result
                const resultDisplay = document.getElementById('game-result-display');
                if (this.result === 'win') {
                    if (this.winCascade) {
                        const count = this.guess === 'same' ? 100 : 50;
                        this.winCascade.spawn(this.w / 2, this.h / 2, count);
                    }
                    if (resultDisplay) {
                        resultDisplay.innerHTML = `
                            <div style="animation: casinoSlideUp 0.5s ease-out;">
                                <span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br>
                                <span style="color:#00e676;">+${payout} CHIPS</span>
                                ${this.streak > 1 ? `<br><span style="color:#FFD700;font-size:9px;">Streak: ${this.streak}</span>` : ''}
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
                
                // Prepare for next round
                setTimeout(() => {
                    this.currentCard = this.nextCard;
                    this.nextCard = null;
                    this.result = null;
                    this.gamePhase = 'bet';
                    this.cardFlipProgress = 0;
                    this.guess = null;
                }, 2500);
            }
            
            this.drawFullTable();
        }, 30);
    }
    
    cashOut() {
        if (this.streak <= 0 || this.gamePhase !== 'bet') return;
        
        const totalWin = Math.floor(this.bet * this.multiplier);
        this.chips += totalWin;
        this.streak = 0;
        this.multiplier = 1.0;
        this.gamePhase = 'result';
        
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `
                <div style="animation: casinoSlideUp 0.5s ease-out;">
                    <span style="color:#FFD700;font-size:18px;">💰 CASHED OUT!</span><br>
                    <span style="color:#00e676;">+${totalWin} CHIPS</span>
                </div>`;
        }
        
        setTimeout(() => {
            this.currentCard = null;
            this.result = null;
            this.gamePhase = 'bet';
        }, 2000);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
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
        
        // Current card
        this.drawCurrentCard(ctx, w, h);
        
        // Next card (if revealed)
        if (this.nextCard) {
            this.drawNextCard(ctx, w, h);
        }
        
        // Guess buttons
        this.drawGuessButtons(ctx, w, h);
        
        // Streak display
        if (this.streak > 0) {
            this.drawStreakDisplay(ctx, w, h);
        }
        
        // Cash out button
        if (this.streak > 0 && this.gamePhase === 'bet') {
            this.drawCashOutButton(ctx, w, h);
        }
        
        // Cards remaining
        this.drawCardsRemaining(ctx, w, h);
        
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
        ctx.fillText('🔼🔽 HI-LOW', w / 2, 38);
    }
    
    drawCurrentCard(ctx, w, h) {
        const cx = w / 2 - this.cardW / 2;
        const cy = 75;
        
        // Card zone glow
        if (!this.nextCard) {
            const glowGrad = ctx.createRadialGradient(w / 2, cy + this.cardH / 2, 20, w / 2, cy + this.cardH / 2, 60);
            glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
            glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(w / 2, cy + this.cardH / 2, 60, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Card label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.nextCard ? 'PREVIOUS' : 'CURRENT CARD', w / 2, cy - 8);
        
        if (this.currentCard) {
            CardRenderer.drawCard(ctx, cx, cy, this.cardW, this.cardH, this.currentCard.suit, this.currentCard.rank, true);
            
            // Card value
            const val = this.getRankValue(this.currentCard.rank);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Value: ${val}`, w / 2, cy + this.cardH + 16);
        } else {
            // Empty card slot
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            CardRenderer.roundRect(ctx, cx, cy, this.cardW, this.cardH, 10);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', cx + this.cardW / 2, cy + this.cardH / 2);
        }
    }
    
    drawNextCard(ctx, w, h) {
        const cx = w / 2 - this.cardW / 2;
        const cy = 200;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT CARD', w / 2, cy - 8);
        
        // Card flip animation
        const progress = this.cardFlipProgress;
        const scaleX = Math.abs(Math.cos(progress * Math.PI));
        
        ctx.save();
        ctx.translate(cx + this.cardW / 2, cy + this.cardH / 2);
        ctx.scale(scaleX, 1);
        ctx.translate(-(cx + this.cardW / 2), -(cy + this.cardH / 2));
        
        if (scaleX > 0.1) {
            CardRenderer.drawCard(ctx, cx, cy, this.cardW, this.cardH, this.nextCard.suit, this.nextCard.rank, true);
        } else {
            // Card back during flip
            ctx.fillStyle = '#1a2744';
            ctx.strokeStyle = '#2a4a7a';
            ctx.lineWidth = 2;
            CardRenderer.roundRect(ctx, cx, cy, this.cardW, this.cardH, 10);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Result indicator
        if (this.gamePhase === 'result') {
            const val = this.getRankValue(this.nextCard.rank);
            const resultColor = this.result === 'win' ? '#00e676' : '#ff4444';
            
            ctx.fillStyle = resultColor;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Value: ${val}`, w / 2, cy + this.cardH + 16);
        }
    }
    
    drawGuessButtons(ctx, w, h) {
        const by = this.nextCard ? h - 140 : h - 100;
        const btnW = (w - 55) / 3;
        const btnH = 50;
        const gap = 8;
        
        const guesses = [
            { label: '🔼 HI', type: 'hi', color: '#00e676', desc: 'Higher' },
            { label: '🟰 SAME', type: 'same', color: '#FFD700', desc: '12:1' },
            { label: '🔽 LOW', type: 'low', color: '#ff4444', desc: 'Lower' }
        ];
        
        guesses.forEach((g, i) => {
            const gx = 20 + i * (btnW + gap);
            const isSelected = this.guess === g.type;
            
            ctx.fillStyle = isSelected ? `${g.color}25` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? g.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            CardRenderer.roundRect(ctx, gx, by, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? g.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.label, gx + btnW / 2, by + btnH / 2 - 7);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Arial';
            ctx.fillText(g.desc, gx + btnW / 2, by + btnH / 2 + 14);
        });
    }
    
    drawStreakDisplay(ctx, w, h) {
        const sy = this.nextCard ? 310 : 245;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        CardRenderer.roundRect(ctx, w / 2 - 55, sy, 110, 32, 16);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STREAK', w / 2, sy + 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`🔥 ${this.streak} (${this.multiplier.toFixed(1)}x)`, w / 2, sy + 26);
    }
    
    drawCashOutButton(ctx, w, h) {
        const cy = this.nextCard ? h - 50 : h - 45;
        const cashOut = Math.floor(this.bet * this.multiplier);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 60, cy, 120, 32, 16);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`💰 CASH OUT ₹${cashOut}`, w / 2, cy + 16);
    }
    
    drawCardsRemaining(ctx, w, h) {
        const rx = w - 55;
        const ry = 22;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        CardRenderer.roundRect(ctx, rx, ry, 42, 30, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CARDS', rx + 21, ry + 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(this.cardsRemaining, rx + 21, ry + 24);
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
    }
}

// Export
window.HiLowFullGame = HiLowFullGame;
console.log('✅ Game 19: Hi-Low - Full Casino Design Loaded');
