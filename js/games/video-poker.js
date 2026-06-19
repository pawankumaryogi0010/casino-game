// ============================================
// EMERALD KING CASINO - GAME 16: VIDEO POKER
// Full Real Casino Visual Design
// Jacks or Better - 5 Card Draw Poker
// File: js/games/video-poker.js
// ============================================

class VideoPokerFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.cards = []; // 5 cards
        this.held = [false, false, false, false, false];
        this.deck = [];
        this.gamePhase = 'bet'; // bet, deal, draw, result
        this.handRank = null;
        this.handName = '';
        this.payout = 0;
        this.isAnimating = false;
        
        // Pay table (Jacks or Better)
        this.payTable = [
            { name: 'ROYAL FLUSH', payout: 250, icon: '👑' },
            { name: 'STRAIGHT FLUSH', payout: 50, icon: '🌟' },
            { name: 'FOUR OF A KIND', payout: 25, icon: '4️⃣' },
            { name: 'FULL HOUSE', payout: 9, icon: '🏠' },
            { name: 'FLUSH', payout: 6, icon: '🌸' },
            { name: 'STRAIGHT', payout: 4, icon: '📈' },
            { name: 'THREE OF A KIND', payout: 3, icon: '3️⃣' },
            { name: 'TWO PAIR', payout: 2, icon: '2️⃣' },
            { name: 'JACKS OR BETTER', payout: 1, icon: '🃏' }
        ];
        
        // Card dimensions
        this.cardW = 50;
        this.cardH = 72;
        this.cardY = 0;
        this.cardStartX = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Card deal animation
        this.dealAnimations = [];
        
        // Colors
        this.colors = {
            screen: '#0a0a1a',
            border: '#FFD700',
            hold: '#00e676',
            button: '#00b0ff',
            deal: '#ff4444',
            text: '#ffffff'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.calculateDimensions();
        this.resetGame();
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
                opacity: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    calculateDimensions() {
        const totalCardW = this.cardW * 5 + 8 * 4;
        this.cardStartX = (this.w - totalCardW) / 2;
        this.cardY = this.h / 2 - this.cardH / 2 + 20;
    }
    
    resetGame() {
        this.cards = [];
        this.held = [false, false, false, false, false];
        this.deck = [];
        this.gamePhase = 'bet';
        this.handRank = null;
        this.handName = '';
        this.payout = 0;
        this.isAnimating = false;
        this.dealAnimations = [];
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
    // HAND EVALUATION
    // ============================================
    
    evaluateHand(cards) {
        const values = cards.map(c => this.getRankValue(c.rank)).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        
        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = values.every((v, i) => i === 0 || v === values[i - 1] - 1) ||
                          (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2);
        
        // Count pairs
        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const countValues = Object.values(counts).sort((a, b) => b - a);
        
        // Royal Flush
        if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
            return { rank: 9, name: 'ROYAL FLUSH', payout: this.payTable[0].payout };
        }
        // Straight Flush
        if (isFlush && isStraight) {
            return { rank: 8, name: 'STRAIGHT FLUSH', payout: this.payTable[1].payout };
        }
        // Four of a Kind
        if (countValues[0] === 4) {
            return { rank: 7, name: 'FOUR OF A KIND', payout: this.payTable[2].payout };
        }
        // Full House
        if (countValues[0] === 3 && countValues[1] === 2) {
            return { rank: 6, name: 'FULL HOUSE', payout: this.payTable[3].payout };
        }
        // Flush
        if (isFlush) {
            return { rank: 5, name: 'FLUSH', payout: this.payTable[4].payout };
        }
        // Straight
        if (isStraight) {
            return { rank: 4, name: 'STRAIGHT', payout: this.payTable[5].payout };
        }
        // Three of a Kind
        if (countValues[0] === 3) {
            return { rank: 3, name: 'THREE OF A KIND', payout: this.payTable[6].payout };
        }
        // Two Pair
        if (countValues[0] === 2 && countValues[1] === 2) {
            return { rank: 2, name: 'TWO PAIR', payout: this.payTable[7].payout };
        }
        // Jacks or Better
        if (countValues[0] === 2) {
            const pairRank = Object.entries(counts).find(([k, v]) => v === 2);
            if (pairRank && parseInt(pairRank[0]) >= 11) {
                return { rank: 1, name: 'JACKS OR BETTER', payout: this.payTable[8].payout };
            }
        }
        
        return { rank: 0, name: 'NO WIN', payout: 0 };
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    toggleHold(index) {
        if (this.gamePhase !== 'draw') return;
        this.held[index] = !this.held[index];
        this.drawFullScreen();
    }
    
    play(bet) {
        if (this.isAnimating) return;
        
        this.bet = bet;
        
        if (this.gamePhase === 'bet' || this.gamePhase === 'result') {
            this.dealInitial();
        } else if (this.gamePhase === 'draw') {
            this.drawCards();
        }
    }
    
    dealInitial() {
        this.isAnimating = true;
        this.held = [false, false, false, false, false];
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cards = [];
        this.gamePhase = 'deal';
        this.handRank = null;
        this.handName = '';
        this.payout = 0;
        
        // Deal 5 cards with animation
        for (let i = 0; i < 5; i++) {
            this.cards.push(this.deck.pop());
            this.dealAnimations.push({
                index: i,
                progress: 0,
                startTime: performance.now() + i * 100
            });
        }
        
        setTimeout(() => {
            this.gamePhase = 'draw';
            this.isAnimating = false;
            this.dealAnimations = [];
        }, 800);
    }
    
    drawCards() {
        // Check if any cards held
        if (!this.held.some(h => h) && !confirm('Draw without holding any cards?')) return;
        
        this.isAnimating = true;
        
        // Replace non-held cards
        for (let i = 0; i < 5; i++) {
            if (!this.held[i]) {
                this.cards[i] = this.deck.pop();
            }
        }
        
        // Evaluate final hand
        const result = this.evaluateHand(this.cards);
        this.handRank = result.rank;
        this.handName = result.name;
        this.payout = Math.floor(this.bet * result.payout);
        
        if (this.payout > 0) {
            this.chips += this.payout;
        }
        
        this.gamePhase = 'result';
        this.isAnimating = false;
        
        this.showResult();
        this.drawFullScreen();
    }
    
    showResult() {
        const resultDisplay = document.getElementById('game-result-display');
        
        if (this.payout > 0) {
            if (this.winCascade) {
                const particleCount = this.handRank >= 7 ? 100 : 50;
                this.winCascade.spawn(this.w / 2, this.h / 2, particleCount);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:18px;">🎉 ${this.handName}!</span><br>
                        <span style="color:#00e676;">+${this.payout} CHIPS</span>
                    </div>`;
            }
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 ${this.handName}</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>
                    </div>`;
            }
        }
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
    // RENDERING - FULL SCREEN
    // ============================================
    
    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Screen
        this.drawScreen(ctx, w, h);
        
        // Pay table
        this.drawPayTable(ctx, w, h);
        
        // Cards
        this.drawCards(ctx);
        
        // Hold buttons
        if (this.gamePhase === 'draw') {
            this.drawHoldButtons(ctx);
        }
        
        // Action button
        this.drawActionButton(ctx, w, h);
        
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
    
    drawScreen(ctx, w, h) {
        const sx = 15;
        const sy = 55;
        const sw = w - 30;
        const sh = h - 155;
        
        // Screen background
        const screenGrad = ctx.createLinearGradient(0, sy, 0, sy + sh);
        screenGrad.addColorStop(0, '#0a0a1a');
        screenGrad.addColorStop(1, '#0f0f2a');
        ctx.fillStyle = screenGrad;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, sx, sy, sw, sh, 12);
        ctx.fill();
        ctx.stroke();
        
        // Screen title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🃏 VIDEO POKER', w / 2, sy + 18);
        
        // Game status
        let statusText = '';
        let statusColor = '#ffffff';
        switch (this.gamePhase) {
            case 'bet': statusText = 'Press DEAL to play'; statusColor = '#FFD700'; break;
            case 'deal': statusText = 'Dealing...'; statusColor = '#00b0ff'; break;
            case 'draw': statusText = 'Hold cards & press DRAW'; statusColor = '#00e676'; break;
            case 'result': 
                statusText = this.handName;
                statusColor = this.payout > 0 ? '#00e676' : '#ff4444';
                break;
        }
        
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 10px Arial';
        ctx.fillText(statusText, w / 2, sy + sh - 12);
    }
    
    drawCards(ctx) {
        const startX = this.cardStartX;
        const y = this.cardY;
        
        this.cards.forEach((card, i) => {
            let cx = startX + i * (this.cardW + 8);
            let cy = y;
            let scale = 1;
            
            // Animation
            const anim = this.dealAnimations.find(a => a.index === i);
            if (anim) {
                scale = anim.progress;
                cx = startX + i * (this.cardW + 8) + (1 - scale) * 50;
                cy = y - (1 - scale) * 30;
            }
            
            ctx.save();
            ctx.translate(cx + this.cardW / 2, cy + this.cardH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cx + this.cardW / 2), -(cy + this.cardH / 2));
            
            if (card) {
                CardRenderer.drawCard(ctx, cx, cy, this.cardW, this.cardH, card.suit, card.rank, true);
            }
            
            ctx.restore();
            
            // Held indicator
            if (this.held[i]) {
                ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
                ctx.strokeStyle = '#00e676';
                ctx.lineWidth = 2;
                CardRenderer.roundRect(ctx, cx - 3, cy - 3, this.cardW + 6, this.cardH + 6, 8);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#00e676';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('HELD', cx + this.cardW / 2, cy + this.cardH + 15);
            }
        });
    }
    
    drawHoldButtons(ctx) {
        const startX = this.cardStartX;
        const btnY = this.cardY + this.cardH + 22;
        
        this.cards.forEach((card, i) => {
            const bx = startX + i * (this.cardW + 8);
            const bw = this.cardW;
            const bh = 22;
            
            ctx.fillStyle = this.held[i] ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = this.held[i] ? '#00e676' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = this.held[i] ? 2 : 1;
            CardRenderer.roundRect(ctx, bx, btnY, bw, bh, 11);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.held[i] ? '#00e676' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('HOLD', bx + bw / 2, btnY + bh / 2);
        });
    }
    
    drawPayTable(ctx, w, h) {
        const py = h - 85;
        const pw = w - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, 15, py, pw, 40, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAY TABLE (x bet)', w / 2, py + 10);
        
        // Show top 5 payouts
        const topPays = this.payTable.slice(0, 5);
        topPays.forEach((pay, i) => {
            const px = 25 + i * (pw / 5);
            const highlight = this.handName === pay.name;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 7px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(pay.icon, px, py + 22);
            ctx.fillText(`x${pay.payout}`, px, py + 34);
        });
    }
    
    drawActionButton(ctx, w, h) {
        const by = h - 38;
        const bw = 100;
        const bh = 30;
        
        let label = 'DEAL';
        let color = '#ff4444';
        
        if (this.gamePhase === 'draw') {
            label = 'DRAW';
            color = '#00e676';
        } else if (this.gamePhase === 'deal') {
            label = '...';
            color = '#888888';
        }
        
        ctx.fillStyle = `${color}20`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - bw / 2, by, bw, bh, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, by + bh / 2);
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
    // KEYBOARD SHORTCUTS
    // ============================================
    
    handleKeyPress(key) {
        if (this.gamePhase === 'draw') {
            const num = parseInt(key);
            if (num >= 1 && num <= 5) {
                this.toggleHold(num - 1);
            }
        }
        if (key === ' ' || key === 'Enter') {
            this.play(this.bet);
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
        this.dealAnimations = [];
    }
}

// Export
window.VideoPokerFullGame = VideoPokerFullGame;
console.log('✅ Game 16: Video Poker - Full Casino Design Loaded');
