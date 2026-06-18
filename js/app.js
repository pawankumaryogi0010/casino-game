// ============================================
// EMERALD KING CASINO - GAME LOADER ORCHESTRATOR
// HTML5 Canvas Game Engine Bootloader
// File: js/app.js
// Version: 1.0.0 Production
// ============================================

// ============================================
// SECTION 1: GAME REGISTRY & CONFIGURATION
// ============================================

// Master game registry - maps game IDs to their engine files
const GAME_REGISTRY = {
    'dragon-tiger': {
        name: 'Dragon Tiger',
        engine: 'js/games/_engine.js',
        class: 'DragonTigerGame',
        thumbnail: '🐉',
        minBet: 10,
        maxBet: 10000,
        rtp: '97.5%',
        category: 'table'
    },
    'teen-patti': {
        name: 'Teen Patti',
        engine: 'js/games/_engine.js',
        class: 'TeenPattiGame',
        thumbnail: '🃏',
        minBet: 10,
        maxBet: 5000,
        rtp: '96.8%',
        category: 'table'
    },
    'aviator': {
        name: 'Aviator',
        engine: 'js/games/_engine.js',
        class: 'AviatorGame',
        thumbnail: '✈️',
        minBet: 10,
        maxBet: 10000,
        rtp: '99.1%',
        category: 'crash'
    },
    'roulette': {
        name: 'Roulette',
        engine: 'js/games/_engine.js',
        class: 'RouletteGame',
        thumbnail: '🎡',
        minBet: 5,
        maxBet: 5000,
        rtp: '97.3%',
        category: 'table'
    },
    'slots': {
        name: '777 Slots',
        engine: 'js/games/_engine.js',
        class: 'SlotsGame',
        thumbnail: '🎰',
        minBet: 1,
        maxBet: 1000,
        rtp: '96.5%',
        category: 'slots'
    },
    'baccarat': {
        name: 'Baccarat',
        engine: 'js/games/_engine.js',
        class: 'BaccaratGame',
        thumbnail: '🎴',
        minBet: 10,
        maxBet: 10000,
        rtp: '98.9%',
        category: 'table'
    },
    'cricket-war': {
        name: 'Cricket War',
        engine: 'js/games/_engine.js',
        class: 'CricketWarGame',
        thumbnail: '🎯',
        minBet: 10,
        maxBet: 5000,
        rtp: '95.2%',
        category: 'casual'
    },
    'lucky-7': {
        name: 'Lucky 7',
        engine: 'js/games/_engine.js',
        class: 'Lucky7Game',
        thumbnail: '🍀',
        minBet: 5,
        maxBet: 2000,
        rtp: '96.0%',
        category: 'slots'
    }
};

// ============================================
// SECTION 2: GAME LOADER STATE MANAGEMENT
// ============================================

// Global game loader state
const GameLoader = {
    // Current game session
    currentGame: null,
    currentGameId: null,
    currentGameInstance: null,
    
    // Canvas reference
    canvas: null,
    ctx: null,
    
    // Animation frame reference
    animationFrameId: null,
    
    // Game state flags
    isGameRunning: false,
    isGamePaused: false,
    
    // Lobby state cache
    lobbyState: {
        previousView: 'home-view',
        previousHash: '#home-view'
    },
    
    // Asset cache
    assetCache: new Map(),
    
    // Performance metrics
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0
};

// ============================================
// SECTION 3: GAME CARD INTERACTION HANDLERS
// ============================================

/**
 * Initialize game card click handlers on the home lobby
 * Intercepts clicks on .game-card elements
 */
function initializeGameCardListeners() {
    try {
        const gameCards = document.querySelectorAll('.game-card');
        
        if (gameCards.length === 0) {
            console.warn('⚠️ No game cards found in DOM. Retrying in 1s...');
            setTimeout(initializeGameCardListeners, 1000);
            return;
        }
        
        gameCards.forEach(card => {
            // Remove existing listeners to prevent duplicates
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', function(event) {
                event.preventDefault();
                const gameId = this.getAttribute('data-game-id');
                
                if (gameId && GAME_REGISTRY[gameId]) {
                    launchGame(gameId);
                } else {
                    console.warn('⚠️ Unknown game ID:', gameId);
                    // Demo fallback
                    launchGame('dragon-tiger');
                }
            });
        });
        
        console.log('✅ Game card listeners initialized (' + gameCards.length + ' cards)');
        
    } catch (error) {
        console.error('❌ Game card initialization error:', error);
    }
}

