// ============================================
// EMERALD KING CASINO - ANDAR BAHAR
// Real Casino UI - Evolution Gaming Style
// Full Redesign v3.0.0
// File: js/games/andar-bahar.js
// ============================================

class AndarBaharFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas display dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betSide = 'andar';
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.winner = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.currentDealSide = 'andar';
        this.dealIndex = 0;
        
        // Multiple bets
        this.bets = {
            andar: 0,
            bahar: 0
        };
        this.totalBet = 0;
        this.winnings = 0;
        
        // Deck
        this.deck = [];
        this.cardsRemaining = 0;
        
        // Animation
        this.cardSlideProgress = 0;
        this.cardScaleProgress = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.spotlightAlpha = 0;
        this.spotlightTarget = 'andar';
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Table felt sparks
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors - Real casino palette
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
            andar: '#00e676',
            andarGlow: '#33ff88',
            bahar: '#4488ff',
            baharGlow: '#66aaff',
            joker: '#ff4444',
            jokerGlow: '#ff6666',
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
        this.cardWidth = 48;
        this.cardHeight = 68;
        this.jokerCardWidth = 60;
        this.jokerCardHeight = 86;
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
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.winner = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.currentDealSide = 'andar';
        this.dealIndex = 0;
        this.winnings = 0;
        this.cardSlideProgress = 0;
        this.cardScaleProgress = 0;
        this.winGlowAlpha = 0;
        this.spotlightAlpha = 0;
        this.confettiParticles = [];
        this.bets = { andar: 0, bahar: 0 };
        this.totalBet = 0;
    }
    
    // ============================================
    // DECK OPERATIONS
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
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSide(side) {
        if (this.isPlaying || this.isDealing) return;
        
        if (this.bets[side] > 0) {
            this.totalBet -= this.bets[side];
            this.bets[side] = 0;
        } else {
            this.bets[side] = this.bet;
            this.totalBet += this.bet;
        }
        
        this.betSide = side;
        this.drawFullTable();
    }
    
    clearAllBets() {
        if (this.isPlaying || this.isDealing) return;
        this.bets = { andar: 0, bahar: 0 };
        this.totalBet = 0;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        if (this.totalBet === 0) {
            this.bets.andar = bet || this.bet;
            this.totalBet = this.bets.andar;
            this.betSide = 'andar';
        }
        
        this.bet = bet || this.bet;
        this.isPlaying = true;
        this.isDealing = true;
        this.showdown = false;
        this.winner = null;
        this.winnings = 0;
        this.confettiParticles = [];
        this.spotlightAlpha = 0;
        
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cardsRemaining = this.deck.length;
        
        // Draw Joker
        this.jokerCard = this.deck.pop();
        this.cardsRemaining = this.deck.length;
        this.andarCards = [];
        this.baharCards = [];
        
        // Deal cards until match found
        this.currentDealSide = 'andar';
        this.dealIndex = 0;
        this.dealPhase = 'dealing';
        this.cardSlideProgress = 0;
        
        this.continueDealing();
    }
    
    continueDealing() {
        if (this.deck.length === 0) {
            this.deck = this.createDeck();
            this.shuffleDeck(this.deck);
            this.cardsRemaining = this.deck.length;
        }
        
        const card = this.deck.pop();
        this.cardsRemaining = this.deck.length;
        
        if (this.currentDealSide === 'andar') {
            this.andarCards.push(card);
            this.currentDealSide = 'bahar';
        } else {
            this.baharCards.push(card);
            this.currentDealSide = 'andar';
        }
        
        this.dealIndex++;
        this.cardSlideProgress = 0;
        this.animateCardDeal();
        
        // Check match
        if (card.rank === this.jokerCard.rank) {
            this.winner = this.currentDealSide === 'andar' ? 'bahar' : 'andar';
            
            setTimeout(() => {
                this.isDealing = false;
                this.showdown = true;
                this.spotlightAlpha = 1;
                this.spotlightTarget = this.winner;
                this.resolveGame();
            }, 700);
            return;
        }
        
        // Continue dealing after delay
        setTimeout(() => {
            if (this.isDealing) {
                this.continueDealing();
            }
        }, 500);
    }
    
    animateCardDeal() {
        const dealInterval = setInterval(() => {
            this.cardSlideProgress += 0.06;
            
            this.drawFullTable();
            
            if (this.cardSlideProgress >= 1) {
                clearInterval(dealInterval);
            }
        }, 20);
    }
    
    resolveGame() {
        this.winnings = 0;
        const playerWon = this.winner === this.betSide;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (playerWon) {
            if (this.bets[this.winner] > 0) {
                this.winnings += Math.floor(this.bets[this.winner] * 1.9);
            }
        } else if (this.bets[this.winner] > 0) {
            this.winnings += 0;
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
                const cascadeX = this.winner === 'andar' ? this.w * 0.3 : this.w * 0.7;
                this.winCascade.spawn(cascadeX, this.h * 0.5, 70);
            }
        } else if (this.totalBet > 0 && this.winnings === 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            const winnerName = this.winner === 'andar' ? 'ANDAR' : 'BAHAR';
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! ' + winnerName + ' +' + this.winnings + '</div>';
            } else if (this.totalBet > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + winnerName + ' - Lost ' + this.totalBet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.showdown = false;
            this.winGlowAlpha = 0;
            this.spotlightAlpha = 0;
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
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        this.confettiParticles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(p => p.opacity > 0);
        
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
        this.drawJokerArea(ctx, w, h);
        this.drawAndarZone(ctx, w, h);
        this.drawBaharZone(ctx, w, h);
        this.drawBettingAreas(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.spotlightAlpha > 0) {
            this.drawSpotlight(ctx, w, h);
        }
        
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
        
        ctx.strokeStyle = 'rgba(212,168,67,0.4)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, margin + 12, margin + 12, tableW - 24, tableH - 24, 12);
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
        
        ctx.fillStyle = 'rgba(255,255,255,0.008)';
        for (let x = fx + 4; x < fx + fw - 4; x += 3) {
            for (let y = fy + 4; y < fy + fh - 4; y += 3) {
                if ((x + y) % 6 === 0) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }
    
    drawTableLayout(ctx, w, h) {
        const centerX = w / 2;
        const fy = 24;
        const fh = h - 48;
        
        // Center line
        ctx.strokeStyle = 'rgba(212,168,67,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(centerX, fy + 60);
        ctx.lineTo(centerX, fy + fh - 80);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Joker area line
        const jokerLineY = h * 0.18;
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 50, jokerLineY);
        ctx.lineTo(centerX + 50, jokerLineY);
        ctx.stroke();
        
        // Card area divider
        const cardDividerY = h * 0.55;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fy + 20, cardDividerY);
        ctx.lineTo(w - fy - 20, cardDividerY);
        ctx.stroke();
    }
    
    drawJokerArea(ctx, w, h) {
        const jx = w / 2;
        const jy = h * 0.1;
        
        // Joker zone
        ctx.fillStyle = 'rgba(255,68,68,0.06)';
        ctx.strokeStyle = 'rgba(255,68,68,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        this.roundRect(ctx, jx - 50, jy - 5, 100, 50, 12);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Joker label
        ctx.fillStyle = this.colors.joker;
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('JOKER CARD', jx, jy + 8);
        
        // Joker card
        if (this.jokerCard) {
            const cardW = this.jokerCardWidth;
            const cardH = this.jokerCardHeight;
            const cx = jx - cardW / 2;
            const cy = jy + 18;
            
            this.drawSingleCard(ctx, cx, cy, cardW, cardH, this.jokerCard, true);
            
            // Highlight ring
            ctx.strokeStyle = this.colors.jokerGlow;
            ctx.lineWidth = 2;
            ctx.shadowColor = this.colors.jokerGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, cx - 4, cy - 4, cardW + 8, cardH + 8, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            this.roundRect(ctx, jx - 30, jy + 20, 60, 80, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '24px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('?', jx, jy + 55);
        }
    }
    
    drawAndarZone(ctx, w, h) {
        const zoneX = 32;
        const zoneY = h * 0.24;
        const zoneW = w / 2 - 50;
        const zoneH = h * 0.32;
        
        ctx.fillStyle = 'rgba(0,230,118,0.04)';
        ctx.strokeStyle = this.bets.andar > 0 ? 'rgba(0,230,118,0.7)' : 'rgba(0,230,118,0.2)';
        ctx.lineWidth = this.bets.andar > 0 ? 2.5 : 1;
        this.roundRect(ctx, zoneX, zoneY, zoneW, zoneH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Winner highlight
        if (this.showdown && this.winner === 'andar') {
            ctx.strokeStyle = this.colors.andar;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.colors.andarGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, zoneX - 3, zoneY - 3, zoneW + 6, zoneH + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Andar label
        ctx.fillStyle = this.colors.andar;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('ANDAR', zoneX + zoneW / 2, zoneY + 20);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Pays 1.9:1', zoneX + zoneW / 2, zoneY + 34);
        
        // Cards in grid
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const cols = 4;
        const cardsStartX = zoneX + 8;
        const cardsStartY = zoneY + 42;
        
        for (let i = 0; i < this.andarCards.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = cardsStartX + col * (cardW + 4);
            const cy = cardsStartY + row * (cardH + 4);
            
            let scale = 1;
            if (i === this.andarCards.length - 1 && this.isDealing && this.currentDealSide === 'bahar' && this.dealIndex > 0) {
                scale = Math.min(1, this.cardSlideProgress);
            }
            
            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cx + cardW / 2), -(cy + cardH / 2));
            
            this.drawSingleCard(ctx, cx, cy, cardW, cardH, this.andarCards[i], true);
            
            ctx.restore();
        }
        
        // Bet amount badge
        if (this.bets.andar > 0) {
            this.drawBetBadge(ctx, zoneX + zoneW / 2, zoneY + zoneH - 16, this.bets.andar, this.colors.andar);
        }
    }
    
    drawBaharZone(ctx, w, h) {
        const zoneX = w / 2 + 18;
        const zoneY = h * 0.24;
        const zoneW = w / 2 - 50;
        const zoneH = h * 0.32;
        
        ctx.fillStyle = 'rgba(68,136,255,0.04)';
        ctx.strokeStyle = this.bets.bahar > 0 ? 'rgba(68,136,255,0.7)' : 'rgba(68,136,255,0.2)';
        ctx.lineWidth = this.bets.bahar > 0 ? 2.5 : 1;
        this.roundRect(ctx, zoneX, zoneY, zoneW, zoneH, 12);
        ctx.fill();
        ctx.stroke();
        
        // Winner highlight
        if (this.showdown && this.winner === 'bahar') {
            ctx.strokeStyle = this.colors.bahar;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.colors.baharGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, zoneX - 3, zoneY - 3, zoneW + 6, zoneH + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Bahar label
        ctx.fillStyle = this.colors.bahar;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('BAHAR', zoneX + zoneW / 2, zoneY + 20);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Pays 1.9:1', zoneX + zoneW / 2, zoneY + 34);
        
        // Cards in grid
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const cols = 4;
        const cardsStartX = zoneX + 8;
        const cardsStartY = zoneY + 42;
        
        for (let i = 0; i < this.baharCards.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = cardsStartX + col * (cardW + 4);
            const cy = cardsStartY + row * (cardH + 4);
            
            let scale = 1;
            if (i === this.baharCards.length - 1 && this.isDealing && this.currentDealSide === 'andar' && this.dealIndex > 0) {
                scale = Math.min(1, this.cardSlideProgress);
            }
            
            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cx + cardW / 2), -(cy + cardH / 2));
            
            this.drawSingleCard(ctx, cx, cy, cardW, cardH, this.baharCards[i], true);
            
            ctx.restore();
        }
        
        // Bet amount badge
        if (this.bets.bahar > 0) {
            this.drawBetBadge(ctx, zoneX + zoneW / 2, zoneY + zoneH - 16, this.bets.bahar, this.colors.bahar);
        }
    }
    
    drawBetBadge(ctx, x, y, amount, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x - 28, y - 10, 56, 20, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RS ' + amount, x, y);
    }
    
    drawSingleCard(ctx, x, y, width, height, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        
        const bodyGrad = ctx.createLinearGradient(x, y, x + width, y + height);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.5, '#f8f8f5');
        bodyGrad.addColorStop(1, '#eeeeea');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.colors.cardBorder;
        ctx.lineWidth = 0.5;
        this.roundRect(ctx, x, y, width, height, 5);
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
            const fontSize = Math.floor(width * 0.3);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fontSize + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.rank, x + width / 2, y + height / 2 - 2);
            ctx.font = Math.floor(fontSize * 0.8) + 'px Georgia';
            ctx.fillText(suitChar, x + width / 2, y + height / 2 + fontSize * 0.7);
        }
    }
    
    drawBettingAreas(ctx, w, h) {
        const areaY = h * 0.62;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', w / 2, areaY - 8);
        
        const betBtns = [
            { label: 'ANDAR', sub: '1.9:1', color: this.colors.andar, side: 'andar' },
            { label: 'BAHAR', sub: '1.9:1', color: this.colors.bahar, side: 'bahar' }
        ];
        
        const btnW = 140;
        const btnH = 52;
        const gap = 30;
        const totalW = btnW * 2 + gap;
        const startX = (w - totalW) / 2;
        const btnY = areaY + 4;
        
        for (let i = 0; i < betBtns.length; i++) {
            const bet = betBtns[i];
            const bx = startX + i * (btnW + gap);
            const isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 16px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, btnY + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 9px Georgia';
            ctx.fillText(bet.sub, bx + btnW / 2, btnY + btnH / 2 + 16);
        }
    }
    
    drawSpotlight(ctx, w, h) {
        if (!this.spotlightTarget) return;
        
        const sx = this.spotlightTarget === 'andar' ? w * 0.22 : w * 0.78;
        const sy = h * 0.4;
        
        const spotGrad = ctx.createRadialGradient(sx, sy, 30, sx, sy, 200);
        const spotColor = this.spotlightTarget === 'andar' ? '0,230,118' : '68,136,255';
        spotGrad.addColorStop(0, 'rgba(' + spotColor + ',' + (this.spotlightAlpha * 0.15) + ')');
        spotGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, 200, 0, Math.PI * 2);
        ctx.fill();
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
        const glowX = this.winner === 'andar' ? w * 0.22 : w * 0.78;
        const glowY = h * 0.4;
        const glowColor = this.winner === 'andar' ? this.colors.andar : this.colors.bahar;
        
        const glowGrad = ctx.createRadialGradient(glowX, glowY, 30, glowX, glowY, 200);
        glowGrad.addColorStop(0, glowColor + '30');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(glowX, glowY, 200, 0, Math.PI * 2);
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
    // CANVAS CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isPlaying || this.isDealing) return;
        
        const w = this.w;
        const h = this.h;
        const areaY = h * 0.62;
        const btnW = 140;
        const btnH = 52;
        const gap = 30;
        const totalW = btnW * 2 + gap;
        const startX = (w - totalW) / 2;
        const btnY = areaY + 4;
        
        // Andar button
        if (clickX >= startX && clickX <= startX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            this.setSide('andar');
            return;
        }
        
        // Bahar button
        if (clickX >= startX + btnW + gap && clickX <= startX + btnW + gap + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            this.setSide('bahar');
            return;
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
        this.confettiParticles = [];
        this.andarCards = [];
        this.baharCards = [];
        this.deck = [];
    }
}

// Export
window.AndarBaharFullGame = AndarBaharFullGame;
console.log('Andar Bahar v3.0.0 - Real Casino Design Loaded');
