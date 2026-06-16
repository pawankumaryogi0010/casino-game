// =====================================================================
// JHANDI-MUNDA.JS — Six-sided dice rolling machine (6 dice, 6 symbols)
// Symbols: Spade, Heart, Diamond, Club, Flag, Sun — one per die face set.
// Players bet on a symbol; payout = number of dice showing that symbol.
//
// 3D effect achieved via canvas: each die rendered as a rotating cube
// (isometric projection) with rotation angles animated each frame,
// decelerating to rest on the rolled face.
// =====================================================================

(function () {
  const ROOM_NAME = "jhandi-munda-room-1";

  const SYMBOLS = [
    { key: "spade", label: "♠", color: "#e5e7eb" },
    { key: "heart", label: "♥", color: "#f87171" },
    { key: "diamond", label: "♦", color: "#f87171" },
    { key: "club", label: "♣", color: "#e5e7eb" },
    { key: "flag", label: "⚑", color: "#FFD700" },
    { key: "sun", label: "☀", color: "#FFD700" }
  ];

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let selectedSymbol = "flag";
  let countdownInterval = null;

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class JhandiMundaEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.dice = SYMBOLS.map((_, i) => ({
        rotX: 0, rotY: 0,
        spinX: 0, spinY: 0,
        resultIndex: i % SYMBOLS.length,
        settled: true
      }));
      this.rolling = false;
      this.results = [];
    }

    roll() {
      this.rolling = true;
      this.results = [];
      this.dice.forEach((die) => {
        die.settled = false;
        die.spinX = 0.25 + Math.random() * 0.15;
        die.spinY = 0.2 + Math.random() * 0.15;
        die.resultIndex = Math.floor(Math.random() * SYMBOLS.length);
        // Target rotation that lands on resultIndex (each face = 90deg apart on 4 visible faces approximation)
        die._targetRotX = Math.round(die.rotX / (Math.PI / 2)) * (Math.PI / 2) + Math.PI * (4 + Math.random() * 2);
        die._targetRotY = die.resultIndex * (Math.PI / 3) + Math.PI * (4 + Math.random() * 2);
      });
      this.sfx.spin();
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      ctx.clearRect(0, 0, this.width, this.height);

      let allSettled = true;
      this.dice.forEach((die) => {
        if (!die.settled) {
          die.rotX += die.spinX;
          die.rotY += die.spinY;
          die.spinX *= 0.95;
          die.spinY *= 0.95;

          if (die.spinX < 0.01 && die.spinY < 0.01) {
            die.settled = true;
            die.rotX = die.resultIndex * 0.3; // visual settle angle
            die.rotY = die.resultIndex * (Math.PI / 3);
            this.sfx.tick();
            this.results.push(SYMBOLS[die.resultIndex].key);
          } else {
            allSettled = false;
          }
        }
      });

      if (this.rolling && allSettled && this.results.length === this.dice.length) {
        this.rolling = false;
        this.onRollComplete?.(this.results);
      }

      this.drawDice();
    }

    drawDice() {
      const ctx = this.ctx;
      const cols = 3;
      const rows = 2;
      const cellW = this.width / cols;
      const cellH = this.height / rows;
      const size = Math.min(cellW, cellH) * 0.55;

      this.dice.forEach((die, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = cellW * col + cellW / 2;
        const cy = cellH * row + cellH / 2;
        this.drawIsoCube(cx, cy, size, die);
      });
    }

    // Isometric cube with rotation — front face shows the symbol
    drawIsoCube(cx, cy, size, die) {
      const ctx = this.ctx;
      const s = size / 2;

      // Pseudo-3D wobble via rotation angles affecting face skew
      const skewX = Math.sin(die.rotY) * 0.3;
      const skewY = Math.sin(die.rotX) * 0.3;

      ctx.save();
      ctx.translate(cx, cy);

      // Top face (lighter)
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.6 + skewY * s);
      ctx.lineTo(s, -s * 0.6 - skewY * s);
      ctx.lineTo(s * 0.7, -s * 1.1);
      ctx.lineTo(-s * 0.7, -s * 1.1);
      ctx.closePath();
      ctx.fillStyle = "#2a2e38";
      ctx.fill();

      // Side face (darker)
      ctx.beginPath();
      ctx.moveTo(s, -s * 0.6 - skewY * s);
      ctx.lineTo(s, s * 0.6 - skewY * s);
      ctx.lineTo(s * 0.7, s * 0.9);
      ctx.lineTo(s * 0.7, -s * 1.1);
      ctx.closePath();
      ctx.fillStyle = "#15171c";
      ctx.fill();

      // Front face (main, shows symbol)
      const frontW = s * 1.7;
      const frontH = s * 1.7;
      ctx.save();
      ctx.transform(1, skewY * 0.15, skewX * 0.15, 1, 0, 0);
      window.CardUtils.roundRect(ctx, -frontW / 2, -frontH / 2, frontW, frontH, 6);
      ctx.fillStyle = "#1c1f26";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,0,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const sym = SYMBOLS[die.resultIndex];
      ctx.font = `${frontW * 0.5}px sans-serif`;
      ctx.fillStyle = sym.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = sym.color;
      ctx.shadowBlur = die.settled ? 8 : 0;
      ctx.fillText(sym.label, 0, 2);
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new JhandiMundaEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    engine.onRollComplete = (results) => {
      renderUI(container, engine, results);
    };

    renderUI(container, engine, null);
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
  function renderUI(container, eng, results) {
    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${eng.rolling ? "gold-text" : "emerald-text"}">${eng.rolling ? "Rolling..." : "Place your bet!"}</span>
          <span class="text-xs font-bold gold-text">RTP ${eng.rtp.toFixed(1)}%</span>
        </div>

        <div class="min-h-[180px] pointer-events-none relative z-10"></div>

        ${results ? renderResult(results) : ""}
        ${renderBettingPanel(eng)}
      </div>`;

    attachHandlers(container, eng);
  }

  function renderResult(results) {
    const counts = {};
    results.forEach((r) => counts[r] = (counts[r] || 0) + 1);
    const matchCount = counts[selectedSymbol] || 0;
    const won = matchCount > 0;
    const payout = won ? selectedAmount * matchCount : 0;

    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-xs text-gray-400">Your symbol (${SYMBOLS.find(s=>s.key===selectedSymbol)?.label}) appeared</p>
        <p class="text-2xl font-black ${won ? "emerald-text" : "text-red-400"}">${matchCount}x</p>
        <p class="text-xs mt-1 ${won ? "emerald-text" : "text-red-400"}">${won ? `+$${payout.toFixed(2)}` : `-$${selectedAmount.toFixed(2)}`}</p>
      </div>`;
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
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Pick Your Symbol</p>
        <div class="grid grid-cols-3 gap-1.5 mb-3">
          ${SYMBOLS.map((s) => `
            <button class="sym-cell glass rounded-xl py-3 text-xl font-bold ${selectedSymbol === s.key ? "gold-grad" : ""}" data-symbol="${s.key}" style="color:${selectedSymbol === s.key ? "#0B0C10" : s.color}">${s.label}</button>
          `).join("")}
        </div>
        <button id="roll-btn" class="w-full ${eng.rolling ? "glass text-gray-500" : "gold-grad text-black gold-glow"} text-sm font-bold py-3 rounded-xl" ${eng.rolling ? "disabled" : ""}>
          ${eng.rolling ? "Rolling..." : `Roll Dice — $${selectedAmount}`}
        </button>
      </div>`;
  }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachHandlers(container, eng) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        renderUI(container, eng, null);
      });
    });

    container.querySelectorAll(".sym-cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSymbol = btn.dataset.symbol;
        engine.sfx.chipPlace();
        renderUI(container, eng, null);
      });
    });

    container.querySelector("#roll-btn")?.addEventListener("click", async () => {
      if (eng.session) {
        const { error } = await eng.placeBet(selectedSymbol, selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      eng.roll();
      renderUI(container, eng, null);
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.jhandiMunda = { mount, cleanup };
})();