/**
 * Launch a game from the lobby
 * Caches lobby state, creates canvas, loads engine, starts game
 * @param {string} gameId - Game identifier from registry
 */
async function launchGame(gameId) {
    try {
        const gameConfig = GAME_REGISTRY[gameId];
        
        if (!gameConfig) {
            console.error('❌ Game not found in registry:', gameId);
            return;
        }
        
        console.log('🚀 Launching game:', gameConfig.name, '(' + gameId + ')');
        
        // Step 1: Cache current lobby state
        GameLoader.lobbyState.previousView = getCurrentViewId();
        GameLoader.lobbyState.previousHash = window.location.hash;
        
        // Step 2: Store game context
        GameLoader.currentGameId = gameId;
        GameLoader.currentGame = gameConfig;
        
        // Step 3: Wipe active view components
        hideAllLobbyViews();
        
        // Step 4: Hide bottom navigation
        hideBottomNavigation();
        
        // Step 5: Hide top bar
        hideTopBar();
        
        // Step 6: Create game view container
        createGameViewContainer(gameConfig);
        
        // Step 7: Create hardware-accelerated canvas
        createGameCanvas();
        
        // Step 8: Create game UI overlay (bet controls, back button)
        createGameUIOverlay(gameConfig);
        
        // Step 9: Load game engine script dynamically
        await loadGameEngine(gameConfig);
        
        // Step 10: Initialize game instance
        initializeGameInstance(gameConfig);
        
        // Step 11: Update URL hash
        window.location.hash = '#game-view';
        
        console.log('✅ Game launched successfully:', gameConfig.name);
        
    } catch (error) {
        console.error('❌ Game launch error:', error);
        returnToLobby();
    }
}

/**
 * Get current visible view ID
 * @returns {string} Current view identifier
 */
function getCurrentViewId() {
    try {
        const visibleView = document.querySelector('.hash-view:not(.hidden)');
        return visibleView ? visibleView.id : 'home-view';
    } catch (error) {
        return 'home-view';
    }
}

/**
 * Hide all lobby view elements
 */
function hideAllLobbyViews() {
    try {
        const views = document.querySelectorAll('.hash-view');
        views.forEach(view => {
            view.classList.add('hidden');
        });
    } catch (error) {
        console.error('❌ Hide views error:', error);
    }
}

/**
 * Hide bottom navigation bar
 */
function hideBottomNavigation() {
    try {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Hide nav error:', error);
    }
}

/**
 * Hide top header bar
 */
