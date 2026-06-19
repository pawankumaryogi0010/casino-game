// ============================================
// EMERALD KING CASINO - GAME 10: CAR ROULETTE
// Full Real Casino Visual Design
// 6-Car Racing Betting Game
// File: js/games/car-roulette.js
// ============================================

class CarRouletteFullGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.w = canvas.width / 2;
        this.h = canvas.height / 2;
        
        // Game state
        this.bet = 50;
        this.chips = 1000;
        this.selectedCar = 0; // 0-5
        this.winner = null;
        this.isRacing = false;
        this.showResult = false;
        
        // Cars
        this.cars = [
            { name: 'RED', icon: '🚗', color: '#ff4444', progress: 0, speed: 0, x: 0 },
            { name: 'BLUE', icon: '🚙', color: '#00b0ff', progress: 0, speed: 0, x: 0 },
            { name: 'GREEN', icon: '🚕', color: '#00e676', progress: 0, speed: 0, x: 0 },
            { name: 'YELLOW', icon: '🚌', color: '#FFD700', progress: 0, speed: 0, x: 0 },
            { name: 'PURPLE', icon: '🚎', color: '#c084fc', progress: 0, speed: 0, x: 0 },
            { name: 'ORANGE', icon: '🏎️', color: '#ff8800', progress: 0, speed: 0, x: 0 }
        ];
        
        // Race track
        this.trackY = 0;
        this.trackH = 0;
        this.raceDistance = 0;
        this.finishLine = 0;
        this.raceStartTime = 0;
        this.raceDuration = 4000;
        
        // Win cascade
        this.winCascade = null;
        if (typeof WinParticleCascade !== 'undefined') {
            this.winCascade = new WinParticleCascade(ctx);
        }
        
        // Sparkles
        this.sparkles = [];
        this.glowPulse = 0;
        
        // Exhaust particles
        this.exhaustParticles = [];
        
        // Colors
        this.colors = {
            felt: '#0d3320',
            track: '#333333',
            trackLine: '#ffffff',
            gold: '#FFD700'
        };
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        this.generateSparkles();
        this.trackY = 75;
        this.trackH = this.h - 200;
        this.raceDistance = this.w - 130;
        this.finishLine = this.w - 50;
        this.resetCars();
        this.drawFullTrack();
    }
    
    generateSparkles() {
        this.sparkles = [];
        for (let i = 0; i < 20; i++) {
            this.sparkles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.02 + 0.005,
                opacity: Math.random() * 0.3 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    resetCars() {
        this.cars.forEach(car => {
            car.progress = 0;
            car.speed = 0;
            car.x = 50;
        });
        this.winner = null;
        this.isRacing = false;
        this.showResult = false;
        this.exhaustParticles = [];
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    selectCar(index) {
        if (this.isRacing) return;
        this.selectedCar = index;
        this.drawFullTrack();
    }
    
    play(bet) {
        if (this.isRacing) return;
        
        this.bet = bet;
        this.resetCars();
        this.isRacing = true;
        this.showResult = false;
        
        // Determine winner with weighted probability
        const totalWeight = 100;
        const weights = [18, 18, 18, 18, 14, 14]; // Slight edge for house
        let random = Math.random() * totalWeight;
        let winnerIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) { winnerIndex = i; break; }
        }
        this.winner = winnerIndex;
        
        // Set target speeds
        this.cars.forEach((car, i) => {
            car.speed = 1.5 + Math.random() * 3.5;
            if (i === this.winner) car.speed += 0.3;
        });
        
        // Ensure winner reaches finish
        const fastestSpeed = Math.max(...this.cars.map(c => c.speed));
        this.raceDuration = (this.raceDistance / fastestSpeed) * 150 + 1000;
        
        this.raceStartTime = performance.now();
        
        const resultDisplay = document.getElementById('game-result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '<span style="color:#FFD700;">🏎️ Racing...</span>';
        }
    }
    
    update(timestamp) {
        this.glowPulse += 0.02;
        
        if (this.isRacing) {
            const elapsed = timestamp - this.raceStartTime;
            const progress = Math.min(elapsed / this.raceDuration, 1);
            
            // Update car positions
            this.cars.forEach(car => {
                // Add randomness to speed
                const speedVariation = (Math.sin(timestamp * 0.01 + car.progress) * 0.5 + 0.5) * 0.3;
                const currentSpeed = car.speed + speedVariation;
                car.progress += currentSpeed * 0.008;
                car.x = 50 + car.progress * this.raceDistance;
                
                // Generate exhaust
                if (Math.random() > 0.3 && elapsed < this.raceDuration * 0.9) {
                    this.exhaustParticles.push({
                        x: car.x - 15,
                        y: this.trackY + this.cars.indexOf(car) * (this.trackH / 6) + (this.trackH / 12),
                        size: 1 + Math.random() * 3,
                        opacity: 0.6,
                        life: 0,
                        maxLife: 15 + Math.random() * 20
                    });
                }
            });
            
            // Update exhaust particles
            this.exhaustParticles.forEach(p => {
                p.x -= 1 + Math.random() * 2;
                p.life++;
                p.opacity -= 0.03;
            });
            this.exhaustParticles = this.exhaustParticles.filter(p => p.opacity > 0 && p.life < p.maxLife);
            
            // Race complete
            if (progress >= 1) {
                this.isRacing = false;
                this.showResult = true;
                this.resolveGame();
            }
        }
        
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.update();
        }
    }
    
    resolveGame() {
        const playerWon = this.winner === this.selectedCar;
        const resultDisplay = document.getElementById('game-result-display');
        const winnerCar = this.cars[this.winner];
        
        if (playerWon) {
            const payout = Math.floor(this.bet * 3);
            this.chips += payout;
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#00e676;font-size:18px;">🎉 ${winnerCar.icon} ${winnerCar.name} WINS!</span><br>
                        <span style="color:#00e676;">+${payout} CHIPS (3:1)</span>
                    </div>`;
            }
            if (this.winCascade) this.winCascade.spawn(this.w / 2, this.h / 2, 80);
        } else {
            if (resultDisplay) {
                resultDisplay.innerHTML = `
                    <div style="animation: casinoSlideUp 0.5s ease-out;">
                        <span style="color:#ff4444;font-size:16px;">😞 ${winnerCar.icon} ${winnerCar.name} WINS</span><br>
                        <span style="color:rgba(255,255,255,0.6);">-${this.bet} CHIPS</span>
                    </div>`;
            }
        }
        
        setTimeout(() => { this.showResult = false; this.resetCars(); }, 4000);
    }
    
    // ============================================
    // RENDERING - FULL TRACK
    // ============================================
    
    drawFullTrack() {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        this.drawBackground(ctx, w, h);
        
        // Table border
        this.drawTableBorder(ctx, w, h);
        
        // Title
        this.drawTitle(ctx, w, h);
        
        // Track
        this.drawRaceTrack(ctx);
        
        // Cars
        this.drawCars(ctx);
        
        // Finish line
        this.drawFinishLine(ctx);
        
        // Exhaust
        this.drawExhaust(ctx);
        
        // Car selector
        this.drawCarSelector(ctx, w, h);
        
        // Winner display
        if (this.showResult && this.winner !== null) {
            this.drawWinnerDisplay(ctx, w, h);
        }
        
        // Sparkles
        this.drawSparkles(ctx);
        
        // Win particles
        if (this.winCascade && this.winCascade.isAlive()) {
            this.winCascade.render();
        }
    }
    
    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w);
        bgGrad.addColorStop(0, '#033826');
        bgGrad.addColorStop(0.5, '#02231c');
        bgGrad.addColorStop(1, '#011713');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawTableBorder(ctx, w, h) {
        ctx.fillStyle = '#1a0a00';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 6;
        CardRenderer.roundRect(ctx, 8, 8, w - 16, h - 16, 18);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 14, 14, w - 28, h - 28, 14);
        ctx.stroke();
    }
    
    drawTitle(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        CardRenderer.roundRect(ctx, w * 0.2, 24, w * 0.6, 34, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏎️ CAR ROULETTE', w / 2, 41);
    }
    
    drawRaceTrack(ctx) {
        const ty = this.trackY;
        const th = this.trackH;
        const trackW = this.w - 90;
        
        // Track background
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, 40, ty, trackW + 10, th, 12);
        ctx.fill();
        ctx.stroke();
        
        // Lane dividers
        const laneH = th / 6;
        for (let i = 1; i < 6; i++) {
            const ly = ty + i * laneH;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([8, 12]);
            ctx.beginPath();
            ctx.moveTo(45, ly);
            ctx.lineTo(this.finishLine - 5, ly);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Lane numbers
        for (let i = 0; i < 6; i++) {
            const ly = ty + i * laneH + laneH / 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`L${i + 1}`, 55, ly);
        }
    }
    
    drawFinishLine(ctx) {
        const fx = this.finishLine;
        const fy = this.trackY;
        const fh = this.trackH;
        const squareSize = 8;
        const squares = Math.floor(fh / squareSize);
        
        for (let i = 0; i < squares; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1a1a1a';
            ctx.fillRect(fx - squareSize / 2, fy + i * squareSize, squareSize, squareSize);
        }
        
        // Finish label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', fx, fy - 10);
    }
    
    drawCars(ctx) {
        const laneH = this.trackH / 6;
        
        this.cars.forEach((car, i) => {
            const cx = car.x;
            const cy = this.trackY + i * laneH + laneH / 2;
            
            // Car glow
            if (this.selectedCar === i && !this.isRacing) {
                ctx.shadowColor = car.color;
                ctx.shadowBlur = 15;
            }
            
            // Car body
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy - 7);
            ctx.lineTo(cx + 10, cy - 4);
            ctx.lineTo(cx + 10, cy + 4);
            ctx.lineTo(cx - 8, cy + 4);
            ctx.lineTo(cx - 10, cy + 2);
            ctx.lineTo(cx - 10, cy - 2);
            ctx.lineTo(cx - 8, cy - 7);
            ctx.closePath();
            ctx.fill();
            
            // Windows
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.moveTo(cx + 3, cy - 4);
            ctx.lineTo(cx + 5, cy - 2);
            ctx.lineTo(cx + 5, cy + 2);
            ctx.lineTo(cx - 2, cy + 2);
            ctx.lineTo(cx - 3, cy);
            ctx.lineTo(cx - 2, cy - 2);
            ctx.lineTo(cx + 3, cy - 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Selection indicator
            if (this.selectedCar === i && !this.isRacing) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 13, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }
    
    drawExhaust(ctx) {
        this.exhaustParticles.forEach(p => {
            ctx.fillStyle = `rgba(180, 180, 180, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawCarSelector(ctx, w, h) {
        const selY = h - 105;
        const btnW = (w - 50) / 6;
        const btnH = 50;
        const gap = 4;
        
        this.cars.forEach((car, i) => {
            const sx = 18 + i * (btnW + gap);
            const isSelected = this.selectedCar === i;
            
            ctx.fillStyle = isSelected ? `${car.color}30` : 'rgba(255,255,255,0.04)';
            ctx.strokeStyle = isSelected ? car.color : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = isSelected ? 2 : 1;
            CardRenderer.roundRect(ctx, sx, selY, btnW, btnH, 10);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = car.color;
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(car.icon, sx + btnW / 2, selY + btnH / 2 - 7);
            
            ctx.fillStyle = isSelected ? car.color : 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 7px Arial';
            ctx.fillText(car.name, sx + btnW / 2, selY + btnH / 2 + 14);
        });
    }
    
    drawWinnerDisplay(ctx, w, h) {
        const winnerCar = this.cars[this.winner];
        const wy = h - 115;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = winnerCar.color;
        ctx.lineWidth = 2;
        CardRenderer.roundRect(ctx, w / 2 - 70, wy - 5, 140, 30, 15);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🏆 ${winnerCar.icon} ${winnerCar.name} WINS!`, w / 2, wy + 10);
    }
    
    drawSparkles(ctx) {
        this.sparkles.forEach(sparkle => {
            sparkle.opacity += Math.sin(Date.now() * sparkle.speed + sparkle.phase) * 0.005;
            sparkle.opacity = Math.max(0.05, Math.min(0.4, sparkle.opacity));
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkle.opacity})`;
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // ============================================
    // GAME LOOP
    // ============================================
    
    render() {
        this.drawFullTrack();
    }
    
    setBet(amount) {
        this.bet = amount;
    }
    
    destroy() {
        if (this.winCascade) this.winCascade.destroy();
        this.sparkles = [];
        this.exhaustParticles = [];
    }
}

// Export
window.CarRouletteFullGame = CarRouletteFullGame;
console.log('✅ Game 10: Car Roulette - Full Casino Design Loaded');
