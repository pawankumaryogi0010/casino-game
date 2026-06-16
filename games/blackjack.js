// =====================================================================
// BLACKJACK.JS — Hit/Stand/Split, Dealer AI (hits below 17), canvas hands
// LOCAL DEMO: full single-player round runs entirely client-side using
// CardUtils.blackjackValue(). Multiplayer game_sessions sync is supported
// for shared dealer card reveals when present.
// =====================================================================

(function () {
  const ROOM_NAME = "blackjack-room-1";
  const { blackjackValue, newShuffledDeck, drawCard } = window.CardUtils;

  let engine = null;
  let uiContainer = null;
  let betAmount = 25;
  let countdownInterval = null;

  // -------------------------------------------------------------
  // ENGINE SUBCLASS
  // -------------------------------------------------------------
  class BlackjackEngine extends CasinoGameEngine {
    constructor(canvas, gameMeta) {
      super(canvas, gameMeta);
      this.deck = [];
      this.hands = []; // array of {cards:[], status:'active'|'stand'|'bust'|'blackjack', bet}
      this.activeHandIndex = 0;
      this.dealer = [];
      this.dealerHidden = true;
      this.phase = "betting"; // betting | player | dealer | result
      this.dealerPlayQueue = [];
      this.lastDealerStep = 0;
    }

    newRound(bet) {
      this.deck = newShuffledDeck();
      this.hands = [{ cards: [this.draw(), this.draw()], status: "active", bet, doubled: false }];
      this.dealer = [this.draw(), this.draw()];
      this.dealerHidden = true;
      this.activeHandIndex = 0;
      this.phase = "player";
      this.dealerPlayQueue = [];

      // Auto-resolve blackjack
      if (blackjackValue(this.hands[0].cards) === 21) {
        this.hands[0].status = "blackjack";
        this.finishPlayerTurn();
      }
      renderUI(uiContainer, this);
      this.sfx.cardFlip();
    }

    draw() {
      if (this.deck.length === 0) this.deck = newShuffledDeck();
      return this.deck.pop();
    }

    hit() {
      const hand = this.hands[this.activeHandIndex];
      hand.cards.push(this.draw());
      this.sfx.cardFlip();
      const val = blackjackValue(hand.cards);
      if (val > 21) {
        hand.status = "bust";
        this.sfx.lose();
        this.nextHandOrDealer();
      } else if (val === 21) {
        hand.status = "stand";
        this.nextHandOrDealer();
      }
      renderUI(uiContainer, this);
    }

    stand() {
      this.hands[this.activeHandIndex].status = "stand";
      this.nextHandOrDealer();
      renderUI(uiContainer, this);
    }

    double() {
      const hand = this.hands[this.activeHandIndex];
      if (hand.cards.length !== 2) return;
      hand.bet *= 2;
      hand.doubled = true;
      hand.cards.push(this.draw());
      this.sfx.cardFlip();
      hand.status = blackjackValue(hand.cards) > 21 ? "bust" : "stand";
      this.nextHandOrDealer();
      renderUI(uiContainer, this);
    }

    split() {
      const hand = this.hands[this.activeHandIndex];
      if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank) return;
      const newHand = { cards: [hand.cards.pop(), this.draw()], status: "active", bet: hand.bet, doubled: false };
      hand.cards.push(this.draw());
      this.hands.splice(this.activeHandIndex + 1, 0, newHand);
      this.sfx.cardFlip();
      renderUI(uiContainer, this);
    }

    nextHandOrDealer() {
      if (this.activeHandIndex < this.hands.length - 1) {
        this.activeHandIndex++;
        if (this.hands[this.activeHandIndex].status !== "active" && blackjackValue(this.hands[this.activeHandIndex].cards) === 21) {
          this.hands[this.activeHandIndex].status = "blackjack";
        }
      } else {
        this.finishPlayerTurn();
      }
    }

    finishPlayerTurn() {
      // If all hands busted/blackjack with no need for dealer play vs a non-busted hand,
      // dealer still reveals (standard rules), unless ALL hands busted.
      this.phase = "dealer";
      this.dealerHidden = false;
      this.lastDealerStep = performance.now();

      const allBust = this.hands.every((h) => h.status === "bust");
      if (allBust) {
        this.dealerPlayQueue = []; // no need to draw further
        setTimeout(() => this.resolveRound(), 600);
        return;
      }

      // Pre-compute dealer draw sequence: hit on soft/hard <17 (dealer stands on all 17s)
      const seq = [];
      let cards = [...this.dealer];
      while (blackjackValue(cards) < 17) {
        const card = this.draw();
        cards.push(card);
        seq.push(card);
      }
      this.dealerPlayQueue = seq;
    }

    resolveRound() {
      this.phase = "result";
      const dealerVal = blackjackValue(this.dealer);
      const dealerBust = dealerVal > 21;

      this.hands.forEach((hand) => {
        const val = blackjackValue(hand.cards);
        if (hand.status === "bust") {
          hand.outcome = "lose";
        } else if (hand.status === "blackjack" && !(dealerVal === 21 && this.dealer.length === 2)) {
          hand.outcome = "blackjack";
        } else if (dealerBust || val > dealerVal) {
          hand.outcome = "win";
        } else if (val === dealerVal) {
          hand.outcome = "push";
        } else {
          hand.outcome = "lose";
        }
      });

      const anyWin = this.hands.some((h) => h.outcome === "win" || h.outcome === "blackjack");
      anyWin ? this.sfx.win() : this.sfx.lose();
      renderUI(uiContainer, this);
    }

    onTick(dt, now) {
      const ctx = this.ctx;
      if (!ctx || !this.width) return;

      // Dealer draw animation pacing
      if (this.phase === "dealer" && this.dealerPlayQueue.length > 0) {
        if (now - this.lastDealerStep > 700) {
          const card = this.dealerPlayQueue.shift();
          this.dealer.push(card);
          this.sfx.cardFlip();
          this.lastDealerStep = now;
          renderUI(uiContainer, this);
          if (this.dealerPlayQueue.length === 0) {
            setTimeout(() => this.resolveRound(), 500);
          }
        }
      }

      ctx.clearRect(0, 0, this.width, this.height);
      const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 10, this.width / 2, this.height / 2, this.width * 0.8);
      grad.addColorStop(0, "rgba(255,215,0,0.06)");
      grad.addColorStop(1, "rgba(11,12,16,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      if (this.phase !== "betting") {
        this.drawDealer();
        this.drawHands();
      }
    }

    drawDealer() {
      const ctx = this.ctx;
      const cardW = Math.min(40, this.width * 0.11);
      const cardH = cardW * 1.4;
      const startX = this.width / 2 - (this.dealer.length * (cardW + 6)) / 2;
      const y = this.height * 0.06;

      this.dealer.forEach((card, i) => {
        const faceDown = this.dealerHidden && i === 1;
        drawCard(ctx, card, startX + i * (cardW + 6), y, cardW, cardH, { faceDown });
      });

      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      const visibleVal = this.dealerHidden ? blackjackValue([this.dealer[0]]) : blackjackValue(this.dealer);
      ctx.fillText(`Dealer: ${this.dealerHidden ? visibleVal + "+" : visibleVal}`, this.width / 2, y + cardH + 14);
    }

    drawHands() {
      const ctx = this.ctx;
      const cardW = Math.min(36, this.width * 0.1);
      const cardH = cardW * 1.4;
      const handCount = this.hands.length;
      const handSpacing = this.width / (handCount + 1);

      this.hands.forEach((hand, hi) => {
        const centerX = handSpacing * (hi + 1);
        const totalW = hand.cards.length * cardW + (hand.cards.length - 1) * 4;
        const startX = centerX - totalW / 2;
        const y = this.height * 0.52;

        const isActive = this.phase === "player" && hi === this.activeHandIndex;

        hand.cards.forEach((card, ci) => {
          drawCard(ctx, card, startX + ci * (cardW + 4), y, cardW, cardH, {
            glow: isActive ? "#FFD700" : hand.outcome === "win" || hand.outcome === "blackjack" ? "#50C878" : hand.outcome === "lose" ? "#f87171" : null
          });
        });

        ctx.font = "10px sans-serif";
        ctx.fillStyle = isActive ? "#FFD700" : "#9ca3af";
        ctx.textAlign = "center";
        const val = blackjackValue(hand.cards);
        let label = `${val}`;
        if (hand.status === "bust") label += " BUST";
        if (hand.status === "blackjack") label += " BJ!";
        if (hand.outcome) label = `${val} — ${hand.outcome.toUpperCase()}`;
        ctx.fillText(label, centerX, y + cardH + 14);
      });
    }
  }

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta, canvas) {
    uiContainer = container;
    const room = gameMeta?.room || ROOM_NAME;

    engine = new BlackjackEngine(canvas, { ...gameMeta, room });
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

        <div class="min-h-[200px] pointer-events-none relative z-10"></div>

        ${eng.phase === "betting" ? renderBettingPanel() : ""}
        ${eng.phase === "player" ? renderActionPanel(eng) : ""}
        ${eng.phase === "result" ? renderResultPanel(eng) : ""}
      </div>`;

    if (eng.phase === "betting") attachBettingHandlers(container);
    if (eng.phase === "player") attachActionHandlers(container);
    if (eng.phase === "result") attachResultHandlers(container);
  }

  function renderBettingPanel() {
    const chips = [10, 25, 50, 100, 500];
    return `
      <div class="mb-3 relative z-10">
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Bet Amount</p>
        <div class="flex gap-1.5 mb-3 overflow-x-auto scrollbar-x">
          ${chips.map((c) => `
            <button class="chip-btn glass rounded-full px-3 py-1.5 text-xs font-bold ${c === betAmount ? "gold-grad text-black" : "gold-text"}" data-amount="${c}">$${c}</button>
          `).join("")}
        </div>
        <button id="deal-btn" class="w-full gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">Deal — $${betAmount}</button>
      </div>`;
  }

  function renderActionPanel(eng) {
    const hand = eng.hands[eng.activeHandIndex];
    const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && eng.hands.length < 4;
    const canDouble = hand.cards.length === 2;

    return `
      <div class="grid grid-cols-2 gap-2 mb-2 relative z-10">
        <button id="hit-btn" class="glass rounded-xl py-3 text-sm font-bold gold-text" style="border:1px solid #FFD70040">Hit</button>
        <button id="stand-btn" class="glass rounded-xl py-3 text-sm font-bold emerald-text" style="border:1px solid #50C87840">Stand</button>
      </div>
      <div class="grid grid-cols-2 gap-2 relative z-10">
        <button id="double-btn" class="glass rounded-xl py-2.5 text-xs font-bold ${canDouble ? "text-gray-300" : "text-gray-600"}" ${canDouble ? "" : "disabled"}>Double</button>
        <button id="split-btn" class="glass rounded-xl py-2.5 text-xs font-bold ${canSplit ? "text-gray-300" : "text-gray-600"}" ${canSplit ? "" : "disabled"}>Split</button>
      </div>`;
  }

  function renderResultPanel(eng) {
    const totalBet = eng.hands.reduce((s, h) => s + h.bet, 0);
    const totalPayout = eng.hands.reduce((s, h) => {
      if (h.outcome === "blackjack") return s + h.bet * 2.5;
      if (h.outcome === "win") return s + h.bet * 2;
      if (h.outcome === "push") return s + h.bet;
      return s;
    }, 0);
    const net = totalPayout - totalBet;

    return `
      <div class="text-center py-2 relative z-10">
        <p class="text-lg font-black ${net >= 0 ? "emerald-text" : "text-red-400"}">${net >= 0 ? "+" : ""}$${net.toFixed(2)}</p>
        <button id="new-round-btn" class="w-full mt-3 gold-grad text-black text-sm font-bold py-3 rounded-xl gold-glow">Play Again — $${betAmount}</button>
      </div>`;
  }

  function phaseLabel(phase) {
    return { betting: "Place your bet", player: "Your turn", dealer: "Dealer's turn", result: "Round complete" }[phase] || phase;
  }
  function phaseColor(phase) {
    return { betting: "emerald-text", player: "gold-text", dealer: "gold-text", result: "text-gray-400" }[phase] || "text-gray-400";
  }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachBettingHandlers(container) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        betAmount = Number(btn.dataset.amount);
        renderUI(container, engine);
      });
    });

    container.querySelector("#deal-btn")?.addEventListener("click", async () => {
      if (engine.session) {
        const { error } = await engine.placeBet("player", betAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      engine.newRound(betAmount);
    });
  }

  function attachActionHandlers(container) {
    container.querySelector("#hit-btn")?.addEventListener("click", () => engine.hit());
    container.querySelector("#stand-btn")?.addEventListener("click", () => engine.stand());
    container.querySelector("#double-btn")?.addEventListener("click", () => engine.double());
    container.querySelector("#split-btn")?.addEventListener("click", () => engine.split());
  }

  function attachResultHandlers(container) {
    container.querySelector("#new-round-btn")?.addEventListener("click", async () => {
      if (engine.session) {
        const { error } = await engine.placeBet("player", betAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
          return;
        }
      }
      engine.newRound(betAmount);
    });
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.blackjack = { mount, cleanup };
})();
