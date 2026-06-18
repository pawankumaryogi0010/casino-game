// ============================================
// EMERALD KING CASINO - GAME ENGINE LIBRARY
// Visual Component & Particle System Core
// File: js/games/_engine.js
// Version: 1.0.0 Production
// ============================================

// ============================================
// SECTION 1: NEON GLOW RENDERING UTILITIES
// ============================================

/**
 * Neon Glow Context - Manages shadow and glow effects
 */
class NeonGlowContext {
    /**
     * Apply neon glow to current canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} color - Glow color (hex)
     * @param {number} blur - Blur radius
     * @param {number} offsetX - Shadow offset X
     * @param {number} offsetY - Shadow offset Y
     */
    static apply(ctx, color = '#00e676', blur = 15, offsetX = 0, offsetY = 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
    }

    /**
     * Remove all glow effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    static clear(ctx) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    /**
     * Draw text with neon glow
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Text color
     * @param {string} glowColor - Glow color
     * @param {number} glowBlur - Glow blur amount
     */
    static drawText(ctx, text, x, y, color = '#00e676', glowColor = '#00e676', glowBlur = 12) {
        NeonGlowContext.apply(ctx, glowColor, glowBlur);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        NeonGlowContext.apply(ctx, glowColor, glowBlur * 0.5);
        ctx.fillText(text, x, y);
        NeonGlowContext.clear(ctx);
    }

    /**
     * Draw rectangle with neon border glow
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} w - Width
     * @param {number} h - Height
     * @param {string} borderColor - Border color
     * @param {string} glowColor - Glow color
     * @param {number} glowBlur - Glow blur
     */
    static drawRect(ctx, x, y, w, h, borderColor = '#00e676', glowColor = '#00e676', glowBlur = 10) {
        NeonGlowContext.apply(ctx, glowColor, glowBlur);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        NeonGlowContext.clear(ctx);
    }

    /**
     * Draw circle with neon glow
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Circle radius
     * @param {string} color - Fill/stroke color
     * @param {string} glowColor - Glow color
     * @param {number} glowBlur - Glow blur amount
     * @param {boolean} fill - Fill or stroke
     */
    static drawCircle(ctx, x, y, radius, color = '#00e676', glowColor = '#00e676', glowBlur = 15, fill = false) {
        NeonGlowContext.apply(ctx, glowColor, glowBlur);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        NeonGlowContext.clear(ctx);
    }
}

// ============================================
// SECTION 2: VECTOR MATH UTILITIES
// ============================================

/**
 * 2D Vector class for particle physics calculations
 */
