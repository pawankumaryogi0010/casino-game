// ============================================
// EMERALD KING CASINO - GAME 5: BLACKJACK
// Full Real Casino Visual Design
// Double-Deck, Split, Double Down, Hit, Stand
// File: js/games/blackjack.js
// ============================================

class BlackjackFullGame {
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
        this.playerScore = 0;
        this.dealerScore = 0;
        this.playerScore2 = 0; // For split hand
        this.splitCards = [];
        this.isPlaying = false;
        this.gameOver = false;
        this.playerBust = false;
        this.dealerBust = false;
        this.playerBlackjack = false;
        this.dealerBlackjack = false;
        this.canSplit = false;
        this.canDouble = false;
        this.hasSplit = false;
        this.hasDoubled = false;
        this.activeHand = 0; // 0 = main, 1 = split
        this.result = null; // 'win', 'lose', 'push', 'blackjack'
        this.result2 = null; // For split hand
        
        // Animation
        this.dealAnimProgress = 0;
        this.dealAnimTarget = 0;
        this.isDealing = false;
        this.cardFlipAnim = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        this.chipStackAnim = 0;
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            feltDark: '#072218',
            gold: '#FFD700',
            red: '#ff4444',
            blue: '#00b0ff',
            green: '#00e676',
            white: '#ffffff',
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
        this.playerCards = [];
        this.dealerCards = [];
        this.splitCards = [];
        this.playerScore = 0;
        this.dealerScore = 0;
        this.playerScore2 = 0;
        this.isPlaying = false;
        this.gameOver = false;
        this.playerBust = false;
        this.dealerBust = false;
        this.playerBlackjack = false;
        this.dealerBlackjack = false;
        this.canSplit = false;
        this.canDouble = false;
        this.hasSplit = false;
        this.hasDoubled = false;
        this.activeHand = 0;
        this.result = null;
        this.result2 = null;
        this.dealAnimProgress = 0;
        this.isDealing = false;
    }
    
    // ============================================
    // DECK OPERATIONS (Double Deck)
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        // Double deck
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
    
    getCardValue(rank) {
        if (rank === 'A') return 11;
        if (['K', 'Q', 'J'].includes(rank)) return 10;
        return parseInt(rank);
    }
    
    calculateScore(cards) {
        let score = 0;
        let aces = 0;
        for (const card of cards) {
            if (card.rank === 'A') { aces++; score += 11; }
            else if (['K', 'Q', 'J'].includes(card.rank)) score += 10;
            else score += parseInt(card.rank);
        }
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    }
    
    isBlackjack(cards) {
        return cards.length === 2 && this.calculateScore(cards) === 21;
    }
    
    // ============================================
    // GAME ACTIONS
    // ============================================
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.resetGame();
        this.bet = bet;
        this.isDealing = true;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        // Deal initial cards
        this.playerCards = [deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop()];
        
        this.playerScore = this.calculateScore(this.playerCards);
        this.dealerScore = this.calculateScore([this.dealerCards[0]]); // Only show one
        
        this.playerBlackjack = this.isBlackjack(this.playerCards);
        this.dealerBlackjack = this.isBlackjack(this.dealerCards);
        
        this.canSplit = this.playerCards[0].rank === this.playerCards[1].rank;
        this.canDouble = true;
        this.isPlaying = true;
        this.isDealing = false;
        this.gameOver = false;
        
        // Check for natural blackjack
        if (this.playerBlackjack || this.dealerBlackjack) {
            this.gameOver = true;
            this.isPlaying = false;
            this.dealerScore = this.calculateScore(this.dealerCards);
            this.resolveGame();
        }
        
        this.drawFullTable();
    }
    
    hit() {
        if (!this.isPlaying || this.gameOver) return;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        if (this.activeHand === 0) {
            this.playerCards.push(deck.pop());
            this.playerScore = this.calculateScore(this.playerCards);
            
            if (this.playerScore > 21) {
                this.playerBust = true;
                this.stand();
            }
        } else {
            this.splitCards.push(deck.pop());
            this.playerScore2 = this.calculateScore(this.splitCards);
            
            if (this.playerScore2 > 21) {
                this.activeHand = 0;
                this.stand();
            }
        }
        
        this.canDouble = false;
        this.drawFullTable();
    }
    
    stand() {
        if (!this.isPlaying || this.gameOver) return;
        
        if (this.hasSplit && this.activeHand === 1) {
            this.activeHand = 0;
            this.drawFullTable();
            return;
        }
        
        this.gameOver = true;
        this.isPlaying = false;
        
        // Dealer plays
        this.dealerScore = this.calculateScore(this.dealerCards);
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        while (this.dealerScore < 17) {
            this.dealerCards.push(deck.pop());
            this.dealerScore = this.calculateScore(this.dealerCards);
        }
        
        this.dealerBust = this.dealerScore > 21;
        this.resolveGame();
        this.drawFullTable();
    }
    
    doubleDown() {
        if (!this.canDouble || !this.isPlaying || this.gameOver) return;
        
        this.hasDoubled = true;
        this.bet *= 2;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards.push(deck.pop());
        this.playerScore = this.calculateScore(this.playerCards);
        
        if (this.playerScore > 21) {
            this.playerBust = true;
        }
        
        this.stand();
    }
    
    split() {
        if (!this.canSplit || !this.isPlaying || this.gameOver || this.hasSplit) return;
        
        this.hasSplit = true;
        this.splitCards = [this.playerCards.pop()];
        this.playerScore = this.calculateScore(this.playerCards);
        this.playerScore2 = this.calculateScore(this.splitCards);
        this.activeHand = 1; // Start with split hand
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards.push(deck.pop());
        this.splitCards.push(deck.pop());
        this.playerScore = this.calculateScore(this.playerCards);
        this.playerScore2 = this.calculateScore(this.splitCards);
        
        this.drawFullTable();
    }
    
    resolveGame() {
        const ps = this.playerScore;
        const ds = this.dealerScore;
        const resultDisplay = document.getElementById('game-result-display');
        
        // Main hand result
        if (this.playerBust) {
            this.result = 'lose';
        } else if (this.dealerBust) {
            this.result = 'win';
        } else if (this.playerBlackjack && !this.dealerBlackjack) {
            this.result = 'blackjack';
        } else if (ps > ds) {
            this.result = 'win';
        } else if (ps === ds) {
            this.result = 'push';
        } else {
            this.result = 'lose';
        }
        
        // Display result
        if (resultDisplay) {
            let html = '';
            switch (this.result) {
                case 'blackjack':
                    const bjpayout = Math.floor(this.bet * 2.5);
                    this.chips += bjpayout;
                    html = `<span style="color:#FFD700;font-size:18px;">🃏 BLACKJACK!</span><br><span style="color:#00e676;">+${bjpayout} CHIPS</span>`;
                    if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
                    break;
                case 'win':
                    const payout = Math.floor(this.bet * 2);
                    this.chips += payout;
                    html = `<span style="color:#00e676;font-size:18px;">🎉 YOU WIN!</span><br><span style="color:#00e676;">+${payout} CHIPS</span>`;
                    if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
                    break;
                case 'push':
                    this.chips += this.bet;
                    html = `<span style="color:#FFD700;font-size:16px;">🤝 PUSH</span><br><span style="color:rgba(255,255,255,0.6);">Bet returned</span>`;
                    break;
                case 'lose':
                    html = `<span style="color:#ff4444;font-size:16px;">😞 DEALER WINS</span><br><span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>`;
                    break;
            }
            resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out;">${html}</div>`;
        }
        
        setTimeout(() => { this.resetGame(); }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        this.chipStackAnim += 0.03;
        
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
        
        // Table felt
        this.drawTableFelt(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Dealer area
        this.drawDealerArea(ctx, w, h);
        
        // Player area
        this.drawPlayerArea(ctx, w, h);
        
        // Split hand area (if active)
        if (this.hasSplit) {
            this.drawSplitArea(ctx, w, h);
        }
        
        // Score displays
        this.drawScores(ctx, w, h);
        
        // Action buttons
        if (this.isPlaying && !this.gameOver) {
            this.drawActionButtons(ctx, w, h);
        }
        
        // Chip stack
        this.drawChipStack(ctx, w, h);
        
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
    
    drawTableFelt(ctx, w, h) {
        const feltGrad = ctx.createLinearGradient(0, 0, w, h);
        feltGrad.addColorStop(0, '#0d3320');
        feltGrad.addColorStop(0.5, '#0a2a1a');
        feltGrad.addColorStop(1, '#072218');
        ctx.fillStyle = feltGrad;
        CardRenderer.roundRect(ctx, 20, 20, w - 40, h - 40, 12);
        ctx.fill();
        
        // Felt texture
        ctx.fillStyle = 'rgba(0, 40, 25, 0.2)';
        for (let x = 28; x < w - 28; x += 4) {
            for (let y = 28; y < h - 28; y += 4) {
                if ((x + y) % 8 === 0) ctx.fillRect(x, y, 2, 2);
            }
        }
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 25, w * 0.6, 32, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 25, w * 0.6, 32, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🃏 BLACKJACK', w / 2, 41);
        
        // RTP badge
        ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
        CardRenderer.roundRect(ctx, w - 75, 27, 50, 18, 10);
        ctx.fill();
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('RTP 99.5%', w - 50, 36);
    }
    
    drawDealerArea(ctx, w, h) {
        const areaY = 68;
        const areaW = w * 0.6;
        const areaX = (w - areaW) / 2;
        
        // Dealer zone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, 95, 10);
        ctx.fill();
        ctx.stroke();
        
        // Dealer label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 DEALER', w / 2, areaY - 5);
        
        // Dealer cards
        const cardW = 46;
        const cardH = 64;
        const startX = w / 2 - (this.dealerCards.length * 28) / 2;
        
        for (let i = 0; i < this.dealerCards.length; i++) {
            const cx = startX + i * 28;
            const cy = areaY + 18;
            const showCard = (i === 0 && !this.gameOver) ? false : true;
            
            if (showCard) {
                CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.dealerCards[i].suit, this.dealerCards[i].rank, true);
            } else {
                // Hidden card
                ctx.fillStyle = '#1a2744';
                ctx.strokeStyle = '#2a4a7a';
                ctx.lineWidth = 1.5;
                CardRenderer.roundRect(ctx, cx, cy, cardW, cardH, 6);
                ctx.fill();
                ctx.stroke();
                
                // Card back pattern
                ctx.fillStyle = '#2a4a7a';
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 2; c++) {
                        ctx.beginPath();
                        ctx.arc(cx + 14 + c * 18, cy + 16 + r * 20, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }
    
    drawPlayerArea(ctx, w, h) {
        const areaY = h - 200;
        const areaW = w * 0.6;
        const areaX = (w - areaW) / 2;
        
        // Player zone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeStyle = this.activeHand === 0 ? 'rgba(0, 230, 118, 0.5)' : 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = this.activeHand === 0 ? 2 : 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, 95, 10);
        ctx.fill();
        ctx.stroke();
        
        // Player label
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👤 YOUR HAND', w / 2, areaY - 5);
        
        // Player cards
        const cardW = 46;
        const cardH = 64;
        const startX = w / 2 - (this.playerCards.length * 28) / 2;
        
        for (let i = 0; i < this.playerCards.length; i++) {
            const cx = startX + i * 28;
            const cy = areaY + 18;
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.playerCards[i].suit, this.playerCards[i].rank, true);
        }
    }
    
    drawSplitArea(ctx, w, h) {
        const areaY = h - 310;
        const areaW = w * 0.45;
        const areaX = w * 0.05;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeStyle = this.activeHand === 1 ? 'rgba(0, 176, 255, 0.5)' : 'rgba(0, 176, 255, 0.2)';
        ctx.lineWidth = this.activeHand === 1 ? 2 : 1;
        CardRenderer.roundRect(ctx, areaX, areaY, areaW, 75, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPLIT HAND', areaX + areaW / 2, areaY - 5);
        
        const cardW = 38;
        const cardH = 52;
        const startX = areaX + 8;
        
        for (let i = 0; i < this.splitCards.length; i++) {
            const cx = startX + i * 22;
            const cy = areaY + 14;
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.splitCards[i].suit, this.splitCards[i].rank, true);
        }
    }
    
    drawScores(ctx, w, h) {
        // Dealer score
        const dealerY = 168;
        ctx.fillStyle = this.dealerBust ? '#ff4444' : '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        const dScore = this.gameOver ? this.dealerScore : (this.dealerCards.length > 0 ? this.getCardValue(this.dealerCards[1]?.rank || '0') : 0);
        ctx.fillText(this.gameOver ? this.dealerScore : '?', w / 2, dealerY);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px Arial';
        ctx.fillText('DEALER', w / 2, dealerY - 15);
        
        // Player score
        const playerY = h - 85;
        ctx.fillStyle = this.playerBust ? '#ff4444' : '#00e676';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(this.playerScore, w / 2, playerY);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px Arial';
        ctx.fillText('YOU', w / 2, playerY - 15);
        
        // Split score
        if (this.hasSplit) {
            ctx.fillStyle = '#00b0ff';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(this.playerScore2, w * 0.27, h - 218);
        }
    }
    
    drawActionButtons(ctx, w, h) {
        const btnY = h - 70;
        const btnW = 55;
        const btnH = 28;
        const gap = 6;
        const totalW = btnW * 4 + gap * 3;
        const startX = (w - totalW) / 2;
        
        const actions = [
            { label: 'HIT', key: 'H', color: '#00e676', active: true },
            { label: 'STAND', key: 'S', color: '#ff4444', active: true },
            { label: 'DOUBLE', key: 'D', color: '#FFD700', active: this.canDouble },
            { label: 'SPLIT', key: 'P', color: '#00b0ff', active: this.canSplit && !this.hasSplit }
        ];
        
        actions.forEach((action, i) => {
            const bx = startX + i * (btnW + gap);
            
            ctx.fillStyle = action.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = action.active ? action.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = action.active ? 1.5 : 1;
            CardRenderer.roundRect(ctx, bx, btnY, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = action.active ? action.color : 'rgba(255,255,255,0.3)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(action.label, bx + btnW / 2, btnY + btnH / 2 - 4);
            ctx.font = 'bold 6px Arial';
            ctx.fillText(`[${action.key}]`, bx + btnW / 2, btnY + btnH / 2 + 8);
        });
    }
    
    drawChipStack(ctx, w, h) {
        const cx = w - 35;
        const cy = h / 2;
        
        // Chip stack
        const chips = [
            { color: '#cc0000', value: 100 },
            { color: '#0044cc', value: 50 },
            { color: '#00aa44', value: 25 },
            { color: '#1a1a1a', value: 100 }
        ];
        
        chips.forEach((chip, i) => {
            const offset = Math.sin(this.chipStackAnim + i) * 1;
            const chipY = cy + i * 8 + offset;
            
            ctx.fillStyle = chip.color;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(cx, chipY, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Chip edge
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx - 12, chipY - 2, 24, 4);
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
    // KEYBOARD SHORTCUTS
    // ============================================
    
    handleKeyPress(key) {
        if (!this.isPlaying || this.gameOver) return;
        
        switch (key.toUpperCase()) {
            case 'H': this.hit(); break;
            case 'S': this.stand(); break;
            case 'D': if (this.canDouble) this.doubleDown(); break;
            case 'P': if (this.canSplit && !this.hasSplit) this.split(); break;
        }
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
window.BlackjackFullGame = BlackjackFullGame;
console.log('✅ Game 5: Blackjack - Full Casino Design Loaded');
