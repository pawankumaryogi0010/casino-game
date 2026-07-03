// ============================================
// EMERALD KING CASINO - GAME MATRIX ENGINE
// Core Library: CardRenderer, WinParticleCascade, Game Registry
// File: js/games/matrix.js
// Version: 2.0.1 - Fixed Game Registry & Auto-Detection
// ============================================

// ============================================
// SECTION 1: CARD RENDERING ENGINE
// ============================================

class CardRenderer {
    static drawCard(ctx, x, y, width, height, suit, rank, faceUp = true) {
        ctx.save();
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        
        // Card body
        const bodyGrad = ctx.createLinearGradient(x, y, x + width, y + height);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(1, '#f0f0f0');
        ctx.fillStyle = faceUp ? bodyGrad : '#1a2744';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, x, y, width, height, 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        if (faceUp && suit && rank) {
            const color = (suit === '♥' || suit === '♦') ? '#cc0000' : '#1a1a1a';
            const fontSize = Math.floor(width * 0.32);
            
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rank, x + 4, y + 2);
            ctx.font = `${Math.floor(fontSize * 0.8)}px Arial`;
            ctx.fillText(suit, x + 4, y + fontSize + 1);
            
            ctx.font = `${Math.floor(fontSize * 1.6)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(suit, x + width / 2, y + height / 2);
            
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(rank, x + width - 4, y + height - 2);
            ctx.font = `${Math.floor(fontSize * 0.8)}px Arial`;
            ctx.fillText(suit, x + width - 4, y + height - fontSize - 1);
        } else {
            ctx.fillStyle = '#0d2b4a';
            CardRenderer.roundRect(ctx, x + 3, y + 3, width - 6, height - 6, 4);
            ctx.fill();
            ctx.fillStyle = '#1a4a7a';
            ctx.font = `${Math.floor(width * 0.5)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🃏', x + width / 2, y + height / 2);
        }
        ctx.restore();
    }
    