class Vector2 {
    /**
     * @param {number} x - X component
     * @param {number} y - Y component
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Add another vector to this one
     * @param {Vector2} v - Vector to add
     * @returns {Vector2} This vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtract another vector from this one
     * @param {Vector2} v - Vector to subtract
     * @returns {Vector2} This vector
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiply vector by scalar
     * @param {number} s - Scalar value
     * @returns {Vector2} This vector
     */
    multiply(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Get vector magnitude (length)
     * @returns {number} Magnitude
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalize vector to unit length
     * @returns {Vector2} This vector
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    /**
     * Create a copy of this vector
     * @returns {Vector2} New vector with same values
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Get distance to another vector
     * @param {Vector2} v - Target vector
     * @returns {number} Distance
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Linear interpolation between two vectors
     * @param {Vector2} v1 - Start vector
     * @param {Vector2} v2 - End vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2} New interpolated vector
     */
    static lerp(v1, v2, t) {
        return new Vector2(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t
        );
    }

    /**
     * Create random vector within a circle
     * @param {number} radius - Circle radius
     * @returns {Vector2} Random vector
     */
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
// SECTION 3: PARTICLE SYSTEM - WIN CASCADE
// ============================================

/**
 * Individual particle for win cascade effect
 */
class WinParticle {
    /**
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {string} type - 'star' or 'coin'
     */
    constructor(x, y, type = 'star') {
        // Position
        this.position = new Vector2(x, y);
        
        // Velocity with random direction
        const angle = (Math.random() * Math.PI * 2);
        const speed = 2 + Math.random() * 6;
        this.velocity = new Vector2(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - (2 + Math.random() * 4) // Upward bias
        );
        
        // Physics
        this.gravity = 0.15;
        this.friction = 0.98;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        
        // Visual properties
        this.type = type;
        this.size = type === 'coin' ? 6 + Math.random() * 8 : 3 + Math.random() * 6;
        this.opacity = 1.0;
        this.fadeRate = 0.008 + Math.random() * 0.015;
        
        // Color based on type
        if (type === 'coin') {
            this.color = Math.random() > 0.5 ? '#FFD700' : '#FFA500';
            this.glowColor = '#FFD700';
        } else {
            const starColors = ['#FFD700', '#00e676', '#00b0ff', '#FF6B6B', '#FFFFFF'];
            this.color = starColors[Math.floor(Math.random() * starColors.length)];
            this.glowColor = this.color;
        }
        
        // Lifetime
        this.alive = true;
        this.age = 0;
        this.maxAge = 60 + Math.random() * 80; // Frames
        
        // Trail particles (for stars)
        this.trail = [];
    }

    /**
     * Update particle position and properties
     */
    update() {
        if (!this.alive) return;
        
        // Apply gravity
        this.velocity.y += this.gravity;
        
        // Apply friction
        this.velocity.multiply(this.friction);
        
        // Update position
        this.position.add(this.velocity);
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Update opacity
        this.age++;
        if (this.age > this.maxAge * 0.6) {
            this.opacity -= this.fadeRate;
        }
        
        // Check if dead
        if (this.opacity <= 0 || this.age >= this.maxAge) {
            this.alive = false;
        }
        
        // Add trail point
        if (this.type === 'star' && this.age % 3 === 0) {
            this.trail.push({
                x: this.position.x,
                y: this.position.y,
                opacity: this.opacity * 0.5,
                size: this.size * 0.5
            });
            if (this.trail.length > 5) {
                this.trail.shift();
            }
        }
    }

    /**
     * Render particle on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.alive || this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'coin') {
            this.drawCoin(ctx);
        } else {
            this.drawStar(ctx);
        }
        
        ctx.restore();
        
        // Render trail
        if (this.type === 'star') {
            this.renderTrail(ctx);
        }
    }

    /**
     * Draw star shape
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawStar(ctx) {
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        
        // Glow
        NeonGlowContext.apply(ctx, this.glowColor, 8);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        NeonGlowContext.clear(ctx);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw coin shape
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawCoin(ctx) {
        const radius = this.size;
        
        // Outer glow
        NeonGlowContext.apply(ctx, this.glowColor, 12);
        
        // Coin body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin border
        NeonGlowContext.clear(ctx);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        
        // Dollar sign
        ctx.fillStyle = '#011713';
        ctx.font = `bold ${radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
    }

    /**
     * Render particle trail
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderTrail(ctx) {
        ctx.save();
        this.trail.forEach((point, index) => {
            ctx.globalAlpha = point.opacity * (index / this.trail.length);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}

/**
 * Win Particle Cascade Manager
 * Spawns 80 golden star and coin particles on win event
 */
class WinParticleCascade {
    /**
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.isActive = false;
        this.age = 0;
        this.maxAge = 150; // Frames before auto-cleanup
    }

    /**
     * Spawn the particle cascade
     * @param {number} x - Origin X position
     * @param {number} y - Origin Y position
     * @param {number} count - Number of particles (default 80)
     */
    spawn(x, y, count = 80) {
        try {
            this.isActive = true;
            this.age = 0;
            this.particles = [];
            
            // Create particles
            for (let i = 0; i < count; i++) {
                const type = i < 30 ? 'coin' : 'star'; // 30 coins + 50 stars
                const particle = new WinParticle(x, y, type);
                this.particles.push(particle);
            }
            
            console.log('✨ Win cascade spawned:', count, 'particles');
            
        } catch (error) {
            console.error('❌ Cascade spawn error:', error);
        }
    }

    /**
     * Update all particles
     */
    update() {
        if (!this.isActive) return;
        
        this.age++;
        
        // Update each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // Remove dead particles
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
        
        // Auto-deactivate if all particles gone or max age reached
        if (this.particles.length === 0 || this.age >= this.maxAge) {
            this.isActive = false;
            this.particles = [];
        }
    }

    /**
     * Render all particles
     */
    render() {
        if (!this.isActive) return;
        
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
    }

    /**
     * Check if cascade is still active
     * @returns {boolean} Active state
     */
    isAlive() {
        return this.isActive && this.particles.length > 0;
    }

    /**
     * Force stop and clear all particles
     */
    destroy() {
        this.isActive = false;
        this.particles = [];
        this.age = 0;
    }
}

// ============================================
// SECTION 4: GAME BASE CLASS
// ============================================

/**
 * Base Game Class - Extended by specific game implementations
 */
class CasinoGame {
    /**
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} gameId - Game identifier
     */
    constructor(canvas, ctx, gameId) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameId = gameId;
        
        // Game state
        this.bet = 50;
        this.isPlaying = false;
        this.result = null;
        
        // Particle system
        this.winCascade = new WinParticleCascade(ctx);
        
        // Animation
        this.animations = [];
        this.frameCount = 0;
        
        // Display dimensions
        this.width = canvas.width / 2;
        this.height = canvas.height / 2;
        
        // Colors
        this.colors = {
            background: '#011713',
            surface: 'rgba(3, 56, 38, 0.5)',
            border: 'rgba(0, 230, 118, 0.3)',
            neon: '#00e676',
            gold: '#FFD700',
            blue: '#00b0ff',
            red: '#ff4444',
            white: '#ffffff',
            textDim: 'rgba(255, 255, 255, 0.5)'
        };
    }

    /**
     * Initialize the game
     */
    init() {
        this.clearCanvas();
        this.drawBackground();
        this.drawGameTitle();
        console.log('🎮 Game initialized:', this.gameId);
    }

    /**
     * Set bet amount
     * @param {number} amount - Bet amount
     */
    setBet(amount) {
        this.bet = amount;
    }

    /**
     * Play a round
     * @param {number} bet - Bet amount
     */
    play(bet) {
        // Override in child classes
        console.log('⚠️ Base play() called - override in game class');
    }

    /**
     * Update game state (called in animation loop)
     * @param {number} timestamp - Current timestamp
     */
    update(timestamp) {
        this.frameCount++;
        
        // Update win cascade
        if (this.winCascade.isAlive()) {
            this.winCascade.update();
        }
        
        // Update animations
        this.animations = this.animations.filter(anim => {
            anim.progress += anim.speed;
            if (anim.progress >= 1) {
                if (anim.onComplete) anim.onComplete();
                return false;
            }
            return true;
        });
    }

    /**
     * Render game frame (called in animation loop)
     */
    render() {
        if (!this.ctx) return;
        
        // Clear and redraw
        this.clearCanvas();
        this.drawBackground();
        
        // Render win cascade on top
        if (this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }

    /**
     * Clear entire canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw game background
     */
    drawBackground() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // Main surface
        ctx.fillStyle = this.colors.surface;
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        
        const margin = 10;
        ctx.beginPath();
        this.roundRect(margin, margin, w - margin * 2, h - margin * 2, 12);
        ctx.fill();
        ctx.stroke();
        
        // Inner grid lines
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.05)';
        ctx.lineWidth = 1;
        
        for (let x = margin; x < w - margin; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, margin);
            ctx.lineTo(x, h - margin);
            ctx.stroke();
        }
        
        for (let y = margin; y < h - margin; y += 40) {
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(w - margin, y);
            ctx.stroke();
        }
    }

