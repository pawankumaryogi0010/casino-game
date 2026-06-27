// ============================================
// EMERALD KING CASINO - DRAGON TIGER
// Real Casino UI - Evolution Gaming Style
// Full Redesign v3.0.0
// File: js/games/dragon-tiger.js
// ============================================

class DragonTigerFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas display dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betSide = 'dragon';
        this.dragonCard = null;
        this.tigerCard = null;
        this.dragonValue = 0;
        this.tigerValue = 0;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        
        // Multiple bets support
        this.bets = {
            dragon: 0,
            tiger: 0,
            tie: 0,
            dragonPair: 0,
            tigerPair: 0
        };
        this.totalBet = 0;
        this.winnings = 0;
        
        // Deck
        this.deck = [];
        this.cardsRemaining = 0;
        
        // Animation
        this.cardSlideProgress = 0;
        this.vsPulse = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        
        // Roadmap history
        this.roadmapHistory = [];
        this.maxRoadmapEntries = 20;
        
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
            dragon: '#cc2233',
            dragonGlow: '#ff3344',
            tiger: '#2266cc',
            tigerGlow: '#3388ff',
            tie: '#d4a843',
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
        this.cardWidth = 70;
        this.cardHeight = 100;
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
        this.loadRoadmapHistory();
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
                size: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.015 + 0.003,
                opacity: Math.random() * 0.35 + 0.08,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    loadRoadmapHistory() {
        try {
            const saved = localStorage.getItem('dragon_tiger_roadmap');
            if (saved) {
                this.roadmapHistory = JSON.parse(saved);
                if (this.roadmapHistory.length > this.maxRoadmapEntries) {
                    this.roadmapHistory = this.roadmapHistory.slice(-this.maxRoadmapEntries);
                }
            }
        } catch (e) {
            this.roadmapHistory = [];
        }
    }
    
    saveRoadmapHistory() {
        try {
            localStorage.setItem('dragon_tiger_roadmap', JSON.stringify(this.roadmapHistory));
        } catch (e) {}
    }
    
    resetGame() {
        this.dragonCard = null;
        this.tigerCard = null;
        this.dragonValue = 0;
        this.tigerValue = 0;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealProgress = 0;
        this.dealPhase = 'idle';
        this.winnings = 0;
        this.cardSlideProgress = 0;
        this.winGlowAlpha = 0;
        this.confettiParticles = [];
        this.bets = { dragon: 0, tiger: 0, tie: 0, dragonPair: 0, tigerPair: 0 };
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
    
    getCardValue(rank) {
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    isPair(cards) {
        if (cards.length < 2) return false;
        return cards[0].rank === cards[1].rank;
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
        this.bets = { dragon: 0, tiger: 0, tie: 0, dragonPair: 0, tigerPair: 0 };
        this.totalBet = 0;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        if (this.totalBet === 0) {
            this.bets.dragon = bet || this.bet;
            this.totalBet = this.bets.dragon;
            this.betSide = 'dragon';
        }
        
        this.bet = bet || this.bet;
        this.isPlaying = true;
        this.isDealing = true;
        this.showdown = false;
        this.result = null;
        this.winnings = 0;
        this.cardSlideProgress = 0;
        this.confettiParticles = [];
        
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cardsRemaining = this.deck.length;
        
        this.dragonCard = this.deck.pop();
        this.tigerCard = this.deck.pop();
        this.cardsRemaining = this.deck.length;
        
        this.dragonValue = this.getCardValue(this.dragonCard.rank);
        this.tigerValue = this.getCardValue(this.tigerCard.rank);
        
        if (this.dragonValue > this.tigerValue) {
            this.result = 'dragon';
        } else if (this.tigerValue > this.dragonValue) {
            this.result = 'tiger';
        } else {
            this.result = 'tie';
        }
        
        this.roadmapHistory.push(this.result);
        if (this.roadmapHistory.length > this.maxRoadmapEntries) {
            this.roadmapHistory.shift();
        }
        this.saveRoadmapHistory();
        
        this.dealPhase = 'dealingDragon';
        this.dealProgress = 0;
        this.animateDeal();
    }
    
    animateDeal() {
        const dealInterval = setInterval(() => {
            this.cardSlideProgress += 0.04;
            this.dealProgress += 0.04;
            
            if (this.dealPhase === 'dealingDragon' && this.dealProgress >= 0.5) {
                this.dealPhase = 'dealingTiger';
                this.cardSlideProgress = 0;
            }
            
            if (this.dealPhase === 'dealingTiger' && this.dealProgress >= 1.0) {
                this.dealPhase = 'showdown';
                this.cardSlideProgress = 1;
                clearInterval(dealInterval);
                
                setTimeout(() => {
                    this.isDealing = false;
                    this.showdown = true;
                    this.resolveGame();
                }, 600);
                return;
            }
            
            this.drawFullTable();
        }, 40);
    }
    
    resolveGame() {
        this.winnings = 0;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.bets.dragon > 0 && this.result === 'dragon') {
            this.winnings += Math.floor(this.bets.dragon * 2);
        }
        
        if (this.bets.tiger > 0 && this.result === 'tiger') {
            this.winnings += Math.floor(this.bets.tiger * 2);
        }
        
        if (this.bets.tie > 0 && this.result === 'tie') {
            this.winnings += Math.floor(this.bets.tie * 11);
        } else if (this.result === 'tie' && (this.bets.dragon > 0 || this.bets.tiger > 0)) {
            this.winnings += Math.floor((this.bets.dragon + this.bets.tiger) * 0.5);
        }
        
        if (this.bets.dragonPair > 0 && this.isPair([this.dragonCard, this.dragonCard])) {
            this.winnings += Math.floor(this.bets.dragonPair * 11);
        }
        
        if (this.bets.tigerPair > 0 && this.isPair([this.tigerCard, this.tigerCard])) {
            this.winnings += Math.floor(this.bets.tigerPair * 11);
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
                const cascadeX = this.result === 'dragon' ? this.w * 0.25 : this.result === 'tiger' ? this.w * 0.75 : this.w * 0.5;
                this.winCascade.spawn(cascadeX, this.h * 0.5, 70);
            }
        } else if (this.totalBet > 0 && this.winnings === 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            const winnerName = this.result === 'dragon' ? 'DRAGON' : this.result === 'tiger' ? 'TIGER' : 'TIE';
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">WIN! ' + winnerName + ' +' + this.winnings + '</div>';
            } else if (this.totalBet > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + winnerName + ' - You lost ' + this.totalBet + '</div>';
            }
        }
        
        this.drawFullTable();
        
        setTimeout(() => {
            this.showdown = false;
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
        this.vsPulse = Math.sin(timestamp * 0.004) * 0.3 + 0.7;
        
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
        this.drawRoadmapPanel(ctx, w, h);
        this.drawDragonZone(ctx, w, h);
        this.drawTigerZone(ctx, w, h);
        this.drawVSDisplay(ctx, w, h);
        this.drawCards(ctx, w, h);
        this.drawBettingAreas(ctx, w, h);
        this.drawCardShoe(ctx, w, h);
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
        
        ctx.strokeStyle = 'rgba(212,168,67,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(centerX, fy + 20);
        ctx.lineTo(centerX, fy + fh - 20);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const cardAreaBottom = h * 0.52;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fy + 20, cardAreaBottom);
        ctx.lineTo(w - fy - 20, cardAreaBottom);
        ctx.stroke();
    }
    
    drawRoadmapPanel(ctx, w, h) {
        const rx = w - 82;
        const ry = 35;
        const rw = 64;
        const rh = 110;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, rx, ry, rw, rh, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('ROADMAP', rx + rw / 2, ry + 12);
        
        const beadSize = 6;
        const cols = 6;
        const startX = rx + 8;
        const startY = ry + 22;
        
        for (let i = 0; i < Math.min(this.roadmapHistory.length, 18); i++) {
            const result = this.roadmapHistory[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = startX + col * (beadSize + 3);
            const by = startY + row * (beadSize + 3);
            
            let color;
            if (result === 'dragon') color = this.colors.dragon;
            else if (result === 'tiger') color = this.colors.tiger;
            else color = this.colors.gold;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx, by, beadSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            if (i === this.roadmapHistory.length - 1 && this.showdown) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(bx, by, beadSize / 2 + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Cards: ' + this.cardsRemaining, rx + rw / 2, ry + rh - 8);
    }
    
    drawDragonZone(ctx, w, h) {
        const zoneX = 35;
        const zoneY = 42;
        const zoneW = w / 2 - 55;
        const zoneH = h * 0.42;
        
        ctx.fillStyle = 'rgba(204,34,51,0.04)';
        ctx.strokeStyle = this.bets.dragon > 0 ? 'rgba(204,34,51,0.7)' : 'rgba(204,34,51,0.2)';
        ctx.lineWidth = this.bets.dragon > 0 ? 2.5 : 1;
        this.roundRect(ctx, zoneX, zoneY, zoneW, zoneH, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.dragon;
        ctx.font = '36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('D', zoneX + zoneW / 2, zoneY + 45);
        
        ctx.fillStyle = this.colors.dragon;
        ctx.font = 'bold 16px Georgia';
        ctx.fillText('DRAGON', zoneX + zoneW / 2, zoneY + 70);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('Pays 1:1', zoneX + zoneW / 2, zoneY + 88);
        
        if (this.bets.dragon > 0) {
            this.drawBetBadge(ctx, zoneX + zoneW / 2, zoneY + zoneH - 20, this.bets.dragon, this.colors.dragon);
        }
    }
    
    drawTigerZone(ctx, w, h) {
        const zoneX = w / 2 + 20;
        const zoneY = 42;
        const zoneW = w / 2 - 55;
        const zoneH = h * 0.42;
        
        ctx.fillStyle = 'rgba(34,102,204,0.04)';
        ctx.strokeStyle = this.bets.tiger > 0 ? 'rgba(34,102,204,0.7)' : 'rgba(34,102,204,0.2)';
        ctx.lineWidth = this.bets.tiger > 0 ? 2.5 : 1;
        this.roundRect(ctx, zoneX, zoneY, zoneW, zoneH, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.tiger;
        ctx.font = '36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('T', zoneX + zoneW / 2, zoneY + 45);
        
        ctx.fillStyle = this.colors.tiger;
        ctx.font = 'bold 16px Georgia';
        ctx.fillText('TIGER', zoneX + zoneW / 2, zoneY + 70);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('Pays 1:1', zoneX + zoneW / 2, zoneY + 88);
        
        if (this.bets.tiger > 0) {
            this.drawBetBadge(ctx, zoneX + zoneW / 2, zoneY + zoneH - 20, this.bets.tiger, this.colors.tiger);
        }
    }
    
    drawBetBadge(ctx, x, y, amount, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x - 28, y - 12, 56, 24, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RS ' + amount, x, y);
    }
    
    drawVSDisplay(ctx, w, h) {
        const vsX = w / 2;
        const vsY = h * 0.3;
        
        const glowGrad = ctx.createRadialGradient(vsX, vsY, 5, vsX, vsY, 30);
        glowGrad.addColorStop(0, 'rgba(212,168,67,0.4)');
        glowGrad.addColorStop(1, 'rgba(212,168,67,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(vsX, vsY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0a0806';
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(vsX, vsY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VS', vsX, vsY);
    }
    
    drawCards(ctx, w, h) {
        const cardAreaY = h * 0.15;
        
        if (this.dragonCard) {
            const cardX = w * 0.25 - this.cardWidth / 2;
            const cardY = cardAreaY;
            
            let slideOffset = 0;
            let scale = 1;
            
            if (this.dealPhase === 'dealingDragon') {
                slideOffset = (1 - this.cardSlideProgress * 2) * (-60);
                scale = Math.min(1, this.cardSlideProgress * 2);
            }
            
            ctx.save();
            ctx.translate(cardX + this.cardWidth / 2 + slideOffset, cardY + this.cardHeight / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cardX + this.cardWidth / 2), -(cardY + this.cardHeight / 2));
            
            this.drawSingleCard(ctx, cardX, cardY, this.cardWidth, this.cardHeight, this.dragonCard, true);
            
            ctx.restore();
            
            if (this.showdown || this.dealPhase === 'showdown') {
                ctx.fillStyle = this.colors.dragon;
                ctx.font = 'bold 14px Georgia';
                ctx.textAlign = 'center';
                ctx.fillText(this.dragonValue, cardX + this.cardWidth / 2, cardY + this.cardHeight + 18);
            }
        }
        
        if (this.tigerCard) {
            const cardX = w * 0.75 - this.cardWidth / 2;
            const cardY = cardAreaY;
            
            let slideOffset = 0;
            let scale = 1;
            
            if (this.dealPhase === 'dealingTiger') {
                slideOffset = (1 - this.cardSlideProgress * 2) * 60;
                scale = Math.min(1, this.cardSlideProgress * 2);
            } else if (this.dealPhase === 'dealingDragon') {
                scale = 0;
            }
            
            ctx.save();
            ctx.translate(cardX + this.cardWidth / 2 + slideOffset, cardY + this.cardHeight / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cardX + this.cardWidth / 2), -(cardY + this.cardHeight / 2));
            
            this.drawSingleCard(ctx, cardX, cardY, this.cardWidth, this.cardHeight, this.tigerCard, true);
            
            ctx.restore();
            
            if (this.showdown || this.dealPhase === 'showdown') {
                ctx.fillStyle = this.colors.tiger;
                ctx.font = 'bold 14px Georgia';
                ctx.textAlign = 'center';
                ctx.fillText(this.tigerValue, cardX + this.cardWidth / 2, cardY + this.cardHeight + 18);
            }
        }
        
        if (this.showdown && this.result) {
            const winnerCardX = this.result === 'dragon' ? w * 0.25 - this.cardWidth / 2 : w * 0.75 - this.cardWidth / 2;
            const winnerCardY = cardAreaY;
            
            const glowColor = this.result === 'dragon' ? this.colors.dragon : this.result === 'tiger' ? this.colors.tiger : this.colors.gold;
            
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20;
            this.roundRect(ctx, winnerCardX - 6, winnerCardY - 6, this.cardWidth + 12, this.cardHeight + 12, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    
    drawSingleCard(ctx, x, y, width, height, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        
        const bodyGrad = ctx.createLinearGradient(x, y, x + width, y + height);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.5, '#f8f8f5');
        bodyGrad.addColorStop(1, '#eeeeea');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.colors.cardBorder;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 4, y + 4, width - 8, height - 8, 5);
        ctx.stroke();
        
        if (faceUp && card) {
            const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
            const suitChar = suitSymbols[card.suit] || card.suit;
            const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.colors.red : this.colors.black;
            const fontSize = Math.floor(width * 0.28);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fontSize + 'px Georgia';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 6, y + 4);
            ctx.font = Math.floor(fontSize * 0.7) + 'px Georgia';
            ctx.fillText(suitChar, x + 6, y + fontSize + 3);
            
            ctx.font = Math.floor(fontSize * 1.6) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + width / 2, y + height / 2);
            
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.font = 'bold ' + fontSize + 'px Georgia';
            ctx.fillText(card.rank, x + width - 6, y + height - 4);
            ctx.font = Math.floor(fontSize * 0.7) + 'px Georgia';
            ctx.fillText(suitChar, x + width - 6, y + height - fontSize - 3);
        }
    }
    
    drawBettingAreas(ctx, w, h) {
        const areaY = h * 0.58;
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', w / 2, areaY - 8);
        
        const mainBtns = [
            { label: 'DRAGON', sub: '1:1', color: this.colors.dragon, side: 'dragon' },
            { label: 'TIE', sub: '11:1', color: this.colors.gold, side: 'tie' },
            { label: 'TIGER', sub: '1:1', color: this.colors.tiger, side: 'tiger' }
        ];
        
        const btnW = (w - 80) / 3;
        const btnH = 48;
        const gap = 8;
        const btnY = areaY + 4;
        
        for (let i = 0; i < mainBtns.length; i++) {
            const bet = mainBtns[i];
            const bx = 28 + i * (btnW + gap);
            const isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 10);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 12px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, btnY + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia';
            ctx.fillText(bet.sub, bx + btnW / 2, btnY + btnH / 2 + 14);
        }
        
        const sideBtnY = btnY + btnH + 8;
        const sideBtnW = (w - 80) / 2;
        
        const sideBets = [
            { label: 'DRAGON PAIR', sub: '11:1', color: this.colors.dragon, side: 'dragonPair' },
            { label: 'TIGER PAIR', sub: '11:1', color: this.colors.tiger, side: 'tigerPair' }
        ];
        
        for (let i = 0; i < sideBets.length; i++) {
            const bet = sideBets[i];
            const bx = 28 + i * (sideBtnW + gap);
            const isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '20' : 'rgba(255,255,255,0.02)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 1.5 : 0.8;
            this.roundRect(ctx, bx, sideBtnY, sideBtnW, 30, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label + ' (' + bet.sub + ')', bx + sideBtnW / 2, sideBtnY + 15);
        }
    }
    
    drawCardShoe(ctx, w, h) {
        const shoeX = w / 2 + 80;
        const shoeY = h * 0.08;
        
        ctx.fillStyle = '#2a1a0a';
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(shoeX, shoeY);
        ctx.lineTo(shoeX + 40, shoeY);
        ctx.lineTo(shoeX + 35, shoeY + 20);
        ctx.lineTo(shoeX + 5, shoeY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#f5f5f0';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        this.roundRect(ctx, shoeX + 2, shoeY - 4, 16, 20, 3);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.colors.red;
        ctx.font = '8px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('H', shoeX + 10, shoeY + 10);
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
        const glowColor = this.result === 'dragon' ? this.colors.dragon : this.result === 'tiger' ? this.colors.tiger : this.colors.gold;
        const glowX = this.result === 'dragon' ? w * 0.25 : this.result === 'tiger' ? w * 0.75 : w / 2;
        const glowY = h * 0.35;
        
        const glowGrad = ctx.createRadialGradient(glowX, glowY, 20, glowX, glowY, 150);
        glowGrad.addColorStop(0, glowColor + '40');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(glowX, glowY, 150, 0, Math.PI * 2);
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
        const areaY = h * 0.58;
        const btnW = (w - 80) / 3;
        const gap = 8;
        const btnY = areaY + 4;
        const btnH = 48;
        
        const mainSides = ['dragon', 'tie', 'tiger'];
        for (let i = 0; i < 3; i++) {
            const bx = 28 + i * (btnW + gap);
            if (clickX >= bx && clickX <= bx + btnW && clickY >= btnY && clickY <= btnY + btnH) {
                this.setSide(mainSides[i]);
                return;
            }
        }
        
        const sideBtnY = btnY + btnH + 8;
        const sideBtnW = (w - 80) / 2;
        const sideSides = ['dragonPair', 'tigerPair'];
        for (let i = 0; i < 2; i++) {
            const bx = 28 + i * (sideBtnW + gap);
            if (clickX >= bx && clickX <= bx + sideBtnW && clickY >= sideBtnY && clickY <= sideBtnY + 30) {
                this.setSide(sideSides[i]);
                return;
            }
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
        this.roadmapHistory = [];
        this.deck = [];
    }
}

// Export
window.DragonTigerFullGame = DragonTigerFullGame;
console.log('Dragon Tiger v3.0.0 - Real Casino Design Loaded');
