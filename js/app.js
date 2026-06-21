// ============================================
// EMERALD KING CASINO - GAME LOADER ORCHESTRATOR
// HTML5 Canvas Game Engine Bootloader
// File: js/app.js
// Version: 1.0.1 - Fixed Auto-Close Bug
// ============================================

// ============================================
// SECTION 1: GAME REGISTRY & CONFIGURATION
// ============================================

// Master game registry - maps game IDs to their engine files
// ✅ FIX: Class names match actual game files
const GAME_REGISTRY = {
    'dragon-tiger': {
        name: 'Dragon Tiger',
        class: 'DragonTigerFullGame',
        thumbnail: '🐉',
        minBet: 10,
        maxBet: 10000,
        rtp: '97.5%',
        category: 'table'
    },
    'teen-patti': {
        name: 'Teen Patti',
        class: 'TeenPattiFullGame',
        thumbnail: '🃏',
        minBet: 10,
        maxBet: 5000,
        rtp: '96.8%',
        category: 'table'
    },
    'aviator': {
        name: 'Aviator',
        class: 'AviatorFullGame',
        thumbnail: '✈️',
        minBet: 10,
        maxBet: 10000,
        rtp: '99.1%',
        category: 'crash'
    },
    'roulette': {
        name: 'Roulette',
        class: 'RouletteFullGame',
        thumbnail: '🎡',
        minBet: 5,
        maxBet: 5000,
        rtp: '97.3%',
        category: 'table'
    },
    'classic-slots': {
        name: '777 Slots',
        class: 'ClassicSlotsFullGame',
        thumbnail: '🎰',
        minBet: 1,
        maxBet: 1000,
        rtp: '96.5%',
        category: 'slots'
    },
    'baccarat': {
        name: 'Baccarat',
        class: 'BaccaratFullGame',
        thumbnail: '🎴',
        minBet: 10,
        maxBet: 10000,
        rtp: '98.9%',
        category: 'table'
    },
    'blackjack': {
        name: 'Blackjack',
        class: 'BlackjackFullGame',
        thumbnail: '🃏',
        minBet: 10,
        maxBet: 5000,
        rtp: '99.5%',
        category: 'table'
    },
    'wheel-fortune': {
        name: 'Wheel of Fortune',
        class: 'WheelOfFortuneFullGame',
        thumbnail: '🎡',
        minBet: 5,
        maxBet: 2000,
        rtp: '95.5%',
        category: 'casual'
    },
    'andar-bahar': {
        name: 'Andar Bahar',
        class: 'AndarBaharFullGame',
        thumbnail: '🎯',
        minBet: 10,
        maxBet: 5000,
        rtp: '94.5%',
        category: 'table'
    },
    '7up-7down': {
        name: '7 Up 7 Down',
        class: 'SevenUpSevenDownFullGame',
        thumbnail: '🎲',
        minBet: 10,
        maxBet: 5000,
        rtp: '93.8%',
        category: 'casual'
    },
    'car-roulette': {
        name: 'Car Roulette',
        class: 'CarRouletteFullGame',
        thumbnail: '🏎️',
        minBet: 10,
        maxBet: 5000,
        rtp: '96.0%',
        category: 'casual'
    },
    'ludo-betting': {
        name: 'Ludo Betting',
        class: 'LudoBettingFullGame',
        thumbnail: '🎯',
        minBet: 10,
        maxBet: 5000,
        rtp: '94.0%',
        category: 'casual'
    },
    'plinko': {
        name: 'Plinko',
        class: 'PlinkoFullGame',
        thumbnail: '🔵',
        minBet: 10,
        maxBet: 5000,
        rtp: '97.2%',
        category: 'casual'
    },
    'mines': {
        name: 'Mines',
        class: 'MinesFullGame',
        thumbnail: '💣',
        minBet: 10,
        maxBet: 5000,
        rtp: '96.5%',
        category: 'casual'
    },
    'jhandi-munda': {
        name: 'Jhandi Munda',
        class: 'JhandiMundaFullGame',
        thumbnail: '🎲',
        minBet: 10,
        maxBet: 5000,
        rtp: '95.2%',
        category: 'casual'
    },
    'video-poker': {
        name: 'Video Poker',
        class: 'VideoPokerFullGame',
        thumbnail: '🃏',
        minBet: 10,
        maxBet: 5000,
        rtp: '97.8%',
        category: 'table'
    },
    'red-dog': {
        name: 'Red Dog',
        class: 'RedDogFullGame',
        thumbnail: '🐕',
        minBet: 10,
        maxBet: 5000,
        rtp: '94.8%',
        category: 'table'
    },
    'sic-bo': {
        name: 'Sic Bo',
        class: 'SicBoFullGame',
        thumbnail: '🎲',
        minBet: 10,
        maxBet: 5000,
        rtp: '95.0%',
        category: 'table'
    },
    'hi-low': {
        name: 'Hi-Low',
        class: 'HiLowFullGame',
        thumbnail: '🔼',
        minBet: 10,
        maxBet: 5000,
        rtp: '96.2%',
        category: 'casual'
    },
    'keno-jackpot': {
        name: 'Keno Jackpot',
        class: 'KenoJackpotFullGame',
        thumbnail: '🔢',
        minBet: 10,
        maxBet: 5000,
        rtp: '94.0%',
        category: 'casual'
    }
};

