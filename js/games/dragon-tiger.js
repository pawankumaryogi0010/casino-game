// ============================================
// EMERALD KING CASINO - DRAGON TIGER
// Real Casino UI - Two Card Battle Game
// Full Redesign v3.0.0
// File: js/games/dragon-tiger.js
// ============================================

class DragonTigerFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
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
        this.winnings = 0;
        
        // Multiple bets
        this.bets = { dragon: 0, tiger: 0, tie: 0, dragonPair: 0, tigerPair: 0 };
        this.totalBet = 0;
        
        // Roadmap
        this.roadmapHistory = [];
        this.maxRoadmap = 18;
        
        // Deck
        this.deck = [];
        this.cardsRemaining = 0;
        
        // Animation
        this.cardSlideProgress = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.vsPulse = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Card dimensions
        this.cardWidth = 62;
        this.cardHeight = 88;
        
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
            dragon: '#cc2233',
            dragonGlow: '#ff3344',
            tiger: '#2266cc',
            tigerGlow: '#3388ff',
            tie: '#d4a843',
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
        this.loadRoadmap();
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
    
    loadRoadmap() {
        try {
            const saved = localStorage.getItem('dragon_tiger_roadmap');
            if (saved) {
                this.roadmapHistory = JSON.parse(saved);
                if (this.roadmapHistory.length > this.maxRoadmap) {
                    this.roadmapHistory = this.roadmapHistory.slice(-this.maxRoadmap);
                }
            }
        } catch (e) { this.roadmapHistory = []; }
    }
    
    saveRoadmap() {
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
        const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        return values[rank];
    }
    
    isPair(card1, card2) {
        if (!card1 || !card2) return false;
        return card1.rank === card2.rank;
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
        if (this.roadmapHistory.length > this.maxRoadmap) this.roadmapHistory.shift();
        this.saveRoadmap();
        
        this.dealPhase = 'dealing';
        this.dealProgress = 0;
        this.cardSlideProgress = 0;
        this.animateDeal();
    }
    
    animateDeal() {
        const self = this;
        const dealInterval = setInterval(function() {
            self.dealProgress += 0.04;
            self.cardSlideProgress += 0.05;
            
            if (self.dealProgress >= 1) {
                clearInterval(dealInterval);
                self.isDealing = false;
                self.showdown = true;
                self.resolveGame();
            }
            
            self.drawFullTable();
        }, 40);
    }
    
    resolveGame() {
        this.winnings = 0;
        
        if (this.bets.dragon > 0 && this.result === 'dragon') this.winnings += Math.floor(this.bets.dragon * 2);
        if (this.bets.tiger > 0 && this.result === 'tiger') this.winnings += Math.floor(this.bets.tiger * 2);
        if (this.bets.tie > 0 && this.result === 'tie') this.winnings += Math.floor(this.bets.tie * 11);
        else if (this.result === 'tie' && (this.bets.dragon > 0 || this.bets.tiger > 0)) {
            this.winnings += Math.floor((this.bets.dragon + this.bets.tiger) * 0.5);
        }
        if (this.bets.dragonPair > 0 && this.isPair(this.dragonCard, this.tigerCard)) this.winnings += Math.floor(this.bets.dragonPair * 11);
        if (this.bets.tigerPair > 0 && this.isPair(this.tigerCard, this.dragonCard)) this.winnings += Math.floor(this.bets.tigerPair * 11);
        
        this.chips += this.winnings;
        
        if (this.winnings > 0) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) {
                const cx = this.result === 'dragon' ? this.w * 0.28 : this.result === 'tiger' ? this.w * 0.72 : this.w * 0.5;
                this.winCascade.spawn(cx, this.h * 0.35, 70);
            }
        } else if (this.totalBet > 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            const winnerName = this.result === 'dragon' ? 'DRAGON' : this.result === 'tiger' ? 'TIGER' : 'TIE';
            if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + winnerName + ' WINS! +RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + winnerName + ' - Lost RS ' + this.totalBet + '</div>';
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
        this.vsPulse = Math.sin(timestamp * 0.004) * 0.3 + 0.7;
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.showdown) this.winGlowAlpha -= 0.01;
        
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
        this.drawTableLayout(ctx, w, h);
        this.drawRoadmap(ctx, w, h);
        this.drawDragonZone(ctx, w, h);
        this.drawTigerZone(ctx, w, h);
        this.drawVSDisplay(ctx, w, h);
        this.drawCards(ctx, w, h);
        this.drawBettingAreas(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winGlowAlpha > 0) this.drawWinGlow(ctx, w, h);
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.render();
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
        const m = 12, tw = w - m * 2, th = h - m * 2;
        ctx.fillStyle = this.palette.woodDark;
        ctx.strokeStyle = this.palette.woodBorder;
        ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.woodLight;
        this.roundRect(ctx, m, m, tw, th, 16); ctx.fill();
        
        ctx.strokeStyle = this.palette.gold;
        ctx.lineWidth = 2;
        this.roundRect(ctx, m + 8, m + 8, tw - 16, th - 16, 12); ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const fx = 24, fy = 24, fw = w - 48, fh = h - 48;
        const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        feltGrad.addColorStop(0, this.palette.feltLight);
        feltGrad.addColorStop(0.4, this.palette.felt);
        feltGrad.addColorStop(1, this.palette.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, fx, fy, fw, fh, 10); ctx.fill();
    }
    
    drawTableLayout(ctx, w, h) {
        const cx = w / 2;
        ctx.strokeStyle = 'rgba(212,168,67,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.moveTo(cx, 35); ctx.lineTo(cx, h - 80); ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawRoadmap(ctx, w, h) {
        const rx = w - 82, ry = 35, rw = 66, rh = 105;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, rx, ry, rw, rh, 8); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('ROADMAP', rx + rw / 2, ry + 12);
        
        const beadSize = 7, cols = 6, startX = rx + 9, startY = ry + 22;
        const history = this.roadmapHistory.slice(-18);
        
        for (let i = 0; i < history.length; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const bx = startX + col * (beadSize + 2), by = startY + row * (beadSize + 2);
            let color = this.palette.gold;
            if (history[i] === 'dragon') color = this.palette.dragon;
            else if (history[i] === 'tiger') color = this.palette.tiger;
            
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(bx + beadSize / 2, by + beadSize / 2, beadSize / 2, 0, Math.PI * 2); ctx.fill();
            
            if (i === history.length - 1 && this.showdown) {
                ctx.strokeStyle = color; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(bx + beadSize / 2, by + beadSize / 2, beadSize / 2 + 2, 0, Math.PI * 2); ctx.stroke();
            }
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Cards: ' + this.cardsRemaining, rx + rw / 2, ry + rh - 8);
    }
    
    drawDragonZone(ctx, w, h) {
        const zx = 32, zy = 42, zw = w / 2 - 52, zh = h * 0.42;
        ctx.fillStyle = 'rgba(204,34,51,0.04)';
        ctx.strokeStyle = this.bets.dragon > 0 ? 'rgba(204,34,51,0.7)' : 'rgba(204,34,51,0.2)';
        ctx.lineWidth = this.bets.dragon > 0 ? 2.5 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12); ctx.fill(); ctx.stroke();
        
        if (this.showdown && this.result === 'dragon') {
            ctx.strokeStyle = this.palette.dragon; ctx.lineWidth = 3;
            ctx.shadowColor = this.palette.dragonGlow; ctx.shadowBlur = 15;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14); ctx.stroke(); ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = this.palette.dragon;
        ctx.font = '32px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('D', zx + zw / 2, zy + 40);
        
        ctx.fillStyle = this.palette.dragon;
        ctx.font = 'bold 14px Georgia';
        ctx.fillText('DRAGON', zx + zw / 2, zy + 62);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Pays 1:1', zx + zw / 2, zy + 78);
        
        if (this.bets.dragon > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 18, this.bets.dragon, this.palette.dragon);
        }
    }
    
    drawTigerZone(ctx, w, h) {
        const zx = w / 2 + 20, zy = 42, zw = w / 2 - 52, zh = h * 0.42;
        ctx.fillStyle = 'rgba(34,102,204,0.04)';
        ctx.strokeStyle = this.bets.tiger > 0 ? 'rgba(34,102,204,0.7)' : 'rgba(34,102,204,0.2)';
        ctx.lineWidth = this.bets.tiger > 0 ? 2.5 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12); ctx.fill(); ctx.stroke();
        
        if (this.showdown && this.result === 'tiger') {
            ctx.strokeStyle = this.palette.tiger; ctx.lineWidth = 3;
            ctx.shadowColor = this.palette.tigerGlow; ctx.shadowBlur = 15;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14); ctx.stroke(); ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = this.palette.tiger;
        ctx.font = '32px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('T', zx + zw / 2, zy + 40);
        
        ctx.fillStyle = this.palette.tiger;
        ctx.font = 'bold 14px Georgia';
        ctx.fillText('TIGER', zx + zw / 2, zy + 62);
        
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Georgia';
        ctx.fillText('Pays 1:1', zx + zw / 2, zy + 78);
        
        if (this.bets.tiger > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 18, this.bets.tiger, this.palette.tiger);
        }
    }
    
    drawBetBadge(ctx, x, y, amount, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        this.roundRect(ctx, x - 25, y - 10, 50, 20, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RS ' + amount, x, y);
    }
    
    drawVSDisplay(ctx, w, h) {
        const vsX = w / 2, vsY = h * 0.3;
        const glowGrad = ctx.createRadialGradient(vsX, vsY, 5, vsX, vsY, 28);
        glowGrad.addColorStop(0, 'rgba(212,168,67,0.35)');
        glowGrad.addColorStop(1, 'rgba(212,168,67,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(vsX, vsY, 28, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#0a0806';
        ctx.strokeStyle = this.palette.gold; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(vsX, vsY, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('VS', vsX, vsY);
    }
    
    drawCards(ctx, w, h) {
        const cardY = h * 0.15;
        
        // Dragon card
        if (this.dragonCard) {
            const cx = w * 0.28 - this.cardWidth / 2;
            const scale = Math.min(1, this.cardSlideProgress * 1.5);
            
            ctx.save();
            ctx.translate(cx + this.cardWidth / 2, cardY + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale), Math.max(0.05, scale));
            ctx.translate(-(cx + this.cardWidth / 2), -(cardY + this.cardHeight / 2));
            this.drawSingleCard(ctx, cx, cardY, this.cardWidth, this.cardHeight, this.dragonCard, true);
            ctx.restore();
            
            if (this.showdown) {
                ctx.fillStyle = this.palette.dragon;
                ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
                ctx.fillText(this.dragonValue, cx + this.cardWidth / 2, cardY + this.cardHeight + 16);
            }
        }
        
        // Tiger card
        if (this.tigerCard) {
            const cx = w * 0.72 - this.cardWidth / 2;
            const scale = Math.min(1, this.cardSlideProgress * 1.5);
            
            ctx.save();
            ctx.translate(cx + this.cardWidth / 2, cardY + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale), Math.max(0.05, scale));
            ctx.translate(-(cx + this.cardWidth / 2), -(cardY + this.cardHeight / 2));
            this.drawSingleCard(ctx, cx, cardY, this.cardWidth, this.cardHeight, this.tigerCard, true);
            ctx.restore();
            
            if (this.showdown) {
                ctx.fillStyle = this.palette.tiger;
                ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
                ctx.fillText(this.tigerValue, cx + this.cardWidth / 2, cardY + this.cardHeight + 16);
            }
        }
        
        // Winner highlight
        if (this.showdown && this.result) {
            const wcx = this.result === 'dragon' ? w * 0.28 - this.cardWidth / 2 : w * 0.72 - this.cardWidth / 2;
            const gc = this.result === 'dragon' ? this.palette.dragon : this.result === 'tiger' ? this.palette.tiger : this.palette.gold;
            
            ctx.strokeStyle = gc; ctx.lineWidth = 3;
            ctx.shadowColor = gc; ctx.shadowBlur = 18;
            this.roundRect(ctx, wcx - 5, cardY - 5, this.cardWidth + 10, this.cardHeight + 10, 10);
            ctx.stroke(); ctx.shadowBlur = 0;
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
            const fs = Math.floor(w * 0.28);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 4, y + 3);
            
            ctx.font = Math.floor(fs * 0.7) + 'px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + w / 2, y + h / 2);
        }
    }
    
    drawBettingAreas(ctx, w, h) {
        const areaY = h * 0.58;
        
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', w / 2, areaY - 8);
        
        const mainBtns = [
            { label: 'DRAGON', sub: '1:1', color: this.palette.dragon, side: 'dragon' },
            { label: 'TIE', sub: '11:1', color: this.palette.tie, side: 'tie' },
            { label: 'TIGER', sub: '1:1', color: this.palette.tiger, side: 'tiger' }
        ];
        
        const btnW = (w - 80) / 3, btnH = 42, gap = 8, btnY = areaY + 4;
        
        for (let i = 0; i < 3; i++) {
            const bet = mainBtns[i], bx = 28 + i * (btnW + gap), isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 12); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, btnY + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia';
            ctx.fillText(bet.sub, bx + btnW / 2, btnY + btnH / 2 + 14);
        }
        
        const sideBtnY = btnY + btnH + 8, sideBtnW = (w - 80) / 2;
        const sideBets = [
            { label: 'DRAGON PAIR', sub: '11:1', color: this.palette.dragon, side: 'dragonPair' },
            { label: 'TIGER PAIR', sub: '11:1', color: this.palette.tiger, side: 'tigerPair' }
        ];
        
        for (let i = 0; i < 2; i++) {
            const bet = sideBets[i], bx = 28 + i * (sideBtnW + gap), isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '20' : 'rgba(255,255,255,0.02)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 1.5 : 0.8;
            this.roundRect(ctx, bx, sideBtnY, sideBtnW, 28, 8); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(bet.label + ' (' + bet.sub + ')', bx + sideBtnW / 2, sideBtnY + 14);
        }
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawWinGlow(ctx, w, h) {
        const gx = this.result === 'dragon' ? w * 0.28 : w * 0.72;
        const gy = h * 0.35;
        const gc = this.result === 'dragon' ? this.palette.dragon : this.palette.tiger;
        
        const glowGrad = ctx.createRadialGradient(gx, gy, 30, gx, gy, 200);
        glowGrad.addColorStop(0, gc + '25'); glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(gx, gy, 200, 0, Math.PI * 2); ctx.fill();
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
        if (this.isPlaying || this.isDealing) return;
        
        const areaY = this.h * 0.58;
        const btnW = (this.w - 80) / 3, btnH = 42, gap = 8, btnY = areaY + 4;
        const mainSides = ['dragon', 'tie', 'tiger'];
        
        for (let i = 0; i < 3; i++) {
            const bx = 28 + i * (btnW + gap);
            if (clickX >= bx && clickX <= bx + btnW && clickY >= btnY && clickY <= btnY + btnH) {
                this.setSide(mainSides[i]); return;
            }
        }
        
        const sideBtnY = btnY + btnH + 8, sideBtnW = (this.w - 80) / 2;
        const sideSides = ['dragonPair', 'tigerPair'];
        
        for (let i = 0; i < 2; i++) {
            const bx = 28 + i * (sideBtnW + gap);
            if (clickX >= bx && clickX <= bx + sideBtnW && clickY >= sideBtnY && clickY <= sideBtnY + 28) {
                this.setSide(sideSides[i]); return;
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
        this.sparkles = []; this.confettiParticles = [];
        this.deck = []; this.roadmapHistory = [];
    }
}

// Export
window.DragonTigerFullGame = DragonTigerFullGame;
console.log('Dragon Tiger v3.0.0 - Real Casino Design Loaded');
