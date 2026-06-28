// ============================================
// EMERALD KING CASINO - TEEN PATTI
// Real Casino Experience - 3D Cards, Chips, Dealer
// Real Physics, Sound, Wallet Connect
// ============================================

class TeenPattiFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.w = 0;
        this.h = 0;
        this.dpr = window.devicePixelRatio || 1;
        
        // Wallet
        this.balance = 0;
        this.bet = 100;
        this.totalBet = 0;
        this.potAmount = 0;
        this.winnings = 0;
        
        // Side bets
        this.sideBets = { pairPlus: 0, threePlus: 0 };
        
        // Game state
        this.playerCards = [];
        this.dealerCards = [];
        this.playerRank = null;
        this.dealerRank = null;
        this.result = null;
        this.isPlaying = false;
        this.gameOver = false;
        this.phase = 'betting'; // betting, dealing, reveal, result
        
        // Animation
        this.dealProgress = 0;
        this.cardAnimations = [];
        this.chipBounce = 0;
        this.tableGlow = 0;
        
        // Dealer avatar
        this.dealerMood = 'neutral'; // neutral, happy, sad
        
        // Particles
        this.particles = [];
        this.celebrationParticles = [];
        this.celebration = false;
        this.celebrationTimer = 0;
        
        // Cards
        this.cardWidth = 62;
        this.cardHeight = 88;
        
        // Sound
        this.audioCtx = null;
        
        // Card back pattern
        this.cardBackPattern = null;
        
        this.initAudio();
        this.loadBalance();
    }
    
    // ============================================
    // AUDIO
    // ============================================
    
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }
    
    playSound(freq, type, duration, vol) {
        if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq || 440;
            gain.gain.setValueAtTime((vol || 0.08), this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (duration || 0.15));
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + (duration || 0.15) + 0.05);
        } catch(e) {}
    }
    
    playCardDeal() { this.playSound(300 + Math.random() * 200, 'triangle', 0.06, 0.05); }
    playChipClick() { this.playSound(800, 'sine', 0.04, 0.04); }
    playWin() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playSound(f, 'square', 0.2, 0.08), i * 120);
        });
    }
    playLose() { this.playSound(150, 'sawtooth', 0.5, 0.06); }
    
    // ============================================
    // WALLET
    // ============================================
    
    loadBalance() {
        if (window.currentUser && typeof window.currentUser.balance === 'number') {
            this.balance = window.currentUser.balance;
        } else {
            this.balance = 5000;
        }
    }
    
    updateBalance(amount) {
        this.balance = Math.max(0, this.balance + amount);
        if (window.currentUser) window.currentUser.balance = this.balance;
        if (window.GameLoaderSystem) GameLoaderSystem.updateBalance(this.balance);
        if (typeof updateUI === 'function') updateUI();
    }
    
    // ============================================
    // INIT
    // ============================================
    
    init() {
        if (this.canvas) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.w = rect.width;
            this.h = rect.height;
        }
        if (!this.w || !this.h) { this.w = 500; this.h = 650; }
        
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        this.cardWidth = Math.max(50, this.w * 0.12);
        this.cardHeight = this.cardWidth * 1.42;
        
        this.generateCardBackPattern();
        this.resetGame();
        this.draw();
    }
    
    resize() {
        if (this.canvas) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.w = rect.width;
            this.h = rect.height;
        }
        if (!this.w || !this.h) { this.w = 500; this.h = 650; }
        
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        this.cardWidth = Math.max(50, this.w * 0.12);
        this.cardHeight = this.cardWidth * 1.42;
        this.draw();
    }
    
    generateCardBackPattern() {
        const size = 100;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const octx = offCanvas.getContext('2d');
        
        octx.fillStyle = '#1a0a3a';
        octx.fillRect(0, 0, size, size);
        
        octx.strokeStyle = 'rgba(255,215,0,0.3)';
        octx.lineWidth = 2;
        octx.strokeRect(5, 5, size - 10, size - 10);
        
        octx.strokeStyle = 'rgba(255,215,0,0.15)';
        octx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            octx.beginPath();
            octx.moveTo(size/2, 10);
            octx.lineTo(10 + i * 20, size - 10);
            octx.stroke();
            octx.beginPath();
            octx.moveTo(10, 10 + i * 20);
            octx.lineTo(size - 10, size/2 + i * 10);
            octx.stroke();
        }
        
        octx.fillStyle = '#2a1a5a';
        octx.beginPath();
        octx.arc(size/2, size/2, size*0.3, 0, Math.PI*2);
        octx.fill();
        octx.strokeStyle = 'rgba(255,215,0,0.5)';
        octx.lineWidth = 1;
        octx.stroke();
        
        octx.fillStyle = '#FFD700';
        octx.font = 'bold 24px Georgia';
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText('TP', size/2, size/2);
        
        this.cardBackPattern = offCanvas;
    }
    
    resetGame() {
        this.playerCards = [];
        this.dealerCards = [];
        this.playerRank = null;
        this.dealerRank = null;
        this.result = null;
        this.isPlaying = false;
        this.gameOver = false;
        this.phase = 'betting';
        this.dealProgress = 0;
        this.winnings = 0;
        this.totalBet = 0;
        this.potAmount = 0;
        this.cardAnimations = [];
        this.particles = [];
        this.celebration = false;
        this.celebrationParticles = [];
        this.dealerMood = 'neutral';
        this.sideBets = { pairPlus: 0, threePlus: 0 };
    }
    
    // ============================================
    // DECK
    // ============================================
    
    createDeck() {
        const deck = [];
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        return deck;
    }
    
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    getValue(rank) {
        const v = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
        return v[rank];
    }
    
    evaluateHand(cards) {
        const vals = cards.map(c => this.getValue(c.rank)).sort((a,b) => b-a);
        const suits = cards.map(c => c.suit);
        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isStraight = (vals[0]-vals[1]===1 && vals[1]-vals[2]===1) || (vals[0]===14 && vals[1]===3 && vals[2]===2);
        const isTrio = vals[0]===vals[1] && vals[1]===vals[2];
        const isPair = vals[0]===vals[1] || vals[1]===vals[2];
        
        if (isTrio) return { name:'TRIO', rank:6, high:vals[0], color:'#FFD700', icon:'👑', payout:5 };
        if (isStraight && isFlush) return { name:'PURE SEQUENCE', rank:5, high:vals[0], color:'#ff4444', icon:'🌟', payout:4 };
        if (isStraight) return { name:'SEQUENCE', rank:4, high:vals[0], color:'#00b0ff', icon:'📈', payout:3 };
        if (isFlush) return { name:'FLUSH', rank:3, high:vals[0], color:'#ff69b4', icon:'🌸', payout:2 };
        if (isPair) return { name:'PAIR', rank:2, high:vals[1], color:'#00e676', icon:'👫', payout:1 };
        return { name:'HIGH CARD', rank:1, high:vals[0], color:'#888888', icon:'📋', payout:0 };
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    toggleSideBet(type) {
        if (this.isPlaying) return;
        if (this.sideBets[type] > 0) {
            this.sideBets[type] = 0;
        } else {
            this.sideBets[type] = this.bet;
        }
        this.playChipClick();
        this.draw();
    }
    
    play(betAmount) {
        if (this.isPlaying) return;
        
        this.loadBalance();
        const actualBet = betAmount || this.bet;
        this.totalBet = actualBet + this.sideBets.pairPlus + this.sideBets.threePlus;
        
        if (this.totalBet > this.balance) {
            if (window.GameLoaderSystem) GameLoaderSystem.showToast('Insufficient balance!');
            return;
        }
        
        this.updateBalance(-this.totalBet);
        
        this.bet = actualBet;
        this.potAmount = this.bet * 2;
        this.isPlaying = true;
        this.gameOver = false;
        this.phase = 'dealing';
        this.result = null;
        this.winnings = 0;
        this.cardAnimations = [];
        this.celebration = false;
        this.dealerMood = 'neutral';
        
        const deck = this.createDeck();
        this.shuffle(deck);
        
        this.playerCards = [deck.pop(), deck.pop(), deck.pop()];
        this.dealerCards = [deck.pop(), deck.pop(), deck.pop()];
        
        this.playerRank = this.evaluateHand(this.playerCards);
        this.dealerRank = this.evaluateHand(this.dealerCards);
        
        if (this.playerRank.rank > this.dealerRank.rank) {
            this.result = 'win';
        } else if (this.dealerRank.rank > this.playerRank.rank) {
            this.result = 'lose';
        } else {
            this.result = this.playerRank.high >= this.dealerRank.high ? 'win' : 'lose';
        }
        
        this.animateDeal();
    }
    
    animateDeal() {
        this.dealProgress = 0;
        const totalFrames = 60;
        let frame = 0;
        
        const animInterval = setInterval(() => {
            frame++;
            this.dealProgress = frame / totalFrames;
            
            // Animate each card
            for (let i = 0; i < 6; i++) {
                if (!this.cardAnimations[i]) {
                    this.cardAnimations[i] = { startFrame: i * 8, progress: 0 };
                }
                const anim = this.cardAnimations[i];
                if (frame >= anim.startFrame) {
                    anim.progress = Math.min(1, (frame - anim.startFrame) / 15);
                }
                if (frame === anim.startFrame + 1) this.playCardDeal();
            }
            
            if (frame >= totalFrames * 0.7) {
                this.phase = 'reveal';
            }
            
            this.draw();
            
            if (frame >= totalFrames) {
                clearInterval(animInterval);
                this.phase = 'result';
                this.gameOver = true;
                this.isPlaying = false;
                this.resolveGame();
            }
        }, 30);
    }
    
    resolveGame() {
        this.winnings = 0;
        
        // Main bet
        if (this.result === 'win') {
            this.winnings += Math.floor(this.bet * 1.9);
        }
        
        // Side bets
        if (this.sideBets.pairPlus > 0 && this.playerRank.rank >= 2) {
            this.winnings += Math.floor(this.sideBets.pairPlus * this.playerRank.payout);
        }
        if (this.sideBets.threePlus > 0 && this.playerRank.rank === 6) {
            this.winnings += Math.floor(this.sideBets.threePlus * 10);
        }
        
        if (this.winnings > 0) {
            this.updateBalance(this.winnings);
            this.celebration = true;
            this.celebrationTimer = 0;
            this.dealerMood = 'sad';
            this.generateCelebration();
            this.playWin();
            if (window.GameLoaderSystem) GameLoaderSystem.showWinOverlay(this.winnings);
        } else {
            this.dealerMood = 'happy';
            this.playLose();
            if (window.GameLoaderSystem) GameLoaderSystem.showLoseOverlay(this.totalBet);
        }
        
        this.draw();
        
        setTimeout(() => {
            this.celebration = false;
            this.celebrationParticles = [];
            this.resetGame();
            this.draw();
        }, 5000);
    }
    
    generateCelebration() {
        this.celebrationParticles = [];
        const colors = ['#FFD700','#00e676','#ff4444','#00b0ff','#ff8800','#ffffff','#c084fc'];
        for (let i = 0; i < 150; i++) {
            this.celebrationParticles.push({
                x: this.w/2, y: this.h*0.5,
                vx: (Math.random()-0.5)*10, vy: -Math.random()*15-5,
                size: 2+Math.random()*6, color: colors[Math.floor(Math.random()*colors.length)],
                life: 1, rotation: Math.random()*Math.PI*2, rotSpeed: (Math.random()-0.5)*0.3
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.tableGlow += 0.015;
        this.chipBounce += 0.04;
        
        if (this.celebration) {
            this.celebrationTimer++;
            this.celebrationParticles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.06;
                p.rotation += p.rotSpeed;
                p.life -= 0.005;
            });
            this.celebrationParticles = this.celebrationParticles.filter(p => p.life > 0);
        }
        
        this.draw();
    }
    
    // ============================================
    // RENDER
    // ============================================
    
    draw() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx);
        
        // Table
        this.drawTable(ctx);
        
        // Dealer
        this.drawDealer(ctx);
        
        // Cards
        this.drawCards(ctx);
        
        // Pot & Chips
        this.drawPot(ctx);
        
        // Rankings
        if (this.phase === 'result') {
            this.drawRankings(ctx);
        }
        
        // Side bets
        this.drawSideBets(ctx);
        
        // Header
        this.drawHeader(ctx);
        
        // Celebration
        if (this.celebration) {
            this.drawCelebration(ctx);
        }
        
        // Chip particles
        this.drawParticles(ctx);
    }
    
    drawBackground(ctx) {
        // Dark ambient
        const bgGrad = ctx.createRadialGradient(this.w/2, this.h*0.4, 10, this.w/2, this.h*0.4, this.w);
        bgGrad.addColorStop(0, '#1a1025');
        bgGrad.addColorStop(0.5, '#0d0815');
        bgGrad.addColorStop(1, '#050208');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.w, this.h);
        
        // Ambient lights
        const lightGrad = ctx.createRadialGradient(this.w*0.3, this.h*0.3, 30, this.w*0.3, this.h*0.3, this.w*0.6);
        lightGrad.addColorStop(0, 'rgba(255,215,0,0.04)');
        lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, this.w, this.h);
    }
    
    drawTable(ctx) {
        const tx = 15, ty = this.h*0.07, tw = this.w - 30, th = this.h*0.78;
        
        // Table shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.roundRect(ctx, tx+4, ty+4, tw, th, 20);
        ctx.fill();
        
        // Table body
        const tableGrad = ctx.createLinearGradient(0, ty, 0, ty+th);
        tableGrad.addColorStop(0, '#1a3a1a');
        tableGrad.addColorStop(0.3, '#0f2a0f');
        tableGrad.addColorStop(0.7, '#0d240d');
        tableGrad.addColorStop(1, '#0a1a0a');
        ctx.fillStyle = tableGrad;
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, tx, ty, tw, th, 20);
        ctx.fill();
        ctx.stroke();
        
        // Inner gold line
        ctx.strokeStyle = 'rgba(212,168,67,0.12)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, tx+10, ty+10, tw-20, th-20, 15);
        ctx.stroke();
        
        // Felt texture
        ctx.fillStyle = 'rgba(255,255,255,0.008)';
        for (let x = tx+4; x < tx+tw-4; x+=3) {
            for (let y = ty+4; y < ty+th-4; y+=3) {
                if ((x+y)%6===0) ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    drawDealer(ctx) {
        const dx = this.w/2;
        const dy = this.h*0.15;
        
        // Dealer glow
        const moodColor = this.dealerMood === 'happy' ? '#ff4444' : this.dealerMood === 'sad' ? '#00e676' : '#FFD700';
        const glowGrad = ctx.createRadialGradient(dx, dy, 10, dx, dy, 50);
        glowGrad.addColorStop(0, moodColor + '20');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(dx, dy, 50, 0, Math.PI*2);
        ctx.fill();
        
        // Dealer avatar circle
        ctx.fillStyle = '#1a0a2a';
        ctx.strokeStyle = moodColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx, dy, 28, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Dealer face
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let face = '😐';
        if (this.dealerMood === 'happy') face = '😄';
        if (this.dealerMood === 'sad') face = '😞';
        ctx.fillText(face, dx, dy);
        
        // Dealer label
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 9px Georgia';
        ctx.fillText('DEALER', dx, dy + 38);
    }
    
    drawCards(ctx) {
        const cw = this.cardWidth;
        const ch = this.cardHeight;
        
        // Dealer cards
        const dealerY = this.h * 0.23;
        const dealerTotalW = 3 * (cw + 6) - 6;
        const dealerStartX = this.w/2 - dealerTotalW/2;
        
        for (let i = 0; i < 3; i++) {
            const cx = dealerStartX + i * (cw + 6);
            const anim = this.cardAnimations ? this.cardAnimations[i] : null;
            const progress = anim ? anim.progress : (this.dealerCards[i] ? 1 : 0);
            const faceUp = this.phase === 'result' || this.phase === 'reveal';
            
            if (this.dealerCards[i]) {
                this.drawCard(ctx, cx, dealerY, cw, ch, this.dealerCards[i], faceUp, progress, 'dealer');
            }
        }
        
        // Player cards
        const playerY = this.h * 0.55;
        const playerTotalW = 3 * (cw + 6) - 6;
        const playerStartX = this.w/2 - playerTotalW/2;
        
        for (let i = 0; i < 3; i++) {
            const cx = playerStartX + i * (cw + 6);
            const anim = this.cardAnimations ? this.cardAnimations[i + 3] : null;
            const progress = anim ? anim.progress : (this.playerCards[i] ? 1 : 0);
            
            if (this.playerCards[i]) {
                this.drawCard(ctx, cx, playerY, cw, ch, this.playerCards[i], true, progress, 'player');
            } else {
                // Empty slot
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3,3]);
                this.roundRect(ctx, cx, playerY, cw, ch, 8);
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
    
    drawCard(ctx, x, y, w, h, card, faceUp, progress, owner) {
        ctx.save();
        
        const cx = x + w/2;
        const cy = y + h/2;
        const scale = Math.max(0.05, Math.min(1, progress));
        const slideY = (1 - progress) * (-40) * (owner === 'dealer' ? -1 : 1);
        
        ctx.translate(cx, cy + slideY);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        
        if (faceUp && card) {
            // Card body
            const bodyGrad = ctx.createLinearGradient(x, y, x+w, y+h);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.4, '#fafaf5');
            bodyGrad.addColorStop(1, '#eee8e0');
            ctx.fillStyle = bodyGrad;
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            this.roundRect(ctx, x, y, w, h, 8);
            ctx.fill();
            ctx.stroke();
            
            // Inner border
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 0.5;
            this.roundRect(ctx, x+4, y+4, w-8, h-8, 5);
            ctx.stroke();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Suit & rank
            const suits = { 'S':'♠','H':'♥','D':'♦','C':'♣' };
            const suitChar = suits[card.suit] || card.suit;
            const suitColor = (card.suit==='H'||card.suit==='D') ? '#cc0000' : '#1a1a1a';
            const fs = Math.floor(w*0.28);
            
            ctx.fillStyle = suitColor;
            ctx.font = 'bold ' + fs + 'px Georgia';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.rank, x+5, y+4);
            
            ctx.font = Math.floor(fs*0.65) + 'px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suitChar, x+w/2, y+h/2);
            
        } else {
            // Card back
            if (this.cardBackPattern) {
                ctx.drawImage(this.cardBackPattern, x, y, w, h);
            } else {
                ctx.fillStyle = '#1a0a3a';
                ctx.strokeStyle = '#2a1a5a';
                ctx.lineWidth = 1;
                this.roundRect(ctx, x, y, w, h, 8);
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        ctx.restore();
    }
    
    drawPot(ctx) {
        const px = this.w/2;
        const py = this.h*0.41;
        
        // Glow
        const potGlow = ctx.createRadialGradient(px, py, 5, px, py, 35);
        potGlow.addColorStop(0, 'rgba(255,215,0,0.2)');
        potGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = potGlow;
        ctx.beginPath();
        ctx.arc(px, py, 35, 0, Math.PI*2);
        ctx.fill();
        
        // Pot circle
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 25, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('POT', px, py-5);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Georgia';
        ctx.fillText('RS ' + this.potAmount, px, py+12);
        
        // Chip stacks
        const chipColors = ['#cc0000','#0044cc','#00aa44','#1a1a1a'];
        for (let i = 0; i < 4; i++) {
            const angle = (i/4)*Math.PI*2 + this.chipBounce*0.3;
            const cx = px + Math.cos(angle)*18;
            const cy = py + Math.sin(angle)*18;
            
            for (let j = 0; j < 3; j++) {
                ctx.fillStyle = chipColors[i];
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.ellipse(cx, cy - j*2 + Math.sin(this.chipBounce+j)*1, 7, 2.5, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
    
    drawRankings(ctx) {
        if (!this.playerRank || !this.dealerRank) return;
        
        // Player rank
        const px = this.w/2;
        const py = this.h*0.51;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.playerRank.color;
        ctx.lineWidth = 1;
        this.roundRect(ctx, px-85, py-4, 170, 22, 11);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.playerRank.color;
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.playerRank.icon + ' ' + this.playerRank.name, px, py+10);
        
        // Dealer rank
        const dy = this.h*0.20;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.dealerRank.color;
        ctx.lineWidth = 1;
        this.roundRect(ctx, px-85, dy-4, 170, 22, 11);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.dealerRank.color;
        ctx.font = 'bold 9px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.dealerRank.icon + ' ' + this.dealerRank.name, px, dy+10);
    }
    
    drawSideBets(ctx) {
        const sy = this.h*0.82;
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('SIDE BETS', this.w/2, sy-6);
        
        const bets = [
            { label:'PAIR PLUS', key:'pairPlus', x:this.w/2-90 },
            { label:'3+ BONUS', key:'threePlus', x:this.w/2+10 }
        ];
        
        bets.forEach(bet => {
            const isActive = this.sideBets[bet.key] > 0;
            
            ctx.fillStyle = isActive ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)';
            ctx.strokeStyle = isActive ? '#FFD700' : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isActive ? 1.5 : 0.8;
            this.roundRect(ctx, bet.x, sy+2, 80, 28, 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = isActive ? '#FFD700' : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 8px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bet.label, bet.x+40, sy+16);
        });
    }
    
    drawHeader(ctx) {
        // Title
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.roundRect(ctx, this.w*0.25, 8, this.w*0.5, 30, 12);
        ctx.fill();
        
        ctx.fillStyle = '#d4a843';
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('TEEN PATTI', this.w/2, 24);
        
        // Balance
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, this.w-115, 10, 100, 26, 13);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('RS ' + this.balance.toFixed(2), this.w-65, 28);
    }
    
    drawCelebration(ctx) {
        this.celebrationParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });
    }
    
    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.fillStyle = 'rgba(255,215,0,' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
    }
    
    // ============================================
    // UTILS
    // ============================================
    
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.arcTo(x+w, y, x+w, y+r, r);
        ctx.lineTo(x+w, y+h-r);
        ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
        ctx.lineTo(x+r, y+h);
        ctx.arcTo(x, y+h, x, y+h-r, r);
        ctx.lineTo(x, y+r);
        ctx.arcTo(x, y, x+r, y, r);
        ctx.closePath();
    }
    
    // ============================================
    // CLICK
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isPlaying) return;
        
        // Side bets
        const sy = this.h*0.82;
        const bets = [
            { key:'pairPlus', x:this.w/2-90 },
            { key:'threePlus', x:this.w/2+10 }
        ];
        
        bets.forEach(bet => {
            if (clickX >= bet.x && clickX <= bet.x+80 && clickY >= sy+2 && clickY <= sy+30) {
                this.toggleSideBet(bet.key);
            }
        });
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.draw(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        this.isPlaying = false;
        this.particles = [];
        this.celebrationParticles = [];
        this.cardAnimations = [];
    }
}

// Export
window.TeenPattiFullGame = TeenPattiFullGame;
console.log('Teen Patti - Real Casino Experience Loaded');
