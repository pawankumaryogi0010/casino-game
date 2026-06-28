// ============================================
// EMERALD KING CASINO - BLACKJACK
// Real Casino UI - Evolution/Pragmatic Style
// Full Redesign v3.0.0
// File: js/games/blackjack.js
// ============================================

class BlackjackFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.playerCards = [];
        this.dealerCards = [];
        this.playerScore = 0;
        this.dealerScore = 0;
        this.playerScore2 = 0;
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
        this.activeHand = 0;
        this.result = null;
        this.result2 = null;
        this.winnings = 0;
        
        // Animation
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.cardSlideAnim = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Table sparks
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors
        this.palette = {
            felt: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            goldLight: '#f0d078',
            playerZone: '#00e676',
            dealerZone: '#ff4444',
            splitZone: '#4488ff',
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            white: '#ffffff',
            black: '#1a1a1a',
            red: '#cc0000',
            chipRed: '#cc0000',
            chipBlue: '#0044cc',
            chipGreen: '#00aa44',
            chipBlack: '#1a1a1a',
            chipGold: '#d4a843'
        };
        
        this.cardWidth = 52;
        this.cardHeight = 74;
    }
    
    // ============================================
    // INIT
    // ============================================
    
    init() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.generateSparkles();
        this.resetGame();
        this.drawFullTable();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.drawFullTable();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 25; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.2 + 0.3,
                speed: Math.random() * 0.015 + 0.003,
                opacity: Math.random() * 0.3 + 0.05,
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
        this.winnings = 0;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.cardSlideAnim = 0;
        this.winGlowAlpha = 0;
        this.confettiParticles = [];
    }
    
    // ============================================
    // DECK
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let d = 0; d < 6; d++) {
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
        if (['K', 'Q', 'J'].indexOf(rank) >= 0) return 10;
        return parseInt(rank);
    }
    
    calculateScore(cards) {
        let score = 0;
        let aces = 0;
        for (const card of cards) {
            if (card.rank === 'A') { aces++; score += 11; }
            else if (['K', 'Q', 'J'].indexOf(card.rank) >= 0) score += 10;
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
        if (this.isPlaying) return;
        
        this.bet = bet || this.bet;
        this.resetGame();
        this.isPlaying = true;
        this.gameOver = false;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        this.playerCards = [deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop()];
        
        this.playerScore = this.calculateScore(this.playerCards);
        this.dealerScore = this.calculateScore([this.dealerCards[0]]);
        
        this.playerBlackjack = this.isBlackjack(this.playerCards);
        this.dealerBlackjack = this.isBlackjack(this.dealerCards);
        
        this.canSplit = this.playerCards[0].rank === this.playerCards[1].rank;
        this.canDouble = true;
        
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
        this.activeHand = 1;
        
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
        this.winnings = 0;
        
        if (this.playerBust) {
            this.result = 'lose';
        } else if (this.dealerBust) {
            this.result = 'win';
        } else if (this.playerBlackjack && !this.dealerBlackjack) {
            this.result = 'blackjack';
            this.winnings = Math.floor(this.bet * 2.5);
        } else if (ps > ds) {
            this.result = 'win';
        } else if (ps === ds) {
            this.result = 'push';
        } else {
            this.result = 'lose';
        }
        
        if (this.result === 'win') this.winnings = Math.floor(this.bet * 2);
        if (this.result === 'push') this.winnings = this.bet;
        
        this.chips += this.winnings;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.winnings > this.bet || this.result === 'blackjack') {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h * 0.6, 80);
        } else if (this.result === 'lose') {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            if (this.result === 'blackjack') {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">BLACKJACK! +RS ' + this.winnings + '</div>';
            } else if (this.result === 'win') {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! +RS ' + this.winnings + '</div>';
            } else if (this.result === 'push') {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">PUSH - Bet returned</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">DEALER WINS - Lost RS ' + this.bet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullTable();
        }, 5000);
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8,
                y: -20 - Math.random() * 100,
                w: 4 + Math.random() * 8,
                h: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: 1 + Math.random() * 3,
                vx: (Math.random() - 0.5) * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.gameOver) {
            this.winGlowAlpha -= 0.01;
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTableBorder(ctx, w, h);
        this.drawTableFelt(ctx, w, h);
        this.drawDealerArea(ctx, w, h);
        this.drawPlayerArea(ctx, w, h);
        this.drawScores(ctx, w, h);
        this.drawActionButtons(ctx, w, h);
        this.drawChipStacks(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) {
            this.drawWinGlow(ctx, w, h);
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410');
        bgGrad.addColorStop(0.5, '#0f0b08');
        bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        const m = 12;
        const tw = w - m * 2;
        const th = h - m * 2;
        
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder;
        ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 20);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 18);
        ctx.fill();
        
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 14);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, fx, fy, fw, fh, 12);
        ctx.fill();
        
        // Betting circle
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.72, 50, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawDealerArea(ctx, w, h) {
        const ax = w / 2 - 110;
        const ay = h * 0.06;
        const aw = 220;
        const ah = h * 0.22;
        
        ctx.fillStyle = 'rgba(255,68,68,0.04)';
        ctx.strokeStyle = 'rgba(255,68,68,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, ax, ay, aw, ah, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.dealerZone;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('DEALER', w / 2, ay + 18);
        
        // Dealer cards
        const cw = this.cardWidth, ch = this.cardHeight;
        const totalW = this.dealerCards.length * (cw + 6) - 6;
        const sx = w / 2 - totalW / 2;
        const cy = ay + 28;
        
        for (let i = 0; i < this.dealerCards.length; i++) {
            const cx = sx + i * (cw + 6);
            const showCard = this.gameOver || i > 0;
            this.drawSingleCard(ctx, cx, cy, cw, ch, this.dealerCards[i], showCard);
        }
    }
    
    drawPlayerArea(ctx, w, h) {
        const ax = w / 2 - 110;
        const ay = h * 0.52;
        const aw = 220;
        const ah = h * 0.22;
        
        ctx.fillStyle = 'rgba(0,230,118,0.04)';
        ctx.strokeStyle = this.activeHand === 0 ? 'rgba(0,230,118,0.5)' : 'rgba(0,230,118,0.2)';
        ctx.lineWidth = this.activeHand === 0 ? 2 : 1;
        this.roundRect(ctx, ax, ay, aw, ah, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.playerZone;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR HAND', w / 2, ay + 18);
        
        const cw = this.cardWidth, ch = this.cardHeight;
        const totalW = this.playerCards.length * (cw + 6) - 6;
        const sx = w / 2 - totalW / 2;
        const cy = ay + 28;
        
        for (let i = 0; i < this.playerCards.length; i++) {
            const cx = sx + i * (cw + 6);
            this.drawSingleCard(ctx, cx, cy, cw, ch, this.playerCards[i], true);
        }
        
        // Split hand
        if (this.hasSplit) {
            const sax = ax - 100;
            const say = ay + ah + 8;
            const saw = 120;
            const sah = 60;
            
            ctx.fillStyle = 'rgba(68,136,255,0.04)';
            ctx.strokeStyle = this.activeHand === 1 ? 'rgba(68,136,255,0.5)' : 'rgba(68,136,255,0.2)';
            ctx.lineWidth = this.activeHand === 1 ? 2 : 1;
            this.roundRect(ctx, sax, say, saw, sah, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.palette.splitZone;
            ctx.font = 'bold 8px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('SPLIT', sax + saw / 2, say + 12);
            
            for (let i = 0; i < this.splitCards.length; i++) {
                const scx = sax + 6 + i * (38 + 3);
                const scy = say + 18;
                this.drawSingleCard(ctx, scx, scy, 38, 54, this.splitCards[i], true);
            }
        }
    }
    
    drawScores(ctx, w, h) {
        // Dealer score
        const dsY = h * 0.29;
        ctx.fillStyle = this.dealerBust ? '#ff4444' : '#ffffff';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.gameOver ? this.dealerScore : '?', w / 2, dsY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('DEALER', w / 2, dsY - 16);
        
        // Player score
        const psY = h * 0.49;
        ctx.fillStyle = this.playerBust ? '#ff4444' : '#00e676';
        ctx.font = 'bold 16px Georgia';
        ctx.fillText(this.playerScore, w / 2, psY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('YOU', w / 2, psY - 16);
        
        // Split score
        if (this.hasSplit) {
            ctx.fillStyle = '#4488ff';
            ctx.font = 'bold 12px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(this.playerScore2, w * 0.2, h * 0.88);
        }
    }
    
    drawActionButtons(ctx, w, h) {
        if (!this.isPlaying || this.gameOver) return;
        
        const btnY = h * 0.82;
        const btnW = 52;
        const btnH = 36;
        const gap = 6;
        const btns = [
            { label: 'HIT', key: 'H', color: '#00e676', active: true, action: 'hit' },
            { label: 'STAND', key: 'S', color: '#ff4444', active: true, action: 'stand' },
            { label: 'DOUBLE', key: 'D', color: '#FFD700', active: this.canDouble, action: 'double' },
            { label: 'SPLIT', key: 'P', color: '#4488ff', active: this.canSplit && !this.hasSplit, action: 'split' }
        ];
        
        const totalW = btns.length * btnW + (btns.length - 1) * gap;
        const startX = (w - totalW) / 2;
        
        btns.forEach(function(btn, i) {
            const bx = startX + i * (btnW + gap);
            
            ctx.fillStyle = btn.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = btn.active ? btn.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = btn.active ? 1.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 10);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = btn.active ? btn.color : 'rgba(255,255,255,0.3)';
            ctx.font = 'bold 10px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, bx + btnW / 2, btnY + btnH / 2 - 4);
            ctx.font = 'bold 7px Georgia';
            ctx.fillText('[' + btn.key + ']', bx + btnW / 2, btnY + btnH / 2 + 10);
        }.bind(this));
    }
    
    drawChipStacks(ctx, w, h) {
        const cx = w / 2;
        const cy = h * 0.72;
        
        if (this.bet > 0 && !this.isPlaying) {
            // Single bet chip
            const colors = [this.palette.chipRed, this.palette.chipBlue, this.palette.chipGreen, this.palette.chipBlack];
            const color = colors[Math.floor(this.bet / 50) % colors.length];
            
            for (let i = 0; i < Math.min(Math.floor(this.bet / 50), 5); i++) {
                ctx.fillStyle = color;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.ellipse(cx, cy - i * 3, 14, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('RS ' + this.bet, cx, cy + 12);
        }
    }
    
    drawSingleCard(ctx, x, y, w, h, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        
        if (faceUp) {
            const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.5, '#f8f8f5');
            bodyGrad.addColorStop(1, '#eeeeea');
            ctx.fillStyle = bodyGrad;
        } else {
            ctx.fillStyle = '#1a2744';
        }
        
        ctx.strokeStyle = this.palette.cardBorder;
        ctx.lineWidth = 0.8;
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (faceUp && card) {
            const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
            const suitChar = suitSymbols[card.suit] || card.suit;
            const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.palette.red : this.palette.black;
            const fs = Math.floor(w * 0.26);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 3, y + 2);
            
            ctx.font = Math.floor(fs * 0.7) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + w / 2, y + h / 2);
        } else if (!faceUp) {
            ctx.fillStyle = '#2a4a7a';
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 2; c++) {
                    ctx.beginPath();
                    ctx.arc(x + w * 0.3 + c * w * 0.4, y + h * 0.3 + r * h * 0.4, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const gc = this.palette.playerZone;
        const glowGrad = ctx.createRadialGradient(w / 2, h * 0.6, 40, w / 2, h * 0.6, 180);
        glowGrad.addColorStop(0, gc + '20');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.6, 180, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sp.opacity + ')';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ============================================
    // UTILS
    // ============================================
    
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
    // LOOP
    // ============================================
    
    render() { this.drawFullTable(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.playerCards = [];
        this.dealerCards = [];
        this.splitCards = [];
    }
}

// Export
window.BlackjackFullGame = BlackjackFullGame;
console.log('Blackjack v3.0.0 - Real Casino Design Loaded');
