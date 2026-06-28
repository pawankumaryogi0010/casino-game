// ============================================
// EMERALD KING CASINO - TEEN PATTI
// Real Casino UI - Super Spade/Pragmatic Style
// Full Redesign v3.0.0
// File: js/games/teen-patti.js
// ============================================

class TeenPattiFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas display dimensions
        this.w = 500;
        this.h = 600;
        
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
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.potAmount = 0;
        this.winnings = 0;
        
        // Side bets
        this.sideBets = {
            pairPlus: 0,
            threePlus: 0
        };
        
        // Animation
        this.cardSlideProgress = 0;
        this.cardFlipProgress = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.chipStackAnim = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Table sparks
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors
        this.colors = {
            felt: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            goldLight: '#f0d078',
            goldDark: '#b8942e',
            playerZone: '#00e676',
            dealerZone: '#ff4444',
            potGold: '#FFD700',
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textSecondary: 'rgba(240,232,216,0.7)',
            textDim: 'rgba(240,232,216,0.4)',
            white: '#ffffff',
            black: '#1a1a1a',
            red: '#cc0000'
        };
        
        // Card dimensions
        this.cardWidth = 56;
        this.cardHeight = 80;
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        if (this.canvas) {
            const styleWidth = parseFloat(this.canvas.style.width);
            const styleHeight = parseFloat(this.canvas.style.height);
            if (styleWidth && styleHeight) {
                this.w = styleWidth;
                this.h = styleHeight;
            }
        }
        
        this.generateSparkles();
        this.resetGame();
        this.drawFullTable();
    }
    
    resize() {
        if (this.canvas) {
            const styleWidth = parseFloat(this.canvas.style.width);
            const styleHeight = parseFloat(this.canvas.style.height);
            if (styleWidth && styleHeight) {
                this.w = styleWidth;
                this.h = styleHeight;
            }
        }
        this.drawFullTable();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 30; i++) {
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
        this.playerRank = null;
        this.dealerRank = null;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.potAmount = 0;
        this.winnings = 0;
        this.cardSlideProgress = 0;
        this.cardFlipProgress = 0;
        this.winGlowAlpha = 0;
        this.confettiParticles = [];
        this.sideBets = { pairPlus: 0, threePlus: 0 };
    }
    
    // ============================================
    // DECK OPERATIONS
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
    
    getCardValue(rank) {
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    // ============================================
    // HAND EVALUATION
    // ============================================
    
    evaluateHand(cards) {
        const values = cards.map(function(c) { return this.getCardValue(c.rank); }.bind(this)).sort(function(a, b) { return b - a; });
        const suits = cards.map(function(c) { return c.suit; });
        
        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isStraight = (values[0] - values[1] === 1 && values[1] - values[2] === 1) || 
                           (values[0] === 14 && values[1] === 3 && values[2] === 2);
        const isTrio = values[0] === values[1] && values[1] === values[2];
        const isPair = values[0] === values[1] || values[1] === values[2];
        
        if (isTrio) return { name: 'TRIO', icon: 'C', rank: 6, high: values[0], color: '#FFD700', payout: 5 };
        if (isStraight && isFlush) return { name: 'PURE SEQUENCE', icon: 'S', rank: 5, high: values[0], color: '#ff4444', payout: 4 };
        if (isStraight) return { name: 'SEQUENCE', icon: 'R', rank: 4, high: values[0], color: '#00b0ff', payout: 3 };
        if (isFlush) return { name: 'FLUSH', icon: 'F', rank: 3, high: values[0], color: '#ff69b4', payout: 2 };
        if (isPair) return { name: 'PAIR', icon: 'P', rank: 2, high: values[1], color: '#00e676', payout: 1 };
        return { name: 'HIGH CARD', icon: 'H', rank: 1, high: values[0], color: '#888888', payout: 0 };
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSideBet(type) {
        if (this.isPlaying || this.isDealing) return;
        
        if (this.sideBets[type] > 0) {
            this.sideBets[type] = 0;
        } else {
            this.sideBets[type] = this.bet;
        }
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.bet = bet || this.bet;
        this.isPlaying = true;
        this.isDealing = true;
        this.showdown = false;
        this.result = null;
        this.winnings = 0;
        this.potAmount = this.bet * 2;
        this.confettiParticles = [];
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        this.playerCards = [deck.pop(), deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop(), deck.pop()];
        
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
        
        // Animate dealing
        this.dealPhase = 'dealing';
        this.dealProgress = 0;
        this.cardSlideProgress = 0;
        this.cardFlipProgress = 0;
        this.animateDeal();
    }
    
    animateDeal() {
        const self = this;
        const dealInterval = setInterval(function() {
            self.dealProgress += 0.03;
            
            // Phase 1: Deal player cards (first 40% of animation)
            if (self.dealProgress < 0.4) {
                self.dealPhase = 'dealingPlayer';
                self.cardSlideProgress = self.dealProgress / 0.4;
            }
            // Phase 2: Deal dealer cards face-down (40-70%)
            else if (self.dealProgress < 0.7) {
                self.dealPhase = 'dealingDealer';
                self.cardSlideProgress = (self.dealProgress - 0.4) / 0.3;
            }
            // Phase 3: Reveal dealer cards (70-100%)
            else {
                self.dealPhase = 'revealing';
                self.cardFlipProgress = (self.dealProgress - 0.7) / 0.3;
            }
            
            self.drawFullTable();
            
            if (self.dealProgress >= 1) {
                clearInterval(dealInterval);
                self.isDealing = false;
                self.showdown = true;
                self.resolveGame();
            }
        }, 50);
    }
    
    resolveGame() {
        const self = this;
        this.winnings = 0;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        // Main bet
        if (this.result === 'win') {
            this.winnings += Math.floor(this.bet * 1.9);
        }
        
        // Side bet: Pair Plus (pays if player has pair or better)
        if (this.sideBets.pairPlus > 0 && this.playerRank.rank >= 2) {
            this.winnings += Math.floor(this.sideBets.pairPlus * this.playerRank.payout);
        }
        
        // Side bet: 3+ (three of a kind bonus)
        if (this.sideBets.threePlus > 0 && this.playerRank.rank === 6) {
            this.winnings += Math.floor(this.sideBets.threePlus * 10);
        }
        
        this.chips += this.winnings;
        
        if (this.winnings > 0) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            
            if (this.winCascade) {
                this.winCascade.spawn(this.w / 2, this.h * 0.55, 80);
            }
        } else if (this.bet > 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet + this.sideBets.pairPlus + this.sideBets.threePlus);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! ' + this.playerRank.name + ' +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + this.dealerRank.name + ' - Lost RS ' + (this.bet + this.sideBets.pairPlus + this.sideBets.threePlus) + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(function() {
            self.showdown = false;
            self.winGlowAlpha = 0;
            self.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            self.resetGame();
            self.drawFullTable();
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
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        this.chipStackAnim += 0.03;
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        }.bind(this));
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.showdown) {
            this.winGlowAlpha -= 0.01;
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    // ============================================
    // RENDERING - FULL CASINO TABLE
    // ============================================
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawOuterBackground(ctx, w, h);
        this.drawTableBorder(ctx, w, h);
        this.drawTableFelt(ctx, w, h);
        this.drawTableLayout(ctx, w, h);
        this.drawPotDisplay(ctx, w, h);
        this.drawDealerArea(ctx, w, h);
        this.drawPlayerArea(ctx, w, h);
        this.drawHandRankings(ctx, w, h);
        this.drawSideBets(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) {
            this.drawWinGlow(ctx, w, h);
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawOuterBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410');
        bgGrad.addColorStop(0.5, '#0f0b08');
        bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        const margin = 12;
        const tableW = w - margin * 2;
        const tableH = h - margin * 2;
        
        ctx.fillStyle = this.colors.woodDark;
        ctx.strokeStyle = this.colors.woodBorder;
        ctx.lineWidth = 4;
        this.roundRect(ctx, margin - 4, margin - 4, tableW + 8, tableH + 8, 20);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.woodLight;
        this.roundRect(ctx, margin, margin, tableW, tableH, 18);
        ctx.fill();
        
        const woodGrad = ctx.createLinearGradient(margin, margin, margin + tableW, margin + tableH);
        woodGrad.addColorStop(0, '#c48b5c');
        woodGrad.addColorStop(0.3, '#b0784a');
        woodGrad.addColorStop(0.6, '#c48b5c');
        woodGrad.addColorStop(1, '#9a6b45');
        ctx.fillStyle = woodGrad;
        this.roundRect(ctx, margin + 2, margin + 2, tableW - 4, tableH - 4, 17);
        ctx.fill();
        
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, margin + 8, margin + 8, tableW - 16, tableH - 16, 14);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24;
        const fy = 24;
        const fw = w - 48;
        const fh = h - 48;
        
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.colors.feltLight);
        feltGrad.addColorStop(0.4, this.colors.felt);
        feltGrad.addColorStop(1, this.colors.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, fx, fy, fw, fh, 12);
        ctx.fill();
        
        // Semi-circular betting lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.55, w * 0.35, Math.PI, 0);
        ctx.stroke();
    }
    
    drawTableLayout(ctx, w, h) {
        // Center line
        ctx.strokeStyle = 'rgba(212,168,67,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2, h - 80);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawPotDisplay(ctx, w, h) {
        const potX = w / 2;
        const potY = h * 0.28;
        
        // Pot glow
        const potGlow = ctx.createRadialGradient(potX, potY, 5, potX, potY, 45);
        potGlow.addColorStop(0, 'rgba(255,215,0,0.25)');
        potGlow.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = potGlow;
        ctx.beginPath();
        ctx.arc(potX, potY, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Pot circle
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeStyle = this.colors.potGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(potX, potY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Pot label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('POT', potX, potY - 6);
        
        // Pot amount
        ctx.fillStyle = this.colors.potGold;
        ctx.font = 'bold 14px Georgia';
        ctx.fillText('RS ' + this.potAmount, potX, potY + 12);
        
        // Chip stacks around pot
        this.drawChipStack(ctx, potX - 20, potY + 8, '#cc0000');
        this.drawChipStack(ctx, potX - 8, potY + 14, '#0044cc');
        this.drawChipStack(ctx, potX + 8, potY + 14, '#00aa44');
        this.drawChipStack(ctx, potX + 20, potY + 8, '#1a1a1a');
    }
    
    drawChipStack(ctx, x, y, color) {
        const offset = Math.sin(this.chipStackAnim) * 1;
        
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.ellipse(x, y - i * 3 + offset, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    drawDealerArea(ctx, w, h) {
        const areaX = w / 2 - 120;
        const areaY = h * 0.08;
        const areaW = 240;
        const areaH = h * 0.18;
        
        ctx.fillStyle = 'rgba(255,68,68,0.04)';
        ctx.strokeStyle = 'rgba(255,68,68,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, areaX, areaY, areaW, areaH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Dealer label
        ctx.fillStyle = this.colors.dealerZone;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('DEALER', w / 2, areaY + 18);
        
        // Dealer cards
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const totalW = this.dealerCards.length * (cardW + 6) - 6;
        const startX = w / 2 - totalW / 2;
        const cardY = areaY + 26;
        
        for (let i = 0; i < 3; i++) {
            const cx = startX + i * (cardW + 6);
            
            if (this.dealerCards[i]) {
                const faceUp = this.dealPhase === 'revealing' || this.showdown;
                const flipScale = faceUp ? Math.min(1, this.cardFlipProgress * 2) : 0;
                
                ctx.save();
                ctx.translate(cx + cardW / 2, cardY + cardH / 2);
                ctx.scale(Math.abs(Math.cos(flipScale * Math.PI)) || 0.01, 1);
                ctx.translate(-(cx + cardW / 2), -(cardY + cardH / 2));
                
                if (faceUp) {
                    this.drawSingleCard(ctx, cx, cardY, cardW, cardH, this.dealerCards[i], true);
                } else {
                    this.drawCardBack(ctx, cx, cardY, cardW, cardH);
                }
                
                ctx.restore();
            } else {
                this.drawCardPlaceholder(ctx, cx, cardY, cardW, cardH);
            }
        }
    }
    
    drawPlayerArea(ctx, w, h) {
        const areaX = w / 2 - 120;
        const areaY = h * 0.52;
        const areaW = 240;
        const areaH = h * 0.22;
        
        ctx.fillStyle = 'rgba(0,230,118,0.04)';
        ctx.strokeStyle = 'rgba(0,230,118,0.4)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, areaX, areaY, areaW, areaH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Player label
        ctx.fillStyle = this.colors.playerZone;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR HAND', w / 2, areaY + 18);
        
        // Player cards
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const totalW = this.playerCards.length * (cardW + 6) - 6;
        const startX = w / 2 - totalW / 2;
        const cardY = areaY + 28;
        
        for (let i = 0; i < 3; i++) {
            const cx = startX + i * (cardW + 6);
            
            if (this.playerCards[i]) {
                const scale = Math.min(1, this.cardSlideProgress * (i + 1) / 3 * 2);
                
                ctx.save();
                ctx.translate(cx + cardW / 2, cardY + cardH / 2);
                ctx.scale(Math.max(0.01, scale), Math.max(0.01, scale));
                ctx.translate(-(cx + cardW / 2), -(cardY + cardH / 2));
                
                this.drawSingleCard(ctx, cx, cardY, cardW, cardH, this.playerCards[i], true);
                
                ctx.restore();
            } else {
                this.drawCardPlaceholder(ctx, cx, cardY, cardW, cardH);
            }
        }
        
        // Winner highlight
        if (this.showdown && this.result === 'win') {
            ctx.strokeStyle = this.colors.playerZone;
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(0,230,118,0.6)';
            ctx.shadowBlur = 20;
            this.roundRect(ctx, areaX - 4, areaY - 4, areaW + 8, areaH + 8, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    
    drawHandRankings(ctx, w, h) {
        if (!this.showdown) return;
        
        // Player rank
        if (this.playerRank) {
            const px = w / 2;
            const py = h * 0.48;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.roundRect(ctx, px - 90, py - 2, 180, 24, 12);
            ctx.fill();
            
            ctx.fillStyle = this.playerRank.color;
            ctx.font = 'bold 10px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(this.playerRank.icon + ' ' + this.playerRank.name, px, py + 14);
        }
        
        // Dealer rank
        if (this.dealerRank) {
            const dx = w / 2;
            const dy = h * 0.27;
            
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.roundRect(ctx, dx - 90, dy - 2, 180, 24, 12);
            ctx.fill();
            
            ctx.fillStyle = this.dealerRank.color;
            ctx.font = 'bold 10px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(this.dealerRank.icon + ' ' + this.dealerRank.name, dx, dy + 14);
        }
    }
    
    drawSideBets(ctx, w, h) {
        const areaY = h * 0.78;
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('SIDE BETS', w / 2, areaY - 6);
        
        const bets = [
            { label: 'PAIR PLUS', side: 'pairPlus', x: w / 2 - 100 },
            { label: '3+ BONUS', side: 'threePlus', x: w / 2 + 20 }
        ];
        
        bets.forEach(function(bet) {
            const isSelected = this.sideBets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? this.colors.potGold : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 1.5 : 1;
            this.roundRect(ctx, bet.x, areaY + 2, 80, 32, 10);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? this.colors.potGold : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bet.x + 40, areaY + 18);
        }.bind(this));
    }
    
    drawSingleCard(ctx, x, y, width, height, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        
        const bodyGrad = ctx.createLinearGradient(x, y, x + width, y + height);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.5, '#f8f8f5');
        bodyGrad.addColorStop(1, '#eeeeea');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.colors.cardBorder;
        ctx.lineWidth = 0.8;
        this.roundRect(ctx, x, y, width, height, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (faceUp && card) {
            const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
            const suitChar = suitSymbols[card.suit] || card.suit;
            const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.colors.red : this.colors.black;
            const fontSize = Math.floor(width * 0.26);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fontSize + 'px Georgia';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 4, y + 3);
            
            ctx.font = Math.floor(fontSize * 0.7) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + width / 2, y + height / 2);
        }
    }
    
    drawCardBack(ctx, x, y, w, h) {
        ctx.fillStyle = '#1a2744';
        ctx.strokeStyle = '#2a4a7a';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#2a4a7a';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                ctx.beginPath();
                ctx.arc(x + w * 0.3 + c * w * 0.4, y + h * 0.3 + r * h * 0.4, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawCardPlaceholder(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        this.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
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
        const glowColor = this.result === 'win' ? this.colors.playerZone : this.colors.dealerZone;
        const glowY = this.result === 'win' ? h * 0.62 : h * 0.18;
        
        const glowGrad = ctx.createRadialGradient(w / 2, glowY, 40, w / 2, glowY, 200);
        glowGrad.addColorStop(0, glowColor + '20');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(w / 2, glowY, 200, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sparkle = this.sparkles[i];
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.004;
            sparkle.opacity = Math.max(0.03, Math.min(0.3, sparkle.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sparkle.opacity + ')';
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ============================================
    // UTILITIES
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
        this.confettiParticles = [];
        this.playerCards = [];
        this.dealerCards = [];
    }
}

// Export
window.TeenPattiFullGame = TeenPattiFullGame;
console.log('Teen Patti v3.0.0 - Real Casino Design Loaded');