function hideTopBar() {
    try {
        const header = document.querySelector('header');
        if (header) {
            header.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Hide header error:', error);
    }
}

/**
 * Create game view container in the main content area
 * @param {Object} gameConfig - Game configuration
 */
function createGameViewContainer(gameConfig) {
    try {
        // Remove existing game view if any
        const existingView = document.getElementById('game-view');
        if (existingView) {
            existingView.remove();
        }
        
        // Create new game view
        const mainContent = document.querySelector('main');
        if (!mainContent) {
            throw new Error('Main content area not found');
        }
        
        const gameView = document.createElement('div');
        gameView.id = 'game-view';
        gameView.className = 'hash-view';
        gameView.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #011713;
        `;
        
        mainContent.appendChild(gameView);
        
        console.log('✅ Game view container created');
        
    } catch (error) {
        console.error('❌ Create container error:', error);
    }
}

// ============================================
// SECTION 4: CANVAS CREATION & MANAGEMENT
// ============================================

/**
 * Create hardware-accelerated 2D/WebGL canvas
 * Appends to game view container with proper sizing
 */
function createGameCanvas() {
    try {
        const gameView = document.getElementById('game-view');
        if (!gameView) {
            throw new Error('Game view container not found');
        }
        
        // Remove existing canvas if any
        const existingCanvas = document.getElementById('casino-stage');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Create new canvas with hardware acceleration hint
        const canvas = document.createElement('canvas');
        canvas.id = 'casino-stage';
        canvas.style.cssText = `
            display: block;
            width: 100%;
            height: auto;
            max-height: 60vh;
            background: radial-gradient(ellipse at center, #033826 0%, #011713 70%);
            border-radius: 12px;
            border: 1px solid rgba(0, 230, 118, 0.2);
            box-shadow: 0 0 30px rgba(0, 230, 118, 0.1);
            image-rendering: auto;
        `;
        
        // Set actual canvas resolution (2x for retina)
        const containerWidth = gameView.clientWidth - 32; // 16px padding each side
        const containerHeight = Math.min(window.innerHeight * 0.55, 500);
        
        canvas.width = containerWidth * 2;
        canvas.height = containerHeight * 2;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = containerHeight + 'px';
        
        // Get rendering context with WebGL fallback hint
        const ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            willReadFrequently: false
        });
        
        // Scale context for retina
        ctx.scale(2, 2);
        
        // Store references
        GameLoader.canvas = canvas;
        GameLoader.ctx = ctx;
        
        // Append to game view
        gameView.appendChild(canvas);
        
        // Clear with background
        ctx.fillStyle = '#011713';
        ctx.fillRect(0, 0, containerWidth, containerHeight);
        
        // Draw loading text
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Game...', containerWidth / 2, containerHeight / 2);
        
        console.log('✅ Game canvas created:', containerWidth + 'x' + containerHeight);
        
    } catch (error) {
        console.error('❌ Canvas creation error:', error);
    }
}

/**
 * Resize canvas to fit container
 */
function resizeGameCanvas() {
    try {
        if (!GameLoader.canvas || !GameLoader.ctx) return;
        
        const gameView = document.getElementById('game-view');
        if (!gameView) return;
        
        const containerWidth = gameView.clientWidth - 32;
        const containerHeight = Math.min(window.innerHeight * 0.55, 500);
        
        GameLoader.canvas.width = containerWidth * 2;
        GameLoader.canvas.height = containerHeight * 2;
        GameLoader.canvas.style.width = containerWidth + 'px';
        GameLoader.canvas.style.height = containerHeight + 'px';
        
        GameLoader.ctx.setTransform(1, 0, 0, 1, 0, 0);
        GameLoader.ctx.scale(2, 2);
        
    } catch (error) {
        console.error('❌ Canvas resize error:', error);
    }
}

// ============================================
// SECTION 5: GAME UI OVERLAY
// ============================================

/**
 * Create game UI overlay with controls
 * @param {Object} gameConfig - Game configuration
 */
function createGameUIOverlay(gameConfig) {
    try {
        const gameView = document.getElementById('game-view');
        if (!gameView) return;
        
        // Remove existing overlay if any
        const existingOverlay = document.getElementById('game-ui-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'game-ui-overlay';
        overlay.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: rgba(1, 23, 19, 0.95);
            border-top: 1px solid rgba(0, 230, 118, 0.2);
        `;
        
        overlay.innerHTML = `
            <!-- Game Title Bar -->
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:24px;">${gameConfig.thumbnail}</span>
                    <div>
                        <h3 style="color:white;font-size:14px;font-weight:bold;margin:0;">${gameConfig.name}</h3>
                        <span style="color:#00e676;font-size:10px;">RTP ${gameConfig.rtp}</span>
                    </div>
                </div>
                <button id="btn-back-to-lobby" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 14px;
                    border-radius: 20px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,68,68,0.3)';this.style.borderColor='#ff4444';"
                   onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.borderColor='rgba(255,255,255,0.2)';">
                    ✕ Lobby
                </button>
            </div>
            
            <!-- Bet Controls -->
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="color:rgba(255,255,255,0.6);font-size:11px;">Bet:</span>
                <button class="bet-btn" data-amount="10" style="
                    padding:6px 12px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.3);
                    color:#00e676;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;
                ">₹10</button>
                <button class="bet-btn" data-amount="50" style="
                    padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                    color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;
                ">₹50</button>
                <button class="bet-btn" data-amount="100" style="
                    padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                    color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;
                ">₹100</button>
                <button class="bet-btn" data-amount="500" style="
                    padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                    color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;
                ">₹500</button>
                <span id="current-bet-display" style="color:#FFD700;font-size:11px;font-weight:bold;margin-left:auto;">
                    Bet: ₹50
                </span>
            </div>
            
            <!-- Action Buttons -->
            <div style="display:flex;gap:8px;">
                <button id="btn-deal-play" style="
                    flex:1;padding:12px;
                    background:linear-gradient(135deg,#00e676,#00b0ff);
                    color:#011713;border:none;border-radius:12px;
                    font-size:15px;font-weight:bold;cursor:pointer;
                    box-shadow:0 8px 20px rgba(0,230,118,0.3);
                ">🎮 DEAL</button>
            </div>
            
            <!-- Result Display -->
            <div id="game-result-display" style="
                text-align:center;min-height:24px;font-size:13px;font-weight:bold;
            "></div>
        `;
        
        gameView.appendChild(overlay);
        
        // Add event listeners
        setupGameUIEventListeners(gameConfig);
        
        console.log('✅ Game UI overlay created');
        
    } catch (error) {
        console.error('❌ Overlay creation error:', error);
    }
}

/**
 * Setup game UI event listeners
 * @param {Object} gameConfig - Game configuration
 */
function setupGameUIEventListeners(gameConfig) {
    try {
        // Back to lobby button
        const backBtn = document.getElementById('btn-back-to-lobby');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (confirm('Leave game and return to lobby?')) {
                    returnToLobby();
                }
            });
        }
        
        // Bet amount buttons
        const betButtons = document.querySelectorAll('.bet-btn');
        let currentBet = 50;
        
        betButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = parseInt(this.getAttribute('data-amount'));
                currentBet = amount;
                
                // Update visual state
                betButtons.forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.05)';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                    b.style.color = 'white';
                });
                
                this.style.background = 'rgba(0,230,118,0.15)';
                this.style.borderColor = 'rgba(0,230,118,0.3)';
                this.style.color = '#00e676';
                
                // Update display
                const betDisplay = document.getElementById('current-bet-display');
                if (betDisplay) {
                    betDisplay.textContent = 'Bet: ₹' + amount;
                }
                
                // Update game instance
                if (GameLoader.currentGameInstance && 
                    typeof GameLoader.currentGameInstance.setBet === 'function') {
                    GameLoader.currentGameInstance.setBet(amount);
                }
            });
        });
        
        // Deal/Play button
        const dealBtn = document.getElementById('btn-deal-play');
        if (dealBtn) {
            dealBtn.addEventListener('click', () => {
                if (GameLoader.currentGameInstance && 
                    typeof GameLoader.currentGameInstance.play === 'function') {
                    GameLoader.currentGameInstance.play(currentBet);
                } else {
                    // Demo fallback
                    triggerDemoGamePlay(currentBet);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ UI listeners error:', error);
    }
}

// ============================================
// SECTION 6: GAME ENGINE LOADING
// ============================================

/**
 * Dynamically load game engine script
 * @param {Object} gameConfig - Game configuration
 */
async function loadGameEngine(gameConfig) {
    try {
        // Check if engine is already loaded
        if (document.querySelector(`script[src="${gameConfig.engine}"]`)) {
            console.log('ℹ️ Game engine already loaded');
            return;
        }
        
        // Load engine script
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = gameConfig.engine;
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Game engine loaded:', gameConfig.engine);
                resolve();
            };
            
            script.onerror = () => {
                console.warn('⚠️ Engine file not found. Using embedded fallback engine.');
                // Engine functions are embedded in this file as fallback
                resolve();
            };
            
            document.head.appendChild(script);
        });
        
    } catch (error) {
        console.error('❌ Engine loading error:', error);
    }
}