// ============================================
// SECTION 2: GAME LOADER STATE MANAGEMENT
// ============================================

const GameLoader = {
    currentGame: null,
    currentGameId: null,
    currentGameInstance: null,
    canvas: null,
    ctx: null,
    animationFrameId: null,
    isGameRunning: false,
    isGamePaused: false,
    lobbyState: { previousView: 'home-view', previousHash: '#home-view' },
    assetCache: new Map(),
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0
};

// ============================================
// SECTION 3: GAME CARD INTERACTION HANDLERS
// ============================================

function initializeGameCardListeners() {
    try {
        const gameCards = document.querySelectorAll('.game-card');
        if (gameCards.length === 0) {
            setTimeout(initializeGameCardListeners, 1000);
            return;
        }
        gameCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            newCard.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                const gameId = this.getAttribute('data-game-id');
                if (gameId && GAME_REGISTRY[gameId]) {
                    launchGame(gameId);
                } else {
                    console.warn('⚠️ Unknown game ID:', gameId);
                    launchGame('dragon-tiger');
                }
            });
        });
        console.log('✅ Game card listeners initialized (' + gameCards.length + ' cards)');
    } catch (error) {
        console.error('❌ Game card initialization error:', error);
    }
}

// ============================================
// SECTION 4: GAME LAUNCHER
// ============================================

async function launchGame(gameId) {
    try {
        // ✅ FIX: Prevent double launch
        if (GameLoader.isGameRunning) {
            console.warn('⚠️ Game already running');
            return;
        }

        const gameConfig = GAME_REGISTRY[gameId];
        if (!gameConfig) {
            console.error('❌ Game not found:', gameId);
            return;
        }
        
        console.log('🚀 Launching game:', gameConfig.name);
        
        // Set game state FIRST to prevent hash interference
        GameLoader.currentGameId = gameId;
        GameLoader.currentGame = gameConfig;
        GameLoader.isGameRunning = true;
        
        // Cache lobby state
        GameLoader.lobbyState.previousView = getCurrentViewId();
        GameLoader.lobbyState.previousHash = window.location.hash;
        
        // Hide lobby UI
        hideAllLobbyViews();
        hideBottomNavigation();
        hideTopBar();
        
        // Create game container
        createGameViewContainer(gameConfig);
        createGameCanvas();
        createGameUIOverlay(gameConfig);
        
        // Initialize game instance directly (scripts already loaded via index.html)
        initializeGameInstance(gameConfig);
        
        // Set hash LAST - after everything is ready
        window.location.hash = '#game-view';
        
        console.log('✅ Game launched:', gameConfig.name);
        
    } catch (error) {
        console.error('❌ Game launch error:', error);
        GameLoader.isGameRunning = false;
        returnToLobby();
    }
}

