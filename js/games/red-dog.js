// ============================================
// EMERALD KING CASINO - RED DOG
// Real Casino UI - Card Spread Betting Game
// Full Redesign v3.0.0
// File: js/games/red-dog.js
// ============================================

class RedDogFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.cards = [];
        this.spread = 0;
        this.result = null;
        this.winnings = 0;
        this.gamePhase = 'bet';
        this.isAnimating = false;
        
        // Deck
        this.deck = [];
        
        // Animation
        this.dealAnimations = [];
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
        this.cardWidth = 60;
        this.cardHeight = 86;
        
        // Spread payout table
        this.spreadPayouts = {
            1: 5, 2: 4, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1
        };
        
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
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#cc0000',
            green: '#00e676',
            blue: '#00b0ff',
            white: '#ffffff',
            black: '#1a1a1a'
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
        for (let i = 0; i < 18; i++) {
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
        this.cards = [];
        this.spread = 0;
        this.result = null;
        this.winnings = 0;
        this.gamePhase = 'bet';
        this.isAnimating = false;
        this.deck = [];
        this.dealAnimations = [];
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
        this.bet = bet || this.bet;
        this.isAnimating = true;
        this.resetGame();
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        
        // Deal two cards
        this.cards = [this.deck.pop(), this.deck.pop()];
        
        // Sort by rank
        this.cards.sort(function(a, b) { return this.getRankValue(a.rank) - this.getRankValue(b.rank); }.bind(this));
        
        // Calculate spread
        const val1 = this.getRankValue(this.cards[0].rank);
        const val2 = this.getRankValue(this.cards[1].rank);
        this.spread = val2 - val1 - 1;
        
        // Pair check
        if (this.spread === -1) {
            // Pair - auto draw third card
            this.drawThirdCard(true);
        } else if (val2 - val1 === 1) {
            // Consecutive - push
            this.result = 'push';
            this.winnings = this.bet;
            this.chips += this.winnings;
            this.gamePhase = 'result';
            this.isAnimating = false;
            this.showResult();
        } else {
            this.gamePhase = 'dealt';
        }
        
        this.dealAnimations = [
            { index: 0, progress: 0, startTime: performance.now() },
            { index: 1, progress: 0, startTime: performance.now() + 180 }
        ];
        
        setTimeout(() => {
            this.isAnimating = false;
            this.dealAnimations = [];
        }, 700);
    }
    
    drawThirdCard(autoDraw) {
        if (autoDraw === undefined) autoDraw = false;
        
        this.isAnimating = true;
        this.cards.push(this.deck.pop());
        const val3 = this.getRankValue(this.cards[2].rank);
        const val1 = this.getRankValue(this.cards[0].rank);
        const val2 = this.getRankValue(this.cards[1].rank);
        
        this.dealAnimations = [{ index: 2, progress: 0, startTime: performance.now() }];
        
        if (autoDraw && val3 === val1) {
            // Three of a kind on pair
            this.result = 'triple';
            this.winnings = Math.floor(this.bet * 11);
        } else if (val3 > val1 && val3 < val2) {
            // Card between
            this.result = 'win';
            const payoutMultiplier = this.spreadPayouts[this.spread] || 1;
            this.winnings = Math.floor(this.bet * payoutMultiplier);
        } else if (autoDraw) {
            // Pair draw, no match - push
            this.result = 'push';
            this.winnings = this.bet;
        } else {
            // Card outside
            this.result = 'lose';
            this.winnings = 0;
        }
        
        if (this.winnings > 0) this.chips += this.winnings;
        
        this.gamePhase = 'result';
        
        setTimeout(() => {
            this.isAnimating = false;
            this.dealAnimations = [];
            this.showResult();
        }, 500);
    }
    
    raiseBet() {
        if (this.gamePhase !== 'dealt' || this.isAnimating) return;
        if (this.spread <= 0) return;
        
        this.bet *= 2;
        this.drawThirdCard();
    }
    
    showResult() {
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.result === 'triple') {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 100);
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:16px;">THREE OF A KIND! +RS ' + this.winnings + '</div>';
            }
        } else if (this.result === 'win') {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 50);
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! Spread ' + this.spread + ' +RS ' + this.winnings + '</div>';
            }
        } else if (this.result === 'push') {
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">PUSH - Bet returned</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">LOST -RS ' + this.bet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullTable();
        }, 4000);
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8,
                y: -20 - Math.random() * 100,
                w: 4 + Math.random() * 8, h: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2, opacity: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        this.dealAnimations.forEach(function(anim) {
            const elapsed = timestamp - anim.startTime;
            anim.progress = Math.min(1, elapsed / 350);
        });
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy; p.x += p.vx; p.vy += 0.03; p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        }.bind(this));
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && this.gamePhase !== 'result') this.winGlowAlpha -= 0.01;
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.update();
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
        this.drawCardsArea(ctx, w, h);
        this.drawSpreadInfo(ctx, w, h);
        this.drawPayoutTable(ctx, w, h);
        this.drawActionButtons(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) this.drawWinGlow(ctx, w, h);
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.render();
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410'); bgGrad.addColorStop(0.5, '#0f0b08'); bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        const m = 12, tw = w - m * 2, th = h - m * 2;
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder; ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16); ctx.fill();
        ctx.strokeStyle = this.palette.gold; ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 12); ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad; this.roundRect(ctx, fx, fy, fw, fh, 10); ctx.fill();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)'; ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.3, 28, w * 0.4, 30, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RED DOG', w / 2, 43);
    }
    
    drawCardsArea(ctx, w, h) {
        const areaY = 72, areaH = 130;
        
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeStyle = 'rgba(255,215,0,0.25)'; ctx.lineWidth = 1.5;
        this.roundRect(ctx, 20, areaY, w - 40, areaH, 12); ctx.fill(); ctx.stroke();
        
        // Card 1 (left)
        if (this.cards.length >= 1) {
            const cx1 = w / 2 - this.cardWidth - 15;
            const cy1 = areaY + (areaH - this.cardHeight) / 2;
            let scale1 = 1;
            const anim1 = this.dealAnimations.find(function(a) { return a.index === 0; });
            if (anim1) scale1 = anim1.progress;
            
            ctx.save();
            ctx.translate(cx1 + this.cardWidth / 2, cy1 + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale1), Math.max(0.05, scale1));
            ctx.translate(-(cx1 + this.cardWidth / 2), -(cy1 + this.cardHeight / 2));
            this.drawSingleCard(ctx, cx1, cy1, this.cardWidth, this.cardHeight, this.cards[0], true);
            ctx.restore();
        }
        
        // Card 2 (right)
        if (this.cards.length >= 2) {
            const cx2 = w / 2 + 15;
            const cy2 = areaY + (areaH - this.cardHeight) / 2;
            let scale2 = 1;
            const anim2 = this.dealAnimations.find(function(a) { return a.index === 1; });
            if (anim2) scale2 = anim2.progress;
            
            ctx.save();
            ctx.translate(cx2 + this.cardWidth / 2, cy2 + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale2), Math.max(0.05, scale2));
            ctx.translate(-(cx2 + this.cardWidth / 2), -(cy2 + this.cardHeight / 2));
            this.drawSingleCard(ctx, cx2, cy2, this.cardWidth, this.cardHeight, this.cards[1], true);
            ctx.restore();
        }
        
        // Card 3 (center below)
        if (this.cards.length >= 3) {
            const cx3 = w / 2 - this.cardWidth / 2;
            const cy3 = areaY + areaH + 10;
            let scale3 = 1;
            const anim3 = this.dealAnimations.find(function(a) { return a.index === 2; });
            if (anim3) scale3 = anim3.progress;
            
            ctx.save();
            ctx.translate(cx3 + this.cardWidth / 2, cy3 + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale3), Math.max(0.05, scale3));
            ctx.translate(-(cx3 + this.cardWidth / 2), -(cy3 + this.cardHeight / 2));
            this.drawSingleCard(ctx, cx3, cy3, this.cardWidth, this.cardHeight, this.cards[2], true);
            ctx.restore();
            
            // Result highlight
            if (this.gamePhase === 'result') {
                const isWin = this.result === 'win' || this.result === 'triple';
                const gc = isWin ? '#00e676' : (this.result === 'push' ? '#FFD700' : '#ff4444');
                ctx.strokeStyle = gc; ctx.lineWidth = 3;
                ctx.shadowColor = gc; ctx.shadowBlur = 12;
                this.roundRect(ctx, cx3 - 4, cy3 - 4, this.cardWidth + 8, this.cardHeight + 8, 10);
                ctx.stroke(); ctx.shadowBlur = 0;
            }
        }
    }
    
    drawSingleCard(ctx, x, y, w, h, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
        
        const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        bodyGrad.addColorStop(0, '#ffffff'); bodyGrad.addColorStop(0.5, '#f8f8f5'); bodyGrad.addColorStop(1, '#eeeeea');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.palette.cardBorder; ctx.lineWidth = 0.8;
        this.roundRect(ctx, x, y, w, h, 7); ctx.fill(); ctx.stroke();
        
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        
        if (faceUp && card) {
            const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
            const suitChar = suitSymbols[card.suit] || card.suit;
            const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.palette.red : this.palette.black;
            const fs = Math.floor(w * 0.26);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 4, y + 3);
            
            ctx.font = Math.floor(fs * 0.7) + 'px Georgia';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + w / 2, y + h / 2);
        }
    }
    
    drawSpreadInfo(ctx, w, h) {
        if (this.gamePhase === 'dealt' || this.gamePhase === 'result') {
            const sy = this.cards.length >= 3 ? 295 : 215;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
            this.roundRect(ctx, w / 2 - 55, sy, 110, 30, 14); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
            ctx.fillText('SPREAD', w / 2, sy + 10);
            
            ctx.fillStyle = this.spread > 0 ? '#00e676' : '#ff4444';
            ctx.font = 'bold 13px Georgia';
            ctx.fillText(this.spread > 0 ? this.spread + ' cards' : 'NONE', w / 2, sy + 24);
        }
    }
    
    drawPayoutTable(ctx, w, h) {
        const py = h - 130;
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.roundRect(ctx, 18, py, w - 36, 48, 8); ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('SPREAD PAYOUTS', w / 2, py + 12);
        
        const spreads = [1, 2, 3, 4, 5, 6, 7];
        spreads.forEach(function(s, i) {
            const sx = 30 + i * (w - 70) / 7;
            const highlight = this.spread === s;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
            ctx.fillText(s, sx, py + 26);
            ctx.fillText(this.spreadPayouts[s] + 'x', sx, py + 40);
        }.bind(this));
    }
    
    drawActionButtons(ctx, w, h) {
        const by = h - 68;
        const btnW = 100, btnH = 32;
        
        // Main button
        let label = 'DEAL';
        let color = '#ff4444';
        if (this.gamePhase === 'dealt') { label = 'DRAW'; color = '#00b0ff'; }
        
        ctx.fillStyle = color + '20';
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - btnW / 2, by, btnW, btnH, 16); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, by + btnH / 2);
        
        // Raise button
        if (this.gamePhase === 'dealt' && this.spread > 0) {
            const rx = w / 2 + btnW / 2 + 10;
            ctx.fillStyle = 'rgba(0,230,118,0.2)';
            ctx.strokeStyle = '#00e676'; ctx.lineWidth = 1.5;
            this.roundRect(ctx, rx, by, 70, btnH, 16); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('RAISE 2x', rx + 35, by + btnH / 2);
        }
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const glowGrad = ctx.createRadialGradient(w / 2, h * 0.35, 40, w / 2, h * 0.35, 200);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(w / 2, h * 0.35, 200, 0, Math.PI * 2); ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sp.opacity + ')';
            ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    
    // ============================================
    // UTILS
    // ============================================
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullTable(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = []; this.confettiParticles = [];
        this.dealAnimations = []; this.cards = []; this.deck = [];
    }
}

// Export
window.RedDogFullGame = RedDogFullGame;
console.log('Red Dog v3.0.0 - Real Casino Design Loaded');
