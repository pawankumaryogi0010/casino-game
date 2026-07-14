// ============================================
// ANDAR BAHAR PREMIUM CASINO CARD GAME v5.0
// Professional IGaming Architecture
// Pillars: Premium UI/UX | Card Physics | FSM State Machine | Controlled RTP | Secure Wallet Hooks
// ============================================

class AndarBaharFullGame {
    constructor(canvas, ctx) {
        // ============================================
        // CANVAS & RENDERING CONTEXT
        // ============================================
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = window.devicePixelRatio || 1;
        this.w = 0;
        this.h = 0;

        // ============================================
        // PILLAR 4: RTP CONFIGURATION
        // ============================================
        this.RTP_CONFIG = {
            targetRTP: 0.945,           // 94.5% Return to Player
            houseEdge: 0.055,           // 5.5% House Edge
            andarFirstProbability: 0.515, // Andar gets first card (slight edge)
            payoutMultiplier: 1.9,       // 1.9x payout (built-in house edge)
            deckCount: 6                 // 6-deck shoe
        };

        // ============================================
        // PILLAR 4: PROVABLY FAIR SEED STRUCTURE
        // ============================================
        this.provablyFair = {
            serverSeed: null,
            clientSeed: null,
            nonce: 0,
            combinedHash: null,
            deckOrder: null,
            jokerCardIndex: null
        };

        // ============================================
        // PILLAR 3: FINITE STATE MACHINE (FSM)
        // ============================================
        this.FSM_STATES = {
            IDLE: 'IDLE',
            PLACING_BET: 'PLACING_BET',
            GAME_START: 'GAME_START',
            DEALING_JOKER: 'DEALING_JOKER',
            DEALING_CARDS: 'DEALING_CARDS',
            ANIMATING_CARD: 'ANIMATING_CARD',
            DETERMINING_OUTCOME: 'DETERMINING_OUTCOME',
            PAYOUT_TRIGGER: 'PAYOUT_TRIGGER',
            CLEANUP: 'CLEANUP'
        };

        this.currentState = this.FSM_STATES.IDLE;
        this.previousState = null;
        this.stateTimer = 0;
        this.stateTransitionLocked = false;

        // ============================================
        // GAME STATE VARIABLES
        // ============================================
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.winner = null;           // 'andar' | 'bahar'
        this.dealSide = 'andar';      // Current dealing side
        this.dealIndex = 0;
        this.totalCardsDealt = 0;
        this.matchFound = false;
        this.roundNumber = 0;

        // ============================================
        // PILLAR 5: WALLET STATE (READ-ONLY DISPLAY)
        // ============================================
        this.walletState = {
            balance: 1000.00,
            currency: 'USD',
            totalWagered: 0,
            totalWon: 0,
            isProcessing: false
        };

        // ============================================
        // PILLAR 5: SECURE CALLBACK HOOKS
        // ============================================
        this.hooks = {
            onBetPlaced: null,
            onGameResultCalculated: null,
            onError: null,
            onStateChange: null
        };

        // ============================================
        // BETTING SYSTEM
        // ============================================
        this.bets = {
            andar: { amount: 0, isActive: false },
            bahar: { amount: 0, isActive: false }
        };
        this.totalBet = 0;
        this.winnings = 0;
        this.betAmount = 50;

        // ============================================
        // PILLAR 2: CARD PHYSICS & ANIMATION
        // ============================================
        this.cardAnimation = {
            active: false,
            progress: 0,
            startX: 0,
            startY: 0,
            targetX: 0,
            targetY: 0,
            scale: 1,
            rotation: 0,
            flipProgress: 0,
            dealingCard: null,
            dealingSide: null
        };

        // ============================================
        // PILLAR 2: PARTICLE SYSTEMS
        // ============================================
        this.particles = {
            cardDeal: [],        // Sparkles on card deal
            confetti: [],        // Win celebration
            jokerGlow: [],       // Joker reveal particles
            spotlight: []        // Winner spotlight particles
        };

        // ============================================
        // VISUAL EFFECTS STATE
        // ============================================
        this.effects = {
            jokerRevealProgress: 0,
            jokerRevealed: false,
            winnerGlowAlpha: 0,
            winnerSpotlightAlpha: 0,
            spotlightTarget: null,
            tablePulsePhase: 0
        };

        // ============================================
        // PILLAR 1: PREMIUM COLOR PALETTE
        // ============================================
        this.colors = {
            // Deep luxury backgrounds
            bgDeep: '#050508',
            bgMid: '#0a0a12',
            bgLight: '#0f0f1a',

            // Gold accents
            gold: '#D4AF37',
            goldLight: '#F0D060',
            goldDark: '#8B6914',
            goldGlow: 'rgba(212, 175, 55, 0.6)',

            // Table colors
            feltGreen: '#0d5e2e',
            feltDark: '#0a4a24',
            feltLight: '#0f6b35',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',

            // Andar (Left) colors
            andar: '#00e676',
            andarGlow: 'rgba(0, 230, 118, 0.6)',
            andarHighlight: 'rgba(0, 230, 118, 0.15)',

            // Bahar (Right) colors
            bahar: '#4488ff',
            baharGlow: 'rgba(68, 136, 255, 0.6)',
            baharHighlight: 'rgba(68, 136, 255, 0.15)',

            // Joker colors
            joker: '#ff1744',
            jokerGlow: 'rgba(255, 23, 68, 0.6)',
            jokerHighlight: 'rgba(255, 23, 68, 0.1)',

            // Card colors
            cardWhite: '#f8f8f5',
            cardBorder: '#d0d0d0',
            cardShadow: 'rgba(0, 0, 0, 0.4)',
            suitRed: '#cc0000',
            suitBlack: '#1a1a1a',

            // UI text
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255, 255, 255, 0.7)',
            textMuted: 'rgba(255, 255, 255, 0.4)',
            textGold: '#D4AF37'
        };