function getCurrentViewId() {
    try {
        const visibleView = document.querySelector('.hash-view:not(.hidden)');
        return visibleView ? visibleView.id : 'home-view';
    } catch (error) { return 'home-view'; }
}

function hideAllLobbyViews() {
    document.querySelectorAll('.hash-view').forEach(view => view.classList.add('hidden'));
}

function hideBottomNavigation() {
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
}

function hideTopBar() {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
}

function createGameViewContainer(gameConfig) {
    const existingView = document.getElementById('game-view');
    if (existingView) existingView.remove();
    
    const mainContent = document.querySelector('main');
    if (!mainContent) throw new Error('Main content not found');
    
    const gameView = document.createElement('div');
    gameView.id = 'game-view';
    gameView.className = 'hash-view';
    gameView.style.cssText = 'position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;background:#011713;';
    mainContent.appendChild(gameView);
}

// ============================================
// SECTION 5: CANVAS CREATION
// ============================================

function createGameCanvas() {
    const gameView = document.getElementById('game-view');
    if (!gameView) throw new Error('Game view not found');
    
    const existingCanvas = document.getElementById('casino-stage');
    if (existingCanvas) existingCanvas.remove();
    
    const canvas = document.createElement('canvas');
    canvas.id = 'casino-stage';
    canvas.style.cssText = 'display:block;width:100%;height:auto;max-height:60vh;background:radial-gradient(ellipse at center,#033826,#011713 70%);border-radius:12px;border:1px solid rgba(0,230,118,0.2);box-shadow:0 0 30px rgba(0,230,118,0.1);';
    
    const containerWidth = gameView.clientWidth - 32;
    const containerHeight = Math.min(window.innerHeight * 0.55, 500);
    
    canvas.width = containerWidth * 2;
    canvas.height = containerHeight * 2;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.scale(2, 2);
    
    GameLoader.canvas = canvas;
    GameLoader.ctx = ctx;
    
    gameView.appendChild(canvas);
    
    ctx.fillStyle = '#011713';
    ctx.fillRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', containerWidth / 2, containerHeight / 2);
}

// ============================================
// SECTION 6: GAME UI OVERLAY
// ============================================

