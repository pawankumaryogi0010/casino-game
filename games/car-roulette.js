// =====================================================================
// CAR-ROULETTE.JS — Circular fast-spinning reel of luxury car badges
// Each car has a weighted probability and an associated multiplier.
// Rarer cars (Bugatti, Ferrari) = higher multiplier, lower weight.
// Spin physics: horizontal reel decelerates via friction, like a slot strip.
// =====================================================================

(function () {
  const ROOM_NAME = "car-roulette-room-1";

  // Car catalog: weight = relative spawn frequency (higher = more common)
  const CARS = [
    { key: "civic",    label: "Civic",    mult: 1.5,  weight: 30, color: "#9ca3af" },
    { key: "mustang",  label: "Mustang",  mult: 2,    weight: 22, color: "#f87171" },
    { key: "porsche",  label: "Porsche",  mult: 5,    weight: 14, color: "#FFD700" },
    { key: "lambo",    label: "Lambo",    mult: 10,   weight: 8,  color: "#fbbf24" },
    { key: "ferrari",  label: "Ferrari",  mult: 25,   weight: 4,  color: "#dc2626" },
    { key: "bugatti",  label: "Bugatti",  mult: 50,   weight: 2,  color: "#50C878" }
  ];

  const TOTAL_WEIGHT = CARS.reduce((s, c) => s + c.weight, 0);

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let countdownInterval = null;

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class CarRouletteEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      // Build a long strip of repeated car icons for the reel effect
      this.strip = [];
      for (let i = 0; i < 60; i++) {
        this.strip.push(CARS[Math.floor(Math.random() * CARS.length)]);
      }
      this.offset = 0;
      this.velocity = 0;
      this.friction = 0.96;
      this.spinning = false;
      this.result = null;
      this.cellW = 80;
    }

    // RTP-weighted pick: outcomes biased so expected payout aligns with RTP
    pickResult() {
      // Build weighted pool, but apply an RTP scale factor to the
      // probability of landing on high-multiplier cars.
      const rtpFactor = this.rtp / 100;
      const adjusted = CARS.map((c) => ({
        ...c,
        adjWeight: c.mult > 5 ? c.weight * rtpFactor : c.weight * (2 - rtpFactor)
      }));
      const total = adjusted.reduce((s, c) => s + c.adjWeight, 0);
      let r = Math.random() * total;
      for (const c of adjusted) {
        if (r < c.adjWeight) return CARS.find((x) => x.key === c.key);
        r -= c.adjWeight;
      }
      return CARS[0];
    }

    spin() {
      this.spinning = true;
      this.result = this.pickResult();

      // Extend strip with fresh random cars, ending with the result car
      // positioned so it lands at the center after deceleration.
      const extra = [];
      for (let i = 0; i < 40; i++) {
        extra.push(CARS[Math.floor(Math.random() * CARS.length)]);
      }
      extra.push(this.result);
      this.strip = [...this.strip, ...extra];

      this.velocity = 2200 + Math.random() * 400; // px/sec
      this.sfx.spin();
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      if (this.spinning) {
        this.offset += this.velocity * dt;
        this.velocity *= Math.pow(this.friction, dt * 60);

        // Recycle strip items that have scrolled fully off-screen
        while (this.offset > this.cellW) {
          this.offset -= this.cellW;
          this.strip.shift();
        }

        if (this.velocity < 5) {
          // Snap to center on the result car
          this.spinning = false;
          this.velocity = 0;
          this.offset = 0;
          // Ensure result car is centered
          const centerIndex = Math.floor(this.strip.length / 2);
          this.strip[centerIndex] = this.result;
          this.sfx.win();
          renderUI(uiContainer, this);
        }
      }

      ctx.clearRect(0, 0, this.width, this.height);

      const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 10, this.width / 2, this.height / 2, this.width * 0.8);
      grad.addColorStop(0, "rgba(255,215,0,0.06)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      this.drawReel();
    }

    drawReel() {
      const ctx = this.ctx;
      const cy = this.height * 0.45;
      const cellW = this.cellW;
      const cellH = cellW * 1.1;
      const centerX = this.width / 2;
      const centerIndex = Math.floor(this.strip.length / 2);

      // Visible window: a few cells either side of center
      const visibleCells = Math.ceil(this.width / cellW) + 2;

      for (let i = -Math.floor(visibleCells / 2); i <= Math.floor(visibleCells / 2); i++) {
        const idx = centerIndex + i;
        const car = this.strip[idx];
        if (!car) continue;

        const x = centerX + i * cellW - this.offset - cellW / 2;
        const isCenter = i === 0 && !this.spinning;

        this.drawCarBadge(car, x, cy - cellH / 2, cellW - 8, cellH, isCenter);
      }

      // Center selection frame
      ctx.save();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 10;
      window.CardUtils.roundRect(ctx, centerX - cellW / 2, cy - cellH / 2, cellW, cellH, 8);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Top/bottom gradient fade for "reel window" effect
      const fadeGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      fadeGrad.addColorStop(0, "#0B0C10");
      fadeGrad.addColorStop(0.15, "rgba(11,12,16,0)");
      fadeGrad.addColorStop(0.75, "rgba(11,12,16,0)");
      fadeGrad.addColorStop(1, "#0B0C10");
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Side fades for horizontal scroll
      const sideGrad = ctx.createLinearGradient(0, 0, this.width, 0);
      sideGrad.addColorStop(0, "#0B0C10");
      sideGrad.addColorStop(0.08, "rgba(11,12,16,0)");
      sideGrad.addColorStop(0.92, "rgba(11,12,16,0)");
      sideGrad.addColorStop(1, "#0B0C10");
      ctx.fillStyle = sideGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draws a simple SVG-style car badge (procedural shapes, no images)
    drawCarBadge(car, x, y, w, h, highlight) {
      const ctx = this.ctx;
      ctx.save();
      window.CardUtils.roundRect(ctx, x, y, w, h, 10);
      ctx.fillStyle = "#16181d";
      ctx.fill();
      if (highlight) {
        ctx.strokeStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Car silhouette (procedural)
      const cx = x + w / 2;
      const cy = y + h * 0.5;
      const bodyW = w * 0.7;
      const bodyH = h * 0.22;

      ctx.fillStyle = car.color;
      // Body
      window.CardUtils.roundRect(ctx, cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, 6);
      ctx.fill();
      // Cabin
      window.CardUtils.roundRect(ctx, cx - bodyW * 0.28, cy - bodyH * 1.4, bodyW * 0.56, bodyH * 1.1, 5);
      ctx.fill();
      // Wheels
      ctx.beginPath();
      ctx.arc(cx - bodyW * 0.28, cy + bodyH * 0.5, bodyH * 0.35, 0, Math.PI * 2);
      ctx.arc(cx + bodyW * 0.28, cy + bodyH * 0.5, bodyH * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0C10";
      ctx.fill();

      // Label + multiplier
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(car.label, cx, y + h * 0.82);
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = car.color;
      ctx.fillText(`${car.mult}x`, cx, y + h * 0.95);

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new CarRouletteEngine(canvas, { ...gameMeta, room });
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
          <span class="text-xs font-semibold ${eng.spinning ? "gold-text" : "emerald-text"}">${eng.spinning ? "Spinning..." : "Place your bet!"}</span>
          <span class="text-xs font-bold gold-text">RTP ${eng.rtp.toFixed(1)}%</span>
        </div>

        <div class="min-h-[140px] pointer-events-none relative z-10"></div>

        ${eng.result && !eng.spinning ? renderResult(eng) : ""}
        ${!eng.spinning ? renderBettingPanel(eng) : ""}

        <div class="grid grid-cols-3 gap-1.5 mt-3 relative z-10">
          ${CARS.map((c) => `
            <div class="glass rounded-lg px-2 py-1.5 text-center">
              <p class="text-[10px] font-bold" style="color:${c.color}">${c.label}</p>
              <p class="text-[9px] text-gray-500">${c.mult}x · ${((c.weight/TOTAL_WEIGHT)*100).toFixed(0)}%</p>
            </div>
          `).join("")}
        </div>
      </div>`;

    if (!eng.spinning) attachHandlers(container, eng);
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
        <button id="spin-btn" class="w-full gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">Spin Reel — $${selectedAmount}</button>
      </div>`;
  }

  function renderResult(eng) {
    const payout = selectedAmount * eng.result.mult;
    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-xs text-gray-400">You landed on</p>
        <p class="text-lg font-black" style="color:${eng.result.color}">${eng.result.label} (${eng.result.mult}x)</p>
        <p class="text-xs mt-1 emerald-text">+$${payout.toFixed(2)}</p>
      </div>`;
  }

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

    container.querySelector("#spin-btn")?.addEventListener("click", async () => {
      if (eng.session) {
        const { error } = await eng.placeBet("spin", selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      eng.spin();
      renderUI(container, eng);
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.carRoulette = { mount, cleanup };
})();
