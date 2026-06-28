// ============================================
// EMERALD KING CASINO - BACCARAT
// Real Casino UI - Evolution Gaming Style
// Full Redesign v3.0.0
// File: js/games/baccarat.js
// ============================================

class BaccaratFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betSide = 'player';
        this.playerCards = [];
        this.bankerCards = [];
        this.playerScore = 0;
        this.bankerScore = 0;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealPhase = 'idle';
        this.dealStep = 0;
        this.winnings = 0;
        
        // Multiple bets
        this.bets = {
            player: 0,
            banker: 0,
            tie: 0,
            playerPair: 0,
            bankerPair: 0
        };
        this.totalBet = 0;
        
        // Roadmap
        this.roadmapBig = [];
        this.roadmapBead = [];
        this.roadmapBigEye = [];
        this.roadmapSmall = [];
        this.roadmapCockroach = [];
        
        // Animation
        this.cardSlideProgress = 0;
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.squeezeProgress = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
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
            playerColor: '#00e676',
            playerGlow: '#33ff88',
            bankerColor: '#ff4444',
            bankerGlow: '#ff6666',
            tieColor: '#FFD700',
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            white: '#ffffff',
            black: '#1a1a1a',
            red: '#cc0000'
        };
        
        this.cardWidth = 55;
        this.cardHeight = 78;
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
            const saved = localStorage.getItem('baccarat_roadmap');
            if (saved) {
                const data = JSON.parse(saved);
                this.roadmapBig = data.big || [];
                this.roadmapBead = data.bead || [];
            }
        } catch (e) {
            this.roadmapBig = [];
            this.roadmapBead = [];
        }
    }
    
    saveRoadmap() {
        try {
            localStorage.setItem('baccarat_roadmap', JSON.stringify({
                big: this.roadmapBig.slice(-60),
                bead: this.roadmapBead.slice(-60)
            }));
        } catch (e) {}
    }
    
    resetGame() {
        this.playerCards = [];
        this.bankerCards = [];
        this.playerScore = 0;
        this.bankerScore = 0;
        this.result = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealPhase = 'idle';
        this.dealStep = 0;
        this.winnings = 0;
        this.cardSlideProgress = 0;
        this.squeezeProgress = 0;
        this.winGlowAlpha = 0;
        this.confettiParticles = [];
        this.bets = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
        this.totalBet = 0;
    }
    
    // ============================================
    // DECK
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let d = 0; d < 8; d++) {
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
    
    getBaccaratValue(rank) {
        if (['10', 'J', 'Q', 'K'].indexOf(rank) >= 0) return 0;
        if (rank === 'A') return 1;
        return parseInt(rank);
    }
    
    calculateScore(cards) {
        let total = 0;
        for (const card of cards) {
            total += this.getBaccaratValue(card.rank);
        }
        return total % 10;
    }
    
    isPair(cards) {
        if (cards.length < 2) return false;
        return cards[0].rank === cards[1].rank;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSide(side) {
        if (this.isPlaying) return;
        
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
        if (this.isPlaying) return;
        this.bets = { player: 0, banker: 0, tie: 0, playerPair: 0, bankerPair: 0 };
        this.totalBet = 0;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying) return;
        
        if (this.totalBet === 0) {
            this.bets.player = bet || this.bet;
            this.totalBet = this.bets.player;
            this.betSide = 'player';
        }
        
        this.bet = bet || this.bet;
        this.resetGame();
        this.isPlaying = true;
        this.isDealing = true;
        this.showdown = false;
        this.winnings = 0;
        this.confettiParticles = [];
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        // Initial deal
        this.playerCards = [deck.pop(), deck.pop()];
        this.bankerCards = [deck.pop(), deck.pop()];
        this.playerScore = this.calculateScore(this.playerCards);
        this.bankerScore = this.calculateScore(this.bankerCards);
        
        // Third card rules
        const playerNatural = this.playerScore >= 8;
        const bankerNatural = this.bankerScore >= 8;
        
        if (!playerNatural && !bankerNatural) {
            if (this.playerScore <= 5) {
                this.playerCards.push(deck.pop());
                this.playerScore = this.calculateScore(this.playerCards);
                
                const playerThird = this.getBaccaratValue(this.playerCards[2].rank);
                let bankerDraws = false;
                
                if (this.bankerScore <= 2) bankerDraws = true;
                else if (this.bankerScore === 3) bankerDraws = playerThird !== 8;
                else if (this.bankerScore === 4) bankerDraws = playerThird >= 2 && playerThird <= 7;
                else if (this.bankerScore === 5) bankerDraws = playerThird >= 4 && playerThird <= 7;
                else if (this.bankerScore === 6) bankerDraws = playerThird === 6 || playerThird === 7;
                
                if (bankerDraws) {
                    this.bankerCards.push(deck.pop());
                    this.bankerScore = this.calculateScore(this.bankerCards);
                }
            } else if (this.bankerScore <= 5) {
                this.bankerCards.push(deck.pop());
                this.bankerScore = this.calculateScore(this.bankerCards);
            }
        }
        
        // Determine winner
        if (this.playerScore > this.bankerScore) {
            this.result = 'player';
        } else if (this.bankerScore > this.playerScore) {
            this.result = 'banker';
        } else {
            this.result = 'tie';
        }
        
        // Update roadmap
        this.roadmapBead.push(this.result);
        this.roadmapBig.push(this.result);
        if (this.roadmapBead.length > 60) this.roadmapBead.shift();
        if (this.roadmapBig.length > 60) this.roadmapBig.shift();
        this.saveRoadmap();
        
        // Animate
        this.dealPhase = 'revealing';
        this.cardSlideProgress = 0;
        this.animateReveal();
    }
    
    animateReveal() {
        const self = this;
        const revealInterval = setInterval(function() {
            self.cardSlideProgress += 0.04;
            
            if (self.cardSlideProgress >= 1) {
                clearInterval(revealInterval);
                self.isDealing = false;
                self.showdown = true;
                self.resolveGame();
            }
            
            self.drawFullTable();
        }, 40);
    }
    
    resolveGame() {
        this.winnings = 0;
        const resultDisplay = document.getElementById('game-info-overlay');
        
        // Player bet
        if (this.bets.player > 0 && this.result === 'player') {
            this.winnings += Math.floor(this.bets.player * 2);
        }
        
        // Banker bet (5% commission)
        if (this.bets.banker > 0 && this.result === 'banker') {
            this.winnings += Math.floor(this.bets.banker * 1.95);
        }
        
        // Tie bet
        if (this.bets.tie > 0 && this.result === 'tie') {
            this.winnings += Math.floor(this.bets.tie * 8);
        } else if (this.result === 'tie' && (this.bets.player > 0 || this.bets.banker > 0)) {
            this.winnings += this.bets.player + this.bets.banker;
        }
        
        // Pair bets
        if (this.bets.playerPair > 0 && this.isPair(this.playerCards.slice(0, 2))) {
            this.winnings += Math.floor(this.bets.playerPair * 11);
        }
        if (this.bets.bankerPair > 0 && this.isPair(this.bankerCards.slice(0, 2))) {
            this.winnings += Math.floor(this.bets.bankerPair * 11);
        }
        
        this.chips += this.winnings;
        
        if (this.winnings > this.totalBet) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h * 0.45, 80);
        } else if (this.winnings === 0 && this.totalBet > 0) {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.totalBet);
                GameLoaderSystem.updateBalance(this.chips);
            }
        }
        
        if (resultDisplay) {
            if (this.winnings > this.totalBet) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + this.result.toUpperCase() + ' WINS! +RS ' + this.winnings + '</div>';
            } else if (this.winnings > 0) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#FFD700;font-size:14px;">TIE - Return RS ' + this.winnings + '</div>';
            } else {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + this.result.toUpperCase() + ' - Lost RS ' + this.totalBet + '</div>';
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
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.showdown) {
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
        this.drawTableLayout(ctx, w, h);
        this.drawRoadmapPanel(ctx, w, h);
        this.drawPlayerZone(ctx, w, h);
        this.drawBankerZone(ctx, w, h);
        this.drawScores(ctx, w, h);
        this.drawCommissionBadge(ctx, w, h);
        this.drawBettingAreas(ctx, w, h);
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
    }
    
    drawTableLayout(ctx, w, h) {
        const centerX = w / 2;
        
        // Center line
        ctx.strokeStyle = 'rgba(212,168,67,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(centerX, 35);
        ctx.lineTo(centerX, h - 80);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Player label top
        ctx.fillStyle = this.palette.playerColor;
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLAYER', w * 0.25, 42);
        
        // Banker label top
        ctx.fillStyle = this.palette.bankerColor;
        ctx.fillText('BANKER', w * 0.75, 42);
    }
    
    drawRoadmapPanel(ctx, w, h) {
        const rx = w - 90;
        const ry = 55;
        const rw = 76;
        const rh = 95;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, rx, ry, rw, rh, 8);
        ctx.fill();
        ctx.stroke();
        
        // Title
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('BIG ROAD', rx + rw / 2, ry + 12);
        
        // Beads
        const beadSize = 7;
        const cols = 6;
        const startX = rx + 10;
        const startY = ry + 22;
        const history = this.roadmapBig.slice(-30);
        
        for (let i = 0; i < Math.min(history.length, 30); i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = startX + col * (beadSize + 2);
            const by = startY + row * (beadSize + 2);
            
            let color = this.palette.gold;
            if (history[i] === 'player') color = this.palette.playerColor;
            else if (history[i] === 'banker') color = this.palette.bankerColor;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx + beadSize / 2, by + beadSize / 2, beadSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPlayerZone(ctx, w, h) {
        const zx = 30;
        const zy = 55;
        const zw = w / 2 - 50;
        const zh = h * 0.38;
        
        ctx.fillStyle = 'rgba(0,230,118,0.03)';
        ctx.strokeStyle = this.bets.player > 0 ? 'rgba(0,230,118,0.6)' : 'rgba(0,230,118,0.2)';
        ctx.lineWidth = this.bets.player > 0 ? 2 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12);
        ctx.fill();
        ctx.stroke();
        
        if (this.showdown && this.result === 'player') {
            ctx.strokeStyle = this.palette.playerColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.palette.playerGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Cards
        const cw = this.cardWidth, ch = this.cardHeight;
        const totalW = this.playerCards.length * (cw + 8) - 8;
        const sx = zx + (zw - totalW) / 2;
        const cy = zy + zh / 2 - ch / 2 + 10;
        
        for (let i = 0; i < this.playerCards.length; i++) {
            const cx = sx + i * (cw + 8);
            let scale = 1;
            if (this.dealPhase === 'revealing' && i === this.playerCards.length - 1) {
                scale = Math.min(1, this.cardSlideProgress * 1.5);
            }
            
            ctx.save();
            ctx.translate(cx + cw / 2, cy + ch / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cx + cw / 2), -(cy + ch / 2));
            this.drawSingleCard(ctx, cx, cy, cw, ch, this.playerCards[i], true);
            ctx.restore();
        }
        
        // Bet badge
        if (this.bets.player > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 18, this.bets.player, this.palette.playerColor);
        }
    }
    
    drawBankerZone(ctx, w, h) {
        const zx = w / 2 + 20;
        const zy = 55;
        const zw = w / 2 - 50;
        const zh = h * 0.38;
        
        ctx.fillStyle = 'rgba(255,68,68,0.03)';
        ctx.strokeStyle = this.bets.banker > 0 ? 'rgba(255,68,68,0.6)' : 'rgba(255,68,68,0.2)';
        ctx.lineWidth = this.bets.banker > 0 ? 2 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12);
        ctx.fill();
        ctx.stroke();
        
        if (this.showdown && this.result === 'banker') {
            ctx.strokeStyle = this.palette.bankerColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.palette.bankerGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        const cw = this.cardWidth, ch = this.cardHeight;
        const totalW = this.bankerCards.length * (cw + 8) - 8;
        const sx = zx + (zw - totalW) / 2;
        const cy = zy + zh / 2 - ch / 2 + 10;
        
        for (let i = 0; i < this.bankerCards.length; i++) {
            const cx = sx + i * (cw + 8);
            let scale = 1;
            if (this.dealPhase === 'revealing' && i === this.bankerCards.length - 1) {
                scale = Math.min(1, this.cardSlideProgress * 1.5);
            }
            
            ctx.save();
            ctx.translate(cx + cw / 2, cy + ch / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(cx + cw / 2), -(cy + ch / 2));
            this.drawSingleCard(ctx, cx, cy, cw, ch, this.bankerCards[i], true);
            ctx.restore();
        }
        
        if (this.bets.banker > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 18, this.bets.banker, this.palette.bankerColor);
        }
    }
    
    drawScores(ctx, w, h) {
        const scoreY = h * 0.49;
        
        // Player score
        ctx.fillStyle = this.palette.playerColor;
        ctx.font = 'bold 32px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.playerCards.length > 0 ? this.playerScore : '-', w * 0.22, scoreY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('PLAYER', w * 0.22, scoreY + 22);
        
        // VS
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 16px Georgia';
        ctx.fillText('VS', w / 2, scoreY);
        
        // Banker score
        ctx.fillStyle = this.palette.bankerColor;
        ctx.font = 'bold 32px Georgia';
        ctx.fillText(this.bankerCards.length > 0 ? this.bankerScore : '-', w * 0.78, scoreY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Georgia';
        ctx.fillText('BANKER', w * 0.78, scoreY + 22);
    }
    
    drawCommissionBadge(ctx, w, h) {
        const cbx = w * 0.78 - 35;
        const cby = h * 0.52;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, cbx, cby, 70, 18, 9);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('COMM 5%', cbx + 35, cby + 12);
    }
    
    drawBettingAreas(ctx, w, h) {
        const areaY = h * 0.58;
        
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', w / 2, areaY - 8);
        
        // Main bets
        const mainBtns = [
            { label: 'PLAYER', sub: '1:1', color: this.palette.playerColor, side: 'player' },
            { label: 'TIE', sub: '8:1', color: this.palette.tieColor, side: 'tie' },
            { label: 'BANKER', sub: '0.95:1', color: this.palette.bankerColor, side: 'banker' }
        ];
        
        const btnW = (w - 80) / 3;
        const btnH = 42;
        const gap = 8;
        const btnY = areaY + 4;
        
        for (let i = 0; i < mainBtns.length; i++) {
            const bet = mainBtns[i];
            const bx = 28 + i * (btnW + gap);
            const isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '30' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : 1;
            this.roundRect(ctx, bx, btnY, btnW, btnH, 12);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 13px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bx + btnW / 2, btnY + btnH / 2 - 6);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 8px Georgia';
            ctx.fillText(bet.sub, bx + btnW / 2, btnY + btnH / 2 + 14);
        }
        
        // Side bets
        const sideBtnY = btnY + btnH + 8;
        const sideBtnW = (w - 80) / 2;
        
        const sideBets = [
            { label: 'PLAYER PAIR', sub: '11:1', color: this.palette.playerColor, side: 'playerPair' },
            { label: 'BANKER PAIR', sub: '11:1', color: this.palette.bankerColor, side: 'bankerPair' }
        ];
        
        for (let i = 0; i < sideBets.length; i++) {
            const bet = sideBets[i];
            const bx = 28 + i * (sideBtnW + gap);
            const isSelected = this.bets[bet.side] > 0;
            
            ctx.fillStyle = isSelected ? bet.color + '20' : 'rgba(255,255,255,0.02)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 1.5 : 0.8;
            this.roundRect(ctx, bx, sideBtnY, sideBtnW, 28, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label + ' (' + bet.sub + ')', bx + sideBtnW / 2, sideBtnY + 14);
        }
    }
    
    drawBetBadge(ctx, x, y, amount, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x - 25, y - 10, 50, 20, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RS ' + amount, x, y);
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
        const gx = this.result === 'player' ? w * 0.22 : w * 0.78;
        const gy = h * 0.35;
        const gc = this.result === 'player' ? this.palette.playerColor : this.palette.bankerColor;
        
        const glowGrad = ctx.createRadialGradient(gx, gy, 30, gx, gy, 200);
        glowGrad.addColorStop(0, gc + '25');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(gx, gy, 200, 0, Math.PI * 2);
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
        if (this.isPlaying) return;
        
        const areaY = this.h * 0.58;
        const btnW = (this.w - 80) / 3;
        const gap = 8;
        const btnY = areaY + 4;
        const btnH = 42;
        const sides = ['player', 'tie', 'banker'];
        
        for (let i = 0; i < 3; i++) {
            const bx = 28 + i * (btnW + gap);
            if (clickX >= bx && clickX <= bx + btnW && clickY >= btnY && clickY <= btnY + btnH) {
                this.setSide(sides[i]);
                return;
            }
        }
        
        const sideBtnY = btnY + btnH + 8;
        const sideBtnW = (this.w - 80) / 2;
        const sideSides = ['playerPair', 'bankerPair'];
        
        for (let i = 0; i < 2; i++) {
            const bx = 28 + i * (sideBtnW + gap);
            if (clickX >= bx && clickX <= bx + sideBtnW && clickY >= sideBtnY && clickY <= sideBtnY + 28) {
                this.setSide(sideSides[i]);
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
        this.playerCards = [];
        this.bankerCards = [];
    }
}

// Export
window.BaccaratFullGame = BaccaratFullGame;
console.log('Baccarat v3.0.0 - Real Casino Design Loaded');
