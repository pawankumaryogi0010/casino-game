// ============================================
// EMERALD KING CASINO - CAR ROULETTE
// Real Casino UI - 6-Car Racing Betting Game
// Full Redesign v3.0.0
// File: js/games/car-roulette.js
// ============================================

class CarRouletteFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Canvas dimensions
        this.w = 500;
        this.h = 600;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedCar = 0;
        this.winner = null;
        this.isRacing = false;
        this.showResult = false;
        this.winnings = 0;
        
        // Cars
        this.cars = [
            { name: 'RED', icon: 'R', color: '#ff4444', progress: 0, speed: 0, x: 0, finishTime: 0 },
            { name: 'BLUE', icon: 'B', color: '#00b0ff', progress: 0, speed: 0, x: 0, finishTime: 0 },
            { name: 'GREEN', icon: 'G', color: '#00e676', progress: 0, speed: 0, x: 0, finishTime: 0 },
            { name: 'GOLD', icon: 'G', color: '#FFD700', progress: 0, speed: 0, x: 0, finishTime: 0 },
            { name: 'PURPLE', icon: 'P', color: '#c084fc', progress: 0, speed: 0, x: 0, finishTime: 0 },
            { name: 'ORANGE', icon: 'O', color: '#ff8800', progress: 0, speed: 0, x: 0, finishTime: 0 }
        ];
        
        // Race track
        this.trackY = 0;
        this.trackHeight = 0;
        this.raceDistance = 0;
        this.finishLineX = 0;
        this.raceStartTime = 0;
        this.raceDuration = 0;
        
        // Animation
        this.exhaustParticles = [];
        this.confettiParticles = [];
        this.winGlowAlpha = 0;
        this.raceProgress = 0;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Colors
        this.palette = {
            bg: '#0a0806',
            trackBg: '#1a1a1a',
            trackBorder: '#333333',
            trackLine: 'rgba(255,255,255,0.3)',
            finishGold: '#FFD700',
            woodLight: '#c48b5c',
            woodDark: '#8b5a3c',
            woodBorder: '#6b3a1f',
            gold: '#d4a843',
            textPrimary: '#f0e8d8',
            textDim: 'rgba(240,232,216,0.4)',
            felt: '#0d5e2e'
        };
    }
    
    // ============================================
    // INIT
    // ============================================
    
    init() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateTrackDimensions();
        this.resetCars();
        this.generateSparkles();
        this.drawFullTrack();
    }
    
    resize() {
        if (this.canvas) {
            const sw = parseFloat(this.canvas.style.width);
            const sh = parseFloat(this.canvas.style.height);
            if (sw && sh) { this.w = sw; this.h = sh; }
        }
        this.calculateTrackDimensions();
        this.drawFullTrack();
    }
    
    calculateTrackDimensions() {
        this.trackY = 72;
        this.trackHeight = this.h - 260;
        this.raceDistance = this.w - 110;
        this.finishLineX = this.w - 55;
        this.cars.forEach(function(car) {
            car.x = 50;
        });
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.0 + 0.2,
                speed: Math.random() * 0.012 + 0.003,
                opacity: Math.random() * 0.25 + 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    resetCars() {
        this.cars.forEach(function(car) {
            car.progress = 0;
            car.speed = 0;
            car.x = 50;
            car.finishTime = 0;
        });
        this.winner = null;
        this.isRacing = false;
        this.showResult = false;
        this.winnings = 0;
        this.exhaustParticles = [];
        this.confettiParticles = [];
        this.raceProgress = 0;
        this.winGlowAlpha = 0;
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    selectCar(index) {
        if (this.isRacing) return;
        this.selectedCar = Math.max(0, Math.min(5, index));
        this.drawFullTrack();
    }
    
    play(bet) {
        if (this.isRacing) return;
        
        this.bet = bet || this.bet;
        this.resetCars();
        this.isRacing = true;
        this.showResult = false;
        
        // Weighted probability for winner
        const weights = [18, 18, 18, 18, 14, 14];
        const totalWeight = 100;
        let random = Math.random() * totalWeight;
        let winnerIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) { winnerIndex = i; break; }
        }
        this.winner = winnerIndex;
        
        // Set speeds with winner getting slight edge
        this.cars.forEach(function(car, i) {
            car.speed = 1.8 + Math.random() * 3.2;
            if (i === winnerIndex) car.speed += 0.3;
            car.finishTime = this.raceDistance / (car.speed * 60);
        }.bind(this));
        
        this.raceStartTime = performance.now();
        this.raceDuration = Math.max.apply(null, this.cars.map(function(c) { return c.finishTime; })) * 1000 + 1500;
        
        const resultDisplay = document.getElementById('game-info-overlay');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<div class="info-badge" style="color:#d4a843;">Racing...</div>';
        }
        
        this.drawFullTrack();
    }
    
    resolveGame() {
        const playerWon = this.winner === this.selectedCar;
        const winnerCar = this.cars[this.winner];
        const resultDisplay = document.getElementById('game-info-overlay');
        
        if (playerWon) {
            this.winnings = Math.floor(this.bet * 3);
            this.chips += this.winnings;
            this.generateConfetti();
            this.winGlowAlpha = 1.0;
            
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showWinOverlay(this.winnings);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
            
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#00e676;font-size:14px;">' + winnerCar.name + ' WINS! +RS ' + this.winnings + '</div>';
            }
        } else {
            if (window.GameLoaderSystem) {
                GameLoaderSystem.showLoseOverlay(this.bet);
                GameLoaderSystem.updateBalance(this.chips);
            }
            if (resultDisplay) {
                resultDisplay.innerHTML = '<div class="info-badge" style="color:#ff6666;font-size:14px;">' + winnerCar.name + ' WINS -RS ' + this.bet + '</div>';
            }
        }
        
        this.showResult = true;
        this.drawFullTrack();
        
        setTimeout(() => {
            this.showResult = false;
            this.winGlowAlpha = 0;
            this.confettiParticles = [];
            if (resultDisplay) resultDisplay.innerHTML = '';
            this.resetCars();
            this.drawFullTrack();
        }, 5000);
    }
    
    generateConfetti() {
        this.confettiParticles = [];
        const colors = ['#ff4444', '#00e676', '#FFD700', '#00b0ff', '#ff8800', '#c084fc', '#ffffff'];
        for (let i = 0; i < 60; i++) {
            this.confettiParticles.push({
                x: this.w * 0.1 + Math.random() * this.w * 0.8,
                y: -20 - Math.random() * 100,
                w: 4 + Math.random() * 8,
                h: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: 1 + Math.random() * 3,
                vx: (Math.random() - 0.5) * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1
            });
        }
    }
    
    // ============================================
    // UPDATE
    // ============================================
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.isRacing) {
            const elapsed = timestamp - this.raceStartTime;
            this.raceProgress = Math.min(elapsed / this.raceDuration, 1);
            
            let allFinished = true;
            
            this.cars.forEach(function(car) {
                if (car.progress >= 1) return;
                allFinished = false;
                
                const speedVariation = Math.sin(timestamp * 0.008 + car.progress * 10) * 0.4;
                const currentSpeed = car.speed + speedVariation;
                car.progress += currentSpeed * 0.006;
                
                if (car.progress >= 1) {
                    car.progress = 1;
                    car.x = this.finishLineX;
                } else {
                    car.x = 50 + car.progress * this.raceDistance;
                }
                
                // Exhaust particles
                if (Math.random() > 0.3 && car.progress < 0.95) {
                    const laneHeight = this.trackHeight / 6;
                    const carIndex = this.cars.indexOf(car);
                    this.exhaustParticles.push({
                        x: car.x - 8,
                        y: this.trackY + carIndex * laneHeight + laneHeight / 2 + (Math.random() - 0.5) * 10,
                        size: 1 + Math.random() * 2.5,
                        opacity: 0.5,
                        life: 0,
                        maxLife: 12 + Math.random() * 15,
                        color: 'rgba(180,180,180,0.6)'
                    });
                }
            }.bind(this));
            
            // Update exhaust
            this.exhaustParticles.forEach(function(p) {
                p.x -= 1 + Math.random() * 1.5;
                p.life++;
                p.opacity -= 0.04;
            });
            this.exhaustParticles = this.exhaustParticles.filter(function(p) { return p.opacity > 0 && p.life < p.maxLife; });
            
            if (allFinished || this.raceProgress >= 1) {
                this.isRacing = false;
                this.cars.forEach(function(car) { car.progress = 1; car.x = this.finishLineX; }.bind(this));
                this.resolveGame();
            }
        }
        
        this.confettiParticles.forEach(function(p) {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.03;
            p.rotation += p.rotationSpeed;
            if (p.y > this.h + 50) p.opacity -= 0.02;
        });
        this.confettiParticles = this.confettiParticles.filter(function(p) { return p.opacity > 0; });
        
        if (this.winGlowAlpha > 0 && !this.showResult) this.winGlowAlpha -= 0.01;
        
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.update();
    }
    
    // ============================================
    // RENDERING
    // ============================================
    
    drawFullTrack() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground(ctx, w, h);
        this.drawTitle(ctx, w, h);
        this.drawTrack(ctx, w, h);
        this.drawFinishLine(ctx, w, h);
        this.drawCars(ctx, w, h);
        this.drawExhaust(ctx);
        this.drawCarSelector(ctx, w, h);
        this.drawWinnerDisplay(ctx, w, h);
        this.drawConfetti(ctx);
        this.drawSparkles(ctx);
        
        if (this.winCascade && this.winCascade.isAlive()) this.winCascade.render();
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
        bgGrad.addColorStop(0, '#1a1410');
        bgGrad.addColorStop(0.5, '#0f0b08');
        bgGrad.addColorStop(1, '#050302');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(212,168,67,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, w * 0.25, 24, w * 0.5, 32, 14);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('CAR ROULETTE', w / 2, 40);
    }
    
    drawTrack(ctx, w, h) {
        const tx = 40;
        const ty = this.trackY;
        const tw = this.w - 80;
        const th = this.trackHeight;
        
        // Track background
        ctx.fillStyle = '#0d0d0d';
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, tx - 4, ty - 4, tw + 8, th + 8, 10);
        ctx.fill(); ctx.stroke();
        
        // Lane dividers
        const laneHeight = th / 6;
        for (let i = 1; i < 6; i++) {
            const ly = ty + i * laneHeight;
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 10]);
            ctx.beginPath();
            ctx.moveTo(tx, ly);
            ctx.lineTo(tx + tw - 10, ly);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Lane numbers
        for (let i = 0; i < 6; i++) {
            const ly = ty + i * laneHeight + laneHeight / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = 'bold 9px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('L' + (i + 1), tx + 12, ly);
        }
    }
    
    drawFinishLine(ctx, w, h) {
        const fx = this.finishLineX;
        const fy = this.trackY;
        const fh = this.trackHeight;
        const squareSize = 7;
        const squares = Math.floor(fh / squareSize);
        
        for (let i = 0; i < squares; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1a1a1a';
            ctx.fillRect(fx - squareSize / 2, fy + i * squareSize, squareSize, squareSize);
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', fx, fy - 8);
    }
    
    drawCars(ctx, w, h) {
        const laneHeight = this.trackHeight / 6;
        
        this.cars.forEach(function(car, i) {
            const cx = car.x;
            const cy = this.trackY + i * laneHeight + laneHeight / 2;
            
            // Selection glow
            if (this.selectedCar === i && !this.isRacing) {
                ctx.shadowColor = car.color;
                ctx.shadowBlur = 12;
            }
            
            // Car body
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 8);
            ctx.lineTo(cx + 12, cy - 4);
            ctx.lineTo(cx + 12, cy + 4);
            ctx.lineTo(cx - 6, cy + 4);
            ctx.lineTo(cx - 8, cy + 1);
            ctx.lineTo(cx - 8, cy - 1);
            ctx.lineTo(cx - 6, cy - 8);
            ctx.closePath();
            ctx.fill();
            
            // Window
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy - 5);
            ctx.lineTo(cx + 6, cy - 2);
            ctx.lineTo(cx + 6, cy + 2);
            ctx.lineTo(cx - 1, cy + 2);
            ctx.lineTo(cx - 2, cy);
            ctx.lineTo(cx - 1, cy - 2);
            ctx.lineTo(cx + 4, cy - 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Selection ring
            if (this.selectedCar === i && !this.isRacing) {
                ctx.strokeStyle = this.palette.gold;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Winner crown
            if (this.showResult && this.winner === i) {
                ctx.fillStyle = this.palette.gold;
                ctx.font = '14px Georgia';
                ctx.textAlign = 'center';
                ctx.fillText('*', cx, cy - 14);
            }
        }.bind(this));
    }
    
    drawExhaust(ctx) {
        this.exhaustParticles.forEach(function(p) {
            ctx.fillStyle = 'rgba(160,160,160,' + p.opacity + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawCarSelector(ctx, w, h) {
        const sy = this.trackY + this.trackHeight + 20;
        const btnW = (w - 50) / 6;
        const btnH = 48;
        const gap = 4;
        
        this.cars.forEach(function(car, i) {
            const sx = 18 + i * (btnW + gap);
            const isSelected = this.selectedCar === i;
            
            ctx.fillStyle = isSelected ? car.color + '30' : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? car.color : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, sx, sy, btnW, btnH, 10);
            ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = car.color;
            ctx.font = '20px Georgia';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(car.icon, sx + btnW / 2, sy + btnH / 2 - 7);
            
            ctx.fillStyle = isSelected ? car.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 7px Georgia';
            ctx.fillText(car.name, sx + btnW / 2, sy + btnH / 2 + 14);
        }.bind(this));
    }
    
    drawWinnerDisplay(ctx, w, h) {
        if (!this.showResult || this.winner === null) return;
        
        const winnerCar = this.cars[this.winner];
        const wy = this.trackY + this.trackHeight + 75;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = winnerCar.color;
        ctx.lineWidth = 2;
        this.roundRect(ctx, w / 2 - 70, wy, 140, 28, 14);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.palette.gold;
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(winnerCar.icon + ' ' + winnerCar.name + ' WINS!', w / 2, wy + 14);
    }
    
    drawConfetti(ctx) {
        for (let i = 0; i < this.confettiParticles.length; i++) {
            const p = this.confettiParticles[i];
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
    }
    
    drawSparkles(ctx) {
        for (let i = 0; i < this.sparkles.length; i++) {
            const sp = this.sparkles[i];
            sp.opacity += Math.sin(Date.now() * sp.speed + sp.phase) * 0.004;
            sp.opacity = Math.max(0.03, Math.min(0.3, sp.opacity));
            ctx.fillStyle = 'rgba(212, 168, 67, ' + sp.opacity + ')';
            ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    
    // ============================================
    // UTILS
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
    // CLICK HANDLER
    // ============================================
    
    handleClick(clickX, clickY) {
        if (this.isRacing) return;
        
        const sy = this.trackY + this.trackHeight + 20;
        const btnW = (this.w - 50) / 6;
        const btnH = 48;
        const gap = 4;
        
        for (let i = 0; i < 6; i++) {
            const sx = 18 + i * (btnW + gap);
            if (clickX >= sx && clickX <= sx + btnW && clickY >= sy && clickY <= sy + btnH) {
                this.selectCar(i);
                return;
            }
        }
    }
    
    // ============================================
    // LOOP
    // ============================================
    
    render() { this.drawFullTrack(); }
    setBet(amount) { this.bet = amount; }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.confettiParticles = [];
        this.exhaustParticles = [];
        this.cars = [];
    }
}

// Export
window.CarRouletteFullGame = CarRouletteFullGame;
console.log('Car Roulette v3.0.0 - Real Casino Design Loaded');