/**
 * Initialize game instance from loaded engine
 * @param {Object} gameConfig - Game configuration
 */
function initializeGameInstance(gameConfig) {
    try {
        const canvas = GameLoader.canvas;
        const ctx = GameLoader.ctx;
        
        if (!canvas || !ctx) {
            throw new Error('Canvas not initialized');
        }
        
        // Try to create game instance from loaded engine class
        if (gameConfig.class && typeof window[gameConfig.class] === 'function') {
            GameLoader.currentGameInstance = new window[gameConfig.class](canvas, ctx);
            console.log('✅ Game instance created:', gameConfig.class);
        } else {
            // Use fallback demo game
            console.log('ℹ️ Using fallback demo game engine');
            GameLoader.currentGameInstance = createFallbackGameInstance(canvas, ctx, gameConfig);
        }
        
        // Initialize the game
        if (GameLoader.currentGameInstance && 
            typeof GameLoader.currentGameInstance.init === 'function') {
            GameLoader.currentGameInstance.init();
        }
        
        // Start game loop
        GameLoader.isGameRunning = true;
        startGameLoop();
        
        // Setup resize handler
        window.addEventListener('resize', handleGameResize);
        
    } catch (error) {
        console.error('❌ Game instance error:', error);
    }
}

/**
 * Create fallback game instance for demo
 * @param {HTMLCanvasElement} canvas - Game canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} gameConfig - Game configuration
 * @returns {Object} Game instance with standard interface
 */
