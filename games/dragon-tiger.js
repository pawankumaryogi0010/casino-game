// =====================================================================
// DRAGON-TIGER.JS — Ultra-fast high-card comparison with neon bet zones
// Rules: one card each to Dragon and Tiger; higher card wins (A low, K high
// in this implementation — standard Dragon Tiger uses A=1...K=13).
// Tie pays 8x (or 11x in some variants); push on tie for Dragon/Tiger bets.
// =====================================================================

(function () {
  const ROOM_NAME = "dragon-tiger-room-1";
  const { newShuffledDeck, drawCard } = window.CardUtils;

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let selectedBet = "dragon"; // dragon | tiger | tie
  let countdownInterval = null;

  const PAYOUTS = { dragon: 1.95, tiger: 1.95, tie: 8 };

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class DragonTigerEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.deck = [];
      this.dragonCard = null;
      this.tigerCard = null;
      this.phase = "betting"; // betting | revealing | result
      this.result = null;
      this.revealStart = 0;
      this.pulsePhase = 0;
    }

    newRound() {
      this.deck = newShuffledDeck();
      this.dragonCard = this.deck.pop();
      this.tigerCard = this.deck.pop();
      this.phase = "revealing";
      this.revealStart = performance.now();
      this.sfx.cardFlip();

      // Dragon Tiger card order: A=1 (low) ... K=13 (high)
      const dVal = this.dragonCard.rank === "A" ? 1 : this.dragonCard.value === 14 ? 1 : this.dragonCard.value;
      const tVal = this.tigerCard.rank === "A" ? 1 : this.tigerCard.value === 14 ? 1 : this.tigerCard.value;

      if (dVal > tVal) this.result = "dragon";
      else if (tVal > dVal) this.result = "tiger";
      else this.result = "tie";
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      this.pulsePhase += dt * 4;

      if (this.phase === "revealing" && now - this.revealStart > 600) {
        this.phase = "result";
        this.result === selectedBet ? this.sfx.win() : this.sfx.lose();
        renderUI(uiContainer, this);
      }

      ctx.clearRect(0, 0, this.width, this.height);
      const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 10, this.width / 2, this.height / 2, this.width * 0.8);
      grad.addColorStop(0, "rgba(255,215,0,0.06)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.phase !== "betting") {
        this.drawCards(now);
      }
    }

    drawCards(now) {
      const ctx = this.ctx;
      const cardW = Math.min(56, this.width * 0.16);
      const cardH = cardW * 1.4;
      const y = this.height * 0.4;
      const elapsed = (now - this.revealStart) / 1000;
      const progress = Math.min(1, elapsed / 0.5);

      const faceDown = this.phase === "revealing" && progress < 0.5;

      // Dragon (left)
      const dx = this.width * 0.27 - cardW / 2;
      const dGlow = this.phase === "result" && (this.result === "dragon" || this.result === "tie") ? "#FFD700" : null;
      drawCard(ctx, this.dragonCard, dx, y, cardW, cardH, { faceDown, glow: dGlow });

      // Tiger (right)
      const tx = this.width * 0.73 - cardW / 2;
      const tGlow = this.phase === "result" && (this.result === "tiger" || this.result === "tie") ? "#50C878" : null;
      drawCard(ctx, this.tigerCard, tx, y, cardW, cardH, { faceDown, glow: tGlow });

      // Labels
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.phase === "result" && (this.result === "dragon") ? 8 + Math.sin(this.pulsePhase) * 4 : 0;
      ctx.fillText("DRAGON", this.width * 0.27, y - 12);

      ctx.fillStyle = "#50C878";
      ctx.shadowColor = "#50C878";
      ctx.shadowBlur = this.phase === "result" && (this.result === "tiger") ? 8 + Math.sin(this.pulsePhase) * 4 : 0;
      ctx.fillText("TIGER", this.width * 0.73, y - 12);
      ctx.shadowBlur = 0;

      // VS
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("VS", this.width / 2, y + cardH / 2);
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new DragonTigerEngine(canvas, { ...gameMeta, room });
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
          <span class="text-xs font-semibold ${phaseColor(eng.phase)}">${phaseLabel(eng.phase)}</span>
          <span class="text-xs font-bold gold-text">RTP ${eng.rtp.toFixed(1)}%</span>
        </div>

        <div class="min-h-[150px] pointer-events-none relative z-10"></div>

        ${eng.phase === "result" ? renderResult(eng) : ""}
        ${eng.phase !== "revealing" ? renderBettingPanel(eng) : ""}
      </div>`;

    if (eng.phase !== "revealing") attachHandlers(container, eng);
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
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "dragon" ? "gold-grad text-black gold-glow" : "gold-text"}" data-bet="dragon" style="border:1px solid #FFD70040">Dragon<br><span class="text-[10px] opacity-70">${PAYOUTS.dragon}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "tie" ? "bg-gray-300 text-black" : "text-gray-300"}" data-bet="tie" style="border:1px solid #9ca3af40">Tie<br><span class="text-[10px] opacity-70">${PAYOUTS.tie}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "tiger" ? "bg-emerald-500 text-black emerald-glow" : "emerald-text"}" data-bet="tiger" style="border:1px solid #50C87840">Tiger<br><span class="text-[10px] opacity-70">${PAYOUTS.tiger}x</span></button>
        </div>
        <button id="deal-btn" class="w-full gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">Deal — $${selectedAmount} on ${capitalize(selectedBet)}</button>
      </div>`;
  }

  function renderResult(eng) {
    const won = eng.result === selectedBet;
    const payout = won ? selectedAmount * PAYOUTS[eng.result] : 0;
    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-xs text-gray-400">Winner</p>
        <p class="text-lg font-black gold-text">${capitalize(eng.result)}</p>
        <p class="text-xs mt-1 ${won ? "emerald-text" : "text-red-400"}">${won ? `+$${payout.toFixed(2)}` : `-$${selectedAmount.toFixed(2)}`}</p>
      </div>`;
  }

  function phaseLabel(phase) {
    return { betting: "Place your bet", revealing: "Revealing...", result: "Round complete" }[phase] || phase;
  }
  function phaseColor(phase) {
    return { betting: "emerald-text", revealing: "gold-text", result: "text-gray-400" }[phase] || "text-gray-400";
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
        engine.sfx.chipPlace();
        renderUI(container, eng);
      });
    });

    container.querySelector("#deal-btn")?.addEventListener("click", async () => {
      if (eng.session) {
        const { error } = await eng.placeBet(selectedBet, selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      eng.newRound();
      renderUI(uiContainer, eng);
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.dragonTiger = { mount, cleanup };
})();