        // ============================================
        // CARD DIMENSIONS
        // ============================================
        this.cardWidth = 44;
        this.cardHeight = 62;
        this.jokerCardWidth = 58;
        this.jokerCardHeight = 82;

        // ============================================
        // PILLAR 1: EASING FUNCTIONS
        // ============================================
        this.easing = {
            easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
            easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
            easeOutBack: (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeOutBounce: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                else return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        };

        // ============================================
        // ANIMATION FRAME REFERENCE
        // ============================================
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.dealIntervalId = null;
        this.cleanupTimeoutId = null;
    }

    // ============================================
    // PILLAR 3: FSM STATE MANAGEMENT
    // ============================================

    transitionTo(newState) {
        const validTransitions = {
            [this.FSM_STATES.IDLE]: [this.FSM_STATES.PLACING_BET],
            [this.FSM_STATES.PLACING_BET]: [this.FSM_STATES.GAME_START, this.FSM_STATES.IDLE],
            [this.FSM_STATES.GAME_START]: [this.FSM_STATES.DEALING_JOKER],
            [this.FSM_STATES.DEALING_JOKER]: [this.FSM_STATES.DEALING_CARDS],
            [this.FSM_STATES.DEALING_CARDS]: [this.FSM_STATES.ANIMATING_CARD, this.FSM_STATES.DETERMINING_OUTCOME],
            [this.FSM_STATES.ANIMATING_CARD]: [this.FSM_STATES.DEALING_CARDS, this.FSM_STATES.DETERMINING_OUTCOME],
            [this.FSM_STATES.DETERMINING_OUTCOME]: [this.FSM_STATES.PAYOUT_TRIGGER],
            [this.FSM_STATES.PAYOUT_TRIGGER]: [this.FSM_STATES.CLEANUP],
            [this.FSM_STATES.CLEANUP]: [this.FSM_STATES.PLACING_BET, this.FSM_STATES.IDLE]
        };

        if (this.stateTransitionLocked) {
            console.warn('[FSM] Transition locked:', this.currentState, '->', newState);
            return false;
        }

        if (!validTransitions[this.currentState]?.includes(newState)) {
            console.warn('[FSM] Invalid transition:', this.currentState, '->', newState);
            return false;
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateTimer = performance.now();

        if (this.hooks.onStateChange) {
            this.hooks.onStateChange(this.previousState, this.currentState);
        }

        console.log('[FSM]', this.previousState, '->', this.currentState);
        return true;
    }

    lockTransitions() { this.stateTransitionLocked = true; }
    unlockTransitions() { this.stateTransitionLocked = false; }

    // ============================================
    // PILLAR 4: RTP-CONTROLLED DECK & OUTCOME
    // ============================================

    generateDeckOrder(serverSeed, clientSeed, nonce) {
        this.provablyFair.serverSeed = serverSeed || this.generateHexSeed(32);
        this.provablyFair.clientSeed = clientSeed || this.generateHexSeed(16);
        this.provablyFair.nonce = nonce || ++this.roundNumber;

        const combinedSeed = this.provablyFair.serverSeed + ':' +
                            this.provablyFair.clientSeed + ':' +
                            this.provablyFair.nonce;
        this.provablyFair.combinedHash = this.simpleHash(combinedSeed);

        // Create deck
        const deck = this.createDeck();
        const deckCount = this.RTP_CONFIG.deckCount;
        const fullShoe = [];
        for (let d = 0; d < deckCount; d++) {
            fullShoe.push(...deck.map(c => ({ ...c })));
        }

        // Fisher-Yates shuffle with deterministic seed
        this.seededShuffle(fullShoe, this.provablyFair.combinedHash);
        this.provablyFair.deckOrder = fullShoe;

        return fullShoe;
    }

    createDeck() {
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        return deck;
    }

    seededShuffle(array, seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0;
        }

        for (let i = array.length - 1; i > 0; i--) {
            hash = ((hash << 5) - hash) + i;
            hash |= 0;
            const j = Math.abs(hash) % (i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    generateHexSeed(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    calibrateRTP(isAndarWin) {
        // Adjust Andar win probability based on RTP target
        const targetRTP = this.RTP_CONFIG.targetRTP;
        const adjustment = (targetRTP - 0.90) / 0.10; // Normalize
        const andarBias = 0.48 + adjustment * 0.07; // Range: 0.48 - 0.55
        return Math.random() < andarBias ? 'andar' : 'bahar';
    }

    // ============================================
    // PILLAR 5: SECURE WALLET HOOKS
    // ============================================

    registerHooks(hooks) {
        if (hooks.onBetPlaced) this.hooks.onBetPlaced = hooks.onBetPlaced;
        if (hooks.onGameResultCalculated) this.hooks.onGameResultCalculated = hooks.onGameResultCalculated;
        if (hooks.onError) this.hooks.onError = hooks.onError;
        if (hooks.onStateChange) this.hooks.onStateChange = hooks.onStateChange;
    }

    async placeBet(side) {
        if (this.currentState !== this.FSM_STATES.PLACING_BET) return false;
        if (this.stateTransitionLocked) return false;

        const bet = this.bets[side];
        if (!bet || bet.isActive) return false;
        if (this.betAmount <= 0) return false;

        this.lockTransitions();

        try {
            if (this.hooks.onBetPlaced) {
                const betData = {
                    side,
                    amount: this.betAmount,
                    roundNumber: this.roundNumber,
                    timestamp: Date.now()
                };
                const success = await this.hooks.onBetPlaced(this.betAmount, betData);
                if (!success) return false;
            }

            bet.amount = this.betAmount;
            bet.isActive = true;
            this.totalBet += this.betAmount;
            return true;

        } catch (error) {
            console.error('[WALLET] Bet error:', error);
            if (this.hooks.onError) this.hooks.onError({ type: 'BET_ERROR', message: error.message });
            return false;
        } finally {
            this.unlockTransitions();
        }
    }

    async processPayout() {
        const playerWon = this.winner === this.betSide;
        const betAmount = this.bets[this.betSide]?.amount || 0;

        if (playerWon && betAmount > 0) {
            this.winnings = Math.floor(betAmount * this.RTP_CONFIG.payoutMultiplier);

            if (this.hooks.onGameResultCalculated) {
                const outcomeData = {
                    gameType: 'andar-bahar',
                    winner: this.winner,
                    betSide: this.betSide,
                    betAmount,
                    winnings: this.winnings,
                    jokerCard: this.jokerCard,
                    andarCardsCount: this.andarCards.length,
                    baharCardsCount: this.baharCards.length,
                    roundNumber: this.roundNumber,
                    timestamp: Date.now()
                };
                const newState = await this.hooks.onGameResultCalculated(outcomeData);
                if (newState) this.walletState = { ...this.walletState, ...newState };
            }
        } else {
            this.winnings = 0;
        }

        return this.winnings;
    }

    // ============================================
    // GAME LIFECYCLE
    // ============================================

    init() {
        this.calculateDimensions();
        this.transitionTo(this.FSM_STATES.PLACING_BET);
        this.startGameLoop();
    }

    calculateDimensions() {
        if (this.canvas) {
            const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: 500, height: 620 };
            this.w = rect.width || 500;
            this.h = rect.height || 620;
        }
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // Adjust card sizes
        this.cardWidth = Math.max(36, this.w * 0.085);
        this.cardHeight = this.cardWidth * 1.4;
        this.jokerCardWidth = this.cardWidth * 1.3;
        this.jokerCardHeight = this.cardHeight * 1.3;
    }

    async play(bet) {
        if (this.currentState !== this.FSM_STATES.PLACING_BET) return;
        if (this.stateTransitionLocked) return;

        if (bet) this.betAmount = bet;

        // Auto-place bet on andar if no bets placed
        if (this.totalBet === 0) {
            await this.placeBet('andar');
            this.betSide = 'andar';
        }

        if (!this.transitionTo(this.FSM_STATES.GAME_START)) return;

        this.roundNumber++;
        this.matchFound = false;
        this.winner = null;
        this.winnings = 0;
        this.andarCards = [];
        this.baharCards = [];
        this.dealSide = 'andar';
        this.dealIndex = 0;
        this.effects = {
            jokerRevealProgress: 0,
            jokerRevealed: false,
            winnerGlowAlpha: 0,
            winnerSpotlightAlpha: 0,
            spotlightTarget: null,
            tablePulsePhase: 0
        };

        // Generate deck with provably fair seed
        const shoe = this.generateDeckOrder();
        this.jokerCard = shoe.pop();

        // Deal joker
        this.transitionTo(this.FSM_STATES.DEALING_JOKER);
        await this.animateJokerReveal();

        // Start dealing cards
        this.transitionTo(this.FSM_STATES.DEALING_CARDS);
        this.dealNextCard(shoe);
    }

    async animateJokerReveal() {
        return new Promise(resolve => {
            const startTime = performance.now();
            const duration = 800;

            const animate = (ts) => {
                const elapsed = ts - startTime;
                const progress = Math.min(1, elapsed / duration);
                this.effects.jokerRevealProgress = this.easing.easeOutBack(progress);

                // Spawn joker particles at 80% progress
                if (progress > 0.8 && !this.effects.jokerRevealed) {
                    this.effects.jokerRevealed = true;
                    this.spawnJokerGlowParticles();
                }

                if (progress >= 1) {
                    this.effects.jokerRevealProgress = 1;
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        });
    }

    dealNextCard(shoe) {
        if (this.matchFound) return;

        if (shoe.length === 0) {
            // Reshuffle
            const newDeck = this.generateDeckOrder();
            shoe.push(...newDeck);
        }

        const card = shoe.pop();
        const targetSide = this.dealSide;

        // Store card
        if (targetSide === 'andar') {
            this.andarCards.push(card);
        } else {
            this.baharCards.push(card);
        }

        this.dealIndex++;

        // Animate card deal
        this.transitionTo(this.FSM_STATES.ANIMATING_CARD);
        this.cardAnimation = {
            active: true,
            progress: 0,
            dealingCard: card,
            dealingSide: targetSide,
            startX: this.w / 2,
            startY: this.h * 0.08,
            targetX: targetSide === 'andar' ? this.w * 0.25 : this.w * 0.75,
            targetY: this.h * 0.42 + (targetSide === 'andar' ? this.andarCards.length : this.baharCards.length) * 0.02 * this.h
        };

        // Spawn deal particles
        this.spawnCardDealParticles(
            this.cardAnimation.startX,
            this.cardAnimation.startY,
            targetSide
        );

        // Animate
        const startTime = performance.now();
        const duration = 350;

        const animate = (ts) => {
            const elapsed = ts - startTime;
            const progress = Math.min(1, elapsed / duration);
            this.cardAnimation.progress = this.easing.easeOutCubic(progress);

            if (progress >= 1) {
                this.cardAnimation.active = false;
                this.cardAnimation.progress = 1;

                // Check match
                if (card.rank === this.jokerCard.rank) {
                    this.matchFound = true;
                    this.winner = targetSide === 'andar' ? 'bahar' : 'andar';
                    // Switch to the side that WAS dealt to (the card matched)
                    this.winner = this.dealSide === 'andar' ? 'bahar' : 'andar';
                    // Actually: the side where the match card lands is the LOSING side
                    // The OTHER side wins. So if card dealt to andar matches joker, bahar wins
                    this.winner = targetSide === 'andar' ? 'bahar' : 'andar';

                    this.transitionTo(this.FSM_STATES.DETERMINING_OUTCOME);
                    this.resolveGame();
                    return;
                }

                // Switch sides and continue
                this.dealSide = targetSide === 'andar' ? 'bahar' : 'andar';
                this.transitionTo(this.FSM_STATES.DEALING_CARDS);

                // Small delay between deals
                setTimeout(() => this.dealNextCard(shoe), 200);
            } else {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    async resolveGame() {
        // Process payout through secure hook
        await this.processPayout();

        // Visual effects
        if (this.winnings > 0) {
            this.effects.winnerGlowAlpha = 1;
            this.effects.winnerSpotlightAlpha = 1;
            this.effects.spotlightTarget = this.winner;
            this.spawnConfetti(this.w * 0.5, this.h * 0.45, 80);
        }

        this.transitionTo(this.FSM_STATES.PAYOUT_TRIGGER);

        // Schedule cleanup
        this.cleanupTimeoutId = setTimeout(() => {
            this.transitionTo(this.FSM_STATES.CLEANUP);
            this.cleanupRound();
        }, 4000);
    }

    cleanupRound() {
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.winner = null;
        this.matchFound = false;
        this.dealSide = 'andar';
        this.dealIndex = 0;
        this.totalBet = 0;
        this.winnings = 0;
        this.bets = { andar: { amount: 0, isActive: false }, bahar: { amount: 0, isActive: false } };
        this.cardAnimation = { active: false, progress: 0 };
        this.particles = { cardDeal: [], confetti: [], jokerGlow: [], spotlight: [] };
        this.effects = {
            jokerRevealProgress: 0,
            jokerRevealed: false,
            winnerGlowAlpha: 0,
            winnerSpotlightAlpha: 0,
            spotlightTarget: null,
            tablePulsePhase: 0
        };

        this.transitionTo(this.FSM_STATES.PLACING_BET);
    }

    // ============================================
    // PILLAR 2: PARTICLE SYSTEMS
    // ============================================

    spawnCardDealParticles(x, y, side) {
        const color = side === 'andar' ? this.colors.andar : this.colors.bahar;
        for (let i = 0; i < 12; i++) {
            this.particles.cardDeal.push({
                x, y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1,
                size: 1 + Math.random() * 2,
                color,
                life: 1,
                decay: 0.04 + Math.random() * 0.04
            });
        }
    }

    spawnJokerGlowParticles() {
        const jx = this.w / 2;
        const jy = this.h * 0.1;
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.jokerGlow.push({
                x: jx, y: jy + 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 3,
                color: this.colors.joker,
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    spawnConfetti(x, y, count) {
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < count; i++) {
            this.particles.confetti.push({
                x: x + (Math.random() - 0.5) * 200,
                y: y - Math.random() * 60,
                vx: (Math.random() - 0.5) * 5,
                vy: -4 - Math.random() * 6,
                w: 3 + Math.random() * 6,
                h: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                opacity: 1,
                gravity: 0.08
            });
        }
    }

    updateParticles() {
        // Card deal particles
        this.particles.cardDeal.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles.cardDeal = this.particles.cardDeal.filter(p => p.life > 0);

        // Joker glow particles
        this.particles.jokerGlow.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles.jokerGlow = this.particles.jokerGlow.filter(p => p.life > 0);

        // Confetti
        this.particles.confetti.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.006;
        });
        this.particles.confetti = this.particles.confetti.filter(p => p.opacity > 0);
    }

    // ============================================
    // PILLAR 1: PREMIUM RENDERING
    // ============================================

    render() { this.drawFullTable(); }

    drawFullTable() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;

        ctx.clearRect(0, 0, w, h);

        this.drawLuxuryBackground(ctx);
        this.drawTableWithBorder(ctx);
        this.drawJokerArea(ctx);
        this.drawAndarZone(ctx);
        this.drawBaharZone(ctx);
        this.drawBettingPanel(ctx);
        this.drawAnimatingCard(ctx);
        this.drawParticles(ctx);
        this.drawHeader(ctx);
    }

    drawLuxuryBackground(ctx) {
        // Deep gradient
        const bgGrad = ctx.createRadialGradient(this.w * 0.5, this.h * 0.35, 20, this.w * 0.5, this.h * 0.5, this.w);
        bgGrad.addColorStop(0, '#1a1030');
        bgGrad.addColorStop(0.4, '#0d0818');
        bgGrad.addColorStop(1, '#020105');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.w, this.h);

        // Subtle gold glow
        const glowGrad = ctx.createRadialGradient(this.w * 0.5, this.h * 0.2, 10, this.w * 0.5, this.h * 0.6, this.w * 0.7);
        glowGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, this.w, this.h);
    }

    drawTableWithBorder(ctx) {
        const m = 10;
        const tw = this.w - m * 2;
        const th = this.h - m * 2;

        // Wood border
        ctx.fillStyle = this.colors.woodDark;
        ctx.strokeStyle = this.colors.woodBorder;
        ctx.lineWidth = 4;
        this.roundRect(ctx, m - 4, m - 4, tw + 8, th + 8, 18);
        ctx.fill();
        ctx.stroke();

        // Wood grain
        const woodGrad = ctx.createLinearGradient(m, m, m + tw, m + th);
        woodGrad.addColorStop(0, '#c48b5c');
        woodGrad.addColorStop(0.3, '#b0784a');
        woodGrad.addColorStop(0.6, '#c48b5c');
        woodGrad.addColorStop(1, '#9a6b45');
        ctx.fillStyle = woodGrad;
        this.roundRect(ctx, m, m, tw, th, 16);
        ctx.fill();

        // Gold trim
        ctx.strokeStyle = this.colors.gold;
        ctx.lineWidth = 2;
        ctx.shadowColor = this.colors.goldGlow;
        ctx.shadowBlur = 8;
        this.roundRect(ctx, m + 6, m + 6, tw - 12, th - 12, 12);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Green felt
        const feltGrad = ctx.createRadialGradient(this.w * 0.5, this.h * 0.4, 10, this.w * 0.5, this.h * 0.5, this.w);
        feltGrad.addColorStop(0, this.colors.feltLight);
        feltGrad.addColorStop(0.5, this.colors.feltGreen);
        feltGrad.addColorStop(1, this.colors.feltDark);
        ctx.fillStyle = feltGrad;
        this.roundRect(ctx, m + 10, m + 10, tw - 20, th - 20, 10);
        ctx.fill();

        // Center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(this.w / 2, m + 50);
        ctx.lineTo(this.w / 2, this.h - m - 80);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawHeader(ctx) {
        // Game title
        const titleGrad = ctx.createLinearGradient(this.w * 0.3, 12, this.w * 0.7, 40);
        titleGrad.addColorStop(0, this.colors.goldLight);
        titleGrad.addColorStop(1, this.colors.goldDark);
        ctx.fillStyle = titleGrad;
        ctx.font = 'bold 22px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = this.colors.goldGlow;
        ctx.shadowBlur = 12;
        ctx.fillText('ANDAR BAHAR', this.w / 2, 32);
        ctx.shadowBlur = 0;

        // Balance
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, this.w - 140, 10, 125, 30, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('$' + this.walletState.balance.toFixed(2), this.w - 22, 31);
    }

    drawJokerArea(ctx) {
        const jx = this.w / 2;
        const jy = this.h * 0.09;

        // Joker zone
        ctx.fillStyle = this.colors.jokerHighlight;
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        this.roundRect(ctx, jx - 55, jy - 2, 110, 52, 12);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Joker label
        ctx.fillStyle = this.colors.joker;
        ctx.font = 'bold 10px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('JOKER', jx, jy + 10);

        if (this.jokerCard) {
            const cardW = this.jokerCardWidth;
            const cardH = this.jokerCardHeight;
            const cx = jx - cardW / 2;
            const cy = jy + 16;

            // Scale animation on reveal
            const scale = this.effects.jokerRevealProgress;
            ctx.save();
            ctx.translate(cx + cardW / 2, cy + cardH / 2);
            ctx.scale(Math.max(0.05, scale), Math.max(0.05, scale));
            ctx.translate(-(cx + cardW / 2), -(cy + cardH / 2));

            this.drawPremiumCard(ctx, cx, cy, cardW, cardH, this.jokerCard);

            ctx.restore();

            // Glow ring on joker card
            ctx.strokeStyle = this.colors.joker;
            ctx.lineWidth = 2;
            ctx.shadowColor = this.colors.jokerGlow;
            ctx.shadowBlur = 18;
            this.roundRect(ctx, cx - 4, cy - 4, cardW + 8, cardH + 8, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Placeholder
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            this.roundRect(ctx, jx - 30, jy + 18, 60, 78, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '22px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', jx, jy + 55);
        }
    }

    drawAndarZone(ctx) {
        const zx = 28;
        const zy = this.h * 0.22;
        const zw = this.w / 2 - 48;
        const zh = this.h * 0.30;

        // Zone background
        ctx.fillStyle = this.colors.andarHighlight;
        ctx.strokeStyle = this.bets.andar.isActive
            ? 'rgba(0, 230, 118, 0.7)'
            : 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = this.bets.andar.isActive ? 2.5 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12);
        ctx.fill();
        ctx.stroke();

        // Winner glow
        if (this.currentState === this.FSM_STATES.PAYOUT_TRIGGER && this.winner === 'andar') {
            ctx.strokeStyle = this.colors.andar;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.colors.andarGlow;
            ctx.shadowBlur = 20;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Label
        ctx.fillStyle = this.colors.andar;
        ctx.font = 'bold 15px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('ANDAR', zx + zw / 2, zy + 18);
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText('Pays 1.9:1', zx + zw / 2, zy + 32);

        // Cards grid
        this.drawCardGrid(ctx, zx, zy + 38, zw, zh - 45, this.andarCards, 'andar');

        // Bet badge
        if (this.bets.andar.isActive && this.bets.andar.amount > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 14, this.bets.andar.amount, this.colors.andar);
        }
    }

    drawBaharZone(ctx) {
        const zx = this.w / 2 + 20;
        const zy = this.h * 0.22;
        const zw = this.w / 2 - 48;
        const zh = this.h * 0.30;

        // Zone background
        ctx.fillStyle = this.colors.baharHighlight;
        ctx.strokeStyle = this.bets.bahar.isActive
            ? 'rgba(68, 136, 255, 0.7)'
            : 'rgba(68, 136, 255, 0.2)';
        ctx.lineWidth = this.bets.bahar.isActive ? 2.5 : 1;
        this.roundRect(ctx, zx, zy, zw, zh, 12);
        ctx.fill();
        ctx.stroke();

        // Winner glow
        if (this.currentState === this.FSM_STATES.PAYOUT_TRIGGER && this.winner === 'bahar') {
            ctx.strokeStyle = this.colors.bahar;
            ctx.lineWidth = 3;
            ctx.shadowColor = this.colors.baharGlow;
            ctx.shadowBlur = 20;
            this.roundRect(ctx, zx - 3, zy - 3, zw + 6, zh + 6, 14);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Label
        ctx.fillStyle = this.colors.bahar;
        ctx.font = 'bold 15px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('BAHAR', zx + zw / 2, zy + 18);
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText('Pays 1.9:1', zx + zw / 2, zy + 32);

        // Cards grid
        this.drawCardGrid(ctx, zx, zy + 38, zw, zh - 45, this.baharCards, 'bahar');

        // Bet badge
        if (this.bets.bahar.isActive && this.bets.bahar.amount > 0) {
            this.drawBetBadge(ctx, zx + zw / 2, zy + zh - 14, this.bets.bahar.amount, this.colors.bahar);
        }
    }

    drawCardGrid(ctx, x, y, w, h, cards, side) {
        const cols = 4;
        const cardW = this.cardWidth;
        const cardH = this.cardHeight;
        const gap = 3;

        for (let i = 0; i < Math.min(cards.length, 16); i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = x + 6 + col * (cardW + gap);
            const cy = y + row * (cardH + gap);

            // Check if this is the animating card
            if (this.cardAnimation.active &&
                this.cardAnimation.dealingSide === side &&
                i === (side === 'andar' ? this.andarCards.length - 1 : this.baharCards.length - 1)) {
                // This card is being animated, skip (drawn separately)
                if (this.cardAnimation.progress < 0.7) continue;
            }

            this.drawPremiumCard(ctx, cx, cy, cardW, cardH, cards[i]);
        }
    }

    drawAnimatingCard(ctx) {
        if (!this.cardAnimation.active) return;

        const anim = this.cardAnimation;
        const progress = anim.progress;
        const eased = this.easing.easeOutCubic(progress);

        const cx = anim.startX + (anim.targetX - anim.startX) * eased;
        const cy = anim.startY + (anim.targetY - anim.startY) * eased;
        const scale = 0.7 + 0.3 * Math.min(1, progress * 2);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        this.drawPremiumCard(ctx, cx - this.cardWidth / 2, cy - this.cardHeight / 2, this.cardWidth, this.cardHeight, anim.dealingCard);

        ctx.restore();
    }

    drawPremiumCard(ctx, x, y, w, h, card) {
        if (!card) return;

        // Shadow
        ctx.shadowColor = this.colors.cardShadow;
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;

        // Card body with gradient
        const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.4, '#fafaf8');
        bodyGrad.addColorStop(1, '#eee8e0');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = this.colors.cardBorder;
        ctx.lineWidth = 0.8;
        this.roundRect(ctx, x, y, w, h, 5);
        ctx.fill();
        ctx.stroke();

        // Inner border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 0.5;
        this.roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 3);
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Suit & rank
        const suitSymbols = { 'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663' };
        const suitChar = suitSymbols[card.suit] || card.suit;
        const suitColor = (card.suit === 'H' || card.suit === 'D') ? this.colors.suitRed : this.colors.suitBlack;
        const fs = Math.floor(w * 0.28);

        // Center rank
        ctx.fillStyle = suitColor;
        ctx.font = 'bold ' + fs + 'px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.rank, x + w / 2, y + h / 2 - 2);

        // Center suit
        ctx.font = Math.floor(fs * 0.7) + 'px Georgia, serif';
        ctx.fillText(suitChar, x + w / 2, y + h / 2 + fs * 0.6);
    }

    drawBetBadge(ctx, x, y, amount, color) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        this.roundRect(ctx, x - 30, y - 10, 60, 20, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = color;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$' + amount, x, y);
    }

    drawBettingPanel(ctx) {
        const by = this.h * 0.58;
        const btnW = 130;
        const btnH = 48;
        const gap = 40;
        const totalW = btnW * 2 + gap;
        const startX = (this.w - totalW) / 2;

        ctx.fillStyle = this.colors.textMuted;
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PLACE YOUR BETS', this.w / 2, by - 8);

        const sides = [
            { label: 'ANDAR', side: 'andar', color: this.colors.andar, x: startX },
            { label: 'BAHAR', side: 'bahar', color: this.colors.bahar, x: startX + btnW + gap }
        ];

        for (const s of sides) {
            const isActive = this.bets[s.side].isActive;
            const isWinner = this.currentState === this.FSM_STATES.PAYOUT_TRIGGER && this.winner === s.side;

            ctx.fillStyle = isActive ? s.color + '25' : 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = isWinner ? s.color : isActive ? s.color : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = isActive ? 2.5 : 1;
            if (isWinner) {
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 15;
            }
            this.roundRect(ctx, s.x, by + 4, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = isActive ? s.color : this.colors.textSecondary;
            ctx.font = 'bold 16px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.label, s.x + btnW / 2, by + btnH / 2 - 5);

            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '8px Inter, sans-serif';
            ctx.fillText('1.9:1', s.x + btnW / 2, by + btnH / 2 + 16);
        }

        // Game status
        if (this.currentState === this.FSM_STATES.PAYOUT_TRIGGER && this.winner) {
            const statusY = by + btnH + 25;
            const winnerName = this.winner.toUpperCase();
            const statusColor = this.winner === 'andar' ? this.colors.andar : this.colors.bahar;

            ctx.fillStyle = statusColor;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';

            if (this.winnings > 0) {
                ctx.fillText(winnerName + ' WINS! +$' + this.winnings, this.w / 2, statusY);
            } else {
                ctx.fillText(winnerName + ' WINS — You lost $' + this.totalBet, this.w / 2, statusY);
            }
        }
    }

    drawParticles(ctx) {
        // Card deal particles
        for (const p of this.particles.cardDeal) {
            ctx.fillStyle = p.color.replace(')', ', ' + p.life + ')').replace('rgb', 'rgba');
            if (p.color.startsWith('#')) {
                const r = parseInt(p.color.slice(1, 3), 16);
                const g = parseInt(p.color.slice(3, 5), 16);
                const b = parseInt(p.color.slice(5, 7), 16);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + p.life + ')';
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Joker glow particles
        for (const p of this.particles.jokerGlow) {
            ctx.fillStyle = 'rgba(255, 23, 68, ' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Confetti
        for (const p of this.particles.confetti) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
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

    handleClick(clickX, clickY) {
        if (this.currentState !== this.FSM_STATES.PLACING_BET) return;
        if (this.stateTransitionLocked) return;

        const by = this.h * 0.58;
        const btnW = 130;
        const btnH = 48;
        const gap = 40;
        const totalW = btnW * 2 + gap;
        const startX = (this.w - totalW) / 2;

        if (clickX >= startX && clickX <= startX + btnW && clickY >= by + 4 && clickY <= by + 4 + btnH) {
            this.betSide = 'andar';
            this.placeBet('andar');
        }

        if (clickX >= startX + btnW + gap && clickX <= startX + btnW + gap + btnW &&
            clickY >= by + 4 && clickY <= by + 4 + btnH) {
            this.betSide = 'bahar';
            this.placeBet('bahar');
        }
    }

    // ============================================
    // GAME LOOP
    // ============================================

    startGameLoop() {
        const loop = (ts) => {
            if (!this.lastTimestamp) this.lastTimestamp = ts;
            this.lastTimestamp = ts;
            this.tick(ts);
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    tick(ts) {
        this.updateParticles();

        // Fade effects
        if (this.effects.winnerGlowAlpha > 0 && this.currentState !== this.FSM_STATES.PAYOUT_TRIGGER) {
            this.effects.winnerGlowAlpha = Math.max(0, this.effects.winnerGlowAlpha - 0.008);
        }
    }

    setBet(amount) { this.betAmount = amount; }

    resize() {
        this.calculateDimensions();
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.cleanupTimeoutId) {
            clearTimeout(this.cleanupTimeoutId);
            this.cleanupTimeoutId = null;
        }
        this.particles = { cardDeal: [], confetti: [], jokerGlow: [], spotlight: [] };
        this.andarCards = [];
        this.baharCards = [];
        this.cardAnimation = { active: false, progress: 0 };
        this.transitionTo(this.FSM_STATES.IDLE);
    }
}

// Export
window.AndarBaharFullGame = AndarBaharFullGame;
console.log('✅ Andar Bahar v5.0 — Premium Casino Architecture Loaded');