    /**
     * Draw game title on canvas
     */
    drawGameTitle() {
        const gameConfig = GAME_REGISTRY ? GAME_REGISTRY[this.gameId] : null;
        const title = gameConfig ? gameConfig.name : this.gameId;
        const emoji = gameConfig ? gameConfig.thumbnail : '🎮';
        
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // Title background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(20, h - 45, w - 40, 35);
        
        // Title text
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(emoji + ' ' + title, w / 2, h - 20);
    }

    /**
     * Show win result
     * @param {number} amount - Win amount
     */
    showWin(amount) {
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `<span style="color:#00e676;">🎉 YOU WIN! +₹${amount}</span>`;
        }
        
        // Spawn win particles
        this.winCascade.spawn(this.width / 2, this.height / 2, 80);
    }

    /**
     * Show lose result
     * @param {number} amount - Lost amount
     */
    showLose(amount) {
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = `<span style="color:#ff4444;">😞 You lost ₹${amount}</span>`;
        }
    }

    /**
     * Helper: Draw rounded rectangle path
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} w - Width
     * @param {number} h - Height
     * @param {number} r - Corner radius
     */
    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
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

    /**
     * Handle canvas resize
     */
    resize() {
        this.width = this.canvas.width / 2;
        this.height = this.canvas.height / 2;
    }

    /**
     * Clean up game resources
     */
    destroy() {
        this.winCascade.destroy();
        this.animations = [];
        this.isPlaying = false;
        console.log('🧹 Game destroyed:', this.gameId);
    }
}

// ============================================
// SECTION 5: EXPORT TO GLOBAL SCOPE
// ============================================

// Export classes and utilities
window.NeonGlowContext = NeonGlowContext;
window.Vector2 = Vector2;
window.WinParticle = WinParticle;
window.WinParticleCascade = WinParticleCascade;
window.CasinoGame = CasinoGame;

// Export global win particle spawner
window.spawnWinParticles = function(ctx, x, y, count = 80) {
    try {
        const cascade = new WinParticleCascade(ctx);
        cascade.spawn(x, y, count);
        
        // Auto-animate the cascade
        function animateCascade() {
            if (!cascade.isAlive()) return;
            cascade.update();
            
            // We need to render on the main game loop's canvas
            // This is handled by the game instance's render method
            
            requestAnimationFrame(animateCascade);
        }
        
        // Store reference for game loop to pick up
        if (window._activeWinCascade) {
            window._activeWinCascade.destroy();
        }
        window._activeWinCascade = cascade;
        
        animateCascade();
        
        return cascade;
    } catch (error) {
        console.error('❌ Spawn particles error:', error);
        return null;
    }
};

console.log('🎨 Game Engine Library v1.0.0 Loaded');
console.log('📋 Classes: NeonGlowContext | Vector2 | WinParticle | WinParticleCascade | CasinoGame');
console.log('✨ Features: Neon Glow | Vector Math | 80-Particle Win Cascade');
