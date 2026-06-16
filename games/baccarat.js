// =====================================================================
// BACCARAT.JS — Punto Banco with automatic third-card drawing rules
// Standard baccarat tableau rules:
//   - Natural 8/9 (two-card total) ends the round immediately, no draws.
//   - Player draws third card if total 0-5; stands on 6-7.
//   - Banker's third-card draw depends on Player's third card (full table below).
// =====================================================================

(function () {
  const ROOM_NAME = "baccarat-room-1";
  const { baccaratValue, newShuffledDeck, drawCard } = window.CardUtils;

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let selectedBet = "player"; // player | banker | tie
  let countdownInterval = null;

  const PAYOUTS = { player: 2, banker: 1.95, tie: 8 };

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class BaccaratEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.deck = [];
      this.player = [];
      this.banker = [];
      this.phase = "betting"; // betting | dealing | result
      this.dealQueue = [];
      this.lastDealTime = 0;
      this.result = null;
    }

    draw() {
      if (this.deck.length === 0) this.deck = newShuffledDeck();
      return this.deck.pop();
    }

    newRound() {
      this.deck = newShuffledDeck();
      this.player = [];
      this.banker = [];
      this.result = null;
      this.phase = "dealing";

      // Initial 2 cards each
      this.dealQueue = [
        { side: "player", card: this.draw() },
        { side: "banker", card: this.draw() },
        { side: "player", card: this.draw() },
        { side: "banker", card: this.draw() }
      ];

      // Pre-resolve third-card logic now (queue extends as needed once dealt)
      this.lastDealTime = performance.now();
      renderUI(uiContainer, this);
    }

    // Called after the initial 4 cards finish animating
    applyThirdCardRules() {
      const pVal = baccaratValue(this.player);
      const bVal = baccaratValue(this.banker);
      const playerNatural = pVal >= 8;
      const bankerNatural = bVal >= 8;

      if (playerNatural || bankerNatural) {
        this.finishRound();
        return;
      }

      let playerThirdCard = null;

      // Player draws on 0-5
      if (pVal <= 5) {
        playerThirdCard = this.draw();
        this.dealQueue.push({ side: "player", card: playerThirdCard });
      }

      // Banker draw rules depend on whether player drew and the value of that card
      let bankerDraws = false;
      if (playerThirdCard === null) {
        // Player stood (6 or 7) -> banker draws on 0-5
        bankerDraws = bVal <= 5;
      } else {
        const p3 = playerThirdCard.value > 10 ? 0 : (playerThirdCard.rank === "A" ? 1 : (["10","J","Q","K"].includes(playerThirdCard.rank) ? 0 : Number(playerThirdCard.rank)));
        if (bVal <= 2) bankerDraws = true;
        else if (bVal === 3) bankerDraws = p3 !== 8;
        else if (bVal === 4) bankerDraws = p3 >= 2 && p3 <= 7;
        else if (bVal === 5) bankerDraws = p3 >= 4 && p3 <= 7;
        else if (bVal === 6) bankerDraws = p3 === 6 || p3 === 7;
        else bankerDraws = false; // 7 stands
      }

      if (bankerDraws) {
        this.dealQueue.push({ side: "banker", card: this.draw() });
      }

      if (this.dealQueue.length === 0) {
        this.finishRound();
      }
    }

    finishRound() {
      const pVal = baccaratValue(this.player);
      const bVal = baccaratValue(this.banker);
      if (pVal > bVal) this.result = "player";
      else if (bVal > pVal) this.result = "banker";
      else this.result = "tie";

      this.phase = "result";
      this.result === selectedBet ? this.sfx.win() : this.sfx.lose();
      renderUI(uiContainer, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      if (this.phase === "dealing" && this.dealQueue.length > 0) {
        if (now - this.lastDealTime > 400) {
          const next = this.dealQueue.shift();
          if (next.side === "player") this.player.push(next.card);
          else this.banker.push(next.card);
          this.sfx.cardFlip();
          this.lastDealTime = now;
          renderUI(uiContainer, this);

          // After initial 4 cards dealt, apply third-card rules
          if (this.player.length === 2 && this.banker.length === 2 && this.dealQueue.length === 0) {
            setTimeout(() => this.applyThirdCardRules(), 100);
          } else if (this.dealQueue.length === 0 && (this.player.length > 2 || this.banker.length > 2)) {
            setTimeout(() => this.finishRound(), 400);
          }
        }
      }

      ctx.clearRect(0, 0, this.width, this.height);
      const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 10, this.width / 2, this.height / 2, this.width * 0.8);
      grad.addColorStop(0, "rgba(80,200,120,0.07)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.phase !== "betting") {
        this.drawHand(this.player, this.width * 0.27, "PLAYER", "#FFD700");
        this.drawHand(this.banker, this.width * 0.73, "BANKER", "#50C878");
      }
    }

    drawHand(cards, centerX, label, color) {
      const ctx = this.ctx;
      const cardW = Math.min(40, this.width * 0.11);
      const cardH = cardW * 1.4;
      const gap = 6;
      const totalW = cards.length * cardW + (cards.length - 1) * gap;
      const startX = centerX - totalW / 2;
      const y = this.height * 0.35;

      cards.forEach((card, i) => {
        const glow = this.phase === "result" && isWinner(this.result, label) ? "#FFD700" : null;
        drawCard(ctx, card, startX + i * (cardW + gap), y, cardW, cardH, { glow });
      });

      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(label, centerX, y - 8);

      if (cards.length > 0) {
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(baccaratValue(cards), centerX, y + cardH + 18);
      }
    }
  }

  function isWinner(result, label) {
    return (result === "player" && label === "PLAYER") || (result === "banker" && label === "BANKER") || result === "tie";
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new BaccaratEngine(canvas, { ...gameMeta, room });
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

        <div class="min-h-[160px] pointer-events-none relative z-10"></div>

        ${eng.phase === "result" ? renderResult(eng) : ""}
        ${eng.phase !== "dealing" ? renderBettingPanel(eng) : ""}
      </div>`;

    if (eng.phase !== "dealing") attachHandlers(container, eng);
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
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "player" ? "gold-grad text-black" : "gold-text"}" data-bet="player" style="border:1px solid #FFD70040">Player<br><span class="text-[10px] opacity-70">${PAYOUTS.player}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "tie" ? "bg-gray-300 text-black" : "text-gray-300"}" data-bet="tie" style="border:1px solid #9ca3af40">Tie<br><span class="text-[10px] opacity-70">${PAYOUTS.tie}x</span></button>
          <button class="bet-cell glass rounded-xl py-3 text-xs font-bold ${selectedBet === "banker" ? "bg-emerald-500 text-black" : "emerald-text"}" data-bet="banker" style="border:1px solid #50C87840">Banker<br><span class="text-[10px] opacity-70">${PAYOUTS.banker}x</span></button>
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
    return { betting: "Place your bet", dealing: "Dealing...", result: "Round complete" }[phase] || phase;
  }
  function phaseColor(phase) {
    return { betting: "emerald-text", dealing: "gold-text", result: "text-gray-400" }[phase] || "text-gray-400";
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
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.baccarat = { mount, cleanup };
})();
