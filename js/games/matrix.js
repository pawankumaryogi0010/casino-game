// ============================================
// EMERALD KING CASINO - 20-GAME MATRIX ENGINE
// Demo Chips Simulation - No Real Money
// Vector Graphics & Probability Logic Core
// File: js/games/matrix.js
// Version: 1.0.0
// ============================================

// ============================================
// SECTION 1: CORE UTILITIES
// ============================================

// Global RTP configuration for all games (demo simulation)
const GAME_RTP = {
    'teen-patti': 0.968,
    'andar-bahar': 0.945,
    'aviator': 0.991,
    'roulette': 0.973,
    'blackjack': 0.995,
    'baccarat': 0.989,
    'jhandi-munda': 0.952,
    'dragon-tiger': 0.975,
    '7up-7down': 0.938,
    'car-roulette': 0.960,
    'ludo-betting': 0.940,
    'plinko': 0.972,
    'mines': 0.965,
    'wheel-fortune': 0.955,
    'classic-slots': 0.965,
    'video-poker': 0.978,
    'red-dog': 0.948,
    'sic-bo': 0.950,
    'hi-low': 0.962,
    'keno-jackpot': 0.940
};

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#ffffff', '♥': '#ff4444', '♦': '#ff4444', '♣': '#ffffff' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

// Roulette wheel numbers (European)
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_COLORS = { 0: 'green', 32: 'red', 15: 'black', 19: 'red', 4: 'black', 21: 'red', 2: 'black', 25: 'red', 17: 'black', 34: 'red', 6: 'black', 27: 'red', 13: 'black', 36: 'red', 11: 'black', 30: 'red', 8: 'black', 23: 'red', 10: 'black', 5: 'red', 24: 'black', 16: 'red', 33: 'black', 1: 'red', 20: 'black', 14: 'red', 31: 'black', 9: 'red', 22: 'black', 18: 'red', 29: 'black', 7: 'red', 28: 'black', 12: 'red', 35: 'black', 3: 'red', 26: 'black' };

// Slot symbols
const SLOT_SYMBOLS = ['⭐', '🔔', '7️⃣', '🍒', '💎', '🍀', '🎰', '👑'];
const SLOT_PAYOUTS = { '⭐': 2, '🔔': 3, '7️⃣': 5, '🍒': 2, '💎': 4, '🍀': 3, '🎰': 10, '👑': 8 };

// ============================================
// SECTION 2: CARD RENDERING ENGINE
// ============================================

class CardRenderer {
    static drawCard(ctx, x, y, width, height, suit, rank, faceUp = true) {
        ctx.save();
        
        // Card shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Card body
        ctx.fillStyle = faceUp ? '#ffffff' : '#1a3a5c';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        if (faceUp && suit && rank) {
            const color = SUIT_COLORS[suit] || '#000000';
            const fontSize = Math.floor(width * 0.35);
            
            // Top-left rank & suit
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, x + 5, y + 3);
            ctx.font = `${fontSize * 0.8}px Arial`;
            ctx.fillText(suit, x + 5, y + fontSize + 2);
            
            // Center suit
            ctx.font = `${fontSize * 1.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suit, x + width / 2, y + height / 2);
            
            // Bottom-right rank & suit (inverted)
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(rank, x + width - 5, y + height - 3);
            ctx.font = `${fontSize * 0.8}px Arial`;
            ctx.fillText(suit, x + width - 5, y + height - fontSize - 2);
        } else if (!faceUp) {
            // Card back design
            ctx.fillStyle = '#0d2b4a';
            this.roundRect(ctx, x + 4, y + 4, width - 8, height - 8, 4);
            ctx.fill();
            ctx.strokeStyle = '#1a4a7a';
            ctx.lineWidth = 1;
            this.roundRect(ctx, x + 4, y + 4, width - 8, height - 8, 4);
            ctx.stroke();
            
            // Diamond pattern
            ctx.fillStyle = '#1a4a7a';
            ctx.font = `${Math.floor(width * 0.5)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♦', x + width / 2, y + height / 2);
        }
        
        ctx.restore();
    }
    
