// ============================================
// EMERALD KING CASINO - GAME LOADER
// Fixed: Game UI + Logout Working
// File: js/app.js
// Version: 1.0.2
// ============================================

const GAME_REGISTRY = {
    'dragon-tiger': { name: 'Dragon Tiger', class: 'DragonTigerFullGame', thumbnail: '🐉', rtp: '97.5%' },
    'teen-patti': { name: 'Teen Patti', class: 'TeenPattiFullGame', thumbnail: '🃏', rtp: '96.8%' },
    'aviator': { name: 'Aviator', class: 'AviatorFullGame', thumbnail: '✈️', rtp: '99.1%' },
    'roulette': { name: 'Roulette', class: 'RouletteFullGame', thumbnail: '🎡', rtp: '97.3%' },
    'classic-slots': { name: '777 Slots', class: 'ClassicSlotsFullGame', thumbnail: '🎰', rtp: '96.5%' },
    'baccarat': { name: 'Baccarat', class: 'BaccaratFullGame', thumbnail: '🎴', rtp: '98.9%' },
    'blackjack': { name: 'Blackjack', class: 'BlackjackFullGame', thumbnail: '🃏', rtp: '99.5%' },
    'wheel-fortune': { name: 'Wheel of Fortune', class: 'WheelOfFortuneFullGame', thumbnail: '🎡', rtp: '95.5%' },
    'andar-bahar': { name: 'Andar Bahar', class: 'AndarBaharFullGame', thumbnail: '🎯', rtp: '94.5%' },
    '7up-7down': { name: '7 Up 7 Down', class: 'SevenUpSevenDownFullGame', thumbnail: '🎲', rtp: '93.8%' },
    'car-roulette': { name: 'Car Roulette', class: 'CarRouletteFullGame', thumbnail: '🏎️', rtp: '96.0%' },
    'ludo-betting': { name: 'Ludo Betting', class: 'LudoBettingFullGame', thumbnail: '🎯', rtp: '94.0%' },
    'plinko': { name: 'Plinko', class: 'PlinkoFullGame', thumbnail: '🔵', rtp: '97.2%' },
    'mines': { name: 'Mines', class: 'MinesFullGame', thumbnail: '💣', rtp: '96.5%' },
    'jhandi-munda': { name: 'Jhandi Munda', class: 'JhandiMundaFullGame', thumbnail: '🎲', rtp: '95.2%' },
    'video-poker': { name: 'Video Poker', class: 'VideoPokerFullGame', thumbnail: '🃏', rtp: '97.8%' },
    'red-dog': { name: 'Red Dog', class: 'RedDogFullGame', thumbnail: '🐕', rtp: '94.8%' },
    'sic-bo': { name: 'Sic Bo', class: 'SicBoFullGame', thumbnail: '🎲', rtp: '95.0%' },
    'hi-low': { name: 'Hi-Low', class: 'HiLowFullGame', thumbnail: '🔼', rtp: '96.2%' },
    'keno-jackpot': { name: 'Keno Jackpot', class: 'KenoJackpotFullGame', thumbnail: '🔢', rtp: '94.0%' }
};

const GameLoader = {
    currentGame: null, currentGameId: null, currentGameInstance: null,
    canvas: null, ctx: null, animationFrameId: null,
    isGameRunning: false, isGamePaused: false,
    lobbyState: { previousView: 'home-view', previousHash: '#home-view' },
    assetCache: new Map()
};

// ============================================
// GAME CARD LISTENERS
// ============================================

function initializeGameCardListeners() {
    try {
        const gameCards = document.querySelectorAll('.game-card');
        if (gameCards.length === 0) { setTimeout(initializeGameCardListeners, 1000); return; }
        
        gameCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            newCard.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                const gameId = this.getAttribute('data-game-id');
                console.log('🖱️ Game card clicked:', gameId);
                if (gameId && GAME_REGISTRY[gameId]) {
                    launchGame(gameId);
                } else {
                    console.warn('⚠️ Unknown game, launching default');
                    launchGame('dragon-tiger');
                }
            });
        });
        console.log('✅ Game cards ready:', gameCards.length);
    } catch (e) { console.error('Card init error:', e); }
}

// ============================================
// LAUNCH GAME
// ============================================

