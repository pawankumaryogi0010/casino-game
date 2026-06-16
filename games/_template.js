// =====================================================================
// _TEMPLATE.JS — Boilerplate pattern for all betting-round games
//
// HOW TO USE:
// 1. Copy this file to games/<slug>.js
// 2. Rename `CasinoGames.template` to the camelCase slug (e.g. plinko -> CasinoGames.plinko)
// 3. Set ROOM_NAME to the matching game_sessions.game_name
// 4. Replace renderBoard() with your game's visual (CSS/SVG/Three.js)
// 5. Replace the choices[] array with your game's bet options
// 6. Implement your own win-condition mapping in onRoundResult()
//
// FLOW:
//   mount() -> subscribe to game_sessions row -> render countdown/board
//   user taps a choice + amount -> placeBet() RPC (validates balance + round)
//   admin/dealer updates game_sessions.status/game_state -> all clients re-render
//   when status flips to 'finished', game_state.result determines win/loss display
// =====================================================================

(function () {
  const ROOM_NAME = "template-room-1"; // <-- change per game
  const { getGameSession, subscribeToGameSession, placeBet, unsubscribe } = window.SupabaseAPI;

  let channel = null;
  let currentSession = null;
  let countdownInterval = null;
  let selectedAmount = 10;

  // Example bet choices — override per game
  const choices = [
    { key: "option-a", label: "Option A", color: "#FFD700", payout: 2 },
    { key: "option-b", label: "Option B", color: "#50C878", payout: 2 }
  ];

  // -------------------------------------------------------------
  // MOUNT
  // -------------------------------------------------------------
  async function mount(container, gameMeta) {
    cleanup();

    currentSession = await getGameSession(gameMeta.room || ROOM_NAME);
    if (!currentSession) {
      container.innerHTML = `<p class="text-xs text-red-400 text-center py-8">Room not found.</p>`;
      return;
    }

    render(container);

    channel = subscribeToGameSession(gameMeta.room || ROOM_NAME, (updatedSession) => {
      currentSession = updatedSession;
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
        ${renderStatusBar(status)}
        ${renderBoard(state)}
        ${status === "betting" ? renderBettingPanel() : ""}
        ${status === "finished" ? renderResult(state) : ""}
      </div>
    `;

    if (status === "betting") attachBettingHandlers(container);
    startCountdown(container);
  }

  function renderStatusBar(status) {
    const labels = {
      waiting: "Waiting for next round...",
      betting: "Place your bets!",
      dealing: "Dealing...",
      finished: "Round finished"
    };
    const colors = {
      waiting: "text-gray-400",
      betting: "emerald-text",
      dealing: "gold-text",
      finished: "text-gray-400"
    };
    return `
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-semibold ${colors[status] || "text-gray-400"}">${labels[status] || status}</span>
        <span id="countdown" class="text-xs font-bold gold-text"></span>
      </div>`;
  }

  function renderBoard(state) {
    // Override this per game with your visual board/wheel/cards/grid
    return `
      <div class="card-grad rounded-xl p-6 mb-3 flex items-center justify-center min-h-[160px]">
        <p class="text-xs text-gray-400">Game board renders here</p>
      </div>`;
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
            <button class="choice-btn glass rounded-xl py-3 text-sm font-bold" data-choice="${c.key}" style="border:1px solid ${c.color}40; color:${c.color}">
              ${c.label}<br><span class="text-[10px] text-gray-400">Pays ${c.payout}x</span>
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
        const { data, error } = await placeBet(
          currentSession.id,
          currentSession.round_id,
          choice,
          selectedAmount
        );
        if (error) {
          window.showToast(error.message || "Bet failed", "#f87171");
        } else {
          window.showToast(`Bet placed: $${selectedAmount} on ${choice}`, "#50C878");
        }
      });
    });
  }

  // -------------------------------------------------------------
  // COUNTDOWN (visual only — authoritative timing is server-side)
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
  // EXPORT (rename `template` to your camelCase slug)
  // -------------------------------------------------------------
  window.CasinoGames = window.CasinoGames || {};
  window.CasinoGames.template = { mount, cleanup };
})();