function createFallbackGameInstance(canvas, ctx, gameConfig) {
    // Fallback game state
    const state = {
        bet: 50,
        isPlaying: false,
        result: null,
        particles: [],
        animations: []
    };
    
    return {
        canvas: canvas,
        ctx: ctx,
        state: state,
        gameConfig: gameConfig,
        
        init: function() {
            console.log('🎮 Fallback game initialized:', gameConfig.name);
            this.drawGameBoard();
        },
        
        setBet: function(amount) {
            state.bet = amount;
        },
        
        play: function(bet) {
            if (state.isPlaying) return;
            
            state.isPlaying = true;
            state.bet = bet;
            
            // Simulate game result
            const outcomes = ['win', 'lose', 'win', 'win', 'lose', 'win'];
            state.result = outcomes[Math.floor(Math.random() * outcomes.length)];
            
            // Disable button temporarily
            const dealBtn = document.getElementById('btn-deal-play');
            if (dealBtn) dealBtn.disabled = true;
            
            // Show result after animation
            setTimeout(() => {
                this.showResult();
                state.isPlaying = false;
                if (dealBtn) dealBtn.disabled = false;
            }, 1500);
        },
        
        drawGameBoard: function() {
            const w = canvas.width / 2;  // Actual display width
            const h = canvas.height / 2; // Actual display height
            
            // Clear
            ctx.fillStyle = '#011713';
            ctx.fillRect(0, 0, w, h);
            
            // Draw game area
            ctx.fillStyle = 'rgba(3, 56, 38, 0.5)';
            ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
            ctx.lineWidth = 2;
            
            // Draw game zone
            const zoneX = w * 0.1;
            const zoneY = h * 0.1;
            const zoneW = w * 0.8;
            const zoneH = h * 0.8;
            
            ctx.beginPath();
            ctx.roundRect(zoneX, zoneY, zoneW, zoneH, 15);
            ctx.fill();
            ctx.stroke();
            
            // Draw game title
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(gameConfig.thumbnail, w / 2, h / 2 - 10);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(gameConfig.name, w / 2, h / 2 + 30);
            
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '11px Arial';
            ctx.fillText('Press DEAL to play', w / 2, h / 2 + 55);
        },
        
        showResult: function() {
            const w = canvas.width / 2;
            const h = canvas.height / 2;
            const resultDisplay = document.getElementById('game-result-display');
            
            if (state.result === 'win') {
                const winAmount = state.bet * 2;
                if (resultDisplay) {
                    resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${winAmount}</span>`;
                }
                // Trigger win particles
                if (typeof window.spawnWinParticles === 'function') {
                    window.spawnWinParticles(ctx, w / 2, h / 2);
                }
            } else {
                if (resultDisplay) {
                    resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${state.bet}</span>`;
                }
            }
            
            // Redraw board
            setTimeout(() => this.drawGameBoard(), 2000);
        },
        
        destroy: function() {
            state.particles = [];
            state.animations = [];
            console.log('🧹 Fallback game destroyed');
        }
    };
}

// ============================================
// SECTION 7: GAME LOOP MANAGEMENT
// ============================================

/**
 * Start the game animation loop
 */