    static drawCardBack(ctx, x, y, w, h) {
        ctx.fillStyle = '#1a2744';
        ctx.strokeStyle = '#2a4a7a';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2a4a7a';
        ctx.font = `${Math.floor(w * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎰', x + w/2, y + h/2);
    }
    
    static roundRect(ctx, x, y, w, h, r) {
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
}

// ============================================
// SECTION 2: WIN PARTICLE CASCADE SYSTEM
// ============================================

class WinParticle {
    constructor(x, y, type = 'star') {
        this.position = { x, y };
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - (3 + Math.random() * 4)
        };
        this.gravity = 0.15;
        this.friction = 0.98;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.type = type;
        this.size = type === 'coin' ? 5 + Math.random() * 7 : 2 + Math.random() * 5;
        this.opacity = 1.0;
        this.fadeRate = 0.008 + Math.random() * 0.015;
        this.color = type === 'coin' ? (Math.random() > 0.5 ? '#FFD700' : '#FFA500') : 
            ['#FFD700', '#00e676', '#00b0ff', '#ff6b6b', '#ffffff'][Math.floor(Math.random() * 5)];
        this.alive = true;
        this.age = 0;
        this.maxAge = 60 + Math.random() * 80;
    }
    
    update() {
        if (!this.alive) return;
        this.velocity.y += this.gravity;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.rotation += this.rotationSpeed;
        this.age++;
        if (this.age > this.maxAge * 0.6) this.opacity -= this.fadeRate;
        if (this.opacity <= 0 || this.age >= this.maxAge) this.alive = false;
    }
    
    render(ctx) {
        if (!this.alive || this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        if (this.type === 'coin') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            const spikes = 5;
            const outerR = this.size;
            const innerR = this.size * 0.4;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const a = (i * Math.PI) / spikes - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class WinParticleCascade {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.isActive = false;
        this.age = 0;
        this.maxAge = 150;
    }
    
    spawn(x, y, count = 80) {
        this.isActive = true;
        this.age = 0;
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(new WinParticle(x, y, i < 30 ? 'coin' : 'star'));
        }
    }
    
    update() {
        if (!this.isActive) return;
        this.age++;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].alive) this.particles.splice(i, 1);
        }
        if (this.particles.length === 0 || this.age >= this.maxAge) {
            this.isActive = false;
        }
    }
    
    render() {
        if (!this.isActive) return;
        this.particles.forEach(p => p.render(this.ctx));
    }
    
    isAlive() { return this.isActive && this.particles.length > 0; }
    destroy() { this.isActive = false; this.particles = []; }
}

// ============================================
// SECTION 3: NEON GLOW CONTEXT
// ============================================

class NeonGlowContext {
    static apply(ctx, color = '#00e676', blur = 15, offsetX = 0, offsetY = 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
    }
    
    static clear(ctx) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

// ============================================
// SECTION 4: VECTOR2 MATH
// ============================================

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) { this.x += v.x; this.y += v.y; return this; }
    subtract(v) { this.x -= v.x; this.y -= v.y; return this; }
    multiply(s) { this.x *= s; this.y *= s; return this; }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) { this.x /= mag; this.y /= mag; }
        return this;
    }
    
    clone() { return new Vector2(this.x, this.y); }
    
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static lerp(v1, v2, t) {
        return new Vector2(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t
        );
    }
    
    static random(radius = 1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        return new Vector2(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        );
    }
}

// ============================================
// SECTION 5: GAME CONSTANTS & DATA
// ============================================

const GAME_RTP = {
    'teen-patti': 0.968,
    'andar-bahar': 0.945,
    'aviator': 0.991,
    'roulette': 0.973,
    'blackjack': 0.995,
    'baccarat': 0.989,
    'jhandi-munda': 0.952,
    'dragon-tiger': 0.975,
    '7up-7down': 0.938,
    'car-roulette': 0.960,
    'ludo-betting': 0.940,
    'plinko': 0.972,
    'mines': 0.965,
    'wheel-fortune': 0.955,
    'classic-slots': 0.965,
    'video-poker': 0.978,
    'red-dog': 0.948,
    'sic-bo': 0.950,
    'hi-low': 0.962,
    'keno-jackpot': 0.940
};

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#ffffff', '♥': '#ff4444', '♦': '#ff4444', '♣': '#ffffff' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROULETTE_COLORS = { 0: 'green', 32: 'red', 15: 'black', 19: 'red', 4: 'black', 21: 'red', 2: 'black', 25: 'red', 17: 'black', 34: 'red', 6: 'black', 27: 'red', 13: 'black', 36: 'red', 11: 'black', 30: 'red', 8: 'black', 23: 'red', 10: 'black', 5: 'red', 24: 'black', 16: 'red', 33: 'black', 1: 'red', 20: 'black', 14: 'red', 31: 'black', 9: 'red', 22: 'black', 18: 'red', 29: 'black', 7: 'red', 28: 'black', 12: 'red', 35: 'black', 3: 'red', 26: 'black' };

const SLOT_SYMBOLS = ['⭐', '🔔', '7️⃣', '🍒', '💎', '🍀', '🎰', '👑'];
const SLOT_PAYOUTS = { '⭐': 2, '🔔': 3, '7️⃣': 5, '🍒': 2, '💎': 4, '🍀': 3, '🎰': 10, '👑': 8 };

// ============================================
// SECTION 6: GAME CLASS REGISTRY (FIXED)
// ============================================

/**
 * GAME_CLASSES - Runtime cache for loaded game classes
 * Initially all null, populated by detectLoadedGames() or registerGameClass()
 * Once a game class is found on window object, it's cached here for fast access
 */
const GAME_CLASSES = {
    'teen-patti': null,
    'andar-bahar': null,
    'aviator': null,
    'roulette': null,
    'blackjack': null,
    'baccarat': null,
    'jhandi-munda': null,
    'dragon-tiger': null,
    '7up-7down': null,
    'car-roulette': null,
    'ludo-betting': null,
    'plinko': null,
    'mines': null,
    'wheel-fortune': null,
    'classic-slots': null,
    'video-poker': null,
    'red-dog': null,
    'sic-bo': null,
    'hi-low': null,
    'keno-jackpot': null
};

/**
 * GAME_CLASS_MAP - Maps game IDs to their expected window class names
 * Used by getGameClass() and detectLoadedGames() to find classes on window object
 */
const GAME_CLASS_MAP = {
    'teen-patti': 'TeenPattiFullGame',
    'andar-bahar': 'AndarBaharFullGame',
    'aviator': 'AviatorFullGame',
    'roulette': 'RouletteFullGame',
    'blackjack': 'BlackjackFullGame',
    'baccarat': 'BaccaratFullGame',
    'jhandi-munda': 'JhandiMundaFullGame',
    'dragon-tiger': 'DragonTigerFullGame',
    '7up-7down': 'SevenUpSevenDownFullGame',
    'car-roulette': 'CarRouletteFullGame',
    'ludo-betting': 'LudoBettingFullGame',
    'plinko': 'PlinkoFullGame',
    'mines': 'MinesFullGame',
    'wheel-fortune': 'WheelOfFortuneFullGame',
    'classic-slots': 'ClassicSlotsFullGame',
    'video-poker': 'VideoPokerFullGame',
    'red-dog': 'RedDogFullGame',
    'sic-bo': 'SicBoFullGame',
    'hi-low': 'HiLowFullGame',
    'keno-jackpot': 'KenoJackpotFullGame'
};

// ============================================
// SECTION 7: GAME FACTORY FUNCTIONS (FIXED)
// ============================================

/**
 * Get a game class by gameId
 * First checks the GAME_CLASSES cache, then looks up via GAME_CLASS_MAP on window
 * 
 * @param {string} gameId - The game identifier (e.g., 'teen-patti', 'blackjack')
 * @returns {Function|null} The game class constructor, or null if not found
 */
function getGameClass(gameId) {
    // Step 1: Check cache first
    if (GAME_CLASSES[gameId]) {
        return GAME_CLASSES[gameId];
    }
    
    // Step 2: Get expected class name from map
    const className = GAME_CLASS_MAP[gameId];
    if (!className) {
        console.warn('⚠️ Game class not found in GAME_CLASS_MAP for:', gameId);
        return null;
    }
    
    // Step 3: Check if class exists on window object
    if (window[className]) {
        // Cache it for future calls
        GAME_CLASSES[gameId] = window[className];
        console.log('✅ Game class found & cached:', gameId, '→', className);
        return window[className];
    }
    
    // Step 4: Not found anywhere
    console.warn('⚠️ Game class not found for:', gameId, '(expected: window.' + className + ')');
    return null;
}

/**
 * Create a game instance from a gameId
 * Uses getGameClass() to find the constructor, then instantiates it
 * 
 * @param {string} gameId - The game identifier
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The 2D context
 * @returns {Object|null} The game instance, or null if class not found
 */
function createGameInstance(gameId, canvas, ctx) {
    const GameClass = getGameClass(gameId);
    if (GameClass) {
        try {
            const instance = new GameClass(canvas, ctx);
            console.log('🎮 Game instance created:', gameId);
            return instance;
        } catch (error) {
            console.error('❌ Error creating game instance for:', gameId, error);
            return null;
        }
    }
    console.error('❌ Cannot create game instance for:', gameId, '(class not found)');
    return null;
}

/**
 * Register a game class manually
 * Useful when a game file wants to self-register on load
 * 
 * @param {string} gameId - The game identifier
 * @param {Function} gameClass - The game class constructor
 */
function registerGameClass(gameId, gameClass) {
    if (!gameId || !gameClass) {
        console.warn('⚠️ registerGameClass: Invalid parameters', { gameId, gameClass });
        return;
    }
    
    if (!GAME_CLASSES.hasOwnProperty(gameId)) {
        console.warn('⚠️ registerGameClass: Unknown game ID:', gameId);
    }
    
    GAME_CLASSES[gameId] = gameClass;
    console.log('✅ Game registered:', gameId, '→', gameClass.name || 'Anonymous');
}

// ============================================
// SECTION 8: AUTO-DETECT LOADED GAMES (FIXED)
// ============================================

/**
 * Auto-detect which game classes are loaded on the window object
 * Loops through GAME_CLASS_MAP and checks if each class exists globally
 * Updates GAME_CLASSES cache for any newly found games
 * 
 * @returns {number} The total number of games currently detected
 */
function detectLoadedGames() {
    let detectedCount = 0;
    
    for (const [gameId, className] of Object.entries(GAME_CLASS_MAP)) {
        // Skip if already registered
        if (GAME_CLASSES[gameId]) {
            detectedCount++;
            continue;
        }
        
        // Check if class exists on window
        if (window[className]) {
            GAME_CLASSES[gameId] = window[className];
            detectedCount++;
            console.log('✅ Auto-detected game:', gameId, '→', className);
        }
    }
    
    return detectedCount;
}

// ============================================
// SECTION 9: GLOBAL EXPORT
// ============================================

window.GameMatrix = {
    // Core Classes
    CardRenderer,
    WinParticle,
    WinParticleCascade,
    NeonGlowContext,
    Vector2,
    
    // Constants
    GAME_RTP,
    SUITS,
    SUIT_COLORS,
    RANKS,
    RANK_VALUES,
    ROULETTE_NUMBERS,
    ROULETTE_COLORS,
    SLOT_SYMBOLS,
    SLOT_PAYOUTS,
    
    // Game Registry (read-only reference)
    GAME_CLASSES,
    GAME_CLASS_MAP,
    
    // Functions
    getGameClass,
    createGameInstance,
    registerGameClass,
    detectLoadedGames
};

// ============================================
// SECTION 10: AUTO-INITIALIZE (FIXED)
// ============================================

/**
 * Primary initialization on DOMContentLoaded
 * Waits 500ms for all scripts to finish loading, then scans for game classes
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loadedCount = detectLoadedGames();
        console.log('🎮 Game Matrix Engine v2.0.1 Ready');
        console.log('📋 Registered Games: ' + loadedCount + ' / 20');
        console.log('🔧 Available via: window.GameMatrix');
        
        // List which games were found
        const foundGames = Object.entries(GAME_CLASSES)
            .filter(([id, cls]) => cls !== null)
            .map(([id]) => id);
        
        if (foundGames.length > 0) {
            console.log('✅ Loaded games:', foundGames.join(', '));
        }
        
        // List which games are missing
        const missingGames = Object.entries(GAME_CLASSES)
            .filter(([id, cls]) => cls === null)
            .map(([id]) => id);
        
        if (missingGames.length > 0) {
            console.warn('⚠️ Missing games (' + missingGames.length + '):', missingGames.join(', '));
        }
    }, 500);
});

/**
 * Fallback detection on window.load
 * Waits 1000ms then scans again, in case scripts loaded after DOMContentLoaded
 */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadedCount = detectLoadedGames();
        const totalRegistered = Object.values(GAME_CLASSES).filter(c => c !== null).length;
        
        if (loadedCount > 0) {
            console.log('🔄 Fallback detection complete: ' + totalRegistered + ' / 20 games loaded');
        }
    }, 1000);
});

console.log('✅ Game Matrix Engine v2.0.1 Loaded');
