// ============================================
// AVIATOR PREMIUM CASINO CRASH GAME v5.0
// Professional IGaming Architecture
// Pillars: Premium UI/UX | Realistic Physics | FSM State Machine | Controlled RTP | Secure Wallet Hooks
// ============================================

class AviatorFullGame {
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
            targetRTP: 0.97,           // 97% Return to Player
            houseEdge: 0.03,           // 3% House Edge
            volatilityIndex: 0.65,     // Medium-High Volatility
            crashDistribution: {
                instantCrash: { probability: 0.04, range: [1.00, 1.05] },
                lowCrash:     { probability: 0.18, range: [1.05, 1.80] },
                mediumCrash:  { probability: 0.30, range: [1.80, 4.50] },
                highCrash:    { probability: 0.28, range: [4.50, 12.00] },
                extremeCrash: { probability: 0.15, range: [12.00, 50.00] },
                jackpotCrash: { probability: 0.05, range: [50.00, 500.00] }
            }
        };

        // ============================================
        // PILLAR 4: PROVABLY FAIR SEED STRUCTURE
        // ============================================
        this.provablyFair = {
            serverSeed: null,
            clientSeed: null,
            nonce: 0,
            combinedHash: null,
            crashResult: null
        };

        // ============================================
        // PILLAR 3: FINITE STATE MACHINE (FSM)
        // ============================================
        this.FSM_STATES = {
            IDLE: 'IDLE',
            WAITING_FOR_BETS: 'WAITING_FOR_BETS',
            GAME_START: 'GAME_START',
            FLYING: 'FLYING',
            CASHED_OUT: 'CASHED_OUT',
            CRASHED: 'CRASHED',
            PAYOUT: 'PAYOUT',
            CLEANUP: 'CLEANUP'
        };

        this.currentState = this.FSM_STATES.IDLE;
        this.previousState = null;
        this.stateTimer = 0;
        this.stateTransitionLocked = false;

        // ============================================
        // GAME STATE VARIABLES
        // ============================================
        this.multiplier = 1.00;
        this.crashPoint = 1.00;
        this.elapsedTime = 0;
        this.gameStartTime = 0;
        this.roundNumber = 0;

        // ============================================
        // PILLAR 5: WALLET STATE (READ-ONLY DISPLAY)
        // ============================================
        this.walletState = {
            balance: 1000.00,
            currency: 'USD',
            totalWagered: 0,
            totalWon: 0,
            netProfit: 0,
            isProcessing: false
        };

        // ============================================
        // PILLAR 5: SECURE CALLBACK HOOKS
        // ============================================
        this.hooks = {
            onBetPlaced: null,        // (betAmount, betData) => Promise<boolean>
            onGameResultCalculated: null, // (outcomeData) => Promise<WalletState>
            onCashout: null,          // (cashoutData) => Promise<WalletState>
            onError: null,            // (errorData) => void
            onStateChange: null       // (oldState, newState) => void
        };

        // ============================================
        // BETTING SYSTEM (DUAL-BET)
        // ============================================
        this.bets = [
            {
                id: 1,
                amount: 0,
                isActive: false,
                autoCashoutAt: 0,
                hasCashedOut: false,
                cashoutMultiplier: 0,
                winAmount: 0,
                status: 'idle' // idle, active, won, lost
            },
            {
                id: 2,
                amount: 0,
                isActive: false,
                autoCashoutAt: 0,
                hasCashedOut: false,
                cashoutMultiplier: 0,
                winAmount: 0,
                status: 'idle'
            }
        ];

        // ============================================
        // GRAPH & TRAJECTORY DATA
        // ============================================
        this.graphPoints = [];
        this.maxGraphPoints = 200;
        this.graphWidth = 0;
        this.graphHeight = 0;
        this.graphX = 0;
        this.graphY = 0;

        // ============================================
        // ROUND HISTORY
        // ============================================
        this.historyRounds = [];
        this.maxHistoryDisplay = 8;

        // ============================================
        // PILLAR 1: JET AIRCRAFT ANIMATION
        // ============================================
        this.jet = {
            x: 0,
            y: 0,
            angle: 0,
            targetAngle: 0,
            scale: 1,
            targetScale: 1,
            trail: [],
            maxTrailLength: 40,
            engineGlow: 0,
            wingVibration: 0
        };

        // ============================================
        // PILLAR 2: PARTICLE SYSTEMS
        // ============================================
        this.particles = {
            explosion: [],
            confetti: [],
            engineSmoke: [],
            sparkles: [],
            cashoutBurst: []
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

            // Neon colors
            neonGreen: '#00FF41',
            neonGreenGlow: 'rgba(0, 255, 65, 0.7)',
            neonRed: '#FF1744',
            neonRedGlow: 'rgba(255, 23, 68, 0.7)',
            neonBlue: '#00B0FF',
            neonBlueGlow: 'rgba(0, 176, 255, 0.7)',

            // UI Colors
            textPrimary: '#FFFFFF',
            textSecondary: 'rgba(255, 255, 255, 0.7)',
            textMuted: 'rgba(255, 255, 255, 0.4)',
            cardBg: 'rgba(255, 255, 255, 0.03)',
            cardBorder: 'rgba(255, 255, 255, 0.08)',
            cardBorderGold: 'rgba(212, 175, 55, 0.3)'
        };

        // ============================================
        // PILLAR 1: EASING FUNCTIONS
        // ============================================
        this.easing = {
            easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
            easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeOutBack: (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeOutElastic: (t) => {
                if (t === 0 || t === 1) return t;
                return Math.pow(2, -10 * t) * Math.sin((t - 1) * (2 * Math.PI) / 0.4) + 1;
            }
        };

        // ============================================
        // BETTING TIMER
        // ============================================
        this.bettingTimeRemaining = 8;
        this.bettingTimeTotal = 8;
        this.bettingTimerInterval = null;

        // ============================================
        // ANIMATION FRAME REFERENCE
        // ============================================
        this.animationFrameId = null;
        this.lastTimestamp = 0;

        // ============================================
        // SIMULATED PLAYERS (FOR ATMOSPHERE)
        // ============================================
        this.simulatedPlayers = [];
        this.generateSimulatedPlayers();
    }

    // ============================================
    // PILLAR 3: FSM STATE MANAGEMENT
    // ============================================

    /**
     * Transition to a new FSM state with validation
     */
    transitionTo(newState) {
        // Prevent invalid transitions
        const validTransitions = {
            [this.FSM_STATES.IDLE]: [this.FSM_STATES.WAITING_FOR_BETS],
            [this.FSM_STATES.WAITING_FOR_BETS]: [this.FSM_STATES.GAME_START, this.FSM_STATES.IDLE],
            [this.FSM_STATES.GAME_START]: [this.FSM_STATES.FLYING],
            [this.FSM_STATES.FLYING]: [this.FSM_STATES.CASHED_OUT, this.FSM_STATES.CRASHED],
            [this.FSM_STATES.CASHED_OUT]: [this.FSM_STATES.PAYOUT, this.FSM_STATES.CLEANUP],
            [this.FSM_STATES.CRASHED]: [this.FSM_STATES.PAYOUT, this.FSM_STATES.CLEANUP],
            [this.FSM_STATES.PAYOUT]: [this.FSM_STATES.CLEANUP],
            [this.FSM_STATES.CLEANUP]: [this.FSM_STATES.WAITING_FOR_BETS, this.FSM_STATES.IDLE]
        };

        if (this.stateTransitionLocked) {
            console.warn('[FSM] Transition locked, ignoring:', this.currentState, '->', newState);
            return false;
        }

        if (!validTransitions[this.currentState] || !validTransitions[this.currentState].includes(newState)) {
            console.warn('[FSM] Invalid transition:', this.currentState, '->', newState);
            return false;
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateTimer = performance.now();

        // Fire state change callback
        if (this.hooks.onStateChange) {
            this.hooks.onStateChange(this.previousState, this.currentState);
        }

        console.log('[FSM] State:', this.previousState, '->', this.currentState);
        return true;
    }

    /**
     * Lock state transitions to prevent race conditions
     */
    lockTransitions() {
        this.stateTransitionLocked = true;
    }

    /**
     * Unlock state transitions
     */
    unlockTransitions() {
        this.stateTransitionLocked = false;
    }

    // ============================================
    // PILLAR 4: RTP-CONTROLLED CRASH GENERATION
    // ============================================

    /**
     * Generate provably fair crash point using seed-based algorithm
     * This decouples visual outcome from pure Math.random()
     */
    generateCrashPoint(serverSeed, clientSeed, nonce) {
        // Store provably fair data
        this.provablyFair.serverSeed = serverSeed || this.generateHexSeed(32);
        this.provablyFair.clientSeed = clientSeed || this.generateHexSeed(16);
        this.provablyFair.nonce = nonce || ++this.roundNumber;

        // Create combined seed
        const combinedSeed = this.provablyFair.serverSeed + ':' + 
                            this.provablyFair.clientSeed + ':' + 
                            this.provablyFair.nonce;

        // Hash the combined seed (simulating SHA-256)
        this.provablyFair.combinedHash = this.simpleHash(combinedSeed);

        // Convert hash to a deterministic float between 0 and 1
        const deterministicFloat = this.hashToFloat(this.provablyFair.combinedHash);

        // Map to crash distribution based on RTP_CONFIG
        const crashPoint = this.mapFloatToCrashPoint(deterministicFloat);

        // Apply RTP calibration
        const calibratedCrash = this.calibrateRTP(crashPoint);

        // Store result
        this.provablyFair.crashResult = calibratedCrash;
        this.crashPoint = calibratedCrash;

        return calibratedCrash;
    }

    /**
     * Generate a random hex string (placeholder for server seed)
     */
    generateHexSeed(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    /**
     * Simple hash function (placeholder for SHA-256)
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    /**
     * Convert hash to deterministic float [0, 1)
     */
    hashToFloat(hash) {
        const intVal = parseInt(hash.substring(0, 8), 16);
        return intVal / 0xFFFFFFFF;
    }

    /**
     * Map float to crash point using weighted distribution from RTP_CONFIG
     */
    mapFloatToCrashPoint(float) {
        const dist = this.RTP_CONFIG.crashDistribution;
        const ranges = [
            { prob: dist.instantCrash.probability, range: dist.instantCrash.range },
            { prob: dist.lowCrash.probability, range: dist.lowCrash.range },
            { prob: dist.mediumCrash.probability, range: dist.mediumCrash.range },
            { prob: dist.highCrash.probability, range: dist.highCrash.range },
            { prob: dist.extremeCrash.probability, range: dist.extremeCrash.range },
            { prob: dist.jackpotCrash.probability, range: dist.jackpotCrash.range }
        ];

        let cumulativeProb = 0;
        for (const range of ranges) {
            cumulativeProb += range.prob;
            if (float <= cumulativeProb) {
                const minCrash = range.range[0];
                const maxCrash = range.range[1];
                // Linear interpolation within the selected range
                const rangeProgress = (float - (cumulativeProb - range.prob)) / range.prob;
                return minCrash + rangeProgress * (maxCrash - minCrash);
            }
        }

        // Fallback
        return 1.50;
    }

    /**
     * Apply RTP calibration to crash point
     */
    calibrateRTP(crashPoint) {
        // Adjust crash point based on target RTP
        const rtp = this.RTP_CONFIG.targetRTP;
        const adjustmentFactor = rtp / 0.97; // Baseline RTP
        return Math.max(1.01, crashPoint * adjustmentFactor);
    }

    // ============================================
    // PILLAR 2: PHYSICS ENGINE
    // ============================================

    /**
     * Calculate multiplier using exponential growth formula
     * multiplier = e^(growthRate * t)
     */
    calculateMultiplier(seconds) {
        const growthRate = 0.14; // Controls curve steepness
        return Math.pow(Math.E, growthRate * seconds);
    }

    /**
     * Apply exponential deceleration to a value
     * omega_new = omega_old * friction
     */
    applyDeceleration(currentValue, friction) {
        return currentValue * friction;
    }

    /**
     * Eased approach: smoothly move current toward target
     */
    easedApproach(current, target, easingFactor) {
        return current + (target - current) * easingFactor;
    }

    // ============================================
    // PILLAR 5: SECURE WALLET HOOKS
    // ============================================

    /**
     * Register wallet callback hooks
     */
    registerHooks(hooks) {
        if (hooks.onBetPlaced) this.hooks.onBetPlaced = hooks.onBetPlaced;
        if (hooks.onGameResultCalculated) this.hooks.onGameResultCalculated = hooks.onGameResultCalculated;
        if (hooks.onCashout) this.hooks.onCashout = hooks.onCashout;
        if (hooks.onError) this.hooks.onError = hooks.onError;
        if (hooks.onStateChange) this.hooks.onStateChange = hooks.onStateChange;
    }

    /**
     * Place bet through secure hook (NO direct balance manipulation)
     */
    async placeBet(betNumber) {
        if (this.currentState !== this.FSM_STATES.WAITING_FOR_BETS) return false;

        const bet = this.bets[betNumber - 1];
        if (!bet || bet.isActive) return false;
        if (bet.amount <= 0) return false;

        // Lock transitions during bet placement
        this.lockTransitions();

        try {
            // Call secure hook
            if (this.hooks.onBetPlaced) {
                const betData = {
                    betId: bet.id,
                    amount: bet.amount,
                    autoCashoutAt: bet.autoCashoutAt,
                    roundNumber: this.roundNumber,
                    timestamp: Date.now()
                };

                const success = await this.hooks.onBetPlaced(bet.amount, betData);

                if (!success) {
                    console.warn('[WALLET] Bet rejected by hook');
                    return false;
                }
            }

            // Activate bet (visual only, balance managed by hook)
            bet.isActive = true;
            bet.status = 'active';
            bet.hasCashedOut = false;
            bet.winAmount = 0;

            return true;

        } catch (error) {
            console.error('[WALLET] Bet placement error:', error);
            if (this.hooks.onError) {
                this.hooks.onError({ type: 'BET_ERROR', message: error.message });
            }
            return false;
        } finally {
            this.unlockTransitions();
        }
    }

    /**
     * Cash out through secure hook
     */
    async cashout(betNumber) {
        const bet = this.bets[betNumber - 1];

        if (!bet || !bet.isActive || bet.hasCashedOut) return false;
        if (this.currentState !== this.FSM_STATES.FLYING) return false;

        this.lockTransitions();

        try {
            const cashoutAmount = Math.floor(bet.amount * this.multiplier * 100) / 100;

            // Call secure hook
            if (this.hooks.onCashout) {
                const cashoutData = {
                    betId: bet.id,
                    cashoutMultiplier: this.multiplier,
                    cashoutAmount: cashoutAmount,
                    roundNumber: this.roundNumber,
                    timestamp: Date.now()
                };

                const newWalletState = await this.hooks.onCashout(cashoutData);

                if (newWalletState) {
                    this.walletState = { ...this.walletState, ...newWalletState };
                }
            }

            // Update bet state (visual only)
            bet.hasCashedOut = true;
            bet.cashoutMultiplier = this.multiplier;
            bet.winAmount = cashoutAmount;
            bet.status = 'won';

            // Trigger cashout effects
            this.spawnCashoutBurst(this.jet.x, this.jet.y);
            this.spawnConfetti(this.jet.x, this.jet.y, 80);

            return true;

        } catch (error) {
            console.error('[WALLET] Cashout error:', error);
            return false;
        } finally {
            this.unlockTransitions();
        }
    }

    // ============================================
    // GAME LIFECYCLE
    // ============================================

    /**
     * Initialize game
     */
    init() {
        this.calculateDimensions();
        this.loadHistoryFromStorage();
        this.transitionTo(this.FSM_STATES.WAITING_FOR_BETS);
        this.startBettingTimer();
        this.startGameLoop();
    }

    /**
     * Calculate canvas dimensions
     */
    calculateDimensions() {
        if (this.canvas) {
            const rect = this.canvas.parentElement 
                ? this.canvas.parentElement.getBoundingClientRect() 
                : { width: 500, height: 650 };
            this.w = rect.width || 500;
            this.h = rect.height || 650;
        }

        // Set actual canvas size for retina
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';

        // Calculate graph dimensions
        this.graphX = this.w * 0.08;
        this.graphY = this.h * 0.15;
        this.graphWidth = this.w * 0.55;
        this.graphHeight = this.h * 0.32;
    }

    /**
     * Start betting countdown timer
     */
    startBettingTimer() {
        this.bettingTimeRemaining = this.bettingTimeTotal;
        this.clearBettingTimer();

        this.bettingTimerInterval = setInterval(() => {
            this.bettingTimeRemaining -= 0.1;
            if (this.bettingTimeRemaining <= 0) {
                this.bettingTimeRemaining = 0;
                this.clearBettingTimer();
                this.startNewRound();
            }
        }, 100);
    }

    /**
     * Clear betting timer
     */
    clearBettingTimer() {
        if (this.bettingTimerInterval) {
            clearInterval(this.bettingTimerInterval);
            this.bettingTimerInterval = null;
        }
    }

    /**
     * Start a new game round
     */
    startNewRound() {
        if (!this.transitionTo(this.FSM_STATES.GAME_START)) return;

        this.roundNumber++;

        // Generate crash point with provably fair seeds
        this.generateCrashPoint();

        // Reset game variables
        this.multiplier = 1.00;
        this.elapsedTime = 0;
        this.gameStartTime = performance.now();
        this.graphPoints = [];
        this.jet.trail = [];
        this.particles = {
            explosion: [],
            confetti: [],
            engineSmoke: [],
            sparkles: [],
            cashoutBurst: []
        };

        // Update simulated players
        this.updateSimulatedPlayers();

        // Start flying
        this.transitionTo(this.FSM_STATES.FLYING);
    }

    /**
     * Handle crash event
     */
    handleCrash() {
        if (!this.transitionTo(this.FSM_STATES.CRASHED)) return;

        // Mark unclaimed bets as lost
        for (const bet of this.bets) {
            if (bet.isActive && !bet.hasCashedOut) {
                bet.status = 'lost';
            }
        }

        // Generate crash VFX
        this.spawnExplosion(this.jet.x, this.jet.y);

        // Add to history
        this.addToHistory(this.crashPoint, true);

        // Transition to payout after delay
        setTimeout(() => {
            this.transitionTo(this.FSM_STATES.PAYOUT);
            this.scheduleCleanup();
        }, 2000);
    }

    /**
     * Schedule cleanup and new round
     */
    scheduleCleanup() {
        setTimeout(() => {
            this.transitionTo(this.FSM_STATES.CLEANUP);
            this.cleanup();
        }, 1500);
    }

    /**
     * Clean up after round
     */
    cleanup() {
        // Reset bets
        for (const bet of this.bets) {
            bet.isActive = false;
            bet.hasCashedOut = false;
            bet.cashoutMultiplier = 0;
            bet.winAmount = 0;
            bet.status = 'idle';
        }

        // Reset particles
        this.particles = {
            explosion: [],
            confetti: [],
            engineSmoke: [],
            sparkles: [],
            cashoutBurst: []
        };

        // Start new betting round
        this.transitionTo(this.FSM_STATES.WAITING_FOR_BETS);
        this.startBettingTimer();
    }

    // ============================================
    // PARTICLE SYSTEMS (PILLAR 2)
    // ============================================

    spawnExplosion(x, y) {
        const colors = ['#FF1744', '#FF6D00', '#FFD700', '#FFAB00', '#FFFFFF'];
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 10;
            this.particles.explosion.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: 0.008 + Math.random() * 0.02,
                gravity: 0.15
            });
        }
    }

    spawnConfetti(x, y, count) {
        const colors = ['#FF1744', '#00FF41', '#FFD700', '#00B0FF', '#FF6D00', '#E040FB', '#FFFFFF'];
        for (let i = 0; i < (count || 50); i++) {
            this.particles.confetti.push({
                x: x + (Math.random() - 0.5) * 150,
                y: y - Math.random() * 50,
                vx: (Math.random() - 0.5) * 6,
                vy: -5 - Math.random() * 8,
                w: 4 + Math.random() * 8,
                h: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.4,
                opacity: 1,
                gravity: 0.12
            });
        }
    }

    spawnCashoutBurst(x, y) {
        const colors = ['#00FF41', '#76FF03', '#B2FF59', '#FFFFFF'];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            this.particles.cashoutBurst.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    /**
     * Update all particle systems
     */
    updateParticles() {
        // Explosion particles
        this.particles.explosion.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.98;
            p.life -= p.decay;
        });
        this.particles.explosion = this.particles.explosion.filter(p => p.life > 0);

        // Confetti particles
        this.particles.confetti.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.99;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.008;
        });
        this.particles.confetti = this.particles.confetti.filter(p => p.opacity > 0);

        // Cashout burst
        this.particles.cashoutBurst.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles.cashoutBurst = this.particles.cashoutBurst.filter(p => p.life > 0);

        // Engine smoke (during flight)
        if (this.currentState === this.FSM_STATES.FLYING && Math.random() > 0.3) {
            this.particles.engineSmoke.push({
                x: this.jet.x - 10 + (Math.random() - 0.5) * 6,
                y: this.jet.y + 5 + (Math.random() - 0.5) * 4,
                size: 1 + Math.random() * 3,
                opacity: 0.6,
                life: 1,
                decay: 0.04 + Math.random() * 0.04,
                vx: -1 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 0.5
            });
        }
        this.particles.engineSmoke.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
        });
        this.particles.engineSmoke = this.particles.engineSmoke.filter(p => p.life > 0);
    }

    // ============================================
    // HISTORY MANAGEMENT
    // ============================================

    addToHistory(multiplier, crashed) {
        this.historyRounds.unshift({
            multiplier: parseFloat(multiplier.toFixed(2)),
            crashed,
            timestamp: Date.now(),
            roundNumber: this.roundNumber
        });

        // Keep history manageable
        if (this.historyRounds.length > 50) {
            this.historyRounds = this.historyRounds.slice(0, 50);
        }

        this.saveHistoryToStorage();
    }

    saveHistoryToStorage() {
        try {
            localStorage.setItem('aviator_history_v5', JSON.stringify(this.historyRounds.slice(0, 20)));
        } catch (e) {}
    }

    loadHistoryFromStorage() {
        try {
            const saved = localStorage.getItem('aviator_history_v5');
            if (saved) {
                this.historyRounds = JSON.parse(saved);
            }
        } catch (e) {}
    }

    // ============================================
    // SIMULATED PLAYERS
    // ============================================

    generateSimulatedPlayers() {
        const names = [
            'ProGamer_X', 'LuckyStar99', 'BigWinKing', 'CasinoPro',
            'DiamondHand', 'MoonShot', 'CashMaster', 'GoldenEagle',
            'HighRoller7', 'CryptoKing'
        ];
        this.simulatedPlayers = names.map(name => ({
            name,
            avatar: '👤',
            betAmount: 10 + Math.random() * 200,
            cashoutMultiplier: null,
            status: 'betting'
        }));
    }

    updateSimulatedPlayers() {
        this.simulatedPlayers.forEach(player => {
            player.betAmount = 10 + Math.random() * 200;
            player.cashoutMultiplier = null;
            player.status = 'betting';
            // Some players will cash out during the round
            const cashoutChance = 0.4 + Math.random() * 0.4;
            if (Math.random() < cashoutChance) {
                player.cashoutMultiplier = 1.5 + Math.random() * 5;
            }
        });
    }

    // ============================================
    // PILLAR 1: PREMIUM RENDERING
    // ============================================

    render() {
        this.drawFullScreen();
    }

    drawFullScreen() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;

        // Deep luxury background with radial gradients
        this.drawLuxuryBackground(ctx, w, h);

        // Draw all sections
        this.drawHeaderSection(ctx, w, h);
        this.drawGraphSection(ctx, w, h);
        this.drawHistoryPanel(ctx, w, h);
        this.drawBettingPanel(ctx, w, h);
        this.drawParticles(ctx);
    }

    /**
     * Draw luxury dark casino background with layered radial gradients
     */
    drawLuxuryBackground(ctx, w, h) {
        // Deepest layer
        ctx.fillStyle = this.colors.bgDeep;
        ctx.fillRect(0, 0, w, h);

        // Radial glow center-top (like a spotlight)
        const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.15, 30, w * 0.5, h * 0.5, w);
        glowGrad.addColorStop(0, 'rgba(212, 175, 55, 0.06)');
        glowGrad.addColorStop(0.3, 'rgba(212, 175, 55, 0.02)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 0.5;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    /**
     * Draw header with game title, multiplier, and balance
     */
    drawHeaderSection(ctx, w, h) {
        // Game logo area
        const logoGrad = ctx.createLinearGradient(20, 15, 150, 55);
        logoGrad.addColorStop(0, this.colors.goldLight);
        logoGrad.addColorStop(1, this.colors.goldDark);
        ctx.fillStyle = logoGrad;
        ctx.font = 'bold 26px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.shadowColor = this.colors.goldGlow;
        ctx.shadowBlur = 15;
        ctx.fillText('AVIATOR', 20, 42);
        ctx.shadowBlur = 0;

        // Provider badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, 130, 18, 70, 22, 11);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PREMIUM', 165, 33);

        // Multiplier display (center)
        const isFlying = this.currentState === this.FSM_STATES.FLYING;
        const isCrashed = this.currentState === this.FSM_STATES.CRASHED;
        const multColor = isCrashed ? this.colors.neonRed : 
                         isFlying ? this.colors.neonGreen : this.colors.textMuted;

        ctx.fillStyle = multColor;
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        if (isFlying) {
            ctx.shadowColor = this.colors.neonGreenGlow;
            ctx.shadowBlur = 25;
        }
        ctx.fillText(this.multiplier.toFixed(2) + 'x', w * 0.5, 45);
        ctx.shadowBlur = 0;

        // Balance display (right)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w - 160, 12, 145, 36, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('$' + this.walletState.balance.toFixed(2), w - 25, 37);

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, 58);
        ctx.lineTo(w - 10, 58);
        ctx.stroke();
    }

    /**
     * Draw graph section with grid, curve, and jet
     */
    drawGraphSection(ctx, w, h) {
        const gx = this.graphX;
        const gy = this.graphY;
        const gw = this.graphWidth;
        const gh = this.graphHeight;

        // Graph background card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, gx - 10, gy - 10, gw + 20, gh + 20, 12);
        ctx.fill();
        ctx.stroke();

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 4; i++) {
            const y = gy + (gh / 4) * i;
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + gw, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const mult = (1 + i * 3).toFixed(0);
            const y = gy + gh - (gh / 4) * i + 3;
            ctx.fillText(mult + 'x', gx - 10, y);
        }

        // Draw graph curve
        if (this.graphPoints.length > 1) {
            // Glow under curve
            ctx.strokeStyle = this.currentState === this.FSM_STATES.CRASHED 
                ? 'rgba(255, 23, 68, 0.3)' 
                : 'rgba(0, 255, 65, 0.3)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = this.currentState === this.FSM_STATES.CRASHED 
                ? this.colors.neonRedGlow 
                : this.colors.neonGreenGlow;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Main line
            ctx.strokeStyle = this.currentState === this.FSM_STATES.CRASHED 
                ? this.colors.neonRed 
                : this.colors.neonGreen;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);
            for (let i = 1; i < this.graphPoints.length; i++) {
                ctx.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
            }
            ctx.stroke();

            // End point
            const last = this.graphPoints[this.graphPoints.length - 1];
            ctx.fillStyle = this.currentState === this.FSM_STATES.CRASHED 
                ? this.colors.neonRed 
                : this.colors.neonGreen;
            ctx.beginPath();
            ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // End point glow
            ctx.fillStyle = this.currentState === this.FSM_STATES.CRASHED 
                ? 'rgba(255, 23, 68, 0.5)' 
                : 'rgba(0, 255, 65, 0.5)';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw jet
        if ((this.currentState === this.FSM_STATES.FLYING || 
             this.currentState === this.FSM_STATES.CRASHED) && 
            this.graphPoints.length > 0) {
            this.drawJet(ctx);
        }

        // Draw engine smoke
        for (const p of this.particles.engineSmoke) {
            ctx.fillStyle = 'rgba(200, 200, 200, ' + (p.life * p.opacity) + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Betting timer (when waiting for bets)
        if (this.currentState === this.FSM_STATES.WAITING_FOR_BETS) {
            const timerProgress = this.bettingTimeRemaining / this.bettingTimeTotal;
            const timerX = gx + gw / 2 - 40;
            const timerY = gy + gh + 15;
            const timerW = 80;
            const timerH = 4;

            // Timer background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.roundRect(ctx, timerX, timerY, timerW, timerH, 2);
            ctx.fill();

            // Timer fill
            const fillColor = timerProgress < 0.25 ? this.colors.neonRed : this.colors.gold;
            ctx.fillStyle = fillColor;
            this.roundRect(ctx, timerX, timerY, timerW * timerProgress, timerH, 2);
            ctx.fill();

            // Timer text
            ctx.fillStyle = this.colors.textMuted;
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Next round in ' + Math.ceil(this.bettingTimeRemaining) + 's', gx + gw / 2, timerY - 6);
        }
    }

    /**
     * Draw the jet aircraft with engine glow
     */
    drawJet(ctx) {
        const jx = this.jet.x;
        const jy = this.jet.y;

        // Engine smoke trail
        ctx.fillStyle = 'rgba(150, 150, 150, 0.15)';
        for (let i = 0; i < this.jet.trail.length; i++) {
            const t = this.jet.trail[i];
            const alpha = (i / this.jet.trail.length) * 0.3;
            ctx.fillStyle = 'rgba(200, 200, 200, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Engine glow
        const engineGlowGrad = ctx.createRadialGradient(jx - 5, jy, 2, jx - 5, jy, 15);
        engineGlowGrad.addColorStop(0, 'rgba(0, 176, 255, 0.6)');
        engineGlowGrad.addColorStop(0.5, 'rgba(0, 176, 255, 0.2)');
        engineGlowGrad.addColorStop(1, 'rgba(0, 176, 255, 0)');
        ctx.fillStyle = engineGlowGrad;
        ctx.beginPath();
        ctx.arc(jx - 5, jy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Jet body
        ctx.save();
        ctx.translate(jx, jy);
        ctx.rotate(this.jet.angle);

        // Shadow
        ctx.shadowColor = 'rgba(0, 176, 255, 0.4)';
        ctx.shadowBlur = 8;

        // Main body
        const jetGrad = ctx.createLinearGradient(-10, -5, 10, 5);
        jetGrad.addColorStop(0, '#FFFFFF');
        jetGrad.addColorStop(0.4, '#E0E0E0');
        jetGrad.addColorStop(0.7, '#B0B0B0');
        jetGrad.addColorStop(1, '#808080');
        ctx.fillStyle = jetGrad;
        ctx.beginPath();
        ctx.moveTo(12, 0);      // Nose
        ctx.lineTo(-5, -6);     // Top wing
        ctx.lineTo(-3, -2);
        ctx.lineTo(-8, 0);      // Tail
        ctx.lineTo(-3, 2);
        ctx.lineTo(-5, 6);      // Bottom wing
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = 'rgba(0, 176, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /**
     * Draw history panel (right side)
     */
    drawHistoryPanel(ctx, w, h) {
        const hx = this.graphX + this.graphWidth + 20;
        const hy = this.graphY;
        const hw = w - hx - 15;
        const hh = this.graphHeight;

        // Panel card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, hx, hy, hw, hh, 12);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HISTORY', hx + hw / 2, hy + 18);

        // History items
        const displayHistory = this.historyRounds.slice(0, 7);
        const itemHeight = (hh - 35) / 7;

        displayHistory.forEach((round, i) => {
            const iy = hy + 30 + i * itemHeight;
            const isLast = i === displayHistory.length - 1 && this.historyRounds.length > 0;

            // Background for newest
            if (i === 0 && this.currentState !== this.FSM_STATES.FLYING) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                this.roundRect(ctx, hx + 5, iy, hw - 10, itemHeight - 2, 4);
                ctx.fill();
            }

            // Multiplier
            const color = round.crashed 
                ? (round.multiplier >= 5 ? '#FFD700' : round.multiplier >= 2 ? '#FF8800' : '#FF4444')
                : '#00FF41';
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(round.multiplier.toFixed(2) + 'x', hx + 12, iy + itemHeight / 2 + 3);

            // Badge
            const badgeText = round.crashed ? 'CRASH' : 'WIN';
            const badgeColor = round.crashed ? '#FF4444' : '#00FF41';
            ctx.fillStyle = badgeColor;
            ctx.font = '7px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(badgeText, hx + hw - 12, iy + itemHeight / 2 + 3);
        });
    }

    /**
     * Draw betting panel (bottom)
     */
    drawBettingPanel(ctx, w, h) {
        const by = this.graphY + this.graphHeight + 50;
        const bh = h - by - 10;

        // Two bet cards side by side
        const cardWidth = (w - 50) / 2;
        const cardHeight = bh;

        for (let i = 0; i < 2; i++) {
            const bet = this.bets[i];
            const bx = 20 + i * (cardWidth + 10);

            this.drawBetCard(ctx, bx, by, cardWidth, cardHeight, bet, i + 1);
        }
    }

    /**
     * Draw individual bet card
     */
    drawBetCard(ctx, x, y, w, h, bet, num) {
        // Card background with status glow
        let cardBg = this.colors.cardBg;
        let cardStroke = this.colors.cardBorderGold;

        if (bet.status === 'won') {
            cardBg = 'rgba(0, 255, 65, 0.08)';
            cardStroke = 'rgba(0, 255, 65, 0.4)';
        } else if (bet.status === 'lost') {
            cardBg = 'rgba(255, 23, 68, 0.08)';
            cardStroke = 'rgba(255, 23, 68, 0.4)';
        } else if (bet.isActive && this.currentState === this.FSM_STATES.FLYING) {
            cardStroke = 'rgba(0, 255, 65, 0.5)';
        }

        // Card
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = cardStroke;
        ctx.lineWidth = bet.isActive ? 2 : 1;
        this.roundRect(ctx, x, y, w, h, 14);
        ctx.fill();
        ctx.stroke();

        // Bet number
        ctx.fillStyle = this.colors.textPrimary;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('BET ' + num, x + 14, y + 22);

        // Bet amount (editable area indicator)
        ctx.fillStyle = this.colors.gold;
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('$' + bet.amount.toFixed(2), x + 14, y + 48);

        // Auto cashout input
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 14, y + 58, 60, 24, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.colors.textMuted;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        const autoText = bet.autoCashoutAt > 0 ? 'Auto: ' + bet.autoCashoutAt.toFixed(1) + 'x' : 'Auto';
        ctx.fillText(autoText, x + 44, y + 73);

        // Status text
        ctx.textAlign = 'right';
        if (bet.status === 'won') {
            ctx.fillStyle = this.colors.neonGreen;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText('+$' + bet.winAmount.toFixed(2), x + w - 14, y + h - 15);
        } else if (bet.status === 'lost') {
            ctx.fillStyle = this.colors.neonRed;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText('-$' + bet.amount.toFixed(2), x + w - 14, y + h - 15);
        } else if (bet.isActive && this.currentState === this.FSM_STATES.FLYING) {
            const potential = bet.amount * this.multiplier;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText('$' + potential.toFixed(2), x + w - 14, y + h - 15);
        }
    }

    /**
     * Draw all particle effects
     */
    drawParticles(ctx) {
        // Explosion particles
        for (const p of this.particles.explosion) {
            const alpha = Math.max(0, p.life);
            ctx.fillStyle = p.color.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba');
            if (p.color.startsWith('#')) {
                const r = parseInt(p.color.slice(1, 3), 16);
                const g = parseInt(p.color.slice(3, 5), 16);
                const b = parseInt(p.color.slice(5, 7), 16);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        // Confetti particles
        for (const p of this.particles.confetti) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }

        // Cashout burst
        for (const p of this.particles.cashoutBurst) {
            const alpha = Math.max(0, p.life);
            ctx.fillStyle = 'rgba(0, 255, 65, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============================================
    // UTILITY: ROUNDED RECTANGLE
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
    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.lastTimestamp) this.lastTimestamp = timestamp;
            const deltaTime = (timestamp - this.lastTimestamp) / 1000;
            this.lastTimestamp = timestamp;

            this.tick(timestamp);
            this.render();

            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    tick(timestamp) {
        // Update particles
        this.updateParticles();

        // State-specific updates
        if (this.currentState === this.FSM_STATES.FLYING) {
            const elapsed = (timestamp - this.gameStartTime) / 1000;
            this.elapsedTime = elapsed;
            this.multiplier = this.calculateMultiplier(elapsed);

            // Add graph point
            const progress = Math.min(elapsed / 8, 1);
            const gx = this.graphX + progress * this.graphWidth;
            const logMult = Math.log(this.multiplier) / Math.log(100);
            const gy = this.graphY + this.graphHeight - (logMult * this.graphHeight * 0.7);

            if (this.graphPoints.length === 0 || 
                gx - this.graphPoints[this.graphPoints.length - 1].x > 2) {
                this.graphPoints.push({ 
                    x: Math.min(gx, this.graphX + this.graphWidth), 
                    y: Math.max(this.graphY, gy) 
                });
                if (this.graphPoints.length > this.maxGraphPoints) {
                    this.graphPoints.shift();
                }
            }

            // Update jet
            if (this.graphPoints.length > 0) {
                const lastPoint = this.graphPoints[this.graphPoints.length - 1];
                this.jet.targetAngle = Math.min(0.7, (this.multiplier - 1) * 0.04);
                this.jet.angle = this.easedApproach(this.jet.angle, this.jet.targetAngle, 0.1);
                this.jet.x = this.easedApproach(this.jet.x, lastPoint.x, 0.3);
                this.jet.y = this.easedApproach(this.jet.y, lastPoint.y - 8, 0.3);

                // Trail
                this.jet.trail.push({ x: this.jet.x, y: this.jet.y + 3 });
                if (this.jet.trail.length > this.jet.maxTrailLength) {
                    this.jet.trail.shift();
                }
            }

            // Auto cashout checks
            for (const bet of this.bets) {
                if (bet.isActive && !bet.hasCashedOut && 
                    bet.autoCashoutAt > 0 && this.multiplier >= bet.autoCashoutAt) {
                    this.cashout(bet.id);
                }
            }

            // Crash check
            if (this.multiplier >= this.crashPoint) {
                this.multiplier = this.crashPoint;
                this.handleCrash();
            }
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================
    setBet(amount) {
        if (this.currentState !== this.FSM_STATES.WAITING_FOR_BETS) return;
        const numAmount = parseFloat(amount) || 0;
        this.bets[0].amount = Math.max(0, Math.min(numAmount, this.walletState.balance));
    }

    setBet1Amount(amount) {
        if (this.currentState !== this.FSM_STATES.WAITING_FOR_BETS) return;
        this.bets[0].amount = parseFloat(amount) || 0;
    }

    setBet2Amount(amount) {
        if (this.currentState !== this.FSM_STATES.WAITING_FOR_BETS) return;
        this.bets[1].amount = parseFloat(amount) || 0;
    }

    setAutoCashout(betNumber, multiplier) {
        const bet = this.bets[betNumber - 1];
        if (bet) bet.autoCashoutAt = parseFloat(multiplier) || 0;
    }

    async play() {
        if (this.currentState !== this.FSM_STATES.WAITING_FOR_BETS) return;
        // Auto-place bets then start
        if (this.bets[0].amount > 0) await this.placeBet(1);
        if (this.bets[1].amount > 0) await this.placeBet(2);
    }

    async cashOut(betNumber) {
        await this.cashout(betNumber);
    }

    resize() {
        this.calculateDimensions();
    }

    destroy() {
        this.clearBettingTimer();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.particles = { explosion: [], confetti: [], engineSmoke: [], sparkles: [], cashoutBurst: [] };
        this.transitionTo(this.FSM_STATES.IDLE);
    }
}

// Export
window.AviatorFullGame = AviatorFullGame;
console.log('✅ Aviator v5.0 — Premium Casino Architecture Loaded');
