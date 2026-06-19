// ============================================
// EMERALD KING CASINO - GAME 6: BACCARAT
// Full Real Casino Visual Design
// Player, Banker, Tie Betting with Commission
// File: js/games/baccarat.js
// ============================================

class BaccaratFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.betSide = 'player'; // 'player', 'banker', 'tie'
        this.playerCards = [];
        this.bankerCards = [];
        this.playerScore = 0;
        this.bankerScore = 0;
        this.result = null; // 'player', 'banker', 'tie'
        this.isPlaying = false;
        this.isDealing = false;
        this.showdown = false;
        this.dealStep = 0;
        
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
            player: '#00e676',
            banker: '#ff4444',
            tie: '#FFD700',
            gold: '#FFD700',
            cardBg: '#1a1a2e'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.resetGame();
        this.drawFullTable();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
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
        this.dealStep = 0;
    }
    
    // ============================================
    // DECK OPERATIONS
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        for (let d = 0; d < 6; d++) { // 6-deck shoe
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
        if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
        if (rank === 'A') return 1;
        return parseInt(rank);
    }
    
    calculateBaccaratScore(cards) {
        let total = 0;
        for (const card of cards) {
            total += this.getBaccaratValue(card.rank);
        }
        return total % 10; // Only last digit counts
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    setSide(side) {
        if (this.isPlaying) return;
        this.betSide = side;
        this.drawFullTable();
    }
    
    play(bet) {
        if (this.isPlaying || this.isDealing) return;
        
        this.resetGame();
        this.bet = bet;
        this.isPlaying = true;
        this.isDealing = true;
        this.showdown = false;
        
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        // Deal initial 4 cards
        this.playerCards = [deck.pop(), deck.pop()];
        this.bankerCards = [deck.pop(), deck.pop()];
        this.playerScore = this.calculateBaccaratScore(this.playerCards);
        this.bankerScore = this.calculateBaccaratScore(this.bankerCards);
        
        // Check for natural (8 or 9)
        const playerNatural = this.playerScore >= 8;
        const bankerNatural = this.bankerScore >= 8;
        
        // Third card rules
        if (!playerNatural && !bankerNatural) {
            // Player draws third card if score < 6
            if (this.playerScore <= 5) {
                this.playerCards.push(deck.pop());
                this.playerScore = this.calculateBaccaratScore(this.playerCards);
                
                const playerThird = this.getBaccaratValue(this.playerCards[2].rank);
                
                // Banker draws based on complex rules
                let bankerDraws = false;
                if (this.bankerScore <= 2) {
                    bankerDraws = true;
                } else if (this.bankerScore === 3) {
                    bankerDraws = playerThird !== 8;
                } else if (this.bankerScore === 4) {
                    bankerDraws = playerThird >= 2 && playerThird <= 7;
                } else if (this.bankerScore === 5) {
                    bankerDraws = playerThird >= 4 && playerThird <= 7;
                } else if (this.bankerScore === 6) {
                    bankerDraws = playerThird === 6 || playerThird === 7;
                }
                
                if (bankerDraws) {
                    this.bankerCards.push(deck.pop());
                    this.bankerScore = this.calculateBaccaratScore(this.bankerCards);
                }
            } else {
                // Player stands, banker draws if score <= 5
                if (this.bankerScore <= 5) {
                    this.bankerCards.push(deck.pop());
                    this.bankerScore = this.calculateBaccaratScore(this.bankerCards);
                }
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
        
        this.isDealing = false;
        this.showdown = true;
        this.resolveGame();
        this.drawFullTable();
    }
    
    resolveGame() {
        const playerWon = this.result === this.betSide;
        const isTie = this.result === 'tie';
        const resultDisplay = document.getElementById('game-result-display');
        
        let payout = 0;
        let message = '';
        
        if (isTie) {
            if (this.betSide === 'tie') {
                payout = Math.floor(this.bet * 8); // 8:1 on tie
                this.chips += payout;
                message = `<span style="color:#FFD700;font-size:18px;">🤝 TIE!</span><br><span style="color:#00e676;">+${payout} CHIPS (8:1)</span>`;
            } else {
                this.chips += this.bet; // Return bet on tie
                message = `<span style="color:#FFD700;font-size:16px;">🤝 TIE</span><br><span style="color:rgba(255,255,255,0.6);">Bet returned</span>`;
            }
        } else if (playerWon) {
            if (this.betSide === 'banker') {
                payout = Math.floor(this.bet * 1.95); // 5% commission
                this.chips += payout;
                message = `<span style="color:#00e676;font-size:18px;">🎉 BANKER WINS!</span><br><span style="color:#00e676;">+${payout} CHIPS (0.95:1)</span>`;
            } else {
                payout = Math.floor(this.bet * 2); // 1:1
                this.chips += payout;
                message = `<span style="color:#00e676;font-size:18px;">🎉 PLAYER WINS!</span><br><span style="color:#00e676;">+${payout} CHIPS (1:1)</span>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 60);
        } else {
            message = `<span style="color:#ff4444;font-size:16px;">😞 ${this.result.toUpperCase()} WINS</span><br><span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>`;
        }
        
        if (resultDisplay) {
            resultDisplay.innerHTML = `<div style="animation: casinoSlideUp 0.5s ease-out;">${message}</div>`;
        }
        
        setTimeout(() => { this.resetGame(); }, 3500);
    }
    
    // ============================================
    // UPDATE LOOP
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
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
        this.drawBackground(ctx, w, h);
        
        // Table border
        this.drawTableBorder(ctx, w, h);
        
        // Table felt
        this.drawTableFelt(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Road map (score history)
        this.drawRoadMap(ctx, w, h);
        
        // Player area
        this.drawPlayerArea(ctx, w, h);
        
        // Banker area
        this.drawBankerArea(ctx, w, h);
        
        // Score displays
        this.drawScores(ctx, w, h);
        
        // Betting areas
        this.drawBettingAreas(ctx, w, h);
        
        // Sparkles
        this.drawSparkles(ctx);
        
        // Win particles
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w);
        bgGrad.addColorStop(0, '#033826');
        bgGrad.addColorStop(0.5, '#02231c');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 16, 16, w - 32, h - 32, 14);
        ctx.stroke();
    }
    
    drawTableFelt(ctx, w, h) {
        const feltGrad = ctx.createLinearGradient(0, 0, w, h);
        feltGrad.addColorStop(0, '#0d3320');
        feltGrad.addColorStop(0.5, '#0a2a1a');
        feltGrad.addColorStop(1, '#072218');
        ctx.fillStyle = feltGrad;
        CardRenderer.roundRect(ctx, 20, 20, w - 40, h - 40, 12);
        ctx.fill();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 25, w * 0.6, 32, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 25, w * 0.6, 32, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎴 BACCARAT', w / 2, 41);
    }
    
    drawRoadMap(ctx, w, h) {
        const rx = w - 75;
        const ry = 65;
        const rw = 55;
        const rh = 55;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, rx, ry, rw, rh, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ROAD', rx + rw / 2, ry + 12);
        ctx.fillText('MAP', rx + rw / 2, ry + 22);
        
        // Simulated beads
        const results = ['player', 'banker', 'player', 'player', 'banker', 'tie', 'banker', 'player'];
        results.forEach((r, i) => {
            const col = i % 6;
            const row = Math.floor(i / 6);
            const bx = rx + 8 + col * 9;
            const by = ry + 28 + row * 9;
            
            let color = '#00e676';
            if (r === 'banker') color = '#ff4444';
            if (r === 'tie') color = '#FFD700';
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawPlayerArea(ctx, w, h) {
        const px = 25;
        const py = 68;
        const pw = w / 2 - 45;
        const ph = h - 240;
        
        // Player zone
        ctx.fillStyle = 'rgba(0, 230, 118, 0.03)';
        ctx.strokeStyle = this.betSide === 'player' ? 'rgba(0, 230, 118, 0.6)' : 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = this.betSide === 'player' ? 2 : 1;
        CardRenderer.roundRect(ctx, px, py, pw, ph, 12);
        ctx.fill();
        ctx.stroke();
        
        // Player label
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLAYER', px + pw / 2, py + 18);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Arial';
        ctx.fillText('Pays 1:1', px + pw / 2, py + 32);
        
        // Player cards
        const cardW = 40;
        const cardH = 56;
        for (let i = 0; i < this.playerCards.length; i++) {
            const cx = px + 10 + i * 48;
            const cy = py + 45;
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.playerCards[i].suit, this.playerCards[i].rank, true);
        }
    }
    
    drawBankerArea(ctx, w, h) {
        const bx = w / 2 + 20;
        const by = 68;
        const bw = w / 2 - 45;
        const bh = h - 240;
        
        // Banker zone
        ctx.fillStyle = 'rgba(255, 68, 68, 0.03)';
        ctx.strokeStyle = this.betSide === 'banker' ? 'rgba(255, 68, 68, 0.6)' : 'rgba(255, 68, 68, 0.2)';
        ctx.lineWidth = this.betSide === 'banker' ? 2 : 1;
        CardRenderer.roundRect(ctx, bx, by, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        
        // Banker label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BANKER', bx + bw / 2, by + 18);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '8px Arial';
        ctx.fillText('Pays 0.95:1', bx + bw / 2, by + 32);
        
        // Banker cards
        const cardW = 40;
        const cardH = 56;
        for (let i = 0; i < this.bankerCards.length; i++) {
            const cx = bx + 10 + i * 48;
            const cy = by + 45;
            CardRenderer.drawCard(ctx, cx, cy, cardW, cardH, this.bankerCards[i].suit, this.bankerCards[i].rank, true);
        }
    }
    
    drawScores(ctx, w, h) {
        const scoreY = h - 170;
        
        // Player score
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.playerCards.length > 0 ? this.playerScore : '-', w * 0.22, scoreY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Arial';
        ctx.fillText('PLAYER', w * 0.22, scoreY + 20);
        
        // VS
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('VS', w / 2, scoreY);
        
        // Banker score
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(this.bankerCards.length > 0 ? this.bankerScore : '-', w * 0.78, scoreY);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Arial';
        ctx.fillText('BANKER', w * 0.78, scoreY + 20);
    }
    
    drawBettingAreas(ctx, w, h) {
        const betY = h - 130;
        const btnW = (w - 60) / 3;
        const btnH = 45;
        const gap = 8;
        
        const bets = [
            { label: 'PLAYER', sub: '1:1', color: '#00e676', side: 'player', x: 22 },
            { label: 'TIE', sub: '8:1', color: '#FFD700', side: 'tie', x: 22 + btnW + gap },
            { label: 'BANKER', sub: '0.95:1', color: '#ff4444', side: 'banker', x: 22 + (btnW + gap) * 2 }
        ];
        
        bets.forEach(bet => {
            const isSelected = this.betSide === bet.side;
            
            ctx.fillStyle = isSelected ? `${bet.color}20` : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isSelected ? bet.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, bet.x, betY, btnW, btnH, 12);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? bet.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bet.x + btnW / 2, betY + btnH / 2 - 6);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '8px Arial';
            ctx.fillText(bet.sub, bet.x + btnW / 2, betY + btnH / 2 + 12);
        });
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.4, sparkle.opacity));
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle.opacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
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
    }
}

// Export
window.BaccaratFullGame = BaccaratFullGame;
console.log('✅ Game 6: Baccarat - Full Casino Design Loaded');
