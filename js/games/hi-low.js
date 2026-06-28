// ============================================
// EMERALD KING CASINO - HI-LOW
// Real Casino UI - Card Prediction Game
// Full Redesign v3.0.0
// File: js/games/hi-low.js
// ============================================

class HiLowFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.currentCard = null;
        this.nextCard = null;
        this.guess = null;
        this.result = null;
        this.streak = 0;
        this.multiplier = 1.0;
        this.gamePhase = 'bet';
        this.isAnimating = false;
        this.winnings = 0;
        this.totalWinnings = 0;
        
        // Deck
        this.deck = [];
        this.cardsRemaining = 52;
        
        // Animation
        this.cardFlipProgress = 0;
        this.cardSlideProgress = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Card dimensions
        this.cardWidth = 65;
        this.cardHeight = 92;
        
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
            hiColor: '#00e676',
            lowColor: '#ff4444',
            sameColor: '#FFD700',
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            white: '#ffffff',
            black: '#1a1a1a',
            red: '#cc0000'
        };
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
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.0 + 0.2,
                speed: Math.random() * 0.012 + 0.003,
                opacity: Math.random() * 0.25 + 0.05,
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
        this.winnings = 0;
        this.cardFlipProgress = 0;
        this.cardSlideProgress = 0;
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cardsRemaining = 52;
        this.streak = 0;
        this.multiplier = 1.0;
        this.totalWinnings = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // DECK
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['S', 'H', 'D', 'C'];
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
        
        this.bet = bet || this.bet;
        
        if (this.gamePhase === 'bet' || this.gamePhase === 'result') {
            this.dealNewCard();
        }
    }
    
    dealNewCard() {
        if (!this.guess) {
            const resultDisplay = document.getElementById('game-info-overlay');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;">Select HI, LOW, or SAME first!</div>';
            }
            return;
        }
        
        this.isAnimating = true;
        this.confettiParticles = [];
        
        if (this.deck.length < 2) {
            this.deck = this.createDeck();
            this.shuffleDeck(this.deck);
            this.cardsRemaining = 52;
        }
        
        if (!this.currentCard) {
            this.currentCard = this.deck.pop();
            this.cardsRemaining--;
            this.gamePhase = 'bet';
            this.isAnimating = false;
            
            const resultDisplay = document.getElementById('game-info-overlay');
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;">Now predict HI or LOW!</div>';
            }
        } else {
            this.nextCard = this.deck.pop();
            this.cardsRemaining--;
            this.cardFlipProgress = 0;
            this.cardSlideProgress = 0;
            
            const currentVal = this.getRankValue(this.currentCard.rank);
            const nextVal = this.getRankValue(this.nextCard.rank);
            
            if (nextVal > currentVal) {
                this.result = this.guess === 'hi' ? 'win' : 'lose';
            } else if (nextVal < currentVal) {
                this.result = this.guess === 'low' ? 'win' : 'lose';
            } else {
                this.result = this.guess === 'same' ? 'win' : 'lose';
            }
            
            let payoutMult = 0;
            if (this.result === 'win') {
                if (this.guess === 'same') {
                    payoutMult = 12;
                } else {
                    const diff = Math.abs(nextVal - currentVal);
                    if (diff >= 7) payoutMult = 1.2;
                    else if (diff >= 4) payoutMult = 1.5;
                    else payoutMult = 2.0;
                }
                this.streak++;
                this.multiplier = Math.round(this.multiplier * payoutMult * 100) / 100;
                this.winnings = Math.floor(this.bet * payoutMult);
                this.totalWinnings += this.winnings;
            } else {
                this.winnings = 0;
                this.streak = 0;
                this.multiplier = 1.0;
                this.totalWinnings = 0;
            }
            
            this.animateReveal();
        }
        
        this.drawFullTable();
    }
    
    animateReveal() {
        const self = this;
        const revealInterval = setInterval(function() {
            self.cardFlipProgress += 0.05;
            self.cardSlideProgress += 0.03;
            
            if (self.cardFlipProgress >= 1) {
                clearInterval(revealInterval);
                self.isAnimating = false;
                self.gamePhase = 'result';
                
                if (self.result === 'win') {
                    self.chips += self.winnings;
                    if (self.winCascade) {
                        const count = self.guess === 'same' ? 100 : 50;
                        self.winCascade.spawn(self.w / 2, self.h * 0.55, count);
                    }
                    self.generateConfetti();
                    self.winGlowAlpha = 1.0;
                    if (window.GameLoaderSystem) {
                        GameLoaderSystem.showWinOverlay(self.winnings);
                        GameLoaderSystem.updateBalance(self.chips);
                    }
                } else if (self.result === 'lose') {
                    self.chips -= self.bet;
                    if (window.GameLoaderSystem) {
                        GameLoaderSystem.showLoseOverlay(self.bet);
                        GameLoaderSystem.updateBalance(self.chips);
                    }
                }
                
                const resultDisplay = document.getElementById('game-info-overlay');
                if (resultDisplay) {
                    if (self.result === 'win') {
                        resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! +RS ' + self.winnings + (self.streak > 1 ? ' Streak: ' + self.streak : '') + '</div>';
                    } else {
                        resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">LOST -RS ' + self.bet + '</div>';
                    }
                }
                
                self.drawFullTable();
                
                setTimeout(function() {
                    self.currentCard = self.nextCard;
                    self.nextCard = null;
                    self.result = null;
                    self.gamePhase = 'bet';
                    self.cardFlipProgress = 0;
                    self.cardSlideProgress = 0;
                    self.guess = null;
                    if (resultDisplay) resultDisplay.innerHTML = '';
                    self.drawFullTable();
                }, 2500);
            }
            
            self.drawFullTable();
        }, 30);
    }
    
    cashOut() {
        if (this.streak <= 0 || this.gamePhase !== 'bet') return;
        
        this.gamePhase = 'result';
        this.chips += this.totalWinnings;
        
        if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        this.generateConfetti();
        this.winGlowAlpha = 1.0;
        
        if (window.GameLoaderSystem) {
            GameLoaderSystem.showWinOverlay(this.totalWinnings);
            GameLoaderSystem.updateBalance(this.chips);
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">CASHED OUT! +RS ' + this.totalWinnings + '</div>';
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.currentCard = null;
            this.nextCard = null;
            this.result = null;
            this.gamePhase = 'bet';
            this.streak = 0;
            this.multiplier = 1.0;
            this.totalWinnings = 0;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.drawFullTable();
        }, 3000);
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
        
        if (this.winGlowAlpha > 0 && this.gamePhase !== 'result') {
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
        this.drawTitle(ctx, w, h);
        this.drawCurrentCard(ctx, w, h);
        this.drawNextCard(ctx, w, h);
        this.drawGuessButtons(ctx, w, h);
        this.drawStreakDisplay(ctx, w, h);
        this.drawCashOutButton(ctx, w, h);
        this.drawCardsRemaining(ctx, w, h);
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
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16);
        ctx.fill();
        
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 12);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, fx, fy, fw, fh, 10);
        ctx.fill();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.3, 28, w * 0.4, 30, 14);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HI-LOW', w / 2, 43);
    }
    
    drawCurrentCard(ctx, w, h) {
        const cx = w / 2 - this.cardWidth / 2;
        const cy = 72;
        
        // Glow when no next card
        if (!this.nextCard && this.currentCard) {
            const glowGrad = ctx.createRadialGradient(w / 2, cy + this.cardHeight / 2, 15, w / 2, cy + this.cardHeight / 2, 55);
            glowGrad.addColorStop(0, 'rgba(212,168,67,0.15)');
            glowGrad.addColorStop(1, 'rgba(212,168,67,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(w / 2, cy + this.cardHeight / 2, 55, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.nextCard ? 'PREVIOUS' : 'CURRENT CARD', w / 2, cy - 6);
        
        if (this.currentCard) {
            this.drawSingleCard(ctx, cx, cy, this.cardWidth, this.cardHeight, this.currentCard, true);
            
            const val = this.getRankValue(this.currentCard.rank);
            ctx.fillStyle = this.palette.gold;
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('Value: ' + val, w / 2, cy + this.cardHeight + 14);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            this.roundRect(ctx, cx, cy, this.cardWidth, this.cardHeight, 8);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '22px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', cx + this.cardWidth / 2, cy + this.cardHeight / 2);
        }
    }
    
    drawNextCard(ctx, w, h) {
        if (!this.nextCard) return;
        
        const cx = w / 2 - this.cardWidth / 2;
        const cy = 195;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT CARD', w / 2, cy - 6);
        
        // Card flip animation
        const progress = this.cardFlipProgress;
        const scaleX = Math.abs(Math.cos(progress * Math.PI));
        
        ctx.save();
        ctx.translate(cx + this.cardWidth / 2, cy + this.cardHeight / 2);
        ctx.scale(Math.max(0.05, scaleX), 1);
        ctx.translate(-(cx + this.cardWidth / 2), -(cy + this.cardHeight / 2));
        
        if (scaleX > 0.1) {
            this.drawSingleCard(ctx, cx, cy, this.cardWidth, this.cardHeight, this.nextCard, true);
        } else {
            ctx.fillStyle = '#1a2744';
            ctx.strokeStyle = '#2a4a7a';
            ctx.lineWidth = 1.5;
            this.roundRect(ctx, cx, cy, this.cardWidth, this.cardHeight, 8);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Result glow
        if (this.gamePhase === 'result') {
            const val = this.getRankValue(this.nextCard.rank);
            const resultColor = this.result === 'win' ? '#00e676' : '#ff4444';
            
            ctx.strokeStyle = resultColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = resultColor;
            ctx.shadowBlur = 12;
            this.roundRect(ctx, cx - 5, cy - 5, this.cardWidth + 10, this.cardHeight + 10, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = resultColor;
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('Value: ' + val, w / 2, cy + this.cardHeight + 14);
        }
    }
    
    drawSingleCard(ctx, x, y, w, h, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
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
        this.roundRect(ctx, x, y, w, h, 7);
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
            const fs = Math.floor(w * 0.28);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 4, y + 3);
            
            ctx.font = Math.floor(fs * 0.7) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + w / 2, y + h / 2);
        }
    }
    
    drawGuessButtons(ctx, w, h) {
        const by = this.nextCard ? h * 0.62 : h * 0.72;
        const btnW = (w - 60) / 3;
        const btnH = 48;
        const gap = 8;
        
        const guesses = [
            { label: 'HI', icon: '\u25B2', type: 'hi', color: this.palette.hiColor, desc: 'Higher' },
            { label: 'SAME', icon: '\u25C9', type: 'same', color: this.palette.sameColor, desc: '12:1' },
            { label: 'LOW', icon: '\u25BC', type: 'low', color: this.palette.lowColor, desc: 'Lower' }
        ];
        
        for (let i = 0; i < guesses.length; i++) {
            const g = guesses[i];
            const gx = 22 + i * (btnW + gap);
            const isSelected = this.guess === g.type;
            
            ctx.fillStyle = isSelected ? g.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? g.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, gx, by, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? g.color : 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 14px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.icon + ' ' + g.label, gx + btnW / 2, by + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = 'bold 8px Georgia';
            ctx.fillText(g.desc, gx + btnW / 2, by + btnH / 2 + 16);
        }
    }
    
    drawStreakDisplay(ctx, w, h) {
        if (this.streak <= 0 && !this.nextCard) return;
        
        const sy = this.nextCard ? 330 : 280;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, w / 2 - 55, sy, 110, 34, 16);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('STREAK', w / 2, sy + 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Georgia';
        ctx.fillText(this.streak + ' (' + this.multiplier.toFixed(1) + 'x)', w / 2, sy + 26);
    }
    
    drawCashOutButton(ctx, w, h) {
        if (this.streak <= 0 || this.gamePhase !== 'bet') return;
        
        const cy = this.nextCard ? h * 0.72 : h * 0.82;
        const cashOutAmt = this.totalWinnings;
        
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 60, cy, 120, 34, 16);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CASH OUT RS ' + cashOutAmt, w / 2, cy + 17);
    }
    
    drawCardsRemaining(ctx, w, h) {
        const rx = w - 50;
        const ry = 30;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.roundRect(ctx, rx, ry, 38, 28, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('CARDS', rx + 19, ry + 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Georgia';
        ctx.fillText(this.cardsRemaining, rx + 19, ry + 22);
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
        const glowGrad = ctx.createRadialGradient(w / 2, h * 0.38, 40, w / 2, h * 0.38, 200);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.38, 200, 0, Math.PI * 2);
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
    
    // ============================================
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isAnimating) return;
        
        const by = this.nextCard ? this.h * 0.62 : this.h * 0.72;
        const btnW = (this.w - 60) / 3;
        const gap = 8;
        const btnH = 48;
        const types = ['hi', 'same', 'low'];
        
        // Check guess buttons
        for (let i = 0; i < 3; i++) {
            const gx = 22 + i * (btnW + gap);
            if (clickX >= gx && clickX <= gx + btnW && clickY >= by && clickY <= by + btnH) {
                this.setGuess(types[i]);
                return;
            }
        }
        
        // Check cash out button
        if (this.streak > 0 && this.gamePhase === 'bet') {
            const cy = this.nextCard ? this.h * 0.72 : this.h * 0.82;
            if (clickX >= this.w / 2 - 60 && clickX <= this.w / 2 + 60 && clickY >= cy && clickY <= cy + 34) {
                this.cashOut();
                return;
            }
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
        this.deck = [];
    }
}

// Export
window.HiLowFullGame = HiLowFullGame;
console.log('Hi-Low v3.0.0 - Real Casino Design Loaded');