async function launchGame(gameId) {
    try {
        if (GameLoader.isGameRunning) { console.warn('⚠️ Game already running'); return; }
        
        const gameConfig = GAME_REGISTRY[gameId];
        if (!gameConfig) { console.error('❌ Game not found:', gameId); return; }
        
        console.log('🚀 Launching:', gameConfig.name);
        
        // Set state FIRST
        GameLoader.currentGameId = gameId;
        GameLoader.currentGame = gameConfig;
        GameLoader.isGameRunning = true;
        GameLoader.lobbyState.previousHash = window.location.hash;
        
        // Hide lobby
        document.querySelectorAll('.hash-view').forEach(v => v.classList.add('hidden'));
        const nav = document.querySelector('nav'); if (nav) nav.style.display = 'none';
        const header = document.querySelector('header'); if (header) header.style.display = 'none';
        
        // Create game view
        const main = document.querySelector('main');
        let gameView = document.getElementById('game-view');
        if (gameView) gameView.remove();
        gameView = document.createElement('div');
        gameView.id = 'game-view';
        gameView.className = 'hash-view';
        gameView.style.cssText = 'position:relative;width:100%;display:flex;flex-direction:column;align-items:center;background:#011713;';
        main.appendChild(gameView);
        
        // Canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'casino-stage';
        const cw = Math.min(gameView.clientWidth - 32, 430);
        const ch = Math.min(window.innerHeight * 0.5, 400);
        canvas.width = cw * 2; canvas.height = ch * 2;
        canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
        canvas.style.cssText = 'background:radial-gradient(ellipse at center,#033826,#011713 70%);border-radius:12px;border:1px solid rgba(0,230,118,0.2);margin:8px 0;';
        const ctx = canvas.getContext('2d'); ctx.scale(2, 2);
        gameView.appendChild(canvas);
        GameLoader.canvas = canvas; GameLoader.ctx = ctx;
        
        // Game UI
        const overlay = document.createElement('div');
        overlay.id = 'game-ui-overlay';
        overlay.style.cssText = 'width:100%;padding:12px 16px;background:rgba(1,23,19,0.95);border-top:1px solid rgba(0,230,118,0.2);';
        overlay.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="color:white;font-weight:bold;">${gameConfig.thumbnail} ${gameConfig.name}</span>
                <button id="btn-back-to-lobby" style="background:rgba(255,68,68,0.2);border:1px solid #ff4444;color:#ff4444;padding:6px 14px;border-radius:16px;font-size:11px;cursor:pointer;">✕ Lobby</button>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
                <button class="bet-btn" data-amount="10" style="padding:6px 12px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.3);color:#00e676;border-radius:15px;font-size:11px;cursor:pointer;">₹10</button>
                <button class="bet-btn" data-amount="50" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹50</button>
                <button class="bet-btn" data-amount="100" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹100</button>
                <button class="bet-btn" data-amount="500" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹500</button>
            </div>
            <button id="btn-deal-play" style="width:100%;padding:12px;background:linear-gradient(135deg,#00e676,#00b0ff);color:#011713;border:none;border-radius:12px;font-size:15px;font-weight:bold;cursor:pointer;">🎮 DEAL</button>
            <div id="game-result-display" style="text-align:center;min-height:24px;font-size:13px;font-weight:bold;margin-top:8px;"></div>
        `;
        gameView.appendChild(overlay);
        
        // Bind UI events
        document.getElementById('btn-back-to-lobby').addEventListener('click', () => {
            if (confirm('Leave game?')) returnToLobby();
        });
        
        let currentBet = 50;
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentBet = parseInt(this.getAttribute('data-amount'));
                document.querySelectorAll('.bet-btn').forEach(b => { b.style.background = 'rgba(255,255,255,0.05)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; b.style.color = 'white'; });
                this.style.background = 'rgba(0,230,118,0.15)'; this.style.borderColor = 'rgba(0,230,118,0.3)'; this.style.color = '#00e676';
            });
        });
        
        document.getElementById('btn-deal-play').addEventListener('click', () => {
            if (GameLoader.currentGameInstance?.play) {
                GameLoader.currentGameInstance.play(currentBet);
            } else {
                demoPlay(currentBet);
            }
        });
        
        // Initialize game
        try {
            const GameClass = window[gameConfig.class];
            if (GameClass) {
                GameLoader.currentGameInstance = new GameClass(canvas, ctx);
                console.log('✅ Game class found:', gameConfig.class);
            } else {
                console.warn('⚠️ Class not found:', gameConfig.class);
                GameLoader.currentGameInstance = createFallbackGame(canvas, ctx, gameConfig);
            }
            if (GameLoader.currentGameInstance?.init) GameLoader.currentGameInstance.init();
        } catch (e) {
            console.error('Init error:', e);
            GameLoader.currentGameInstance = createFallbackGame(canvas, ctx, gameConfig);
            GameLoader.currentGameInstance.init();
        }
        
        startGameLoop();
        window.location.hash = '#game-view';
        console.log('✅ Game ready:', gameConfig.name);
        
    } catch (e) { console.error('Launch error:', e); returnToLobby(); }
}

function createFallbackGame(canvas, ctx, config) {
    let bet = 50;
    return {
        canvas, ctx, config,
        init() { this.draw(); },
        setBet(b) { bet = b; },
        play(b) { bet = b; this.draw(); document.getElementById('game-result-display').innerHTML = '<span style="color:#FFD700;">🎰 Playing...</span>'; },
        draw() {
            const w = canvas.width/2, h = canvas.height/2;
            ctx.fillStyle = '#011713'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#0d3320'; ctx.strokeStyle = 'rgba(0,230,118,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(w*0.1, h*0.1, w*0.8, h*0.8, 15); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#00e676'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center'; ctx.fillText(config.thumbnail, w/2, h/2-5);
            ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.fillText(config.name, w/2, h/2+35);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Arial'; ctx.fillText('Press DEAL to play', w/2, h/2+58);
        },
        update() {},
        render() { this.draw(); },
        destroy() {}
    };
}

function demoPlay(bet) {
    const rd = document.getElementById('game-result-display');
    const btn = document.getElementById('btn-deal-play');
    if (btn) btn.disabled = true;
    if (rd) rd.innerHTML = '<span style="color:#FFD700;">🎰 Spinning...</span>';
    setTimeout(() => {
        const win = Math.random() > 0.45;
        if (rd) rd.innerHTML = win ? `<span style="color:#00e676;">🎉 YOU WIN! +₹${Math.floor(bet*2)}</span>` : `<span style="color:#ff4444;">😞 You lost ₹${bet}</span>`;
        if (btn) btn.disabled = false;
    }, 1500);
}

// ============================================
// GAME LOOP
// ============================================

function startGameLoop() {
    if (GameLoader.animationFrameId) cancelAnimationFrame(GameLoader.animationFrameId);
    function loop(ts) {
        if (GameLoader.isGameRunning && GameLoader.currentGameInstance) {
            if (GameLoader.currentGameInstance.update) GameLoader.currentGameInstance.update(ts);
            if (GameLoader.currentGameInstance.render) GameLoader.currentGameInstance.render();
        }
        GameLoader.animationFrameId = requestAnimationFrame(loop);
    }
    GameLoader.animationFrameId = requestAnimationFrame(loop);
}

function stopGameLoop() {
    if (GameLoader.animationFrameId) { cancelAnimationFrame(GameLoader.animationFrameId); GameLoader.animationFrameId = null; }
}

// ============================================
// RETURN TO LOBBY
// ============================================

function returnToLobby() {
    stopGameLoop();
    GameLoader.isGameRunning = false;
    if (GameLoader.currentGameInstance?.destroy) GameLoader.currentGameInstance.destroy();
    GameLoader.currentGameInstance = null;
    if (GameLoader.canvas?.parentNode) GameLoader.canvas.parentNode.removeChild(GameLoader.canvas);
    GameLoader.canvas = null; GameLoader.ctx = null;
    
    const gv = document.getElementById('game-view'); if (gv) gv.remove();
    const ov = document.getElementById('game-ui-overlay'); if (ov) ov.remove();
    
    const header = document.querySelector('header'); if (header) header.style.display = 'flex';
    const nav = document.querySelector('nav'); if (nav) nav.style.display = '';
    
    document.getElementById('home-view')?.classList.remove('hidden');
    window.location.hash = '#home-view';
    GameLoader.currentGameId = null;
    setTimeout(initializeGameCardListeners, 300);
}

// ============================================
// INIT
// ============================================

function initGameLoader() {
    console.log('🎮 Game Loader v1.0.2');
    initializeGameCardListeners();
}

window.emeraldGames = { launch: launchGame, exit: returnToLobby, init: initGameLoader, isActive: () => GameLoader.isGameRunning };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initGameLoader, 1000));
} else {
    setTimeout(initGameLoader, 1000);
}
