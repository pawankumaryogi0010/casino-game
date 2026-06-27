// ============================================
// EMERALD KING - GAME LOADER SYSTEM
// Full-Screen Loading + Container Management
// ============================================

const GameLoaderSystem = {
    isLoading: false,
    isGameActive: false,
    currentGameId: null,
    gameInstance: null,
    animationFrameId: null,
    betAmount: 50,
    balance: 1000,
    bettingTimerInterval: null,
    bettingTimeLeft: 0,

    loadingTips: [
        '🃏 Shuffling the deck...',
        '🎰 Preparing your table...',
        '👑 Welcoming VIP players...',
        '💰 Setting up betting limits...',
        '🎲 Calibrating fair play algorithms...',
        '🌟 Loading premium experience...',
        '🔒 Securing your session...',
        '🎯 Setting up the game board...',
        '💎 Verifying provably fair system...',
        '🎪 Almost ready...'
    ],

    async launchGame(gameId, gameConfig) {
        if (this.isLoading || this.isGameActive) return;
        
        this.isLoading = true;
        this.currentGameId = gameId;
        
        // Get balance from current user if available
        if (window.currentUser && typeof window.currentUser.balance === 'number') {
            this.balance = window.currentUser.balance;
        }
        
        this.hideLobby();
        await this.showLoadingScreen();
        this.createGameContainer(gameConfig);
        await this.initializeGame(gameId, gameConfig);
        this.hideLoadingScreen();
        this.isLoading = false;
        this.isGameActive = true;
        this.startBettingTimer();
    },

    hideLobby() {
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        const main = document.querySelector('main');
        
        if (header) header.style.display = 'none';
        if (nav) nav.style.display = 'none';
        if (main) main.style.display = 'none';
        
        document.querySelectorAll('.hash-view, .page').forEach(v => {
            v.style.display = 'none';
        });
    },

    showLobby() {
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        const main = document.querySelector('main');
        
        if (header) header.style.display = '';
        if (nav) nav.style.display = '';
        if (main) main.style.display = '';
        
        const homeView = document.getElementById('page-home');
        if (homeView) {
            homeView.style.display = '';
            homeView.classList.add('active');
        }
    },

    showLoadingScreen() {
        return new Promise((resolve) => {
            const existingLoader = document.getElementById('game-loading-overlay');
            if (existingLoader) existingLoader.remove();
            
            const overlay = document.createElement('div');
            overlay.id = 'game-loading-overlay';
            overlay.innerHTML = `
                <div class="loader-logo">👑</div>
                <div class="loader-title">EMERALD KING</div>
                <div class="loader-subtitle">Premium Casino Experience</div>
                <div class="loader-progress-container">
                    <div class="loader-progress-bar"></div>
                </div>
                <div class="loader-tips" id="loader-tip">🃏 Shuffling the deck...</div>
            `;
            document.body.appendChild(overlay);
            
            let tipIndex = 0;
            const tipEl = document.getElementById('loader-tip');
            const tipInterval = setInterval(() => {
                tipIndex = (tipIndex + 1) % this.loadingTips.length;
                if (tipEl) {
                    tipEl.style.opacity = '0';
                    setTimeout(() => {
                        tipEl.textContent = this.loadingTips[tipIndex];
                        tipEl.style.opacity = '1';
                    }, 300);
                }
            }, 1200);
            
            const duration = 6000 + Math.random() * 2000;
            
            setTimeout(() => {
                clearInterval(tipInterval);
                resolve();
            }, duration);
        });
    },

    hideLoadingScreen() {
        const overlay = document.getElementById('game-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => overlay.remove(), 500);
        }
    },

    createGameContainer(gameConfig) {
        const existing = document.getElementById('game-fullscreen-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'game-fullscreen-container';
        container.innerHTML = `
            <div id="game-header">
                <div class="game-logo-area">
                    <div class="game-icon">${gameConfig.thumbnail || '🎮'}</div>
                    <div>
                        <div class="game-name">${gameConfig.name || 'Game'}</div>
                        <div class="game-provider">EMERALD KING CASINO</div>
                    </div>
                </div>
                <div class="header-balance-display">
                    <span class="balance-icon">💰</span>
                    <span class="balance-value" id="game-header-balance">₹${this.balance.toFixed(2)}</span>
                </div>
                <button class="exit-btn" id="game-exit-btn">✕ EXIT</button>
            </div>
            
            <div id="game-canvas-wrapper">
                <canvas id="game-main-canvas"></canvas>
                <div id="game-info-overlay"></div>
                <div id="betting-timer" style="display:none;">
                    <div class="timer-ring"></div>
                    <span id="timer-seconds">30</span>
                    <span>SEC</span>
                </div>
            </div>
            
            <div id="game-footer">
                <div class="chip-selector">
                    <button class="chip-btn chip-50 selected" data-chip="50">50</button>
                    <button class="chip-btn chip-100" data-chip="100">100</button>
                    <button class="chip-btn chip-500" data-chip="500">500</button>
                    <button class="chip-btn chip-1000" data-chip="1000">1000</button>
                    <button class="chip-btn chip-5000" data-chip="5000">5000</button>
                </div>
                <button class="action-btn deal-btn" id="game-deal-btn">DEAL</button>
            </div>
        `;
        
        document.body.appendChild(container);
        this.setupCanvas();
        this.bindGameEvents(gameConfig);
    },

    setupCanvas() {
        const wrapper = document.getElementById('game-canvas-wrapper');
        const canvas = document.getElementById('game-main-canvas');
        if (!wrapper || !canvas) return;
        
        const wrapperWidth = wrapper.clientWidth;
        const wrapperHeight = wrapper.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        
        const displayWidth = Math.min(wrapperWidth - 32, 500);
        const displayHeight = Math.min(wrapperHeight - 32, displayWidth * 1.2);
        
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        this.canvasDisplayWidth = displayWidth;
        this.canvasDisplayHeight = displayHeight;
    },

    bindGameEvents(gameConfig) {
        const exitBtn = document.getElementById('game-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitGame());
        }
        
        const chipBtns = document.querySelectorAll('#game-footer .chip-btn');
        chipBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                chipBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.betAmount = parseInt(btn.dataset.chip);
                if (this.gameInstance && this.gameInstance.setBet) {
                    this.gameInstance.setBet(this.betAmount);
                }
            });
        });
        
        const dealBtn = document.getElementById('game-deal-btn');
        if (dealBtn) {
            dealBtn.addEventListener('click', () => {
                if (this.gameInstance && this.gameInstance.play) {
                    dealBtn.disabled = true;
                    dealBtn.textContent = 'PLAYING...';
                    
                    this.gameInstance.play(this.betAmount);
                    
                    // Reset betting timer
                    this.stopBettingTimer();
                    
                    setTimeout(() => {
                        dealBtn.disabled = false;
                        dealBtn.textContent = 'DEAL';
                        this.startBettingTimer();
                    }, 3000);
                }
            });
        }
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.gameInstance && this.gameInstance.resize) {
                this.gameInstance.resize();
            }
        });
    },

    async initializeGame(gameId, gameConfig) {
        const canvas = document.getElementById('game-main-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        let GameClass = null;
        
        if (gameConfig.class && window[gameConfig.class]) {
            GameClass = window[gameConfig.class];
        }
        
        if (!GameClass && window.GameMatrix && window.GameMatrix.getGameClass) {
            GameClass = window.GameMatrix.getGameClass(gameId);
        }
        
        if (GameClass) {
            this.gameInstance = new GameClass(canvas, ctx);
            if (this.gameInstance.init) this.gameInstance.init();
            if (this.gameInstance.setBet) this.gameInstance.setBet(this.betAmount);
        } else {
            this.gameInstance = this.createFallbackGame(canvas, ctx, gameConfig);
            this.gameInstance.init();
        }
        
        this.startGameLoop();
    },

    createFallbackGame(canvas, ctx, config) {
        const self = this;
        return {
            canvas, ctx, config,
            bet: self.betAmount,
            init() {
                const w = self.canvasDisplayWidth || 400;
                const h = self.canvasDisplayHeight || 500;
                ctx.fillStyle = '#0a0806';
                ctx.fillRect(0, 0, w, h);
                
                // Draw table
                ctx.fillStyle = '#1a1410';
                ctx.strokeStyle = 'rgba(201,168,76,0.3)';
                ctx.lineWidth = 3;
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(20, 20, w-40, h-40, 16);
                    ctx.fill();
                    ctx.stroke();
                }
                
                ctx.fillStyle = '#0d3320';
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(28, 28, w-56, h-56, 12);
                    ctx.fill();
                }
                
                ctx.fillStyle = '#c9a84c';
                ctx.font = 'bold 28px Georgia';
                ctx.textAlign = 'center';
                ctx.fillText(config.thumbnail || '🎮', w/2, h/2 - 25);
                
                ctx.fillStyle = '#f0e8d8';
                ctx.font = 'bold 18px Georgia';
                ctx.fillText(config.name || 'Game', w/2, h/2 + 15);
                
                ctx.fillStyle = 'rgba(240,232,216,0.5)';
                ctx.font = '14px Georgia';
                ctx.fillText('Select chip & press DEAL', w/2, h/2 + 45);
            },
            setBet(b) { this.bet = b; },
            play(b) {
                const infoOverlay = document.getElementById('game-info-overlay');
                if (infoOverlay) {
                    infoOverlay.innerHTML = '<div class="info-badge" style="color:#c9a84c;">🎲 Playing...</div>';
                }
                
                // Deduct bet
                self.balance -= b;
                self.updateBalance(self.balance);
                
                setTimeout(() => {
                    const win = Math.random() > 0.5;
                    if (win) {
                        const winAmount = b * 2;
                        self.balance += winAmount;
                        self.updateBalance(self.balance);
                        if (infoOverlay) {
                            infoOverlay.innerHTML = `<div class="info-badge" style="color:#00e676;">🎉 Won +₹${winAmount}</div>`;
                        }
                        self.showWinOverlay(winAmount);
                    } else {
                        if (infoOverlay) {
                            infoOverlay.innerHTML = `<div class="info-badge" style="color:#ff4444;">😞 Lost -₹${b}</div>`;
                        }
                        self.showLoseOverlay(b);
                    }
                    
                    // Update global balance if exists
                    if (window.currentUser) {
                        window.currentUser.balance = self.balance;
                        if (typeof window.updateUI === 'function') window.updateUI();
                    }
                }, 1500);
            },
            update() {},
            render() { this.init(); },
            resize() {},
            destroy() {}
        };
    },

    startGameLoop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        const loop = (ts) => {
            if (this.isGameActive && this.gameInstance) {
                if (this.gameInstance.update) this.gameInstance.update(ts);
                if (this.gameInstance.render) this.gameInstance.render();
            }
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    },

    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    startBettingTimer() {
        this.stopBettingTimer();
        this.bettingTimeLeft = 30;
        
        const timerEl = document.getElementById('betting-timer');
        const secondsEl = document.getElementById('timer-seconds');
        
        if (timerEl) timerEl.style.display = 'flex';
        if (secondsEl) secondsEl.textContent = this.bettingTimeLeft;
        
        this.bettingTimerInterval = setInterval(() => {
            this.bettingTimeLeft--;
            if (secondsEl) secondsEl.textContent = this.bettingTimeLeft;
            
            if (this.bettingTimeLeft <= 10 && timerEl) {
                timerEl.classList.add('urgent');
            }
            
            if (this.bettingTimeLeft <= 0) {
                this.stopBettingTimer();
                const dealBtn = document.getElementById('game-deal-btn');
                if (dealBtn && !dealBtn.disabled) dealBtn.click();
            }
        }, 1000);
    },

    stopBettingTimer() {
        if (this.bettingTimerInterval) {
            clearInterval(this.bettingTimerInterval);
            this.bettingTimerInterval = null;
        }
        const timerEl = document.getElementById('betting-timer');
        if (timerEl) {
            timerEl.style.display = 'none';
            timerEl.classList.remove('urgent');
        }
    },

    showWinOverlay(amount) {
        const wrapper = document.getElementById('game-canvas-wrapper');
        if (!wrapper) return;
        
        const existing = document.getElementById('win-overlay');
        if (existing) existing.remove();
        const existingLose = document.getElementById('lose-overlay');
        if (existingLose) existingLose.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'win-overlay';
        overlay.innerHTML = `
            <div class="win-banner">
                <div class="win-label">🎉 YOU WIN!</div>
                <div class="win-amount">+₹${amount.toFixed(2)}</div>
            </div>
        `;
        wrapper.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 2500);
    },

    showLoseOverlay(amount) {
        const wrapper = document.getElementById('game-canvas-wrapper');
        if (!wrapper) return;
        
        const existing = document.getElementById('lose-overlay');
        if (existing) existing.remove();
        const existingWin = document.getElementById('win-overlay');
        if (existingWin) existingWin.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'lose-overlay';
        overlay.innerHTML = `
            <div class="lose-banner">
                <div class="lose-label">😞 YOU LOST</div>
                <div class="lose-amount">-₹${amount.toFixed(2)}</div>
            </div>
        `;
        wrapper.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 2500);
    },

    updateBalance(newBalance) {
        this.balance = newBalance;
        const balanceEl = document.getElementById('game-header-balance');
        if (balanceEl) {
            const startBalance = parseFloat(balanceEl.textContent.replace(/[^0-9.]/g, '')) || this.balance;
            const duration = 500;
            const startTime = performance.now();
            
            const animate = (ts) => {
                const elapsed = ts - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = startBalance + (newBalance - startBalance) * eased;
                balanceEl.textContent = '₹' + current.toFixed(2);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    },

    exitGame() {
        this.stopGameLoop();
        this.stopBettingTimer();
        this.isGameActive = false;
        this.currentGameId = null;
        
        if (this.gameInstance && this.gameInstance.destroy) {
            this.gameInstance.destroy();
        }
        this.gameInstance = null;
        
        const container = document.getElementById('game-fullscreen-container');
        if (container) {
            container.style.animation = 'gameContainerSlideIn 0.3s ease-in reverse';
            setTimeout(() => container.remove(), 300);
        }
        
        const loadingOverlay = document.getElementById('game-loading-overlay');
        if (loadingOverlay) loadingOverlay.remove();
        
        this.showLobby();
        
        // Update global UI
        if (window.currentUser) {
            window.currentUser.balance = this.balance;
            if (typeof window.updateUI === 'function') window.updateUI();
        }
    }
};

window.GameLoaderSystem = GameLoaderSystem;
console.log('✅ Game Loader System Ready');