function startGameLoop() {
    try {
        if (GameLoader.animationFrameId) {
            cancelAnimationFrame(GameLoader.animationFrameId);
        }
        
        function gameLoop(timestamp) {
            // Calculate FPS
            GameLoader.frameCount++;
            if (timestamp - GameLoader.lastFpsUpdate >= 1000) {
                GameLoader.fps = GameLoader.frameCount;
                GameLoader.frameCount = 0;
                GameLoader.lastFpsUpdate = timestamp;
            }
            
            // Update and render game
            if (GameLoader.isGameRunning && GameLoader.currentGameInstance) {
                if (typeof GameLoader.currentGameInstance.update === 'function') {
                    GameLoader.currentGameInstance.update(timestamp);
                }
                if (typeof GameLoader.currentGameInstance.render === 'function') {
                    GameLoader.currentGameInstance.render();
                }
            }
            
            // Continue loop
            GameLoader.animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        GameLoader.animationFrameId = requestAnimationFrame(gameLoop);
        GameLoader.lastFpsUpdate = performance.now();
        
        console.log('🔄 Game loop started');
        
    } catch (error) {
        console.error('❌ Game loop error:', error);
    }
}

/**
 * Stop the game animation loop
 */
function stopGameLoop() {
    try {
        if (GameLoader.animationFrameId) {
            cancelAnimationFrame(GameLoader.animationFrameId);
            GameLoader.animationFrameId = null;
            console.log('⏹️ Game loop stopped');
        }
    } catch (error) {
        console.error('❌ Stop loop error:', error);
    }
}

// ============================================
// SECTION 8: RETURN TO LOBBY
// ============================================

/**
 * Clean up game and return to lobby
 * Freezes animation loop, clears buffers, syncs wallet, restores UI
 */
async function returnToLobby() {
    try {
        console.log('🏠 Returning to lobby...');
        
        // Step 1: Stop game loop
        stopGameLoop();
        
        // Step 2: Set game state to not running
        GameLoader.isGameRunning = false;
        GameLoader.isGamePaused = false;
        
        // Step 3: Destroy game instance
        if (GameLoader.currentGameInstance && 
            typeof GameLoader.currentGameInstance.destroy === 'function') {
            GameLoader.currentGameInstance.destroy();
        }
        GameLoader.currentGameInstance = null;
        
        // Step 4: Clear asset buffers
        GameLoader.assetCache.clear();
        
        // Step 5: Execute wallet synchronization
        await syncWalletBalance();
        
        // Step 6: Remove canvas
        if (GameLoader.canvas && GameLoader.canvas.parentNode) {
            GameLoader.canvas.parentNode.removeChild(GameLoader.canvas);
        }
        GameLoader.canvas = null;
        GameLoader.ctx = null;
        
        // Step 7: Remove game view
        const gameView = document.getElementById('game-view');
        if (gameView) {
            gameView.remove();
        }
        
        // Step 8: Remove game UI overlay
        const overlay = document.getElementById('game-ui-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Step 9: Show top bar
        showTopBar();
        
        // Step 10: Show bottom navigation
        showBottomNavigation();
        
        // Step 11: Restore previous lobby view
        const previousView = GameLoader.lobbyState.previousView || 'home-view';
        const previousHash = GameLoader.lobbyState.previousHash || '#home-view';
        
        // Show the view
        const viewElement = document.getElementById(previousView);
        if (viewElement) {
            viewElement.classList.remove('hidden');
        }
        
        // Restore hash
        window.location.hash = previousHash;
        
        // Step 12: Reset game state
        GameLoader.currentGameId = null;
        GameLoader.currentGame = null;
        
        // Step 13: Re-initialize game card listeners
        setTimeout(initializeGameCardListeners, 300);
        
        // Step 14: Remove resize listener
        window.removeEventListener('resize', handleGameResize);
        
        console.log('✅ Returned to lobby successfully');
        
    } catch (error) {
        console.error('❌ Return to lobby error:', error);
        // Force reload if cleanup fails
        location.reload();
    }
}

/**
 * Sync wallet balance with Supabase
 * Ensures balance is up to date after gaming session
 */
async function syncWalletBalance() {
    try {
        if (typeof window.emeraldDB !== 'undefined' && 
            typeof window.emeraldDB.fetchProfile === 'function' &&
            window.emeraldDB.isReady && window.emeraldDB.isReady()) {
            
            const profile = await window.emeraldDB.fetchProfile();
            
            if (profile && typeof window.emeraldDB.updateBalance === 'function') {
                window.emeraldDB.updateBalance(profile.balance, profile.vip_level);
                console.log('💰 Wallet synced:', profile.balance);
            }
        } else {
            console.log('ℹ️ Wallet sync skipped - DB not available');
        }
    } catch (error) {
        console.error('❌ Wallet sync error:', error);
    }
}

/**
 * Show top header bar
 */
function showTopBar() {
    try {
        const header = document.querySelector('header');
        if (header) {
            header.style.display = 'flex';
        }
    } catch (error) {
        console.error('❌ Show header error:', error);
    }
}

/**
 * Show bottom navigation bar
 */
function showBottomNavigation() {
    try {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.display = '';
        }
    } catch (error) {
        console.error('❌ Show nav error:', error);
    }
}

/**
 * Handle window resize for game canvas
 */
function handleGameResize() {
    try {
        resizeGameCanvas();
        
        // Notify game instance of resize
        if (GameLoader.currentGameInstance && 
            typeof GameLoader.currentGameInstance.resize === 'function') {
            GameLoader.currentGameInstance.resize();
        }
    } catch (error) {
        console.error('❌ Resize handler error:', error);
    }
}

// ============================================
// SECTION 9: DEMO GAME PLAY
// ============================================

/**
 * Trigger demo game play sequence
 * @param {number} bet - Bet amount
 */
function triggerDemoGamePlay(bet) {
    try {
        console.log('🎮 Demo play - Bet: ₹' + bet);
        
        const resultDisplay = document.getElementById('game-result-display');
        const dealBtn = document.getElementById('btn-deal-play');
        
        if (dealBtn) dealBtn.disabled = true;
        
        // Show "thinking" state
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🎰 Spinning...</span>';
        }
        
        // Simulate delay then show result
        setTimeout(() => {
            const win = Math.random() > 0.45;
            
            if (win) {
                const winAmount = bet * (1 + Math.random());
                if (resultDisplay) {
                    resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${winAmount.toFixed(0)}</span>`;
                }
                // Spawn win particles
                if (GameLoader.ctx) {
                    const w = GameLoader.canvas.width / 2;
                    const h = GameLoader.canvas.height / 2;
                    if (typeof window.spawnWinParticles === 'function') {
                        window.spawnWinParticles(GameLoader.ctx, w / 2, h / 2);
                    }
                }
            } else {
                if (resultDisplay) {
                    resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${bet}</span>`;
                }
            }
            
            if (dealBtn) dealBtn.disabled = false;
            
        }, 1200 + Math.random() * 800);
        
    } catch (error) {
        console.error('❌ Demo play error:', error);
    }
}

