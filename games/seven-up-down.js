// =====================================================================
// SEVEN-UP-DOWN.JS — Dual-dice shaker physics simulator
// Two dice are rolled; sum determines outcome:
//   sum < 7  -> "down" wins (payout 2x)
//   sum == 7 -> "seven" wins (payout 5x)
//   sum > 7  -> "up" wins (payout 2x)
//
// Shaker physics: dice bounce inside a circular cup with simple
// velocity/gravity/restitution simulation before settling on a face.
// =====================================================================

(function () {
  const ROOM_NAME = "seven-up-down-room-1";

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let selectedBet = "up"; // up | seven | down
  let countdownInterval = null;

  const PAYOUTS = { up: 2, seven: 5, down: 2 };

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class SevenUpDownEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.dice = [
        { x: 0, y: 0, vx: 0, vy: 0, value: 1, settled: true, rot: 0, vrot: 0 },
        { x: 0, y: 0, vx: 0, vy: 0, value: 1, settled: true, rot: 0, vrot: 0 }
      ];
      this.shaking = false;
      this.result = null;
      this.shakeStart = 0;
    }

    onResize(w, h) {
      this.dice.forEach((d, i) => {
        d.x = w / 2 + (i === 0 ? -w * 0.12 : w * 0.12);
        d.y = h * 0.5;
      });
    }

    roll() {
      this.shaking = true;
      this.shakeStart = performance.now();
      this.result = null;

      this.dice.forEach((d) => {
        d.vx = (Math.random() - 0.5) * 400;
        d.vy = -200 - Math.random() * 150;
        d.vrot = (Math.random() - 0.5) * 20;
        d.settled = false;
        d.value = 1 + Math.floor(Math.random() * 6);
      });
      this.sfx.spin();
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      ctx.clearRect(0, 0, this.width, this.height);

      // Cup boundary
      const cx = this.width / 2;
      const cy = this.height * 0.55;
      const cupR = Math.min(this.width, this.height) * 0.4;

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cupR);
      grad.addColorStop(0, "rgba(255,215,0,0.07)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cupR, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, cupR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,215,0,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (this.shaking) {
        const gravity = 600;
        let allSettled = true;

        this.dice.forEach((d) => {
          if (d.settled) return;

          d.vy += gravity * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.rot += d.vrot * dt;

          // Bounce off cup walls (circular boundary)
          const dx = d.x - cx;
          const dy = d.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const dieR = 18;
          if (dist + dieR > cupR) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = d.vx * nx + d.vy * ny;
            d.vx -= 2 * dot * nx;
            d.vy -= 2 * dot * ny;
            d.vx *= 0.6;
            d.vy *= 0.6;
            d.vrot *= 0.7;
            // Reposition inside boundary
            d.x = cx + nx * (cupR - dieR);
            d.y = cy + ny * (cupR - dieR);
          }

          // Damping
          d.vx *= 0.995;
          d.vy *= 0.995;
          d.vrot *= 0.98;

          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy) + Math.abs(d.vrot);
          if (speed < 8 && now - this.shakeStart > 800) {
            d.settled = true;
            d.rot = Math.round(d.rot / (Math.PI / 2)) * (Math.PI / 2);
          } else {
            allSettled = false;
          }
        });

        if (allSettled) {
          this.shaking = false;
          const sum = this.dice[0].value + this.dice[1].value;
          if (sum === 7) this.result = "seven";
          else if (sum < 7) this.result = "down";
          else this.result = "up";

          this.result === selectedBet ? this.sfx.win() : this.sfx.lose();
          renderUI(uiContainer, this);
        }
      }

      // Draw dice
      this.dice.forEach((d) => this.drawDie(d));

      // Sum display
      if (!this.shaking) {
        const sum = this.dice[0].value + this.dice[1].value;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = this.result === "seven" ? "#FFD700" : this.result === "up" ? "#50C878" : "#f87171";
        ctx.fillText(`Sum: ${sum}`, cx, cy - cupR - 12);
      }
    }

    drawDie(d) {
      const ctx = this.ctx;
      const size = 32;

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);

      window.CardUtils.roundRect(ctx, -size / 2, -size / 2, size, size, 5);
      ctx.fillStyle = "#1c1f26";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,0,0.3)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = d.settled && !this.shaking ? 6 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pips
      ctx.fillStyle = "#FFD700";
      const pip = size * 0.08;
      const positions = pipPositions(d.value, size);
      positions.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, pip, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  }

  // Standard die pip layouts (relative to center, in size units)
  function pipPositions(value, size) {
    const o = size * 0.28;
    const layouts = {
      1: [[0, 0]],
      2: [[-o, -o], [o, o]],
      3: [[-o, -o], [0, 0], [o, o]],
      4: [[-o, -o], [o, -o], [-o, o], [o, o]],
      5: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]],
      6: [[-o, -o], [o, -o], [-o, 0], [o, 0], [-o, o], [o, o]]
    };
    return layouts[value] || layouts[1];
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new SevenUpDownEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    renderUI(container, engine);
    engine.start();
  }

  function cleanup() {
    if (engine) engine.destroy();
    engine = null;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  function renderUI(container, eng) {
    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${eng.shaking ? "gold-text" : "emerald-text"}">${eng.shaking ? "Shaking..." : "Place your bet!"}</span>
          <span class="text-xs font-bold gold-text">RTP ${eng.rtp.toFixed(1)}%</span>
        </div>

        <div class="min-h-[200px] pointer-events-none relative z-10"></div>

        ${eng.result && !eng.shaking ? renderResult(eng) : ""}
        ${!eng.shaking ? renderBettingPanel(eng) : ""}
      </div>`;

    if (!eng.shaking) attachHandlers(container, eng);
  }

  function renderBettingPanel(eng) {
    const chips = [10, 25, 50, 100, 500];
    return `
      <div class="mb-2 relative z-10">
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Bet Amount</p>
        <div class="flex gap-1.5 mb-3 overflow-x-auto scrollbar-x">
          ${chips.map((c) => `
            <button class="chip-btn glass rounded-full px-3 py-1.5 text-xs font-bold ${c === selectedAmount ? "gold-grad text-black" : "gold-text"}" data-amount="${c}">$${c}</button>
          `).join("")}
        </div>
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "down" ? "bg-red-500 text-black" : "text-red-400"}" data-bet="down" style="border:1px solid #f8717140">Down (&lt;7)<br><span class="text-[10px] opacity-70">${PAYOUTS.down}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "seven" ? "gold-grad text-black gold-glow" : "gold-text"}" data-bet="seven" style="border:1px solid #FFD70040">Seven<br><span class="text-[10px] opacity-70">${PAYOUTS.seven}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "up" ? "bg-emerald-500 text-black emerald-glow" : "emerald-text"}" data-bet="up" style="border:1px solid #50C87840">Up (&gt;7)<br><span class="text-[10px] opacity-70">${PAYOUTS.up}x</span></button>
        </div>
        <button id="roll-btn" class="w-full gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">Shake & Roll — $${selectedAmount}</button>
      </div>`;
  }

  function renderResult(eng) {
    const won = eng.result === selectedBet;
    const payout = won ? selectedAmount * PAYOUTS[eng.result] : 0;
    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-xs text-gray-400">Result</p>
        <p class="text-lg font-black gold-text">${capitalize(eng.result)}</p>
        <p class="text-xs mt-1 ${won ? "emerald-text" : "text-red-400"}">${won ? `+$${payout.toFixed(2)}` : `-$${selectedAmount.toFixed(2)}`}</p>
      </div>`;
  }

  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ""; }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachHandlers(container, eng) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        renderUI(container, eng);
      });
    });

    container.querySelectorAll(".bet-cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedBet = btn.dataset.bet;
        eng.sfx.chipPlace();
        renderUI(container, eng);
      });
    });

    container.querySelector("#roll-btn")?.addEventListener("click", async () => {
      if (eng.session) {
        const { error } = await eng.placeBet(selectedBet, selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      eng.roll();
      renderUI(container, eng);
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.sevenUpDown = { mount, cleanup };
})();