    static roundRect(ctx, x, y, w, h, r) {
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
    
    static drawCardBack(ctx, x, y, w, h) {
        ctx.save();
        ctx.fillStyle = '#1a2744';
        ctx.strokeStyle = '#2a4a7a';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2a4a7a';
        ctx.font = `${Math.floor(w * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎰', x + w/2, y + h/2);
        ctx.restore();
    }
}

// ============================================
// SECTION 3: GAME 1 - TEEN PATTI
// ============================================

class TeenPattiGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        this.bet = 50;
        this.playerCards = [];
        this.dealerCards = [];
        this.result = null;
        this.isPlaying = false;
        this.playerRank = null;
        this.dealerRank = null;
        this.winCascade = new WinParticleCascade(ctx);
    }
    
    init() {
        this.drawTable();
    }
    
    dealCards() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards = [deck.pop(), deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop(), deck.pop()];
        this.playerRank = this.evaluateHand(this.playerCards);
        this.dealerRank = this.evaluateHand(this.dealerCards);
    }
    
    createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
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
    
    evaluateHand(cards) {
        const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isStraight = (values[0] - values[1] === 1 && values[1] - values[2] === 1) || 
                           (values[0] === 14 && values[1] === 3 && values[2] === 2);
        const isTrio = values[0] === values[1] && values[1] === values[2];
        const isPair = values[0] === values[1] || values[1] === values[2];
        
        if (isTrio) return { name: 'Trio (Three of a Kind)', rank: 6, high: values[0] };
        if (isStraight && isFlush) return { name: 'Pure Sequence (Straight Flush)', rank: 5, high: values[0] };
        if (isStraight) return { name: 'Sequence (Straight)', rank: 4, high: values[0] };
        if (isFlush) return { name: 'Flush', rank: 3, high: values[0] };
        if (isPair) return { name: 'Pair', rank: 2, high: values[1] };
        return { name: 'High Card', rank: 1, high: values[0] };
    }
    
    play(bet) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.bet = bet;
        this.dealCards();
        
        let winner = null;
        if (this.playerRank.rank > this.dealerRank.rank) winner = 'player';
        else if (this.dealerRank.rank > this.playerRank.rank) winner = 'dealer';
        else winner = this.playerRank.high >= this.dealerRank.high ? 'player' : 'dealer';
        
        this.result = winner;
        
        const resultDisplay = document.getElementById('game-result-display');
        
        if (winner === 'player') {
            const payout = Math.floor(bet * 1.9);
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +${payout} chips (${this.playerRank.name})</span>`;
            this.winCascade.spawn(this.w / 2, this.h / 2, 80);
            this.recordGameSession(bet, payout, 'win');
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 Dealer wins (${this.dealerRank.name})</span>`;
            this.recordGameSession(bet, -bet, 'lose');
        }
        
        setTimeout(() => { this.isPlaying = false; this.drawTable(); }, 3000);
        this.drawTable();
    }
    
    recordGameSession(bet, winLoss, status) {
        if (typeof window.emeraldDB !== 'undefined' && window.emeraldDB.isReady && window.emeraldDB.isReady()) {
            console.log('📊 Demo Session:', { game: 'teen-patti', bet, winLoss, status });
        }
    }
    
    drawTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        // Table surface
        ctx.fillStyle = '#0d3320';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15);
        ctx.fill();
        ctx.stroke();
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🃏 TEEN PATTI', w / 2, 40);
        
        // Dealer cards
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px Arial';
        ctx.fillText('DEALER', w / 2, 75);
        
        const cardW = 42;
        const cardH = 60;
        const startX = w / 2 - 70;
        const dealerY = 85;
        
        for (let i = 0; i < 3; i++) {
            const cx = startX + i * (cardW + 5);
            if (this.dealerCards.length === 3) {
                CardRenderer.drawCard(ctx, cx, dealerY, cardW, cardH, this.dealerCards[i].suit, this.dealerCards[i].rank, true);
            } else {
                CardRenderer.drawCardBack(ctx, cx, dealerY, cardW, cardH);
            }
        }
        
        // Player cards
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px Arial';
        ctx.fillText('YOUR CARDS', w / 2, 175);
        
        const playerY = 185;
        for (let i = 0; i < 3; i++) {
            const cx = startX + i * (cardW + 5);
            if (this.playerCards.length === 3) {
                CardRenderer.drawCard(ctx, cx, playerY, cardW, cardH, this.playerCards[i].suit, this.playerCards[i].rank, true);
            } else {
                CardRenderer.drawCardBack(ctx, cx, playerY, cardW, cardH);
            }
        }
        
        // Hand rankings
        if (this.playerRank && this.dealerRank) {
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`Your Hand: ${this.playerRank.name}`, w / 2, 270);
            ctx.fillText(`Dealer: ${this.dealerRank.name}`, w / 2, 288);
        }
        
        // Win cascade
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
            this.winCascade.render();
        }
    }
    
    update(timestamp) {
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    render() {
        this.drawTable();
    }
    
    destroy() {
        this.winCascade.destroy();
    }
}

// ============================================
// SECTION 4: GAME 2 - ANDAR BAHAR
// ============================================

class AndarBaharGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        this.bet = 50;
        this.side = 'andar';
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.result = null;
        this.isPlaying = false;
        this.winCascade = new WinParticleCascade(ctx);
    }
    
    init() { this.drawTable(); }
    
    dealJoker() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.jokerCard = deck.pop();
        this.andarCards = [];
        this.baharCards = [];
        
        let found = false;
        let currentSide = 'andar';
        
        while (!found && deck.length > 0) {
            const card = deck.pop();
            if (currentSide === 'andar') {
                this.andarCards.push(card);
                currentSide = 'bahar';
            } else {
                this.baharCards.push(card);
                currentSide = 'andar';
            }
            if (card.rank === this.jokerCard.rank) {
                found = true;
                this.result = currentSide === 'andar' ? 'bahar' : 'andar';
            }
        }
    }
    
    createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
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
    
    setSide(side) {
        this.side = side;
    }
    
    play(bet, side) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.bet = bet;
        this.side = side || this.side;
        this.dealJoker();
        
        const won = this.result === this.side;
        const resultDisplay = document.getElementById('game-result-display');
        
        if (won) {
            const payout = Math.floor(bet * 1.9);
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +${payout} chips</span>`;
            this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 ${this.result.toUpperCase()} wins</span>`;
        }
        
        setTimeout(() => { this.isPlaying = false; this.drawTable(); }, 3000);
        this.drawTable();
    }
    
    drawTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#0d3320';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 ANDAR BAHAR', w / 2, 35);
        
        // Joker card center
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('JOKER', w / 2, 60);
        
        if (this.jokerCard) {
            CardRenderer.drawCard(ctx, w / 2 - 20, 68, 40, 56, this.jokerCard.suit, this.jokerCard.rank, true);
        } else {
            CardRenderer.drawCardBack(ctx, w / 2 - 20, 68, 40, 56);
        }
        
        // Andar side
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('ANDAR', w / 4, 145);
        
        this.andarCards.forEach((card, i) => {
            const cx = w / 4 - 18 + (i % 4) * 20;
            const cy = 155 + Math.floor(i / 4) * 30;
            CardRenderer.drawCard(ctx, cx, cy, 22, 30, card.suit, card.rank, true);
        });
        
        // Bahar side
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('BAHAR', (w * 3) / 4, 145);
        
        this.baharCards.forEach((card, i) => {
            const cx = (w * 3) / 4 - 18 + (i % 4) * 20;
            const cy = 155 + Math.floor(i / 4) * 30;
            CardRenderer.drawCard(ctx, cx, cy, 22, 30, card.suit, card.rank, true);
        });
        
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
            this.winCascade.render();
        }
    }
    
    update(timestamp) {
        if (this.winCascade.isAlive()) this.winCascade.update();
    }
    
    render() { this.drawTable(); }
    
    destroy() { this.winCascade.destroy(); }
}

// ============================================
// SECTION 5: GAME 3 - CRASH / AVIATOR
// ============================================

class AviatorGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        this.bet = 50;
        this.multiplier = 1.0;
        this.crashPoint = 1.0;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.cashOutMultiplier = 0;
        this.pathPoints = [];
        this.jetX = 60;
        this.jetY = 0;
        this.winCascade = new WinParticleCascade(ctx);
    }
    
    init() {
        this.reset();
        this.drawGraph();
    }
    
    reset() {
        this.multiplier = 1.0;
        this.crashPoint = 1.0 + Math.random() * 9;
        this.isFlying = false;
        this.hasCrashed = false;
        this.hasCashedOut = false;
        this.cashOutMultiplier = 0;
        this.pathPoints = [];
        this.jetX = 60;
        this.jetY = this.h - 80;
    }
    
    play(bet) {
        if (this.isFlying) return;
        this.bet = bet;
        this.reset();
        this.isFlying = true;
        this.crashPoint = 1.0 + (Math.random() * 5 + Math.random() * 5);
        this.startTime = performance.now();
    }
    
    cashOut() {
        if (!this.isFlying || this.hasCrashed || this.hasCashedOut) return;
        this.hasCashedOut = true;
        this.cashOutMultiplier = this.multiplier;
        const payout = Math.floor(this.bet * this.multiplier);
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">✅ Cashed Out! ${this.multiplier.toFixed(2)}x = +${payout} chips</span>`;
        this.winCascade.spawn(this.w / 2, this.h / 2, 50);
    }
    
    update(timestamp) {
        if (!this.isFlying || this.hasCrashed) {
            if (this.winCascade.isAlive()) this.winCascade.update();
            return;
        }
        
        const elapsed = (timestamp - this.startTime) / 1000;
        this.multiplier = Math.pow(Math.E, elapsed * 0.15);
        
        const graphW = this.w - 140;
        const graphH = this.h - 100;
        const px = 60 + (this.multiplier - 1) * (graphW / 10);
        const py = this.h - 60 - (this.multiplier - 1) * (graphH / 10);
        
        this.pathPoints.push({ x: px, y: py });
        if (this.pathPoints.length > 200) this.pathPoints.shift();
        
        this.jetX = px;
        this.jetY = py - 20;
        
        if (this.multiplier >= this.crashPoint) {
            this.hasCrashed = true;
            this.isFlying = false;
            const resultDisplay = document.getElementById('game-result-display');
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">💥 CRASHED at ${this.crashPoint.toFixed(2)}x!</span>`;
        }
        
        if (this.winCascade.isAlive()) this.winCascade.update();
    }
    
    drawGraph() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        // Graph background
        ctx.fillStyle = '#0a1a14';
        ctx.strokeStyle = 'rgba(0,230,118,0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, 50, 30, w - 130, h - 80, 10);
        ctx.fill();
        ctx.stroke();
        
        // Grid lines
        ctx.strokeStyle = 'rgba(0,230,118,0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i <= 10; i++) {
            const y = h - 60 - (i * (h - 100) / 10);
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(w - 80, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px Arial';
            ctx.fillText(i.toFixed(1) + 'x', w - 75, y + 3);
        }
        
        // Draw path
        if (this.pathPoints.length > 1) {
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
            for (let i = 1; i < this.pathPoints.length; i++) {
                ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Crash point marker
        if (this.crashPoint > 1) {
            const crashY = this.h - 60 - (this.crashPoint - 1) * ((this.h - 100) / 10);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(50, crashY);
            ctx.lineTo(w - 80, crashY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff4444';
            ctx.font = '9px Arial';
            ctx.fillText('CRASH', w - 75, crashY - 5);
        }
        
        // Draw jet
        this.drawJet(this.jetX, this.jetY);
        
        // Current multiplier
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.multiplier.toFixed(2) + 'x', w / 2, h - 15);
        
        if (this.winCascade.isAlive()) this.winCascade.render();
    }
    
    drawJet(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        
        // Jet body
        ctx.fillStyle = '#00b0ff';
        ctx.shadowColor = '#00b0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-10, -14);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-10, 14);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    render() { this.drawGraph(); }
    
    destroy() { this.winCascade.destroy(); }
}

// ============================================
// SECTION 6: GAME 4 - ROULETTE
// ============================================

class RouletteGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        this.bet = 50;
        this.betType = 'red';
        this.betNumber = null;
        this.ballAngle = 0;
        this.ballRadius = 0;
        this.isSpinning = false;
        this.resultNumber = null;
        this.winCascade = new WinParticleCascade(ctx);
    }
    
    init() { this.drawWheel(); }
    
    setBetType(type, number = null) {
        this.betType = type;
        this.betNumber = number;
    }
    
    play(bet) {
        if (this.isSpinning) return;
        this.bet = bet;
        this.isSpinning = true;
        this.resultNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
        this.ballAngle = Math.random() * Math.PI * 2;
        this.ballRadius = 0;
        
        const targetAngle = this.getNumberAngle(this.resultNumber);
        this.spinDuration = 3000 + Math.random() * 2000;
        this.spinStart = performance.now();
        this.spinEnd = this.spinStart + this.spinDuration;
    }
    
    getNumberAngle(number) {
        const index = ROULETTE_NUMBERS.indexOf(number);
        return (index / ROULETTE_NUMBERS.length) * Math.PI * 2 - Math.PI / 2;
    }
    
    update(timestamp) {
        if (!this.isSpinning) {
            if (this.winCascade.isAlive()) this.winCascade.update();
            return;
        }
        
        const elapsed = timestamp - this.spinStart;
        const progress = Math.min(elapsed / this.spinDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const totalRotations = 5 + Math.random() * 3;
        const targetAngle = this.getNumberAngle(this.resultNumber);
        this.ballAngle = eased * (totalRotations * Math.PI * 2 + targetAngle);
        this.ballRadius = this.w * 0.32;
        
        if (progress >= 1) {
            this.isSpinning = false;
            this.checkResult();
        }
        
        if (this.winCascade.isAlive()) this.winCascade.update();
    }
    
    checkResult() {
        const num = this.resultNumber;
        const color = ROULETTE_COLORS[num];
        let won = false;
        let payoutMultiplier = 0;
        
        switch (this.betType) {
            case 'red':
                won = color === 'red';
                payoutMultiplier = 2;
                break;
            case 'black':
                won = color === 'black';
                payoutMultiplier = 2;
                break;
            case 'even':
                won = num !== 0 && num % 2 === 0;
                payoutMultiplier = 2;
                break;
            case 'odd':
                won = num % 2 === 1;
                payoutMultiplier = 2;
                break;
            case 'number':
                won = num === this.betNumber;
                payoutMultiplier = 36;
                break;
        }
        
        const resultDisplay = document.getElementById('game-result-display');
        if (won) {
            const payout = Math.floor(this.bet * payoutMultiplier);
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 ${num} ${color.toUpperCase()} - YOU WIN! +${payout} chips</span>`;
            this.winCascade.spawn(this.w / 2, this.h / 2, 70);
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 ${num} ${color.toUpperCase()} - You lost</span>`;
        }
    }
    
    drawWheel() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        const cx = w / 2;
        const cy = h / 2 - 10;
        const radius = Math.min(w, h) * 0.35;
        
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        // Wheel outer rim
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Segments
        ROULETTE_NUMBERS.forEach((num, i) => {
            const startAngle = (i / ROULETTE_NUMBERS.length) * Math.PI * 2 - Math.PI / 2;
            const endAngle = ((i + 1) / ROULETTE_NUMBERS.length) * Math.PI * 2 - Math.PI / 2;
            const color = ROULETTE_COLORS[num];
            
            ctx.fillStyle = color === 'red' ? '#cc0000' : color === 'black' ? '#1a1a1a' : '#006600';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Number text
            const midAngle = (startAngle + endAngle) / 2;
            const textX = cx + Math.cos(midAngle) * (radius * 0.75);
            const textY = cy + Math.sin(midAngle) * (radius * 0.75);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString(), textX, textY);
        });
        
        // Center circle
        ctx.fillStyle = '#0a0a0a';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Ball
        if (this.isSpinning || this.resultNumber) {
            const bx = cx + Math.cos(this.ballAngle) * this.ballRadius;
            const by = cy + Math.sin(this.ballAngle) * this.ballRadius;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎡 ROULETTE', w / 2, h - 10);
        
        if (this.winCascade.isAlive()) this.winCascade.render();
    }
    
    render() { this.drawWheel(); }
    
    destroy() { this.winCascade.destroy(); }
}

// ============================================
// SECTION 7: GAME 5 - BLACKJACK
// ============================================

class BlackjackGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        this.bet = 50;
        this.playerCards = [];
        this.dealerCards = [];
        this.playerScore = 0;
        this.dealerScore = 0;
        this.isPlaying = false;
        this.gameOver = false;
        this.canSplit = false;
        this.canDouble = false;
        this.splitHand = null;
        this.winCascade = new WinParticleCascade(ctx);
    }
    
    init() { this.drawTable(); }
    
    dealInitial() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards = [deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop()];
        this.playerScore = this.calculateScore(this.playerCards);
        this.dealerScore = this.calculateScore([this.dealerCards[0]]);
        this.canSplit = this.playerCards[0].rank === this.playerCards[1].rank;
        this.canDouble = true;
        this.gameOver = false;
        this.splitHand = null;
    }
    
    createDeck() {
        const deck = [];
        for (let d = 0; d < 2; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
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
    
    play(bet) {
        if (this.isPlaying) return;
        this.bet = bet;
        this.isPlaying = true;
        this.dealInitial();
        this.drawTable();
    }
    
    hit() {
        if (!this.isPlaying || this.gameOver) return;
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        this.playerCards.push(deck.pop());
        this.playerScore = this.calculateScore(this.playerCards);
        if (this.playerScore > 21) { this.stand(); }
        this.drawTable();
    }
    
    stand() {
        if (!this.isPlaying || this.gameOver) return;
        this.gameOver = true;
        
        this.dealerScore = this.calculateScore(this.dealerCards);
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        while (this.dealerScore < 17) {
            this.dealerCards.push(deck.pop());
            this.dealerScore = this.calculateScore(this.dealerCards);
        }
        
        this.resolveGame();
        this.drawTable();
    }
    
    doubleDown() {
        if (!this.canDouble || this.gameOver) return;
        this.bet *= 2;
        this.hit();
        if (!this.gameOver) this.stand();
    }
    
    split() {
        if (!this.canSplit || this.gameOver) return;
        console.log('Split not fully implemented in demo');
    }
    
    resolveGame() {
        const ps = this.playerScore;
        const ds = this.dealerScore;
        const resultDisplay = document.getElementById('game-result-display');
        
        if (ps > 21) {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">BUST! You lost ${this.bet} chips</span>`;
        } else if (ds > 21) {
            const payout = this.bet * 2;
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">Dealer BUST! You win ${payout} chips!</span>`;
            this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        } else if (ps > ds) {
            const payout = this.bet * 2;
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">You win! +${payout} chips</span>`;
            this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        } else if (ps === ds) {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#FFD700;">Push! Bet returned</span>`;
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">Dealer wins. You lost ${this.bet} chips</span>`;
        }
        
        this.isPlaying = false;
    }
    
    drawTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#0d3320';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🃏 BLACKJACK', w / 2, 35);
        
        // Dealer
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Arial';
        ctx.fillText(`DEALER (${this.dealerScore})`, w / 2, 58);
        
        const cardW = 40;
        const cardH = 56;
        this.dealerCards.forEach((card, i) => {
            const cx = w / 2 - 25 + i * 25;
            const cy = 65;
            const showCard = (i === 0 && !this.gameOver) ? false : true;
            if (showCard) {
                CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, card.suit, card.rank, true);
            } else {
                CardRenderer.drawCardBack(ctx, cx, cy, cardW, cardH);
            }
        });
        
        // Player
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Arial';
        ctx.fillText(`YOUR CARDS (${this.playerScore})`, w / 2, 155);
        
        this.playerCards.forEach((card, i) => {
            const cx = w / 2 - 30 + i * 28;
            const cy = 162;
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, card.suit, card.rank, true);
        });
        
        // Action buttons area
        if (this.isPlaying && !this.gameOver) {
            const btnY = h - 45;
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('[H] Hit  [S] Stand  [D] Double  [P] Split', w / 2, btnY);
        }
        
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
            this.winCascade.render();
        }
    }
    
    update(timestamp) {
        if (this.winCascade.isAlive()) this.winCascade.update();
    }
    
    render() { this.drawTable(); }
    
    destroy() { this.winCascade.destroy(); }
}