// ============================================
// SECTION 10: HASH ROUTE INTEGRATION
// ============================================

/**
 * Handle game-view hash route
 */
function handleGameViewRoute() {
    try {
        // If we're on game-view hash but no game is running, return to lobby
        if (!GameLoader.isGameRunning && !GameLoader.currentGameInstance) {
            console.log('ℹ️ Game view accessed with no active game');
            returnToLobby();
        }
    } catch (error) {
        console.error('❌ Game route error:', error);
    }
}

// Listen for hash changes to detect game view
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash === '#game-view' && !GameLoader.isGameRunning) {
        handleGameViewRoute();
    }
});

// ============================================
// SECTION 11: MODULE INITIALIZATION
// ============================================

/**
 * Initialize the game loader module
 */
function initializeGameLoader() {
    try {
        console.log('🎮 Initializing Game Loader Orchestrator...');
        
        // Initialize game card listeners
        initializeGameCardListeners();
        
        // Re-initialize on hash changes (for SPA navigation)
        window.addEventListener('hashchange', () => {
            setTimeout(initializeGameCardListeners, 200);
        });
        
        // Handle back button from game view
        window.addEventListener('popstate', () => {
            if (GameLoader.isGameRunning) {
                returnToLobby();
            }
        });
        
        console.log('✅ Game Loader Orchestrator Initialized');
        console.log('📋 Registered Games:', Object.keys(GAME_REGISTRY).length);
        console.log('🎯 Click any game card to launch!');
        
    } catch (error) {
        console.error('❌ Game loader initialization error:', error);
    }
}

// ============================================
// SECTION 12: PUBLIC API EXPORT
// ============================================

window.emeraldGames = {
    launch: launchGame,
    exit: returnToLobby,
    getRegistry: () => GAME_REGISTRY,
    getLoader: () => GameLoader,
    isGameActive: () => GameLoader.isGameRunning,
    init: initializeGameLoader
};

// ============================================
// SECTION 13: AUTO-START
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeGameLoader, 1000);
    });
} else {
    setTimeout(initializeGameLoader, 1000);
}

console.log('🎮 Game Loader Module v1.0.0 Loaded');
console.log('📋 Access via: window.emeraldGames');
