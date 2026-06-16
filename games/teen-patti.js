// =====================================================================
// TEEN-PATTI.JS — Full canvas card dealing + auto-ranking + betting loop
// game_state shape (server-authoritative when multiplayer):
//   { handA: [...3 cards], handB: [...3 cards], result: 'player-a'|'player-b'|'tie' }
//
// This module also runs a fully self-contained LOCAL demo round
// (deck shuffle, deal animation, ranking via CardUtils) so the game
// is playable/visually complete even before the server dealer exists.
// Realtime session state (when present) overrides local animation targets.
// =====================================================================

(function () {
  const ROOM_NAME = "teen-patti-room-1";
  const { RANK_VALUES } = window.CardUtils || {};

  let engine = null;
  let uiContainer = null;
  let selectedAmount = 25;
  let countdownInterval = null;

  const choices = [
    { key: "player-a", label: "Player A", color: "#FFD700", payout: 1.95 },
    { key: "player-b", label: "Player B", color: "#50C878", payout: 1.95 },
    { key: "tie", label: "Tie", color: "#9ca3af", payout: 8 }
  ];

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class TeenPattiEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.deck = window.CardUtils.newShuffledDeck();
      this.handA = [];
      this.handB = [];
      this.dealQueue = []; // [{hand:'A'|'B', card, delay}]
      this.dealStartTime = 0;
      this.result = null;
      this.phase = "idle"; // idle | dealing | revealed
      this.cardAnims = []; // per-card animation progress
    }

    // Kick off a local deal animation (used when no live session state present)
    startLocalRound() {
      this.deck = window.CardUtils.newShuffledDeck();
      this.handA = [this.deck[0], this.deck[2], this.deck[4]];
      this.handB = [this.deck[1], this.deck[3], this.deck[5]];
      this.result = window.CardUtils.compareTeenPattiHands(this.handA, this.handB);

      this.dealQueue = [];
      for (let i = 0; i < 3; i++) {
        this.dealQueue.push({ hand: "A", index: i, card: this.handA[i], delay: i * 2 * 0.18 });
        this.dealQueue.push({ hand: "B", index: i, card: this.handB[i], delay: (i * 2 + 1) * 0.18 });
      }
      this.phase = "dealing";
      this.dealStartTime = performance.now();
    }

    onSessionUpdate(session) {
      const state = session.game_state || {};
      if (session.status === "betting") {
        this.phase = "idle";
        this.handA = [];
        this.handB = [];
        this.result = null;
      }
      if (session.status === "dealing" || session.status === "finished") {
        if (state.handA && state.handB && this.phase !== "dealing" && this.phase !== "revealed") {
          this.handA = state.handA;
          this.handB = state.handB;
          this.result = state.result || window.CardUtils.compareTeenPattiHands(this.handA, this.handB);
          this.dealQueue = [];
          for (let i = 0; i < 3; i++) {
            this.dealQueue.push({ hand: "A", index: i, card: this.handA[i], delay: i * 2 * 0.18 });
            this.dealQueue.push({ hand: "B", index: i, card: this.handB[i], delay: (i * 2 + 1) * 0.18 });
          }
          this.phase = "dealing";
          this.dealStartTime = performance.now();
          this.sfx.cardFlip();
        }
        if (session.status === "finished" && this.phase === "dealing") {
          // Will flip to 'revealed' once animation completes (in onTick)
        }
      }
      renderUI(uiContainer, session, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      ctx.clearRect(0, 0, this.width, this.height);

      // Felt background
      const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 10, this.width / 2, this.height / 2, this.width * 0.8);
      grad.addColorStop(0, "rgba(80,200,120,0.08)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.phase === "dealing" || this.phase === "revealed") {
        this.drawHands(now);
      }

      // Check if dealing animation finished -> reveal
      if (this.phase === "dealing") {
        const elapsed = (now - this.dealStartTime) / 1000;
        const totalDuration = this.dealQueue.length > 0
          ? Math.max(...this.dealQueue.map((d) => d.delay)) + 0.4
          : 0;
        if (elapsed > totalDuration) {
          this.phase = "revealed";
          if (this.result) {
            this.result === "tie" ? this.sfx.spin() : this.sfx.win();
          }
        }
      }
    }

    drawHands(now) {
      const ctx = this.ctx;
      const cardW = Math.min(46, this.width * 0.12);
      const cardH = cardW * 1.4;
      const gap = 8;
      const elapsed = (now - this.dealStartTime) / 1000;

      const drawHand = (hand, centerX, faceUp) => {
        const totalW = hand.length * cardW + (hand.length - 1) * gap;
        const startX = centerX - totalW / 2;

        hand.forEach((card, i) => {
          const item = this.dealQueue.find((d) => d.hand === (centerX < this.width / 2 ? "A" : "B") && d.index === i);
          const delay = item ? item.delay : i * 0.15;
          const progress = this.phase === "revealed" ? 1 : Math.max(0, Math.min(1, (elapsed - delay) / 0.35));
          if (progress <= 0) return;

          const x = startX + i * (cardW + gap);
          const yOffset = (1 - easeOutBack(progress)) * -40;
          const y = this.height * 0.5 - cardH / 2 + yOffset;
          const rotation = (1 - progress) * (i - 1) * 0.3;
          const reveal = faceUp || this.phase === "revealed";

          window.CardUtils.drawCard(ctx, card, x, y, cardW, cardH, {
            faceDown: !reveal,
            rotation,
            glow: this.phase === "revealed" && this.result && isWinningHand(this.result, centerX < this.width / 2) ? "#FFD700" : null
          });
        });
      };

      drawHand(this.handA, this.width * 0.27, false);
      drawHand(this.handB, this.width * 0.73, false);

      // VS badge
      ctx.save();
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 8;
      ctx.fillText("VS", this.width / 2, this.height * 0.5);
      ctx.restore();
    }
  }

  function isWinningHand(result, isLeftSide) {
    if (result === "tie") return true;
    return (result === "player-a" && isLeftSide) || (result === "player-b" && !isLeftSide);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new TeenPattiEngine(canvas, { ...gameMeta, room });
    await engine.connect();

    if (!engine.session) {
      container.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Room not found.</p>`;
      return;
    }

    // If no live game_state cards yet, run a local demo round for visual completeness
    if (!engine.session.game_state?.handA) {
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
    const state = session.game_state || {};

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-semibold ${statusColor(status, eng)}">${statusLabel(status, eng)}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <div class="min-h-[180px] pointer-events-none flex items-end justify-between px-4 pb-1 relative z-10">
          <span class="text-[10px] gold-text font-bold">PLAYER A</span>
          <span class="text-[10px] emerald-text font-bold">PLAYER B</span>
        </div>

        ${status === "betting" ? renderBettingPanel() : ""}
        ${(status === "finished" || eng.phase === "revealed") ? renderResult(eng) : ""}

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
        <div class="grid grid-cols-3 gap-2">
          ${choices.map((c) => `
            <button class="choice-btn glass rounded-xl py-3 text-xs font-bold text-center" data-choice="${c.key}" style="border:1px solid ${c.color}40; color:${c.color}">
              ${c.label}<br><span class="text-[10px] text-gray-400">${c.payout}x</span>
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  function renderResult(eng) {
    const winner = choices.find((c) => c.key === eng.result);
    const rankA = window.CardUtils.rankTeenPattiHand(eng.handA);
    const rankB = window.CardUtils.rankTeenPattiHand(eng.handB);
    return `
      <div class="text-center py-3 relative z-10">
        <p class="text-xs text-gray-400">Winner</p>
        <p class="text-lg font-black gold-text">${winner ? winner.label : eng.result}</p>
        <div class="flex justify-between text-[10px] text-gray-400 mt-2 px-4">
          <span>${rankA.name}</span>
          <span>${rankB.name}</span>
        </div>
      </div>`;
  }

  function statusLabel(status, eng) {
    if (eng.phase === "dealing") return "Dealing cards...";
    if (eng.phase === "revealed" && status !== "finished") return "Round complete (demo)";
    return { waiting: "Waiting for next round...", betting: "Place your bets!", dealing: "Dealing cards...", finished: "Round complete" }[status] || status;
  }
  function statusColor(status, eng) {
    if (eng.phase === "dealing") return "gold-text";
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
          window.showToast(`Bet placed: $${selectedAmount} on ${choice.replace("-", " ")}`, "#50C878");
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
  window.CasinoGames.teenPatti = { mount, cleanup };
})();
