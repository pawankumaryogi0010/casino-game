// =====================================================================
// WHEEL-FORTUNE.JS — WheelFortune (Realtime Multiplayer Stub)
// Follows the shared betting-round pattern (see games/_template.js).
// Extend renderBoard() with a custom CSS/SVG/Three.js visual for this game.
// game_state shape: { result, ...game-specific fields }
// =====================================================================

(function () {
  const ROOM_NAME = "wheel-fortune-room-1";
  const { getGameSession, subscribeToGameSession, placeBet, unsubscribe } = window.SupabaseAPI;

  let channel = null;
  let currentSession = null;
  let countdownInterval = null;
  let selectedAmount = 25;

  const choices = [
    { key: "2x", label: "2X", color: "#FFD700", payout: 9.0 },
    { key: "5x", label: "5X", color: "#50C878", payout: 9.0 },
    { key: "10x", label: "10X", color: "#9ca3af", payout: 9.0 },
    { key: "20x", label: "20X", color: "#f59e0b", payout: 9.0 }
  ];

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta) {
    cleanup();
    const room = gameMeta?.room || ROOM_NAME;

    currentSession = await getGameSession(room);
    if (!currentSession) {
      container.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Room not found.</p>`;
      return;
    }

    render(container);

    channel = subscribeToGameSession(room, (updated) => {
      currentSession = updated;
      render(container);
    });
  }

  function cleanup() {
    if (channel) unsubscribe(channel);
    if (countdownInterval) clearInterval(countdownInterval);
    channel = null;
    countdownInterval = null;
  }

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  function render(container) {
    const status = currentSession.status;
    const state = currentSession.game_state || {};

    container.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold ${statusColor(status)}">${statusLabel(status)}</span>
          <span id="countdown" class="text-xs font-bold gold-text"></span>
        </div>

        <div class="card-grad rounded-2xl p-6 mb-3 flex items-center justify-center min-h-[160px] relative overflow-hidden shimmer">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#FFD700" stroke-width="2"/><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" stroke="#FFD700" stroke-width="0.75" opacity="0.5"/></svg>
        </div>

        ${status === "betting" ? renderBettingPanel() : ""}
        ${status === "finished" ? renderResult(state) : ""}
      </div>`;

    if (status === "betting") attachBettingHandlers(container);
    startCountdown(container);
  }

  function renderBettingPanel() {
    const chips = [10, 25, 50, 100, 500];
    return `
      <div class="mb-3">
        <p class="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Bet Amount</p>
        <div class="flex gap-1.5 mb-3 overflow-x-auto scrollbar-x">
          ${chips.map((c) => `
            <button class="chip-btn glass rounded-full px-3 py-1.5 text-xs font-bold ${c === selectedAmount ? "gold-grad text-black" : "gold-text"}" data-amount="${c}">$${c}</button>
          `).join("")}
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${choices.map((c) => `
            <button class="choice-btn glass rounded-xl py-3 text-xs font-bold" data-choice="${c.key}" style="border:1px solid ${c.color}40; color:${c.color}">
              ${c.label}<br><span class="text-[10px] text-gray-400">${c.payout}x</span>
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  function renderResult(state) {
    if (!state.result) return "";
    const winner = choices.find((c) => c.key === state.result);
    return `
      <div class="text-center py-3">
        <p class="text-xs text-gray-400">Result</p>
        <p class="text-lg font-black gold-text">${winner ? winner.label : state.result}</p>
      </div>`;
  }

  function statusLabel(status) {
    return { waiting: "Waiting for next round...", betting: "Place your bets!", dealing: "Dealing...", finished: "Round complete" }[status] || status;
  }
  function statusColor(status) {
    return { waiting: "text-gray-400", betting: "emerald-text", dealing: "gold-text", finished: "text-gray-400" }[status] || "text-gray-400";
  }

  // -------------------------------------------------------------
  // INTERACTIONS
  // -------------------------------------------------------------
  function attachBettingHandlers(container) {
    container.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedAmount = Number(btn.dataset.amount);
        render(container);
      });
    });

    container.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const choice = btn.dataset.choice;
        const { error } = await placeBet(currentSession.id, currentSession.round_id, choice, selectedAmount);
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
        } else {
          window.showToast(`Bet placed: $${selectedAmount} on ${choice}`, "#50C878");
        }
      });
    });
  }

  // -------------------------------------------------------------
  // COUNTDOWN
  // -------------------------------------------------------------
  function startCountdown(container) {
    if (countdownInterval) clearInterval(countdownInterval);
    const el = container.querySelector("#countdown");
    if (!el || !currentSession.round_ends_at) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(currentSession.round_ends_at) - Date.now()) / 1000));
      el.textContent = currentSession.status === "betting" ? `${remaining}s` : "";
      if (remaining <= 0) clearInterval(countdownInterval);
    };
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.wheelFortune = { mount, cleanup };
})();
