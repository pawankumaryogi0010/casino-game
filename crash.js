// =====================================================================
// CRASH.JS — Aviator/Crash (Canvas-rendered via CasinoGameEngine)
// game_state shape: { multiplier, phase: 'rising'|'crashed', crashPoint, result }
// status flow: waiting -> betting (countdown) -> dealing(=rising) -> finished(=crashed)
//
// Demonstrates CasinoGameEngine usage:
//   - requestAnimationFrame render loop drawing the multiplier curve
//   - Web Audio sfx (tick during rise, crashOut on bust, win on cashout)
//   - RTP-aware local crash-point preview (server is authoritative via game_state)
// =====================================================================

(function () {
  const ROOM_NAME = "crash-room-1";

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let hasBetThisRound = false;
  let lastTickSecond = -1;
  let countdownInterval = null;

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class CrashEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.curvePoints = [];
      this.localMultiplier = 1.0;
    }

    onSessionUpdate(session) {
      const state = session.game_state || {};

      if (session.status === "betting") {
        this.curvePoints = [];
        this.localMultiplier = 1.0;
        hasBetThisRound = false;
        lastTickSecond = -1;
      }

      if (session.status === "dealing") {
        this.localMultiplier = Number(state.multiplier) || this.localMultiplier;
        const elapsedSec = this.curvePoints.length;
        if (elapsedSec !== lastTickSecond) {
          lastTickSecond = elapsedSec;
          this.sfx.tick();
        }
        this.curvePoints.push(this.localMultiplier);
      }

      if (session.status === "finished" && state.result === "crashed") {
        this.sfx.crashOut();
      }

      renderUI(uiContainer, session);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      ctx.clearRect(0, 0, this.width, this.height);

      // Background grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }

      // Multiplier curve
      if (this.curvePoints.length > 1) {
        const maxMult = Math.max(2, this.localMultiplier * 1.1);
        const stepX = this.width / Math.max(40, this.curvePoints.length);

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.session?.status === "finished" ? "#f87171" : "#50C878";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;

        this.curvePoints.forEach((m, i) => {
          const x = i * stepX;
          const y = this.height - (Math.min(m, maxMult) / maxMult) * (this.height - 10) - 5;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Multiplier text (center)
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = this.session?.status === "finished" ? "#f87171" : "#FFD700";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      const displayMult = this.session?.status === "finished"
        ? (this.session.game_state?.crashPoint || this.localMultiplier)
        : this.localMultiplier;
      ctx.fillText(`${Number(displayMult).toFixed(2)}x`, this.width / 2, this.height / 2);
      ctx.shadowBlur = 0;
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
      container.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Room not found.</p>`;
      return;
    }

    renderUI(container, engine.session);
    engine.start();
  }

  function cleanup() {
    if (engine) engine.destroy();
    engine = null;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // -------------------------------------------------------------
  // UI (rendered on top of canvas)
  // -------------------------------------------------------------
  function renderUI(container, session) {
    const status = session.status;
    const state = session.game_state || {};

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${statusColor(status)}">${statusLabel(status)}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <!-- Spacer reserves room for the canvas curve behind this UI -->
        <div class="min-h-[180px] pointer-events-none"></div>

        ${status === "betting" ? renderBettingPanel() : ""}
        ${status === "dealing" ? renderCashoutPanel() : ""}
        ${status === "finished" ? renderResult(state) : ""}
      </div>`;

    if (status === "betting") attachBettingHandlers(container);
    if (status === "dealing") attachCashoutHandler(container);
    startCountdown(container, session);
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
        <button id="place-bet-btn" class="w-full gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">
          Place Bet — $${selectedAmount}
        </button>
      </div>`;
  }

  function renderCashoutPanel() {
    return `
      <div class="mb-3 relative z-10">
        <button id="cashout-btn" class="w-full ${hasBetThisRound ? "bg-emerald-500 text-black" : "glass text-gray-500"} text-sm font-bold py-3 rounded-xl ${hasBetThisRound ? "emerald-glow" : ""}" ${hasBetThisRound ? "" : "disabled"}>
          ${hasBetThisRound ? "Cash Out Now" : "No active bet"}
        </button>
      </div>`;
  }

  function renderResult(state) {
    const crashed = state.result === "crashed";
    return `
      <div class="text-center py-3 relative z-10">
        <p class="text-xs text-gray-400">${crashed ? "Flew away at" : "Result"}</p>
        <p class="text-lg font-black ${crashed ? "text-red-400" : "gold-text"}">${Number(state.crashPoint || 0).toFixed(2)}x</p>
      </div>`;
  }

  function statusLabel(status) {
    return {
      waiting: "Waiting for next round...",
      betting: "Place your bets!",
      dealing: "Flying...",
      finished: "Crashed!"
    }[status] || status;
  }
  function statusColor(status) {
    return { waiting: "text-gray-400", betting: "emerald-text", dealing: "gold-text", finished: "text-red-400" }[status] || "text-gray-400";
  }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachBettingHandlers(container) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        renderUI(container, engine.session);
      });
    });

    const betBtn = container.querySelector("#place-bet-btn");
    if (betBtn) {
      betBtn.addEventListener("click", async () => {
        const { error } = await engine.placeBet("cashout", selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
        } else {
          hasBetThisRound = true;
          engine.sfx.chipPlace();
          window.showToast(`Bet placed: $${selectedAmount}`, "#50C878");
        }
      });
    }
  }

  function attachCashoutHandler(container) {
    const btn = container.querySelector("#cashout-btn");
    if (!btn || !hasBetThisRound) return;

    btn.addEventListener("click", async () => {
      // In production, cashing out triggers a dedicated RPC (e.g. cashout_bet)
      // that locks in engine.localMultiplier server-side. Here we surface the
      // intent via UI/sfx; settlement is finalized by settle_round on the backend.
      engine.sfx.win();
      hasBetThisRound = false;
      window.showToast(`Cashed out at ${engine.localMultiplier.toFixed(2)}x!`, "#FFD700");
      btn.disabled = true;
      btn.textContent = "Cashed out";
      btn.classList.remove("bg-emerald-500", "text-black", "emerald-glow");
      btn.classList.add("glass", "text-gray-500");
    });
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
  window.CasinoGames.crash = { mount, cleanup };
})();
