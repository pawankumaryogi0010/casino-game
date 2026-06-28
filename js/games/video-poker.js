// ============================================
// EMERALD KING CASINO - VIDEO POKER
// Real Casino UI - Jacks or Better
// Full Redesign v3.0.0
// File: js/games/video-poker.js
// ============================================

class VideoPokerFullGame {
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
        this.held = [false, false, false, false, false];
        this.deck = [];
        this.gamePhase = 'bet';
        this.handRank = null;
        this.handName = '';
        this.winnings = 0;
        this.isAnimating = false;
        
        // Pay table (Jacks or Better)
        this.payTable = [
            { name: 'ROYAL FLUSH', payout: 250, icon: 'R' },
            { name: 'STRAIGHT FLUSH', payout: 50, icon: 'S' },
            { name: 'FOUR OF A KIND', payout: 25, icon: '4' },
            { name: 'FULL HOUSE', payout: 9, icon: 'F' },
            { name: 'FLUSH', payout: 6, icon: 'L' },
            { name: 'STRAIGHT', payout: 4, icon: 'T' },
            { name: 'THREE OF A KIND', payout: 3, icon: '3' },
            { name: 'TWO PAIR', payout: 2, icon: '2' },
            { name: 'JACKS OR BETTER', payout: 1, icon: 'J' }
        ];
        
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
        this.cardWidth = 55;
        this.cardHeight = 78;
        this.cardY = 0;
        this.cardStartX = 0;
        
        // Colors
        this.palette = {
            screenBg: '#0a0a1a',
            screenBorder: '#1e2844',
            gold: '#d4a843',
            goldLight: '#f0d078',
            holdColor: '#00e676',
            dealColor: '#ff4444',
            drawColor: '#00b0ff',
            cardBg: '#f5f5f0',
            cardBorder: '#cccccc',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            red: '#cc0000',
            black: '#1a1a1a',
            white: '#ffffff'
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
        this.calculateDimensions();
        this.generateSparkles();
        this.resetGame();
        this.drawFullScreen();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateDimensions();
        this.drawFullScreen();
    }
    
