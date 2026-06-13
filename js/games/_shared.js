// =============================================================
// js/games/_shared.js  -  shared rendering helpers for games
// All games extend CasinoGameEngine and ANIMATE toward a result
// returned by resolveBet() (server-authoritative; offline demo
// outcomes are clearly marked and never count as real play).
// =============================================================
(function () {
  'use strict';
  window.CasinoGames = window.CasinoGames || {};

  // Standard 52-card deck helpers -----------------------------
  const SUITS = ['\u2660', '\u2665', '\u2666', '\u2663']; // S H D C
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  // ---- rounded-rect path helper ----
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- high-res suit vectors (procedural, scalable) ----
  // Drawn centered at (cx,cy), sized by s. color sets fill.
  function drawSuit(ctx, suit, cx, cy, s, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (suit === '\u2665') { // heart
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(s * 0.6, -s * 0.25, s * 0.5, -s * 0.7, 0, -s * 0.35);
      ctx.bezierCurveTo(-s * 0.5, -s * 0.7, -s * 0.6, -s * 0.25, 0, s * 0.35);
    } else if (suit === '\u2666') { // diamond
      ctx.moveTo(0, -s * 0.55); ctx.lineTo(s * 0.42, 0); ctx.lineTo(0, s * 0.55); ctx.lineTo(-s * 0.42, 0);
    } else if (suit === '\u2660') { // spade
      ctx.moveTo(0, -s * 0.55);
      ctx.bezierCurveTo(s * 0.55, s * 0.05, s * 0.45, s * 0.4, s * 0.1, s * 0.3);
      ctx.bezierCurveTo(s * 0.2, s * 0.45, s * 0.2, s * 0.5, s * 0.3, s * 0.6);
      ctx.lineTo(-s * 0.3, s * 0.6);
      ctx.bezierCurveTo(-s * 0.2, s * 0.5, -s * 0.2, s * 0.45, -s * 0.1, s * 0.3);
      ctx.bezierCurveTo(-s * 0.45, s * 0.4, -s * 0.55, s * 0.05, 0, -s * 0.55);
    } else { // club
      const rr = s * 0.22;
      ctx.arc(0, -s * 0.22, rr, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.18 + rr, s * 0.08); ctx.arc(-s * 0.18, s * 0.08, rr, 0, Math.PI * 2);
      ctx.moveTo(s * 0.18 + rr, s * 0.08); ctx.arc(s * 0.18, s * 0.08, rr, 0, Math.PI * 2);
      ctx.moveTo(s * 0.07, s * 0.1); ctx.lineTo(s * 0.12, s * 0.55); ctx.lineTo(-s * 0.12, s * 0.55); ctx.lineTo(-s * 0.07, s * 0.1);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  window.CardUtil = {
    SUITS, RANKS, roundRectPath, drawSuit,
    isRed: (s) => s === '\u2665' || s === '\u2666',
    rankValue: (r) => RANKS.indexOf(r) + 2,
    // Premium rounded card: gold-pattern back, suit vectors, glowing pips.
    drawCard(ctx, x, y, w, h, rank, suit, faceUp) {
      const r = Math.max(6, w * 0.12);
      ctx.save();
      // drop shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      roundRectPath(ctx, x, y, w, h, r);

      if (!faceUp) {
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, '#1b1d28'); g.addColorStop(1, '#0d0e14');
        ctx.fillStyle = g; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#C9A227'; ctx.lineWidth = 1.5; ctx.stroke();
        // gold lattice back-pattern
        ctx.save(); roundRectPath(ctx, x + 3, y + 3, w - 6, h - 6, r * 0.7); ctx.clip();
        ctx.strokeStyle = 'rgba(255,215,0,0.28)'; ctx.lineWidth = 1;
        const step = Math.max(7, w * 0.16);
        for (let i = -h; i < w + h; i += step) {
          ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + i + h, y); ctx.lineTo(x + i, y + h); ctx.stroke();
        }
        ctx.restore();
        ctx.restore(); return;
      }

      // face: ivory gradient
      const fg = ctx.createLinearGradient(x, y, x, y + h);
      fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#eef1f5');
      ctx.fillStyle = fg; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.stroke();

      const red = window.CardUtil.isRed(suit);
      const face = ['J', 'Q', 'K', 'A'].includes(rank);
      const ink = red ? '#d11a2a' : '#101826';
      // corner rank + mini suit (top-left, bottom-right mirrored)
      ctx.fillStyle = ink;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.round(w * 0.26) + 'px Georgia, system-ui';
      if (face) { ctx.save(); ctx.shadowColor = red ? 'rgba(209,26,42,0.6)' : 'rgba(201,162,39,0.6)'; ctx.shadowBlur = 6; }
      ctx.fillText(rank, x + w * 0.2, y + h * 0.15);
      if (face) ctx.restore();
      drawSuit(ctx, suit, x + w * 0.2, y + h * 0.3, w * 0.18, ink);
      // center: big suit, or glowing letter for face cards
      if (face) {
        ctx.save();
        ctx.shadowColor = red ? 'rgba(209,26,42,0.7)' : 'rgba(201,162,39,0.85)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = red ? '#d11a2a' : '#C9A227';
        ctx.font = '900 ' + Math.round(w * 0.5) + 'px Georgia, system-ui';
        ctx.fillText(rank, x + w / 2, y + h / 2);
        ctx.restore();
      } else {
        drawSuit(ctx, suit, x + w / 2, y + h / 2, w * 0.42, ink);
      }
      // mirrored bottom-right corner
      ctx.save();
      ctx.translate(x + w, y + h); ctx.rotate(Math.PI);
      ctx.fillStyle = ink; ctx.font = '800 ' + Math.round(w * 0.26) + 'px Georgia, system-ui';
      ctx.fillText(rank, w * 0.2, h * 0.15);
      drawSuit(ctx, suit, w * 0.2, h * 0.3, w * 0.18, ink);
      ctx.restore();
      ctx.restore();
    },
  };

  // ---- premium slot symbol vectors (scale: pulse 1.0..~1.3) ----
  window.SlotArt = {
    draw(ctx, kind, cx, cy, size, scale) {
      const s = size * (scale || 1);
      ctx.save(); ctx.translate(cx, cy);
      ctx.shadowBlur = 12;
      if (kind === 'seven') {
        ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444';
        ctx.font = '900 ' + Math.round(s) + 'px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('7', 0, 0);
      } else if (kind === 'diamond') {
        ctx.shadowColor = '#7dd3fc';
        const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#38bdf8');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(0, -s * 0.5); ctx.lineTo(s * 0.4, -s * 0.1); ctx.lineTo(0, s * 0.5); ctx.lineTo(-s * 0.4, -s * 0.1);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (kind === 'bell') {
        ctx.shadowColor = '#FFD700';
        const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#FFF1A8'); g.addColorStop(1, '#C9A227');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(-s * 0.4, s * 0.3);
        ctx.bezierCurveTo(-s * 0.4, -s * 0.4, s * 0.4, -s * 0.4, s * 0.4, s * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(0, s * 0.36, s * 0.1, 0, Math.PI * 2); ctx.fill();
      } else if (kind === 'crown') {
        ctx.shadowColor = '#FFD700';
        const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#FFF1A8'); g.addColorStop(1, '#C9A227');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(-s * 0.45, s * 0.3); ctx.lineTo(-s * 0.45, -s * 0.1); ctx.lineTo(-s * 0.2, s * 0.05);
        ctx.lineTo(0, -s * 0.35); ctx.lineTo(s * 0.2, s * 0.05); ctx.lineTo(s * 0.45, -s * 0.1);
        ctx.lineTo(s * 0.45, s * 0.3); ctx.closePath(); ctx.fill();
      } else { // cherry fallback
        ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(-s * 0.15, s * 0.2, s * 0.18, 0, Math.PI * 2); ctx.arc(s * 0.15, s * 0.25, s * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.05); ctx.quadraticCurveTo(s * 0.1, -s * 0.3, s * 0.3, -s * 0.4); ctx.stroke();
      }
      ctx.restore();
    },
    kinds: ['cherry', 'bell', 'seven', 'diamond', 'crown'],
  };

  // ---- neon supersonic jet (Aviator) with smoke trail ----
  window.JetArt = {
    draw(ctx, x, y, angle, scale) {
      const s = scale || 1;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle || 0); ctx.scale(s, s);
      ctx.shadowColor = '#ff2d55'; ctx.shadowBlur = 18;
      const g = ctx.createLinearGradient(-16, 0, 18, 0);
      g.addColorStop(0, '#7f1d1d'); g.addColorStop(0.6, '#ef4444'); g.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = g;
      // fuselage
      ctx.beginPath();
      ctx.moveTo(20, 0); ctx.lineTo(-6, -5); ctx.lineTo(-16, -3);
      ctx.lineTo(-16, 3); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
      // swept wings
      ctx.beginPath(); ctx.moveTo(2, -3); ctx.lineTo(-14, -16); ctx.lineTo(-6, -3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, 3); ctx.lineTo(-14, 16); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill();
      // cockpit glow
      ctx.shadowBlur = 8; ctx.shadowColor = '#7dd3fc'; ctx.fillStyle = '#bae6fd';
      ctx.beginPath(); ctx.ellipse(6, 0, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  };

  window.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
})();
