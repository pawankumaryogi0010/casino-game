// ============================================
// EMERALD KING CASINO - GAME MATRIX ENGINE
// Core Library: CardRenderer, WinParticleCascade, Game Registry
// File: js/games/matrix.js
// Version: 2.0.0
// ============================================

// ============================================
// CARD RENDERING ENGINE
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
// WIN PARTICLE CASCADE
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
        this.color = type === 'coin' ? (Math.random() > 0.5 ? '#FFD700' : '#FFA500') : ['#FFD700', '#00e676', '#00b0ff', '#ff6b6b', '#ffffff'][Math.floor(Math.random() * 5)];
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
// GAME REGISTRY
// ============================================

const GAME_CLASSES = {
    'teen-patti': null,  // Loaded from teen-patti.js
    'andar-bahar': null, // Loaded from andar-bahar.js
    // More games will be added...
};

function getGameClass(gameId) {
    if (GAME_CLASSES[gameId]) return GAME_CLASSES[gameId];
    // Fallback lookup on window
    const className = {
        'teen-patti': 'TeenPattiFullGame',
        'andar-bahar': 'AndarBaharFullGame',
    }[gameId];
    if (className && window[className]) {
        GAME_CLASSES[gameId] = window[className];
        return window[className];
    }
    return null;
}

function createGameInstance(gameId, canvas, ctx) {
    const GameClass = getGameClass(gameId);
    if (GameClass) return new GameClass(canvas, ctx);
    console.warn('Game not found:', gameId);
    return null;
}

// ============================================
// EXPORT
// ============================================

window.GameMatrix = {
    CardRenderer,
    WinParticle,
    WinParticleCascade,
    GAME_CLASSES,
    getGameClass,
    createGameInstance
};

console.log('✅ Game Matrix Engine v2.0.0 Loaded');