    calculateDimensions() {
        const totalCardW = this.cardWidth * 5 + 8 * 4;
        this.cardStartX = (this.w - totalCardW) / 2;
        this.cardY = this.h / 2 - this.cardHeight / 2 + 10;
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
        this.cards = [];
        this.held = [false, false, false, false, false];
        this.deck = [];
        this.gamePhase = 'bet';
        this.handRank = null;
        this.handName = '';
        this.winnings = 0;
        this.isAnimating = false;
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
    // HAND EVALUATION
    // ============================================
    
    evaluateHand(cards) {
        const values = cards.map(function(c) { return this.getRankValue(c.rank); }.bind(this)).sort(function(a, b) { return b - a; });
        const suits = cards.map(function(c) { return c.suit; });
        
        const isFlush = suits.every(function(s) { return s === suits[0]; });
        const isStraight = values.every(function(v, i) { return i === 0 || v === values[i - 1] - 1; }) ||
                          (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2);
        
        const counts = {};
        values.forEach(function(v) { counts[v] = (counts[v] || 0) + 1; });
        const countValues = Object.values(counts).sort(function(a, b) { return b - a; });
        
        if (isFlush && isStraight && values[0] === 14 && values[4] === 10) return { rank: 9, name: 'ROYAL FLUSH', payout: this.payTable[0].payout };
        if (isFlush && isStraight) return { rank: 8, name: 'STRAIGHT FLUSH', payout: this.payTable[1].payout };
        if (countValues[0] === 4) return { rank: 7, name: 'FOUR OF A KIND', payout: this.payTable[2].payout };
        if (countValues[0] === 3 && countValues[1] === 2) return { rank: 6, name: 'FULL HOUSE', payout: this.payTable[3].payout };
        if (isFlush) return { rank: 5, name: 'FLUSH', payout: this.payTable[4].payout };
        if (isStraight) return { rank: 4, name: 'STRAIGHT', payout: this.payTable[5].payout };
        if (countValues[0] === 3) return { rank: 3, name: 'THREE OF A KIND', payout: this.payTable[6].payout };
        if (countValues[0] === 2 && countValues[1] === 2) return { rank: 2, name: 'TWO PAIR', payout: this.payTable[7].payout };
        if (countValues[0] === 2) {
            const pairRank = Object.entries(counts).find(function(e) { return e[1] === 2; });
            if (pairRank && parseInt(pairRank[0]) >= 11) return { rank: 1, name: 'JACKS OR BETTER', payout: this.payTable[8].payout };
        }
        
        return { rank: 0, name: 'NO WIN', payout: 0 };
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    toggleHold(index) {
        if (this.gamePhase !== 'draw') return;
        this.held[index] = !this.held[index];
        this.drawFullScreen();
    }
    
    play(bet) {
        if (this.isAnimating) return;
        
        this.bet = bet || this.bet;
        
        if (this.gamePhase === 'bet' || this.gamePhase === 'result') {
            this.dealInitial();
        } else if (this.gamePhase === 'draw') {
            this.drawCards();
        }
    }
    
    dealInitial() {
        this.isAnimating = true;
        this.held = [false, false, false, false, false];
        this.deck = this.createDeck();
        this.shuffleDeck(this.deck);
        this.cards = [];
        this.gamePhase = 'deal';
        this.handRank = null;
        this.handName = '';
        this.winnings = 0;
        this.confettiParticles = [];
        
        for (let i = 0; i < 5; i++) {
            this.cards.push(this.deck.pop());
            this.dealAnimations.push({
                index: i,
                progress: 0,
                startTime: performance.now() + i * 80
            });
        }
        
        setTimeout(() => {
            this.gamePhase = 'draw';
            this.isAnimating = false;
            this.dealAnimations = [];
        }, 700);
    }
    
    drawCards() {
        this.isAnimating = true;
        
        for (let i = 0; i < 5; i++) {
            if (!this.held[i]) {
                this.cards[i] = this.deck.pop();
            }
        }
        
        const result = this.evaluateHand(this.cards);
        this.handRank = result.rank;
        this.handName = result.name;
        this.winnings = Math.floor(this.bet * result.payout);
        
        if (this.winnings > 0) this.chips += this.winnings;
        
        this.gamePhase = 'result';
        this.isAnimating = false;
        
        this.showResult();
        this.drawFullScreen();
    }
    
    showResult() {
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (this.winnings > 0) {
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            if (this.winCascade) {
                const count = this.handRank >= 7 ? 100 : 50;
                this.winCascade.spawn(this.w / 2, this.h / 2, count);
            }
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + this.handName + '! +RS ' + this.winnings + '</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + this.handName + ' -RS ' + this.bet + '</div>';
            }
        }
        
        setTimeout(() => {
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetGame();
            this.drawFullScreen();
        }, 4000);
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8, y: -20 - Math.random() * 100,
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
    
    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawScreen(ctx, w, h);
        this.drawPayTable(ctx, w, h);
        this.drawCards(ctx);
        this.drawHoldButtons(ctx);
        this.drawActionButton(ctx, w, h);
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
    
    drawScreen(ctx, w, h) {
        const sx = 15, sy = 50, sw = w - 30, sh = h - 145;
        
        const screenGrad = ctx.createLinearGradient(0, sy, 0, sy + sh);
        screenGrad.addColorStop(0, '#0a0a1a'); screenGrad.addColorStop(1, '#0f0f2a');
        ctx.fillStyle = screenGrad;
        ctx.strokeStyle = this.palette.gold; ctx.lineWidth = 2;
        this.roundRect(ctx, sx, sy, sw, sh, 12); ctx.fill(); ctx.stroke();
        
        // Title
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('VIDEO POKER', w / 2, sy + 18);
        
        // Status
        let statusText = 'Press DEAL to play';
        let statusColor = this.palette.gold;
        
        if (this.gamePhase === 'deal') { statusText = 'Dealing...'; statusColor = '#00b0ff'; }
        else if (this.gamePhase === 'draw') { statusText = 'Hold cards & press DRAW'; statusColor = '#00e676'; }
        else if (this.gamePhase === 'result') {
            statusText = this.handName;
            statusColor = this.winnings > 0 ? '#00e676' : '#ff4444';
        }
        
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 10px Georgia';
        ctx.fillText(statusText, w / 2, sy + sh - 12);
    }
    
    drawPayTable(ctx, w, h) {
        const py = h - 80, pw = w - 30;
        
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(212,168,67,0.2)'; ctx.lineWidth = 1;
        this.roundRect(ctx, 15, py, pw, 35, 8); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
        ctx.fillText('PAY TABLE (x bet)', w / 2, py + 10);
        
        const topPays = this.payTable.slice(0, 5);
        topPays.forEach(function(pay, i) {
            const px = 20 + i * (pw / 5);
            const highlight = this.handName === pay.name;
            
            ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 7px Georgia'; ctx.textAlign = 'center';
            ctx.fillText(pay.icon, px + pw / 10, py + 20);
            ctx.fillText('x' + pay.payout, px + pw / 10, py + 30);
        }.bind(this));
    }
    
    drawCards(ctx) {
        const startX = this.cardStartX;
        const y = this.cardY;
        
        this.cards.forEach(function(card, i) {
            let cx = startX + i * (this.cardWidth + 8);
            let cy = y;
            let scale = 1;
            
            const anim = this.dealAnimations.find(function(a) { return a.index === i; });
            if (anim) {
                scale = anim.progress;
                cx = startX + i * (this.cardWidth + 8) + (1 - scale) * 40;
                cy = y - (1 - scale) * 25;
            }
            
            ctx.save();
            ctx.translate(cx + this.cardWidth / 2, cy + this.cardHeight / 2);
            ctx.scale(Math.max(0.05, scale), Math.max(0.05, scale));
            ctx.translate(-(cx + this.cardWidth / 2), -(cy + this.cardHeight / 2));
            
            if (card) {
                this.drawSingleCard(ctx, cx, cy, this.cardWidth, this.cardHeight, card, true);
            }
            
            ctx.restore();
            
            // Held indicator
            if (this.held[i]) {
                ctx.fillStyle = 'rgba(0,230,118,0.2)';
                ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2;
                this.roundRect(ctx, cx - 3, cy - 3, this.cardWidth + 6, this.cardHeight + 6, 8);
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = '#00e676';
                ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center';
                ctx.fillText('HELD', cx + this.cardWidth / 2, cy + this.cardHeight + 14);
            }
        }.bind(this));
    }
    
    drawSingleCard(ctx, x, y, w, h, card, faceUp) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
        
        const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        bodyGrad.addColorStop(0, '#ffffff'); bodyGrad.addColorStop(0.5, '#f8f8f5'); bodyGrad.addColorStop(1, '#eeeeea');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.palette.cardBorder; ctx.lineWidth = 0.8;
        this.roundRect(ctx, x, y, w, h, 6); ctx.fill(); ctx.stroke();
        
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        
        if (faceUp && card) {
            const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
            const suitChar = suitSymbols[card.suit] || card.suit;
            const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.palette.red : this.palette.black;
            const fs = Math.floor(w * 0.28);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x + 4, y + 3);
            
            ctx.font = Math.floor(fs * 0.7) + 'px Georgia';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x + w / 2, y + h / 2);
        }
    }
    
    drawHoldButtons(ctx) {
        if (this.gamePhase !== 'draw') return;
        
        const startX = this.cardStartX;
        const btnY = this.cardY + this.cardHeight + 22;
        
        this.cards.forEach(function(card, i) {
            const bx = startX + i * (this.cardWidth + 8);
            const bw = this.cardWidth, bh = 20;
            
            ctx.fillStyle = this.held[i] ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = this.held[i] ? '#00e676' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = this.held[i] ? 1.5 : 1;
            this.roundRect(ctx, bx, btnY, bw, bh, 10); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = this.held[i] ? '#00e676' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('HOLD', bx + bw / 2, btnY + bh / 2);
        }.bind(this));
    }
    
    drawActionButton(ctx, w, h) {
        const by = h - 35, bw = 100, bh = 28;
        
        let label = 'DEAL';
        let color = this.palette.dealColor;
        if (this.gamePhase === 'draw') { label = 'DRAW'; color = this.palette.drawColor; }
        else if (this.gamePhase === 'deal') { label = '...'; color = '#888888'; }
        
        ctx.fillStyle = color + '20';
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - bw / 2, by, bw, bh, 14); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, by + bh / 2);
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
        const glowGrad = ctx.createRadialGradient(w / 2, this.cardY + this.cardHeight / 2, 50, w / 2, this.cardY + this.cardHeight / 2, 200);
        glowGrad.addColorStop(0, 'rgba(0,230,118,' + (this.winGlowAlpha * 0.2) + ')');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(w / 2, this.cardY + this.cardHeight / 2, 200, 0, Math.PI * 2); ctx.fill();
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
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.gamePhase !== 'draw' || this.isAnimating) return;
        
        const startX = this.cardStartX;
        const y = this.cardY;
        
        for (let i = 0; i < 5; i++) {
            const cx = startX + i * (this.cardWidth + 8);
            // Check card click
            if (clickX >= cx && clickX <= cx + this.cardWidth && clickY >= y && clickY <= y + this.cardHeight) {
                this.toggleHold(i);
                return;
            }
            // Check hold button click
            const btnY = y + this.cardHeight + 22;
            if (clickX >= cx && clickX <= cx + this.cardWidth && clickY >= btnY && clickY <= btnY + 20) {
                this.toggleHold(i);
                return;
            }
        }
    }
    
    handleKeyPress(key) {
        if (this.gamePhase === 'draw') {
            const num = parseInt(key);
            if (num >= 1 && num <= 5) this.toggleHold(num - 1);
        }
        if (key === ' ' || key === 'Enter') this.play(this.bet);
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullScreen(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = []; this.confettiParticles = [];
        this.dealAnimations = []; this.cards = []; this.deck = [];
    }
}

// Export
window.VideoPokerFullGame = VideoPokerFullGame;
console.log('Video Poker v3.0.0 - Real Casino Design Loaded');
