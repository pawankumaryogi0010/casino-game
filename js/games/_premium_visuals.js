// =============================================================
// _premium_visuals.js  -  Lux Royale Casino
// ULTRA-HD PREMIUM VISUAL ENGINE
// 
// Professional casino-grade graphics with procedural vectors
// - Premium playing cards (neon gold backs, vector suits)
// - Pro roulette wheel (mahogany wood, gold separators)
// - High-res slot symbols (bell, 777, diamond, crown)
// - Supersonic jet with particle trail (Aviator/Crash)
// =============================================================

(function () {
  'use strict';

  // =============================================================
  // 1. PREMIUM PLAYING CARDS
  // =============================================================
  
  // Vector suit paths (perfect Bezier curves)
  function drawVectorSuit(ctx, suit, cx, cy, size, glowIntensity = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    
    const isRed = suit === '♥' || suit === '♦';
    const mainColor = isRed ? '#E11D2C' : '#111827';
    const glowColor = isRed ? '#FF6B6B' : '#FFD700';
    
    if (glowIntensity > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 * glowIntensity;
    }
    
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    
    switch (suit) {
      case '♥': // Heart with elegant curves
        ctx.moveTo(0, size * 0.32);
        ctx.bezierCurveTo(size * 0.58, -size * 0.28, size * 0.52, -size * 0.68, 0, -size * 0.38);
        ctx.bezierCurveTo(-size * 0.52, -size * 0.68, -size * 0.58, -size * 0.28, 0, size * 0.32);
        break;
        
      case '♦': // Diamond with precise angles
        ctx.moveTo(0, -size * 0.62);
        ctx.lineTo(size * 0.48, 0);
        ctx.lineTo(0, size * 0.62);
        ctx.lineTo(-size * 0.48, 0);
        break;
        
      case '♠': // Spade with royal curves
        ctx.moveTo(0, -size * 0.62);
        ctx.bezierCurveTo(size * 0.54, size * 0.04, size * 0.46, size * 0.42, size * 0.1, size * 0.32);
        ctx.bezierCurveTo(size * 0.2, size * 0.48, size * 0.2, size * 0.58, size * 0.32, size * 0.68);
        ctx.lineTo(-size * 0.32, size * 0.68);
        ctx.bezierCurveTo(-size * 0.2, size * 0.58, -size * 0.2, size * 0.48, -size * 0.1, size * 0.32);
        ctx.bezierCurveTo(-size * 0.46, size * 0.42, -size * 0.54, size * 0.04, 0, -size * 0.62);
        break;
        
      case '♣': // Club with three spheres
        const r = size * 0.23;
        ctx.arc(0, -size * 0.22, r, 0, Math.PI * 2);
        ctx.moveTo(-size * 0.19 + r, size * 0.1);
        ctx.arc(-size * 0.19, size * 0.1, r, 0, Math.PI * 2);
        ctx.moveTo(size * 0.19 + r, size * 0.1);
        ctx.arc(size * 0.19, size * 0.1, r, 0, Math.PI * 2);
        ctx.moveTo(size * 0.09, size * 0.13);
        ctx.lineTo(size * 0.15, size * 0.62);
        ctx.lineTo(-size * 0.15, size * 0.62);
        ctx.lineTo(-size * 0.09, size * 0.13);
        break;
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  // Premium rounded rectangle with gold border
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Main premium card drawer (replaces old drawCard)
  function drawPremiumCard(ctx, x, y, w, h, rank, suit, faceUp, isWinner = false) {
    const radius = Math.min(10, w * 0.1);
    ctx.save();
    
    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    
    roundedRect(ctx, x, y, w, h, radius);
    
    if (!faceUp) {
      // Premium card back - gradient + gold lattice
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#1E2130');
      grad.addColorStop(0.5, '#0F111A');
      grad.addColorStop(1, '#1E2130');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#C9A227';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Diagonal gold lattice
      ctx.save();
      roundedRect(ctx, x + 4, y + 4, w - 8, h - 8, radius * 0.6);
      ctx.clip();
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)';
      ctx.lineWidth = 1.2;
      const step = Math.max(14, w * 0.13);
      for (let i = -h; i < w + h; i += step) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + i + h, y);
        ctx.lineTo(x + i, y + h);
        ctx.stroke();
      }
      // Center gold diamond
      ctx.restore();
      ctx.fillStyle = 'rgba(201, 162, 39, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x + w/2, y + h/2 - 12);
      ctx.lineTo(x + w/2 + 12, y + h/2);
      ctx.lineTo(x + w/2, y + h/2 + 12);
      ctx.lineTo(x + w/2 - 12, y + h/2);
      ctx.fill();
    } else {
      // Premium ivory face
      const faceGrad = ctx.createLinearGradient(x, y, x, y + h);
      faceGrad.addColorStop(0, '#FFFFFF');
      faceGrad.addColorStop(1, '#F2F4F8');
      ctx.fillStyle = faceGrad;
      ctx.fill();
      ctx.strokeStyle = isWinner ? '#FFD700' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = isWinner ? 2.5 : 1;
      ctx.stroke();
      
      const isRed = suit === '♥' || suit === '♦';
      const textColor = isRed ? '#E11D2C' : '#111827';
      const isFace = ['J', 'Q', 'K', 'A'].includes(rank);
      
      // Top-left corner
      ctx.font = `bold ${Math.round(w * 0.24)}px "Georgia", "Times New Roman", serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rank, x + w * 0.18, y + h * 0.14);
      drawVectorSuit(ctx, suit, x + w * 0.18, y + h * 0.32, w * 0.13, isWinner ? 0.8 : 0);
      
      // Center large art
      if (isFace) {
        ctx.font = `bold ${Math.round(w * 0.52)}px "Georgia", serif`;
        if (isWinner) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#FFD700';
        }
        ctx.fillStyle = textColor;
        ctx.fillText(rank, x + w/2, y + h/2);
      } else {
        drawVectorSuit(ctx, suit, x + w/2, y + h/2, w * 0.42, isWinner ? 0.8 : 0);
      }
      
      // Bottom-right mirrored
      ctx.save();
      ctx.translate(x + w, y + h);
      ctx.rotate(Math.PI);
      ctx.font = `bold ${Math.round(w * 0.24)}px "Georgia", serif`;
      ctx.fillStyle = textColor;
      ctx.fillText(rank, w * 0.18, h * 0.14);
      drawVectorSuit(ctx, suit, w * 0.18, h * 0.32, w * 0.13, 0);
      ctx.restore();
      
      // Winner gold border glow
      if (isWinner) {
        ctx.shadowBlur = 0;
        roundedRect(ctx, x + 1, y + 1, w - 2, h - 2, radius);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }

  // =============================================================
  // 2. PRO ROULETTE WHEEL (Mahogany + Gold)
  // =============================================================
  
  const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  function drawProRouletteWheel(ctx, cx, cy, radius, spinAngle = 0, winningNumber = null) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinAngle);
    
    const n = ROULETTE_NUMBERS.length;
    const sliceAngle = (Math.PI * 2) / n;
    
    // Mahogany wood outer rim
    const woodGrad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.22);
    woodGrad.addColorStop(0, '#6B2E1A');
    woodGrad.addColorStop(0.5, '#4A1E0E');
    woodGrad.addColorStop(1, '#241008');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Gold decorative ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.02, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Number pockets
    for (let i = 0; i < n; i++) {
      const num = ROULETTE_NUMBERS[i];
      const start = i * sliceAngle;
      const end = (i + 1) * sliceAngle;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      
      // Pocket colors
      const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
      const pocketGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
      
      if (num === 0) {
        pocketGrad.addColorStop(0, '#2D8B4E');
        pocketGrad.addColorStop(1, '#1A5C33');
      } else if (isRed) {
        pocketGrad.addColorStop(0, '#D11A2A');
        pocketGrad.addColorStop(1, '#8B111C');
      } else {
        pocketGrad.addColorStop(0, '#2A2E45');
        pocketGrad.addColorStop(1, '#121524');
      }
      ctx.fillStyle = pocketGrad;
      ctx.fill();
      
      // Gold separator
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(end) * radius, Math.sin(end) * radius);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      // Number text
      ctx.save();
      ctx.rotate(start + sliceAngle / 2);
      ctx.translate(radius * 0.72, 0);
      ctx.rotate(Math.PI / 2);
      ctx.font = `bold ${Math.max(10, Math.floor(radius * 0.085))}px "Segoe UI", system-ui`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    }
    
    // Center metallic hub
    const hubGrad = ctx.createRadialGradient(-radius * 0.05, -radius * 0.05, 3, 0, 0, radius * 0.24);
    hubGrad.addColorStop(0, '#FFF7CC');
    hubGrad.addColorStop(0.4, '#D4AF37');
    hubGrad.addColorStop(1, '#8B6914');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    
    // Lux Royale logo on hub
    ctx.font = `bold ${Math.floor(radius * 0.09)}px "Segoe UI"`;
    ctx.fillStyle = '#1A1A2E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LUX', 0, 0);
    
    ctx.restore();
    
    // Metallic ball with realistic shadow
    if (winningNumber !== null) {
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      const ballAngle = -Math.PI / 2;
      const ballX = cx + Math.cos(ballAngle) * (radius * 0.86);
      const ballY = cy + Math.sin(ballAngle) * (radius * 0.86);
      const ballGrad = ctx.createRadialGradient(ballX - 3, ballY - 3, 2, ballX, ballY, 8);
      ballGrad.addColorStop(0, '#FFFFFF');
      ballGrad.addColorStop(0.6, '#C0C0C0');
      ballGrad.addColorStop(1, '#808080');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // =============================================================
  // 3. SLOT SYMBOLS - Golden Bell, 777, Diamond, Crown
  // =============================================================
  
  function drawSlotSymbol(ctx, symbol, cx, cy, size, scale = 1, isWinning = false) {
    ctx.save();
    ctx.translate(cx, cy);
    const s = size * scale;
    
    if (isWinning) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFD700';
    }
    
    switch (symbol) {
      case 'seven':
      case '777':
        // Premium metallic 7
        ctx.font = `900 ${Math.round(s * 0.75)}px "Georgia", "Times New Roman", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#D11A2A';
        ctx.fillText('7', 0, 0);
        ctx.fillStyle = '#FFD700';
        ctx.font = `900 ${Math.round(s * 0.72)}px "Georgia", serif`;
        ctx.fillText('7', -1, -1);
        break;
        
      case 'bell':
        // Golden bell with 3D gradient
        const bellGrad = ctx.createLinearGradient(-s/2, -s/2, s/2, s/2);
        bellGrad.addColorStop(0, '#FFF5C2');
        bellGrad.addColorStop(0.5, '#D4AF37');
        bellGrad.addColorStop(1, '#B8860B');
        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.38, s * 0.28);
        ctx.bezierCurveTo(-s * 0.38, -s * 0.42, s * 0.38, -s * 0.42, s * 0.38, s * 0.28);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, s * 0.35, s * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.rect(-s * 0.06, -s * 0.48, s * 0.12, s * 0.16);
        ctx.fill();
        break;
        
      case 'diamond':
        // Faceted diamond with sparkle
        const diamondGrad = ctx.createLinearGradient(0, -s/2, 0, s/2);
        diamondGrad.addColorStop(0, '#E0F2FE');
        diamondGrad.addColorStop(0.4, '#7DD3FC');
        diamondGrad.addColorStop(1, '#0284C7');
        ctx.fillStyle = diamondGrad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.58);
        ctx.lineTo(s * 0.45, -s * 0.1);
        ctx.lineTo(0, s * 0.58);
        ctx.lineTo(-s * 0.45, -s * 0.1);
        ctx.fill();
        // Sparkle effect
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.22);
        ctx.lineTo(s * 0.09, -s * 0.05);
        ctx.lineTo(0, s * 0.06);
        ctx.lineTo(-s * 0.09, -s * 0.05);
        ctx.fill();
        break;
        
      case 'crown':
        // Royal crown with jewels
        const crownGrad = ctx.createLinearGradient(0, -s/2, 0, s/2);
        crownGrad.addColorStop(0, '#FFF5C2');
        crownGrad.addColorStop(1, '#D4AF37');
        ctx.fillStyle = crownGrad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.48, s * 0.32);
        ctx.lineTo(-s * 0.48, -s * 0.08);
        ctx.lineTo(-s * 0.22, s * 0.09);
        ctx.lineTo(0, -s * 0.42);
        ctx.lineTo(s * 0.22, s * 0.09);
        ctx.lineTo(s * 0.48, -s * 0.08);
        ctx.lineTo(s * 0.48, s * 0.32);
        ctx.fill();
        // Rubies
        ctx.fillStyle = '#D11A2A';
        ctx.beginPath();
        ctx.arc(0, s * 0.14, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(-s * 0.2, s * 0.09, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.2, s * 0.09, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'cherry':
      default:
        ctx.fillStyle = '#E11D2C';
        ctx.beginPath();
        ctx.arc(-s * 0.16, s * 0.14, s * 0.24, 0, Math.PI * 2);
        ctx.arc(s * 0.16, s * 0.18, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, s * 0.04);
        ctx.quadraticCurveTo(s * 0.1, -s * 0.32, s * 0.28, -s * 0.42);
        ctx.strokeStyle = '#16A34A';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }

  // =============================================================
  // 4. SUPERSONIC JET WITH PARTICLE SMOKE TRAIL (Aviator)
  // =============================================================
  
  class JetParticleSystem {
    constructor() {
      this.particles = [];
    }
    
    emit(x, y, angle, intensity = 1) {
      const count = Math.floor(3 * intensity);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x - Math.cos(angle) * 18,
          y: y - Math.sin(angle) * 18,
          vx: -Math.cos(angle) * (50 + Math.random() * 40) + (Math.random() - 0.5) * 60,
          vy: -Math.sin(angle) * (50 + Math.random() * 40) + (Math.random() - 0.5) * 60,
          life: 1,
          size: 3 + Math.random() * 5,
          color: `hsl(${15 + Math.random() * 20}, 100%, 55%)`
        });
      }
    }
    
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 3.5;
        if (p.life <= 0 || p.y > 800 || p.x < -100 || p.x > 600) {
          this.particles.splice(i, 1);
        }
      }
    }
    
    draw(ctx) {
      for (const p of this.particles) {
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  
  const jetParticles = new JetParticleSystem();
  
  function drawSupersonicJet(ctx, x, y, angle, scale = 1, afterburner = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    
    // Afterburner glow
    if (afterburner) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#FF4500';
    }
    
    // Fuselage with neon gradient
    const jetGrad = ctx.createLinearGradient(-22, 0, 28, 0);
    jetGrad.addColorStop(0, '#8B1A1A');
    jetGrad.addColorStop(0.5, '#E11D2C');
    jetGrad.addColorStop(1, '#FF6B6B');
    ctx.fillStyle = jetGrad;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-24, -4);
    ctx.lineTo(-24, 4);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    
    // Swept wings
    ctx.fillStyle = '#E11D2C';
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(-18, -24);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(-18, 24);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit (neon blue)
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#7DD3FC';
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.ellipse(14, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Afterburner flame
    if (afterburner) {
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(-24, -3);
      ctx.lineTo(-38, 0);
      ctx.lineTo(-24, 3);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-24, -1.5);
      ctx.lineTo(-32, 0);
      ctx.lineTo(-24, 1.5);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  function updateJetParticles(dt, jetX, jetY, jetAngle, isFlying) {
    if (isFlying) {
      jetParticles.emit(jetX, jetY, jetAngle);
    }
    jetParticles.update(dt);
  }
  
  function drawJetWithTrail(ctx, x, y, angle, scale, afterburner) {
    jetParticles.draw(ctx);
    drawSupersonicJet(ctx, x, y, angle, scale, afterburner);
  }

  // =============================================================
  // 5. WIN CELEBRATION PARTICLE SYSTEM
  // =============================================================
  
  class WinParticleSystem {
    constructor() {
      this.particles = [];
    }
    
    burst(x, y, width, height, count = 100) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * width,
          y: y + (Math.random() - 0.5) * height * 0.6,
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.8) * 150,
          life: 1,
          size: 2 + Math.random() * 6,
          color: `hsl(${40 + Math.random() * 40}, 100%, 60%)`
        });
      }
    }
    
    update(dt, width, height) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 380 * dt;
        p.life -= dt * 2.2;
        if (p.x < -50 || p.x > width + 50 || p.y > height + 100 || p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
    
    draw(ctx) {
      for (const p of this.particles) {
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }
  
  const winParticles = new WinParticleSystem();

  // =============================================================
  // EXPORT ALL VISUAL FUNCTIONS
  // =============================================================
  
  // Override existing CardUtil if present
  if (typeof window !== 'undefined') {
    window.PremiumVisuals = {
      drawPremiumCard,
      drawVectorSuit,
      drawProRouletteWheel,
      drawSlotSymbol,
      drawSupersonicJet,
      drawJetWithTrail,
      updateJetParticles,
      jetParticles,
      winParticles,
      WinParticleSystem,
      ROULETTE_NUMBERS
    };
    
    // Replace old CardUtil.drawCard with premium version
    if (window.CardUtil) {
      window.CardUtil.drawCard = drawPremiumCard;
      window.CardUtil.drawVectorSuit = drawVectorSuit;
    }
    
    // Replace old JetArt with supersonic version
    if (window.JetArt) {
      window.JetArt.draw = drawSupersonicJet;
    }
    
    console.log('[PremiumVisuals] ✓ Ultra-HD casino graphics engine loaded');
  }
})();
