// =====================================================================
// ROULETTE.JS — 2D physics-based spinning wheel + number betting grid
// Wheel physics: angular velocity decelerates via friction each frame
//   omega(t+dt) = omega(t) * (1 - friction * dt)
// Ball settles into the pocket aligned with the wheel's final rotation.
//
// game_state shape (server-authoritative when multiplayer):
//   { result: number (0-36), spinSeed }
//
// LOCAL DEMO MODE: spins on demand via "Spin" button using the same
// RTP-aware random number selection.
// =====================================================================

(function () {
  const ROOM_NAME = "roulette-room-1";

  // European wheel order (single zero)
  const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let countdownInterval = null;
  let selectedBet = null; // { type: 'number'|'red'|'black'|'green'|'even'|'odd', value }

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class RouletteEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.angle = 0;
      this.angularVelocity = 0;
      this.friction = 0.985; // multiplicative decay per frame (~60fps)
      this.spinning = false;
      this.result = null;
      this.resultIndex = 0;
      this.ballAngle = 0;
      this.ballRadius = 1; // 1 = rim, shrinks toward center as it settles
    }

    spin(targetResult) {
      this.spinning = true;
      this.result = targetResult;
      this.resultIndex = WHEEL_ORDER.indexOf(targetResult);

      // Initial velocity — randomized for visual variety, large enough for several rotations
      this.angularVelocity = 0.35 + Math.random() * 0.1;
      this.ballRadius = 1;
      this.sfx.spin();

      // Compute target angle so the winning pocket lands at the pointer (top, angle = -PI/2)
      const pocketAngle = (this.resultIndex / WHEEL_ORDER.length) * Math.PI * 2;
      this._targetPocketAngle = pocketAngle;
    }

    onSessionUpdate(session) {
      const state = session.game_state || {};
      if (session.status === "dealing" && typeof state.result === "number" && !this.spinning) {
        this.spin(state.result);
      }
      renderUI(uiContainer, session, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      if (this.spinning) {
        this.angle += this.angularVelocity;
        this.angularVelocity *= this.friction;

        // Ball spins opposite + faster initially, settles toward result pocket
        this.ballRadius = Math.max(0.55, this.ballRadius - 0.002);

        if (this.angularVelocity < 0.002) {
          // Snap to final position
          this.angularVelocity = 0;
          this.spinning = false;
          this.angle = this._finalAngleFor(this.resultIndex);
          this.sfx.win();
          renderUI(uiContainer, this.session || { status: "finished", game_state: { result: this.result } }, this);
          if (typeof this.onSpinComplete === "function") this.onSpinComplete(this.result);
        }
      }

      this.draw();
    }

    _finalAngleFor(index) {
      // Angle such that pocket `index` sits at the top pointer position
      const segment = (Math.PI * 2) / WHEEL_ORDER.length;
      return -((index * segment) + (this.angle % segment)) % (Math.PI * 2);
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      const cx = this.width / 2;
      const cy = this.height / 2;
      const R = Math.min(this.width, this.height) * 0.42;
      const segment = (Math.PI * 2) / WHEEL_ORDER.length;

      // Outer rim
      ctx.beginPath();
      ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pockets
      WHEEL_ORDER.forEach((num, i) => {
        const startAngle = this.angle + i * segment;
        const endAngle = startAngle + segment;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = pocketColor(num);
        ctx.fill();

        // Number label
        const midAngle = startAngle + segment / 2;
        const lx = cx + Math.cos(midAngle) * R * 0.82;
        const ly = cy + Math.sin(midAngle) * R * 0.82;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(8, R * 0.09)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num, 0, 0);
        ctx.restore();
      });

      // Center hub
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0C10";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,0,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ball
      const ballAngle = this.spinning ? -this.angle * 1.4 : this._finalAngleFor(this.resultIndex);
      const ballR = R * (this.spinning ? this.ballRadius : 0.62);
      const bx = cx + Math.cos(ballAngle) * ballR;
      const by = cy + Math.sin(ballAngle) * ballR;
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(3, R * 0.045), 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pointer (top)
      ctx.beginPath();
      ctx.moveTo(cx, cy - R - 10);
      ctx.lineTo(cx - 6, cy - R - 20);
      ctx.lineTo(cx + 6, cy - R - 20);
      ctx.closePath();
      ctx.fillStyle = "#50C878";
      ctx.shadowColor = "#50C878";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function pocketColor(num) {
    if (num === 0) return "#50C878";
    return RED_NUMBERS.has(num) ? "#dc2626" : "#1c1f26";
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new RouletteEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    engine.onSpinComplete = (result) => {
      renderUI(container, engine.session || { status: "finished", game_state: { result } }, engine);
    };

    if (!engine.session) {
      // Local-only mode
      renderUI(container, { status: "betting", game_state: {} }, engine);
    } else {
      renderUI(container, engine.session, engine);
    }
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
  function renderUI(container, session, eng) {
    const status = session.status;
    const state = session.game_state || {};

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${eng.spinning ? "gold-text" : "emerald-text"}">${eng.spinning ? "Spinning..." : "Place your bets!"}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <div class="min-h-[220px] pointer-events-none relative z-10"></div>

        ${eng.result !== null && !eng.spinning ? renderResult(eng) : ""}
        ${renderBettingGrid()}
        ${renderBettingPanel(eng)}
      </div>`;

    attachBettingHandlers(container);
    startCountdown(container, session);
  }

  function renderResult(eng) {
    const num = eng.result;
    const color = pocketColor(num);
    const colorName = num === 0 ? "Green" : RED_NUMBERS.has(num) ? "Red" : "Black";
    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-xs text-gray-400">Winning Number</p>
        <p class="text-2xl font-black" style="color:${color === '#1c1f26' ? '#e5e7eb' : color}">${num}</p>
        <p class="text-[10px] text-gray-500">${colorName}</p>
      </div>`;
  }

  function renderBettingGrid() {
    // Simplified grid: 0 + 1-36 in 3 columns, plus outside bets
    const numbers = [];
    for (let i = 1; i <= 36; i += 3) {
      numbers.push([i, i + 1, i + 2]);
    }
    const numberCells = numbers.map((row) => row.map((n) => `
      <button class="num-cell glass rounded text-[10px] font-bold py-1.5" data-type="number" data-value="${n}" style="color:${RED_NUMBERS.has(n) ? '#f87171' : '#e5e7eb'}">${n}</button>
    `).join("")).join("");

    return `
      <div class="mb-2 relative z-10">
        <div class="grid grid-cols-1 gap-1 mb-1">
          <button class="num-cell glass rounded text-[10px] font-bold py-1.5 emerald-text" data-type="number" data-value="0">0</button>
        </div>
        <div class="grid grid-cols-3 gap-1 mb-2">${numberCells}</div>
        <div class="grid grid-cols-3 gap-1.5">
          <button class="num-cell glass rounded-lg text-[10px] font-bold py-2" data-type="red" style="color:#f87171; border:1px solid #f8717140">Red 2x</button>
          <button class="num-cell glass rounded-lg text-[10px] font-bold py-2" data-type="black" style="color:#e5e7eb; border:1px solid #e5e7eb40">Black 2x</button>
          <button class="num-cell glass rounded-lg text-[10px] font-bold py-2 emerald-text" data-type="green" style="border:1px solid #50C87840">Green 14x</button>
        </div>
      </div>`;
  }

  function renderBettingPanel(eng) {
    const chips = [10, 25, 50, 100, 500];
    const betLabel = selectedBet
      ? selectedBet.type === "number" ? `Straight Up: ${selectedBet.value}` : capitalize(selectedBet.type)
      : "No bet selected";

    return `
      <div class="mb-2 relative z-10">
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Bet Amount</p>
        <div class="flex gap-1.5 mb-3 overflow-x-auto scrollbar-x">
          ${chips.map((c) => `
            <button class="chip-btn glass rounded-full px-3 py-1.5 text-xs font-bold ${c === selectedAmount ? "gold-grad text-black" : "gold-text"}" data-amount="${c}">$${c}</button>
          `).join("")}
        </div>
        <p class="text-xs text-gray-400 mb-2">Selected: <span class="gold-text font-bold">${betLabel}</span></p>
        <button id="spin-btn" class="w-full ${eng.spinning ? "glass text-gray-500" : "gold-grad text-black gold-glow"} text-sm font-bold py-3 rounded-xl" ${eng.spinning || !selectedBet ? "disabled" : ""}>
          ${eng.spinning ? "Spinning..." : `Spin — $${selectedAmount}`}
        </button>
      </div>`;
  }

  function capitalize(s) { return s[0].toUpperCase() + s.slice(1); }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachBettingHandlers(container) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        renderUI(container, engine.session || { status: "betting", game_state: {} }, engine);
      });
    });

    container.querySelectorAll(".num-cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const value = btn.dataset.value ? Number(btn.dataset.value) : null;
        selectedBet = { type, value };
        engine.sfx.chipPlace();
        renderUI(container, engine.session || { status: "betting", game_state: {} }, engine);
      });
    });

    const spinBtn = container.querySelector("#spin-btn");
    if (spinBtn && !engine.spinning && selectedBet) {
      spinBtn.addEventListener("click", async () => {
        if (engine.session) {
          const choiceKey = selectedBet.type === "number" ? `number-${selectedBet.value}` : selectedBet.type;
          const { error } = await engine.placeBet(choiceKey, selectedAmount);
          if (error) {
            window.showToast(error.message || "Bet failed", "#f87171");
            return;
          }
        }

        // Determine outcome — RTP-weighted: bias toward house-favorable numbers
        const result = rollResult(selectedBet, engine.rtp);
        engine.spin(result);
        renderUI(container, engine.session || { status: "dealing", game_state: { result } }, engine);
      });
    }
  }

  // RTP-weighted outcome roll. If the player's specific bet would win,
  // there's an RTP-proportional chance of letting it stand; otherwise
  // a different (losing-for-player) number is chosen.
  function rollResult(bet, rtp) {
    const playerWinChance = rtp / 100 * baseWinProbability(bet);
    if (Math.random() < playerWinChance) {
      return winningNumberFor(bet);
    }
    // Pick any number that does NOT satisfy the bet
    let n;
    do {
      n = Math.floor(Math.random() * 37);
    } while (matchesBet(bet, n));
    return n;
  }

  function baseWinProbability(bet) {
    if (bet.type === "number") return 1 / 37;
    if (bet.type === "green") return 1 / 37;
    return 18 / 37; // red/black
  }

  function winningNumberFor(bet) {
    if (bet.type === "number") return bet.value;
    if (bet.type === "green") return 0;
    if (bet.type === "red") {
      const reds = [...RED_NUMBERS];
      return reds[Math.floor(Math.random() * reds.length)];
    }
    if (bet.type === "black") {
      let n;
      do { n = Math.floor(Math.random() * 36) + 1; } while (RED_NUMBERS.has(n));
      return n;
    }
    return Math.floor(Math.random() * 37);
  }

  function matchesBet(bet, n) {
    if (bet.type === "number") return n === bet.value;
    if (bet.type === "green") return n === 0;
    if (bet.type === "red") return RED_NUMBERS.has(n);
    if (bet.type === "black") return n !== 0 && !RED_NUMBERS.has(n);
    return false;
  }

  // -------------------------------------------------------------
  // COUNTDOWN
  // -------------------------------------------------------------
  function startCountdown(container, session) {
    if (countdownInterval) clearInterval(countdownInterval);
    const el = container.querySelector("#countdown");
    if (!el || !session.round_ends_at) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(session.round_ends_at) - Date.now()) / 1000));
      el.textContent = session.status === "betting" ? `${remaining}s` : "";
      if (remaining <= 0) clearInterval(countdownInterval);
    };
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.roulette = { mount, cleanup };
})();
