// =====================================================================
// CRASH.JS — Aviator/Crash: vector airplane on exponential multiplier curve
// Multiplier model: m(t) = e^(k * t)  (k tuned so curve feels exponential)
// Crash point is pre-rolled (RTP-weighted) at round start — never revealed
// to the client until the round ends, preventing prediction.
//
// game_state shape (server-authoritative when multiplayer):
//   { multiplier, result: 'crashed', crashPoint }
//
// LOCAL DEMO MODE: runs a self-contained round loop (betting -> flying ->
// crashed -> betting...) so the game is fully playable standalone.
// =====================================================================

(function () {
  const ROOM_NAME = "crash-room-1";

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let hasBetThisRound = false;
  let cashedOutAt = null;
  let countdownInterval = null;
  let localMode = false;

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class CrashEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.curvePoints = [];
      this.multiplier = 1.0;
      this.phase = "betting"; // betting | flying | crashed
      this.crashPoint = null;
      this.phaseStart = performance.now();
      this.bettingDuration = 5000;
      this.k = 0.18; // exponential growth rate
    }

    // -------------------------------------------------------------
    // LOCAL ROUND LOOP (self-contained demo)
    // -------------------------------------------------------------
    startLocalBetting() {
      this.phase = "betting";
      this.phaseStart = performance.now();
      this.multiplier = 1.0;
      this.curvePoints = [];
      this.crashPoint = this.rollCrashPoint();
      hasBetThisRound = false;
      cashedOutAt = null;
      renderUI(uiContainer, this.fakeSession(), this);
    }

    startLocalFlying() {
      this.phase = "flying";
      this.phaseStart = performance.now();
      renderUI(uiContainer, this.fakeSession(), this);
    }

    crash() {
      this.phase = "crashed";
      this.phaseStart = performance.now();
      this.sfx.crashOut();
      renderUI(uiContainer, this.fakeSession(), this);
      setTimeout(() => this.startLocalBetting(), 2500);
    }

    // RTP-weighted crash point: higher RTP -> statistically higher crash points
    rollCrashPoint() {
      // Standard provably-fair-style distribution, biased by RTP
      const r = Math.random();
      const houseEdge = (100 - this.rtp) / 100; // e.g. 0.04 for 96% RTP
      // Inverse transform: smaller r -> bigger multiplier; clamp range 1.00x - 100x
      const raw = (1 - houseEdge) / Math.max(r, 0.0001);
      return Math.max(1.0, Math.min(100, raw));
    }

    fakeSession() {
      return this.session || { status: "betting", game_state: {}, round_ends_at: null };
    }

    onSessionUpdate(session) {
      // Live multiplayer session present -> disable local loop
      localMode = false;
      const state = session.game_state || {};

      if (session.status === "betting") {
        this.phase = "betting";
        this.multiplier = 1.0;
        this.curvePoints = [];
        hasBetThisRound = false;
        cashedOutAt = null;
      }
      if (session.status === "dealing") {
        this.phase = "flying";
        this.multiplier = Number(state.multiplier) || this.multiplier;
        this.curvePoints.push(this.multiplier);
      }
      if (session.status === "finished") {
        this.phase = "crashed";
        this.crashPoint = Number(state.crashPoint) || this.multiplier;
        this.sfx.crashOut();
      }
      renderUI(uiContainer, session, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      // LOCAL MODE state machine
      if (localMode) {
        const elapsed = (now - this.phaseStart) / 1000;
        if (this.phase === "betting" && elapsed * 1000 > this.bettingDuration) {
          this.startLocalFlying();
        } else if (this.phase === "flying") {
          this.multiplier = Math.exp(this.k * elapsed);
          this.curvePoints.push(this.multiplier);

          // Auto cashout check
          if (hasBetThisRound && cashedOutAt === null && this._pendingCashout) {
            cashedOutAt = this.multiplier;
            this._pendingCashout = false;
            this.sfx.win();
            renderUI(uiContainer, this.fakeSession(), this);
          }

          if (this.multiplier >= this.crashPoint) {
            this.multiplier = this.crashPoint;
            this.crash();
          }
        }
      }

      // ---------------- RENDER ----------------
      ctx.clearRect(0, 0, this.width, this.height);

      // Background grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
      }

      if (this.phase === "betting") {
        this.drawCountdownRing(now);
      } else {
        this.drawCurveAndPlane();
      }

      // Multiplier text
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = this.phase === "crashed" ? "#f87171" : "#FFD700";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      const displayMult = this.phase === "crashed" ? this.crashPoint : this.multiplier;
      ctx.fillText(`${Number(displayMult).toFixed(2)}x`, this.width / 2, this.height * 0.45);
      ctx.shadowBlur = 0;

      if (cashedOutAt) {
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#50C878";
        ctx.fillText(`Cashed out at ${cashedOutAt.toFixed(2)}x`, this.width / 2, this.height * 0.45 + 30);
      }
    }

    drawCountdownRing(now) {
      const ctx = this.ctx;
      const elapsed = now - this.phaseStart;
      const progress = Math.min(1, elapsed / this.bettingDuration);
      const cx = this.width / 2;
      const cy = this.height * 0.45;
      const r = Math.min(this.width, this.height) * 0.18;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = "#50C878";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "#50C878";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    drawCurveAndPlane() {
      const ctx = this.ctx;
      const maxMult = Math.max(2, this.multiplier * 1.15);
      const originX = this.width * 0.08;
      const originY = this.height * 0.92;
      const usableW = this.width * 0.84;
      const usableH = this.height * 0.78;

      // Curve path
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.phase === "crashed" ? "#f87171" : "#50C878";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;

      const n = this.curvePoints.length;
      let lastX = originX, lastY = originY;
      this.curvePoints.forEach((m, i) => {
        const t = i / Math.max(1, n - 1);
        const x = originX + t * usableW;
        const y = originY - (Math.min(m, maxMult) - 1) / (maxMult - 1) * usableH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        lastX = x; lastY = y;
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill under curve
      if (n > 1) {
        ctx.lineTo(lastX, originY);
        ctx.lineTo(originX, originY);
        ctx.closePath();
        ctx.fillStyle = this.phase === "crashed" ? "rgba(248,113,113,0.08)" : "rgba(80,200,120,0.08)";
        ctx.fill();
      }

      // Vector airplane (triangle + tail) at curve tip
      if (this.phase === "flying" || this.phase === "crashed") {
        ctx.save();
        ctx.translate(lastX, lastY);
        const angle = n > 2
          ? Math.atan2(lastY - (originY - (Math.min(this.curvePoints[n-2], maxMult) - 1) / (maxMult-1) * usableH),
                        lastX - (originX + ((n-2)/(n-1)) * usableW))
          : -0.5;
        ctx.rotate(angle);

        ctx.fillStyle = this.phase === "crashed" ? "#f87171" : "#FFD700";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-10, -6);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Explosion burst on crash
        if (this.phase === "crashed") {
          const burstProgress = Math.min(1, (performance.now() - this.phaseStart) / 400);
          ctx.save();
          ctx.translate(lastX, lastY);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const dist = burstProgress * 20;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 2 * (1 - burstProgress), 0, Math.PI * 2);
            ctx.fillStyle = "#f87171";
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new CrashEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    if (!engine.session) {
      // No backend room — run fully local demo
      localMode = true;
      engine.startLocalBetting();
    } else if (!["betting", "dealing", "finished"].includes(engine.session.status) || true) {
      // Always allow local loop fallback if session has no live multiplier data
      localMode = !engine.session.game_state?.multiplier;
      if (localMode) engine.startLocalBetting();
      else renderUI(container, engine.session, engine);
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
    const phase = eng.phase;

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${statusColor(phase)}">${statusLabel(phase)}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <div class="min-h-[180px] pointer-events-none relative z-10"></div>

        ${phase === "betting" ? renderBettingPanel() : ""}
        ${phase === "flying" ? renderCashoutPanel() : ""}
        ${phase === "crashed" ? renderResult(eng) : ""}
      </div>`;

    if (phase === "betting") attachBettingHandlers(container);
    if (phase === "flying") attachCashoutHandler(container);
    startCountdown(container, session, eng);
  }

  function renderBettingPanel() {
    const chips = [10, 25, 50, 100, 500];
    return `
      <div class="mb-3 relative z-10">
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Bet Amount</p>
        <div class="flex gap-1.5 mb-3 overflow-x-auto scrollbar-x">
          ${chips.map((c) => `
            <button class="chip-btn glass rounded-full px-3 py-1.5 text-xs font-bold ${c === selectedAmount ? "gold-grad text-black" : "gold-text"}" data-amount="${c}">$${c}</button>
          `).join("")}
        </div>
        <button id="place-bet-btn" class="w-full ${hasBetThisRound ? "glass text-gray-500" : "gold-grad text-black gold-glow"} text-sm font-bold py-3 rounded-xl" ${hasBetThisRound ? "disabled" : ""}>
          ${hasBetThisRound ? "Bet placed — wait for takeoff" : `Place Bet — $${selectedAmount}`}
        </button>
      </div>`;
  }

  function renderCashoutPanel() {
    const potential = (selectedAmount * engine.multiplier).toFixed(2);
    return `
      <div class="mb-3 relative z-10">
        <button id="cashout-btn" class="w-full ${hasBetThisRound && !cashedOutAt ? "bg-emerald-500 text-black emerald-glow" : "glass text-gray-500"} text-sm font-bold py-3 rounded-xl" ${hasBetThisRound && !cashedOutAt ? "" : "disabled"}>
          ${cashedOutAt ? `Cashed out at ${cashedOutAt.toFixed(2)}x` : hasBetThisRound ? `Cash Out — $${potential}` : "No active bet"}
        </button>
      </div>`;
  }

  function renderResult(eng) {
    const won = cashedOutAt !== null;
    return `
      <div class="text-center py-3 relative z-10">
        <p class="text-xs text-gray-400">Flew away at</p>
        <p class="text-lg font-black text-red-400">${eng.crashPoint.toFixed(2)}x</p>
        ${hasBetThisRound ? `<p class="text-xs mt-1 ${won ? "emerald-text" : "text-red-400"}">${won ? `Won at ${cashedOutAt.toFixed(2)}x!` : "Bet lost"}</p>` : ""}
      </div>`;
  }

  function statusLabel(phase) {
    return { betting: "Place your bets!", flying: "Flying...", crashed: "Crashed!" }[phase] || phase;
  }
  function statusColor(phase) {
    return { betting: "emerald-text", flying: "gold-text", crashed: "text-red-400" }[phase] || "text-gray-400";
  }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachBettingHandlers(container) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        renderUI(container, engine.session, engine);
      });
    });

    const betBtn = container.querySelector("#place-bet-btn");
    if (betBtn && !hasBetThisRound) {
      betBtn.addEventListener("click", async () => {
        if (localMode) {
          hasBetThisRound = true;
          engine.sfx.chipPlace();
          window.showToast(`Bet placed: $${selectedAmount}`, "#50C878");
          renderUI(container, engine.session, engine);
          return;
        }
        const { error } = await engine.placeBet("cashout", selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
        } else {
          hasBetThisRound = true;
          engine.sfx.chipPlace();
          window.showToast(`Bet placed: $${selectedAmount}`, "#50C878");
          renderUI(container, engine.session, engine);
        }
      });
    }
  }

  function attachCashoutHandler(container) {
    const btn = container.querySelector("#cashout-btn");
    if (!btn || !hasBetThisRound || cashedOutAt) return;

    btn.addEventListener("click", () => {
      if (localMode) {
        cashedOutAt = engine.multiplier;
        engine.sfx.win();
        window.showToast(`Cashed out at ${cashedOutAt.toFixed(2)}x!`, "#FFD700");
        renderUI(container, engine.session, engine);
        return;
      }
      // Live mode: flag pending cashout, resolved server-side via cashout RPC
      engine._pendingCashout = true;
      window.showToast("Cashout requested...", "#FFD700");
    });
  }

  // -------------------------------------------------------------
  // COUNTDOWN (betting phase countdown ring is drawn on canvas;
  // this just syncs the text label for live sessions)
  // -------------------------------------------------------------
  function startCountdown(container, session, eng) {
    if (countdownInterval) clearInterval(countdownInterval);
    const el = container.querySelector("#countdown");
    if (!el) return;

    if (localMode) {
      const tick = () => {
        if (eng.phase !== "betting") {
          el.textContent = "";
          return;
        }
        const remaining = Math.max(0, Math.ceil((eng.bettingDuration - (performance.now() - eng.phaseStart)) / 1000));
        el.textContent = `${remaining}s`;
      };
      tick();
      countdownInterval = setInterval(tick, 250);
      return;
    }

    if (!session.round_ends_at) return;
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
  window.CasinoGames.crash = { mount, cleanup };
})();
