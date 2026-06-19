// ============================================
// EMERALD KING CASINO - GAME 2: ANDAR BAHAR
// Full Real Casino Visual Design
// File: js/games/andar-bahar.js
// ============================================

class AndarBaharFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedSide = 'andar'; // 'andar' or 'bahar'
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.winner = null;
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            andar: '#00e676',
            bahar: '#00b0ff',
            gold: '#FFD700',
            joker: '#ff4444',
            cardBg: '#1a1a2e'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.drawFullTable();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 25; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.4 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    // ============================================
    // DECK OPERATIONS
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
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
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSide(side) {
        if (this.isPlaying) return;
        this.selectedSide = side;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.isPlaying = true;
        this.isDealing = true;
        this.bet = bet;
        this.showdown = false;
        this.winner = null;
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        // Draw joker
        this.jokerCard = deck.pop();
        
        // Deal alternating cards until match found
        let found = false;
        let dealingTo = 'andar';
        let dealIndex = 0;
        
        const dealSequence = () => {
            if (found || deck.length === 0) {
                this.isDealing = false;
                this.resolveGame();
                return;
            }
            
            const card = deck.pop();
            
            if (dealingTo === 'andar') {
                this.andarCards.push(card);
                dealingTo = 'bahar';
            } else {
                this.baharCards.push(card);
                dealingTo = 'andar';
            }
            
            if (card.rank === this.jokerCard.rank) {
                found = true;
                this.winner = dealingTo === 'andar' ? 'bahar' : 'andar';
            }
            
            dealIndex++;
            this.drawFullTable();
            
            if (!found) {
                setTimeout(dealSequence, 600);
            } else {
                setTimeout(() => {
                    this.isDealing = false;
                    this.resolveGame();
                }, 600);
            }
        };
        
        setTimeout(dealSequence, 500);
    }
    
    resolveGame() {
        this.showdown = true;
        const playerWon = this.winner === this.selectedSide;
        const resultDisplay = document.getElementById('game-result-display');
        
        if (playerWon) {
            const payout = Math.floor(this.bet * 1.9);
            this.chips += payout;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#FFD700;font-size:16px;">🎉 YOU WIN!</span><br>
                        <span style="color:#00e676;">+${payout} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">${this.winner.toUpperCase()} matched first</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 70);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 YOU LOST</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span><br>
                        <span style="color:rgba(255,255,255,0.4);font-size:9px;">${this.winner.toUpperCase()} matched first</span>
                    </div>`;
            }
        }
        
        setTimeout(() => {
            this.isPlaying = false;
        }, 3000);
        
        this.drawFullTable();
    }
    
    // ============================================
    // RENDERING - FULL TABLE
    // ============================================
    
    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.8);
        bgGrad.addColorStop(0, '#033826');
        bgGrad.addColorStop(0.6, '#02231c');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Table border
        this.drawTableBorder(ctx, w, h);
        
        // Table felt
        this.drawTableFelt(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Joker zone (center)
        this.drawJokerZone(ctx, w, h);
        
        // Andar zone (left)
        this.drawAndarZone(ctx, w, h);
        
        // Bahar zone (right)
        this.drawBaharZone(ctx, w, h);
        
        // Side selector buttons
        this.drawSideSelector(ctx, w, h);
        
        // Sparkles
        this.drawSparkles(ctx);
        
        // Win particles
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawTableBorder(ctx, w, h) {
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 20);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 16, 16, w - 32, h - 32, 16);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const feltGrad = ctx.createLinearGradient(0, 0, w, h);
        feltGrad.addColorStop(0, '#0d3320');
        feltGrad.addColorStop(0.5, '#0a2a1a');
        feltGrad.addColorStop(1, '#072218');
        ctx.fillStyle = feltGrad;
        CardRenderer.roundRect(ctx, 20, 20, w - 40, h - 40, 13);
        ctx.fill();
        
        // Grid
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 28; x < w - 28; x += 25) {
            ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x, h - 28); ctx.stroke();
        }
        for (let y = 28; y < h - 28; y += 25) {
            ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(w - 28, y); ctx.stroke();
        }
    }
    
    drawTitle(ctx, w, h) {
        // Title banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 28, w * 0.6, 35, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 28, w * 0.6, 35, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯 ANDAR BAHAR', w / 2, 46);
    }
    
    drawJokerZone(ctx, w, h) {
        const jx = w / 2 - 30;
        const jy = h / 2 - 35;
        const jw = 60;
        const jh = 70;
        
        // Zone background
        ctx.fillStyle = 'rgba(255, 68, 68, 0.05)';
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        CardRenderer.roundRect(ctx, jx - 5, jy - 25, jw + 10, jh + 30, 10);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Joker label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 JOKER', w / 2, jy - 10);
        
        // Joker card
        if (this.jokerCard) {
            if (typeof CardRenderer !== 'undefined') {
                CardRenderer.drawCard(ctx, jx, jy, jw, jh, this.jokerCard.suit, this.jokerCard.rank, true);
            }
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            CardRenderer.roundRect(ctx, jx, jy, jw, jh, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', w / 2, jy + jh / 2);
        }
    }
    
    drawAndarZone(ctx, w, h) {
        const ax = 28;
        const ay = 78;
        const aw = (w / 2) - 50;
        const ah = h - 160;
        
        // Zone
        ctx.fillStyle = 'rgba(0, 230, 118, 0.03)';
        ctx.strokeStyle = this.selectedSide === 'andar' ? 'rgba(0, 230, 118, 0.8)' : 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = this.selectedSide === 'andar' ? 2 : 1;
        CardRenderer.roundRect(ctx, ax, ay, aw, ah, 12);
        ctx.fill();
        ctx.stroke();
        
        // Header
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ANDAR', ax + aw / 2, ay + 20);
        
        // Cards
        this.andarCards.forEach((card, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = ax + 8 + col * 40;
            const cy = ay + 30 + row * 32;
            if (typeof CardRenderer !== 'undefined') {
                CardRenderer.drawCard(ctx, cx, cy, 28, 38, card.suit, card.rank, true);
            }
        });
    }
    
    drawBaharZone(ctx, w, h) {
        const bx = w / 2 + 22;
        const by = 78;
        const bw = (w / 2) - 50;
        const bh = h - 160;
        
        // Zone
        ctx.fillStyle = 'rgba(0, 176, 255, 0.03)';
        ctx.strokeStyle = this.selectedSide === 'bahar' ? 'rgba(0, 176, 255, 0.8)' : 'rgba(0, 176, 255, 0.2)';
        ctx.lineWidth = this.selectedSide === 'bahar' ? 2 : 1;
        CardRenderer.roundRect(ctx, bx, by, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        
        // Header
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BAHAR', bx + bw / 2, by + 20);
        
        // Cards
        this.baharCards.forEach((card, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = bx + 8 + col * 40;
            const cy = by + 30 + row * 32;
            if (typeof CardRenderer !== 'undefined') {
                CardRenderer.drawCard(ctx, cx, cy, 28, 38, card.suit, card.rank, true);
            }
        });
    }
    
    drawSideSelector(ctx, w, h) {
        const sy = h - 62;
        const btnW = 80;
        const btnH = 35;
        
        // Andar button
        const ax = w / 2 - btnW - 10;
        ctx.fillStyle = this.selectedSide === 'andar' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = this.selectedSide === 'andar' ? '#00e676' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = this.selectedSide === 'andar' ? 2 : 1;
        CardRenderer.roundRect(ctx, ax, sy, btnW, btnH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ANDAR', ax + btnW / 2, sy + btnH / 2);
        
        // Bahar button
        const bx = w / 2 + 10;
        ctx.fillStyle = this.selectedSide === 'bahar' ? 'rgba(0, 176, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = this.selectedSide === 'bahar' ? '#00b0ff' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = this.selectedSide === 'bahar' ? 2 : 1;
        CardRenderer.roundRect(ctx, bx, sy, btnW, btnH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00b0ff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BAHAR', bx + btnW / 2, sy + btnH / 2);
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.5, sparkle.opacity));
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle.opacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    update(timestamp) {
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    render() {
        this.drawFullTable();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
    }
}

// Export
window.AndarBaharFullGame = AndarBaharFullGame;
console.log('✅ Game 2: Andar Bahar - Full Casino Design Loaded');