// ============================================
// SECTION 8: GAME 6-20 SHELLS (Visual Framework)
// ============================================

class BaccaratGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawTable(); }
    drawTable() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎴 BACCARAT', w / 2, h / 2 - 5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Arial';
        ctx.fillText('Player | Banker | Tie', w / 2, h / 2 + 25);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawTable(); }
    destroy() { this.winCascade.destroy(); }
}

class JhandiMundaGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawBoard(); }
    drawBoard() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎲 JHANDI MUNDA', w / 2, h / 2 - 5);
        const symbols = ['♠', '♥', '♦', '♣', '👑', '⭐'];
        symbols.forEach((s, i) => { ctx.fillText(s, w / 2 - 60 + i * 24, h / 2 + 30); });
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawBoard(); }
    destroy() { this.winCascade.destroy(); }
}

class DragonTigerGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawTable(); }
    drawTable() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🐉 DRAGON TIGER 🐯', w / 2, h / 2 - 15);
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 16px Arial';
        ctx.fillText('DRAGON', w / 4, h / 2 + 25);
        ctx.fillStyle = '#00b0ff';
        ctx.fillText('TIGER', (w * 3) / 4, h / 2 + 25);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Arial';
        ctx.fillText('VS', w / 2, h / 2 + 25);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawTable(); }
    destroy() { this.winCascade.destroy(); }
}

class SevenUpSevenDownGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawBoard(); }
    drawBoard() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎲 7 UP 7 DOWN', w / 2, h / 2 - 15);
        ctx.fillStyle = '#00e676'; ctx.font = 'bold 14px Arial';
        ctx.fillText('UP (2-6)', w / 4, h / 2 + 20);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('DOWN (8-12)', (w * 3) / 4, h / 2 + 20);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('7️⃣', w / 2, h / 2 + 20);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawBoard(); }
    destroy() { this.winCascade.destroy(); }
}

class CarRouletteGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawTrack(); }
    drawTrack() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🏎️ CAR ROULETTE', w / 2, h / 2 - 5);
        const cars = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️'];
        cars.forEach((c, i) => { ctx.fillText(c, w / 2 - 50 + i * 20, h / 2 + 25); });
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawTrack(); }
    destroy() { this.winCascade.destroy(); }
}

class LudoBettingGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawBoard(); }
    drawBoard() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎯 LUDO BETTING', w / 2, h / 2 - 5);
        const colors = ['🔴', '🔵', '🟢', '🟡'];
        colors.forEach((c, i) => { ctx.fillText(c, w / 2 - 30 + i * 20, h / 2 + 25); });
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawBoard(); }
    destroy() { this.winCascade.destroy(); }
}

class PlinkoGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawBoard(); }
    drawBoard() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🔵 PLINKO', w / 2, 25);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col <= row; col++) {
                const px = w / 2 - row * 15 + col * 30;
                const py = 50 + row * 30;
                ctx.fillStyle = '#00e676';
                ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
            }
        }
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawBoard(); }
    destroy() { this.winCascade.destroy(); }
}

class MinesGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawGrid(); }
    drawGrid() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
        ctx.fillText('💣 MINES (5x5)', w / 2, 25);
        const gridSize = 5; const cellSize = (w - 80) / gridSize;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cx = 30 + col * cellSize; const cy = 40 + row * cellSize;
                ctx.fillStyle = '#1a3a2a'; ctx.strokeStyle = '#00e676';
                ctx.lineWidth = 1;
                CardRenderer.roundRect(ctx, cx, cy, cellSize - 3, cellSize - 3, 6);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = `${cellSize * 0.5}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('?', cx + cellSize / 2 - 1, cy + cellSize / 2);
            }
        }
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawGrid(); }
    destroy() { this.winCascade.destroy(); }
}

class WheelOfFortuneGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawWheel(); }
    drawWheel() {
        const ctx = this.ctx; const w = this.w; const h = this.h; const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * 0.38;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        const segments = ['10', '50', '5', '100', '20', '200', '2', '500'];
        segments.forEach((seg, i) => {
            const start = (i / segments.length) * Math.PI * 2 - Math.PI / 2;
            const end = ((i + 1) / segments.length) * Math.PI * 2 - Math.PI / 2;
            ctx.fillStyle = i % 2 === 0 ? '#1a3a5c' : '#cc0000';
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1; ctx.stroke();
            const mid = (start + end) / 2;
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
            ctx.fillText(seg, cx + Math.cos(mid) * r * 0.7, cy + Math.sin(mid) * r * 0.7);
        });
        ctx.fillStyle = '#0a0a0a'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Arial'; ctx.fillText('🎡 WHEEL OF FORTUNE', w / 2, h - 10);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawWheel(); }
    destroy() { this.winCascade.destroy(); }
}

class ClassicSlotsGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawMachine(); }
    drawMachine() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
        CardRenderer.roundRect(ctx, 15, 15, w - 30, h - 30, 12); ctx.fill(); ctx.stroke();
        const cols = 3; const reelW = (w - 60) / cols;
        for (let col = 0; col < cols; col++) {
            const rx = 25 + col * (reelW + 5);
            ctx.fillStyle = '#0a0a0a'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 1;
            CardRenderer.roundRect(ctx, rx, 35, reelW, h - 80, 8); ctx.fill(); ctx.stroke();
            const symbols = [SLOT_SYMBOLS[col], SLOT_SYMBOLS[col + 3], SLOT_SYMBOLS[col + 1]];
            symbols.forEach((sym, i) => {
                ctx.fillStyle = '#ffffff'; ctx.font = `${reelW * 0.6}px Arial`; ctx.textAlign = 'center';
                ctx.fillText(sym, rx + reelW / 2, 55 + i * 50);
            });
        }
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎰 CLASSIC SLOTS', w / 2, h - 12);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawMachine(); }
    destroy() { this.winCascade.destroy(); }
}

class VideoPokerGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawScreen(); }
    drawScreen() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0a1a2a'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🃏 VIDEO POKER', w / 2, 30);
        for (let i = 0; i < 5; i++) {
            const cx = w / 2 - 80 + i * 40;
            CardRenderer.drawCardBack(ctx, cx, 50, 35, 48);
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px Arial';
            ctx.fillText('HOLD', cx + 17, 110);
        }
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 11px Arial';
        ctx.fillText('Jacks or Better', w / 2, h - 15);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawScreen(); }
    destroy() { this.winCascade.destroy(); }
}

class RedDogGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawTable(); }
    drawTable() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🐕 RED DOG', w / 2, h / 2 - 10);
        CardRenderer.drawCardBack(ctx, w / 2 - 40, h / 2 + 5, 35, 48);
        CardRenderer.drawCardBack(ctx, w / 2 + 5, h / 2 + 5, 35, 48);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Arial';
        ctx.fillText('Spread Betting', w / 2, h / 2 + 65);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawTable(); }
    destroy() { this.winCascade.destroy(); }
}

class SicBoGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawTable(); }
    drawTable() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🎲 SIC BO', w / 2, h / 2 - 15);
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#ffffff'; ctx.font = '30px Arial';
            ctx.fillText('🎲', w / 2 - 30 + i * 30, h / 2 + 20);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Arial';
        ctx.fillText('Big | Small | Triple', w / 2, h / 2 + 50);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawTable(); }
    destroy() { this.winCascade.destroy(); }
}

class HiLowGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawScreen(); }
    drawScreen() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🔼🔽 HI-LOW', w / 2, 30);
        CardRenderer.drawCard(ctx, w / 2 - 18, 50, 36, 50, '♠', '8', true);
        ctx.fillStyle = '#00e676'; ctx.font = 'bold 14px Arial';
        ctx.fillText('HI ▲', w / 4, h / 2 + 20);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('LOW ▼', (w * 3) / 4, h / 2 + 20);
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawScreen(); }
    destroy() { this.winCascade.destroy(); }
}

class KenoJackpotGame {
    constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.w = canvas.width / 2; this.h = canvas.height / 2; this.winCascade = new WinParticleCascade(ctx); }
    init() { this.drawBoard(); }
    drawBoard() {
        const ctx = this.ctx; const w = this.w; const h = this.h;
        ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#0d3320'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 10, 10, w - 20, h - 20, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('🔢 KENO JACKPOT', w / 2, 25);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const num = row * 5 + col + 1;
                const cx = 30 + col * (w - 80) / 5;
                const cy = 40 + row * (h - 80) / 4;
                ctx.fillStyle = '#1a3a2a'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 0.5;
                CardRenderer.roundRect(ctx, cx, cy, (w - 80) / 5 - 3, (h - 80) / 4 - 3, 4);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#ffffff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(num, cx + (w - 80) / 10 - 1, cy + (h - 80) / 8);
            }
        }
        if (this.winCascade.isAlive()) { this.winCascade.update(); this.winCascade.render(); }
    }
    update(t) { if (this.winCascade.isAlive()) this.winCascade.update(); }
    render() { this.drawBoard(); }
    destroy() { this.winCascade.destroy(); }
}

// ============================================
// SECTION 9: GAME FACTORY
// ============================================

const GAME_CLASSES = {
    'teen-patti': TeenPattiGame,
    'andar-bahar': AndarBaharGame,
    'aviator': AviatorGame,
    'roulette': RouletteGame,
    'blackjack': BlackjackGame,
    'baccarat': BaccaratGame,
    'jhandi-munda': JhandiMundaGame,
    'dragon-tiger': DragonTigerGame,
    '7up-7down': SevenUpSevenDownGame,
    'car-roulette': CarRouletteGame,
    'ludo-betting': LudoBettingGame,
    'plinko': PlinkoGame,
    'mines': MinesGame,
    'wheel-fortune': WheelOfFortuneGame,
    'classic-slots': ClassicSlotsGame,
    'video-poker': VideoPokerGame,
    'red-dog': RedDogGame,
    'sic-bo': SicBoGame,
    'hi-low': HiLowGame,
    'keno-jackpot': KenoJackpotGame
};

function createGameInstance(gameId, canvas, ctx) {
    const GameClass = GAME_CLASSES[gameId];
    if (GameClass) {
        return new GameClass(canvas, ctx);
    }
    console.warn('Game not found:', gameId, '- using fallback');
    return new DragonTigerGame(canvas, ctx);
}

// ============================================
// SECTION 10: EXPORT
// ============================================

window.GameMatrix = {
    classes: GAME_CLASSES,
    create: createGameInstance,
    RTP: GAME_RTP,
    CardRenderer,
    ROULETTE_NUMBERS,
    ROULETTE_COLORS,
    SLOT_SYMBOLS,
    SUITS,
    RANKS
};

console.log('🎮 20-Game Matrix Engine Loaded');
console.log('📋 Games:', Object.keys(GAME_CLASSES).length);
console.log('✅ Demo Chips Only - Simulation Mode');