function createGameUIOverlay(gameConfig) {
    const gameView = document.getElementById('game-view');
    if (!gameView) return;
    
    const existingOverlay = document.getElementById('game-ui-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'game-ui-overlay';
    overlay.style.cssText = 'width:100%;padding:12px 16px;display:flex;flex-direction:column;gap:10px;background:rgba(1,23,19,0.95);border-top:1px solid rgba(0,230,118,0.2);';
    
    overlay.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:24px;">${gameConfig.thumbnail}</span>
                <div><h3 style="color:white;font-size:14px;font-weight:bold;margin:0;">${gameConfig.name}</h3><span style="color:#00e676;font-size:10px;">RTP ${gameConfig.rtp}</span></div>
            </div>
            <button id="btn-back-to-lobby" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;padding:8px 14px;border-radius:20px;font-size:11px;cursor:pointer;">✕ Lobby</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:rgba(255,255,255,0.6);font-size:11px;">Bet:</span>
            <button class="bet-btn" data-amount="10" style="padding:6px 12px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.3);color:#00e676;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;">₹10</button>
            <button class="bet-btn" data-amount="50" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;">₹50</button>
            <button class="bet-btn" data-amount="100" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;">₹100</button>
            <button class="bet-btn" data-amount="500" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;font-weight:bold;cursor:pointer;">₹500</button>
            <span id="current-bet-display" style="color:#FFD700;font-size:11px;font-weight:bold;margin-left:auto;">Bet: ₹50</span>
        </div>
        <button id="btn-deal-play" style="width:100%;padding:12px;background:linear-gradient(135deg,#00e676,#00b0ff);color:#011713;border:none;border-radius:12px;font-size:15px;font-weight:bold;cursor:pointer;box-shadow:0 8px 20px rgba(0,230,118,0.3);">🎮 DEAL</button>
        <div id="game-result-display" style="text-align:center;min-height:24px;font-size:13px;font-weight:bold;"></div>
    `;
    
    gameView.appendChild(overlay);
    setupGameUIEventListeners(gameConfig);
}

function setupGameUIEventListeners(gameConfig) {
    const backBtn = document.getElementById('btn-back-to-lobby');
    if (backBtn) backBtn.addEventListener('click', () => { if (confirm('Leave game?')) returnToLobby(); });
    
    let currentBet = 50;
    document.querySelectorAll('.bet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseInt(this.getAttribute('data-amount'));
            currentBet = amount;
            document.querySelectorAll('.bet-btn').forEach(b => { b.style.background = 'rgba(255,255,255,0.05)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; b.style.color = 'white'; });
            this.style.background = 'rgba(0,230,118,0.15)'; this.style.borderColor = 'rgba(0,230,118,0.3)'; this.style.color = '#00e676';
            const betDisplay = document.getElementById('current-bet-display');
            if (betDisplay) betDisplay.textContent = 'Bet: ₹' + amount;
            if (GameLoader.currentGameInstance?.setBet) GameLoader.currentGameInstance.setBet(amount);
        });
    });
    
    const dealBtn = document.getElementById('btn-deal-play');
    if (dealBtn) dealBtn.addEventListener('click', () => {
        if (GameLoader.currentGameInstance?.play) {
            GameLoader.currentGameInstance.play(currentBet);
        } else {
            triggerDemoGamePlay(currentBet);
        }
    });
}

// ============================================
// SECTION 7: GAME INSTANCE INITIALIZATION
// ============================================

function initializeGameInstance(gameConfig) {
    try {
        const canvas = GameLoader.canvas;
        const ctx = GameLoader.ctx;
        if (!canvas || !ctx) throw new Error('Canvas not initialized');
        
        // Check for FullGame classes first (from loaded game files)
        if (gameConfig.class && typeof window[gameConfig.class] === 'function') {
            GameLoader.currentGameInstance = new window[gameConfig.class](canvas, ctx);
            console.log('✅ Game instance created:', gameConfig.class);
        } else {
            console.warn('⚠️ Game class not found:', gameConfig.class, '- using fallback');
            GameLoader.currentGameInstance = createFallbackGameInstance(canvas, ctx, gameConfig);
        }
        
        if (GameLoader.currentGameInstance?.init) {
            GameLoader.currentGameInstance.init();
        }
        
        startGameLoop();
        window.addEventListener('resize', handleGameResize);
        
    } catch (error) {
        console.error('❌ Game instance error:', error);
        GameLoader.currentGameInstance = createFallbackGameInstance(canvas, ctx, gameConfig);
        if (GameLoader.currentGameInstance?.init) GameLoader.currentGameInstance.init();
        startGameLoop();
    }
}

function createFallbackGameInstance(canvas, ctx, gameConfig) {
    const state = { bet: 50, isPlaying: false, result: null };
    return {
        canvas, ctx, state, gameConfig,
        init() { this.drawBoard(); },
        setBet(amount) { state.bet = amount; },
        play(bet) {
            if (state.isPlaying) return;
            state.isPlaying = true; state.bet = bet;
            state.result = Math.random() > 0.45 ? 'win' : 'lose';
            const dealBtn = document.getElementById('btn-deal-play');
            if (dealBtn) dealBtn.disabled = true;
            setTimeout(() => { this.showResult(); state.isPlaying = false; if (dealBtn) dealBtn.disabled = false; }, 1500);
        },
        drawBoard() {
            const w = canvas.width / 2, h = canvas.height / 2;
            ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#0d3320'; ctx.strokeStyle = 'rgba(0,230,118,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(w*0.1, h*0.1, w*0.8, h*0.8, 15); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
            ctx.fillText(gameConfig.thumbnail, w/2, h/2-10);
            ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.fillText(gameConfig.name, w/2, h/2+30);
        },
        showResult() {
            const rd = document.getElementById('game-result-display');
            if (state.result === 'win') {
                if (rd) rd.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${state.bet*2}</span>`;
            } else {
                if (rd) rd.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${state.bet}</span>`;
            }
            setTimeout(() => this.drawBoard(), 2000);
        },
        update() {},
        render() { this.drawBoard(); },
        destroy() { console.log('🧹 Fallback destroyed'); }
    };
}

// ============================================
// SECTION 8: GAME LOOP
// ============================================

function startGameLoop() {
    if (GameLoader.animationFrameId) cancelAnimationFrame(GameLoader.animationFrameId);
    function gameLoop(timestamp) {
        if (GameLoader.isGameRunning && GameLoader.currentGameInstance) {
            if (GameLoader.currentGameInstance.update) GameLoader.currentGameInstance.update(timestamp);
            if (GameLoader.currentGameInstance.render) GameLoader.currentGameInstance.render();
        }
        GameLoader.animationFrameId = requestAnimationFrame(gameLoop);
    }
    GameLoader.animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    if (GameLoader.animationFrameId) { cancelAnimationFrame(GameLoader.animationFrameId); GameLoader.animationFrameId = null; }
}

// ============================================
// SECTION 9: RETURN TO LOBBY
// ============================================

async function returnToLobby() {
    stopGameLoop();
    GameLoader.isGameRunning = false;
    
    if (GameLoader.currentGameInstance?.destroy) GameLoader.currentGameInstance.destroy();
    GameLoader.currentGameInstance = null;
    
    if (GameLoader.canvas?.parentNode) GameLoader.canvas.parentNode.removeChild(GameLoader.canvas);
    GameLoader.canvas = null; GameLoader.ctx = null;
    
    const gameView = document.getElementById('game-view');
    if (gameView) gameView.remove();
    
    const overlay = document.getElementById('game-ui-overlay');
    if (overlay) overlay.remove();
    
    const header = document.querySelector('header');
    if (header) header.style.display = 'flex';
    
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = '';
    
    const previousView = GameLoader.lobbyState.previousView || 'home-view';
    const viewElement = document.getElementById(previousView);
    if (viewElement) viewElement.classList.remove('hidden');
    
    window.location.hash = GameLoader.lobbyState.previousHash || '#home-view';
    
    GameLoader.currentGameId = null;
    GameLoader.currentGame = null;
    
    window.removeEventListener('resize', handleGameResize);
    setTimeout(initializeGameCardListeners, 300);
}

function showTopBar() {
    const header = document.querySelector('header');
    if (header) header.style.display = 'flex';
}

function showBottomNavigation() {
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = '';
}

function handleGameResize() {
    if (GameLoader.currentGameInstance?.resize) GameLoader.currentGameInstance.resize();
}

// ============================================
// SECTION 10: DEMO GAME PLAY
// ============================================

function triggerDemoGamePlay(bet) {
    const resultDisplay = document.getElementById('game-result-display');
    const dealBtn = document.getElementById('btn-deal-play');
    if (dealBtn) dealBtn.disabled = true;
    if (resultDisplay) resultDisplay.innerHTML = '<span style="color:#FFD700;">🎰 Spinning...</span>';
    
    setTimeout(() => {
        const win = Math.random() > 0.45;
        if (win) {
            const winAmount = bet * (1 + Math.random());
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${winAmount.toFixed(0)}</span>`;
        } else {
            if (resultDisplay) resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${bet}</span>`;
        }
        if (dealBtn) dealBtn.disabled = false;
    }, 1200 + Math.random() * 800);
}

// ============================================
// SECTION 11: HASH ROUTE INTEGRATION
// ============================================

// ✅ FIX: Do NOT auto-redirect from game-view
// Original code was redirecting to lobby when game-view hash detected

// ============================================
// SECTION 12: INITIALIZATION
// ============================================

function initializeGameLoader() {
    console.log('🎮 Initializing Game Loader...');
    initializeGameCardListeners();
    console.log('✅ Game Loader Ready -', Object.keys(GAME_REGISTRY).length, 'games registered');
}

// ============================================
// SECTION 13: PUBLIC API
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
// SECTION 14: AUTO-START
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initializeGameLoader, 1000));
} else {
    setTimeout(initializeGameLoader, 1000);
}

console.log('🎮 Game Loader v1.0.1 Loaded - Auto-Close Bug Fixed');
