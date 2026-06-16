// =====================================================================
// ANDAR-BAHAR.JS — Automated dealer routine with sequential card dealing
// Deals a Joker card, then alternately deals cards into Andar/Bahar piles
// until a card matching the Joker's rank appears -> that side wins.
//
// game_state shape (server-authoritative when multiplayer):
//   { joker: {rank,suit}, andarPile: [...], baharPile: [...], result: 'andar'|'bahar' }
//
// This module runs a fully self-contained LOCAL demo round when no
// live game_state is present, animating the deal sequentially via canvas.
// =====================================================================

(function () {
  const ROOM_NAME = "andar-bahar-room-1";

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let countdownInterval = null;

  const choices = [
    { key: "andar", label: "Andar", color: "#FFD700", payout: 1.9 },
    { key: "bahar", label: "Bahar", color: "#50C878", payout: 2.0 }
  ];

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class AndarBaharEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.deck = [];
      this.joker = null;
      this.andarPile = [];
      this.baharPile = [];
      this.dealSequence = []; // [{side:'andar'|'bahar', card}]
      this.dealtCount = 0;
      this.lastDealTime = 0;
      this.dealIntervalMs = 450;
      this.phase = "idle"; // idle | joker-reveal | dealing | finished
      this.result = null;
      this.jokerRevealStart = 0;
    }

    // Build a full deal sequence locally: deal cards alternately starting
    // with Andar until a card.rank === joker.rank appears.
    startLocalRound() {
      this.deck = window.CardUtils.newShuffledDeck();
      this.joker = this.deck[0];
      this.andarPile = [];
      this.baharPile = [];
      this.dealSequence = [];
      this.dealtCount = 0;
      this.result = null;

      let i = 1;
      let side = "andar"; // Andar deals first traditionally
      while (i < this.deck.length) {
        const card = this.deck[i];
        this.dealSequence.push({ side, card });
        if (card.rank === this.joker.rank) {
          this.result = side;
          break;
        }
        side = side === "andar" ? "bahar" : "andar";
        i++;
      }

      this.phase = "joker-reveal";
      this.jokerRevealStart = performance.now();
      this.sfx.cardFlip();
    }

    onSessionUpdate(session) {
      const state = session.game_state || {};
      if (session.status === "betting") {
        this.phase = "idle";
        this.andarPile = [];
        this.baharPile = [];
        this.result = null;
        this.joker = null;
      }
      if ((session.status === "dealing" || session.status === "finished") && state.joker && this.phase === "idle") {
        this.joker = state.joker;
        this.andarPile = [];
        this.baharPile = [];
        this.dealSequence = [];
        const a = state.andarPile || [];
        const b = state.baharPile || [];
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
          if (a[i]) this.dealSequence.push({ side: "andar", card: a[i] });
          if (b[i]) this.dealSequence.push({ side: "bahar", card: b[i] });
        }
        this.result = state.result || null;
        this.dealtCount = 0;
        this.phase = "joker-reveal";
        this.jokerRevealStart = performance.now();
        this.sfx.cardFlip();
      }
      renderUI(uiContainer, session, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      ctx.clearRect(0, 0, this.width, this.height);

      const grad = ctx.createRadialGradient(this.width / 2, this.height * 0.25, 10, this.width / 2, this.height * 0.25, this.width * 0.7);
      grad.addColorStop(0, "rgba(255,215,0,0.08)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.phase === "joker-reveal") {
        const elapsed = now - this.jokerRevealStart;
        this.drawJoker(elapsed / 400);
        if (elapsed > 500 && this.dealSequence.length > 0) {
          this.phase = "dealing";
          this.lastDealTime = now;
        } else if (elapsed > 500) {
          this.phase = "finished";
        }
      } else {
        this.drawJoker(1);
      }

      if (this.phase === "dealing") {
        if (now - this.lastDealTime > this.dealIntervalMs) {
          const next = this.dealSequence[this.dealtCount];
          if (next) {
            if (next.side === "andar") this.andarPile.push(next.card);
            else this.baharPile.push(next.card);
            this.dealtCount++;
            this.lastDealTime = now;
            this.sfx.cardFlip();

            if (next.card.rank === this.joker?.rank || this.dealtCount >= this.dealSequence.length) {
              this.phase = "finished";
              this.result = this.result || next.side;
              setTimeout(() => { this.result === "andar" || this.result === "bahar" ? this.sfx.win() : null; }, 200);
              renderUI(uiContainer, this.session, this);
            }
          }
        }
        this.drawPiles();
      } else {
        this.drawPiles();
      }
    }

    drawJoker(progress) {
      const ctx = this.ctx;
      const cardW = Math.min(50, this.width * 0.14);
      const cardH = cardW * 1.4;
      const x = this.width / 2 - cardW / 2;
      const y = this.height * 0.08;
      const scale = 0.5 + 0.5 * Math.min(1, progress);

      ctx.save();
      ctx.translate(x + cardW / 2, y + cardH / 2);
      ctx.scale(scale, scale);
      ctx.translate(-cardW / 2, -cardH / 2);
      if (this.joker) {
        window.CardUtils.drawCard(ctx, this.joker, 0, 0, cardW, cardH, { glow: "#FFD700" });
      } else {
        window.CardUtils.drawCard(ctx, {}, 0, 0, cardW, cardH, { faceDown: true });
      }
      ctx.restore();

      ctx.save();
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("JOKER", this.width / 2, y - 6);
      ctx.restore();
    }

    drawPiles() {
      const ctx = this.ctx;
      const cardW = Math.min(30, this.width * 0.08);
      const cardH = cardW * 1.4;
      const gap = 4;
      const topY = this.height * 0.35;

      const drawPile = (pile, startX, label, glow) => {
        ctx.save();
        ctx.font = "9px sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(label, startX, topY - 6);
        ctx.restore();

        pile.forEach((card, i) => {
          const col = i % 6;
          const row = Math.floor(i / 6);
          const x = startX + col * (cardW * 0.6);
          const y = topY + row * (cardH * 0.4);
          const isWinningCard = this.phase === "finished" && i === pile.length - 1 && card.rank === this.joker?.rank;
          window.CardUtils.drawCard(ctx, card, x, y, cardW, cardH, {
            glow: isWinningCard ? "#FFD700" : null
          });
        });
      };

      drawPile(this.andarPile, this.width * 0.06, "ANDAR", null);
      drawPile(this.baharPile, this.width * 0.54, "BAHAR", null);
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new AndarBaharEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    if (!engine.session) {
      container.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Room not found.</p>`;
      return;
    }

    if (!engine.session.game_state?.joker) {
      engine.startLocalRound();
    }

    renderUI(container, engine.session, engine);
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

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${statusColor(status, eng)}">${statusLabel(status, eng)}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <div class="min-h-[180px] pointer-events-none relative z-10"></div>

        ${status === "betting" ? renderBettingPanel() : ""}
        ${eng.phase === "finished" ? renderResult(eng) : ""}

        <button id="new-round-btn" class="w-full mt-2 glass text-xs font-bold py-2 rounded-xl text-gray-400 relative z-10">
          ↻ Deal New Round (Demo)
        </button>
      </div>`;

    if (status === "betting") attachBettingHandlers(container);
    startCountdown(container, session);

    container.querySelector("#new-round-btn")?.addEventListener("click", () => {
      eng.startLocalRound();
    });
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
        <div class="grid grid-cols-2 gap-2">
          ${choices.map((c) => `
            <button class="choice-btn glass rounded-xl py-3 text-sm font-bold" data-choice="${c.key}" style="border:1px solid ${c.color}40; color:${c.color}">
              ${c.label}<br><span class="text-[10px] text-gray-400">${c.payout}x</span>
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  function renderResult(eng) {
    const winner = choices.find((c) => c.key === eng.result);
    return `
      <div class="text-center py-3 relative z-10">
        <p class="text-xs text-gray-400">Winning Side</p>
        <p class="text-lg font-black gold-text">${winner ? winner.label : eng.result}</p>
        <p class="text-[10px] text-gray-500 mt-1">Joker: ${eng.joker?.rank}${window.CardUtils.SUIT_SYMBOLS[eng.joker?.suit] || ""} · ${eng.andarPile.length + eng.baharPile.length} cards dealt</p>
      </div>`;
  }

  function statusLabel(status, eng) {
    if (eng.phase === "joker-reveal") return "Revealing Joker...";
    if (eng.phase === "dealing") return "Dealing cards...";
    if (eng.phase === "finished" && status !== "finished") return "Round complete (demo)";
    return { waiting: "Waiting for next round...", betting: "Place your bets!", dealing: "Dealing cards...", finished: "Round complete" }[status] || status;
  }
  function statusColor(status, eng) {
    if (eng.phase === "dealing" || eng.phase === "joker-reveal") return "gold-text";
    return { waiting: "text-gray-400", betting: "emerald-text", dealing: "gold-text", finished: "text-gray-400" }[status] || "text-gray-400";
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

    container.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const choice = btn.dataset.choice;
        const { error } = await engine.placeBet(choice, selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
        } else {
          engine.sfx.chipPlace();
          window.showToast(`Bet placed: $${selectedAmount} on ${choice}`, "#50C878");
        }
      });
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
  window.CasinoGames.andarBahar = { mount, cleanup };
})();
