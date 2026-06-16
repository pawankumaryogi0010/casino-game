// =====================================================================
// ADMIN.JS — Master Admin Dashboard
// Loaded on-demand by app.js when route === #admin and user.role === 'admin'
// Realtime monitoring: balances, bets, live rooms, payment logs, RTP control
// =====================================================================

(function () {
  const { supabase, subscribeToAllGameSessions, unsubscribe } = window.SupabaseAPI;
  let sessionsChannel = null;

  async function render(app) {
    cleanup();

    const [users, transactions, sessions, bets] = await Promise.all([
      fetchUsers(),
      fetchRecentTransactions(),
      fetchGameSessions(),
      fetchRecentBets()
    ]);

    const totalBetVolume = bets.reduce((sum, b) => sum + Number(b.amount), 0);
    const activeRooms = sessions.filter((s) => s.status !== "waiting").length;

    app.innerHTML = `
      <div class="page px-4 pt-4">
        <div class="rounded-2xl card-grad glass p-4 mb-4 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><path d="M12 2l9 4.5V12c0 5-4 8.5-9 10-5-1.5-9-5-9-10V6.5L12 2z"/></svg>
          <div>
            <p class="text-sm font-bold gold-text">Master Dashboard</p>
            <p class="text-[10px] text-gray-400">Realtime monitoring · RTP control</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="glass rounded-xl p-3 text-center">
            <p class="text-lg font-black emerald-text">${users.length}</p>
            <p class="text-[10px] text-gray-400">Total Users</p>
          </div>
          <div class="glass rounded-xl p-3 text-center">
            <p class="text-lg font-black gold-text">$${totalBetVolume.toFixed(0)}</p>
            <p class="text-[10px] text-gray-400">Bet Volume (recent)</p>
          </div>
          <div class="glass rounded-xl p-3 text-center">
            <p class="text-lg font-black emerald-text">${activeRooms}</p>
            <p class="text-[10px] text-gray-400">Active Rooms</p>
          </div>
        </div>

        <!-- RTP Control -->
        <h2 class="text-sm font-bold mb-2 flex items-center gap-2"><span class="w-1 h-4 gold-grad rounded-full"></span> Game RTP Control</h2>
        <div id="rtp-list">${renderRtpList(sessions)}</div>

        <!-- Live Rooms -->
        <h2 class="text-sm font-bold mb-2 mt-4 flex items-center gap-2"><span class="w-1 h-4 gold-grad rounded-full"></span> Live Room Status</h2>
        <div id="rooms-list">${renderRoomsList(sessions)}</div>

        <!-- User Monitor -->
        <h2 class="text-sm font-bold mb-2 mt-4 flex items-center gap-2"><span class="w-1 h-4 gold-grad rounded-full"></span> User Balances</h2>
        ${renderUserList(users)}

        <!-- Payment Logs -->
        <h2 class="text-sm font-bold mb-2 mt-4 flex items-center gap-2"><span class="w-1 h-4 gold-grad rounded-full"></span> Payment Logs</h2>
        ${renderTransactionLogs(transactions)}
      </div>`;

    attachRtpHandlers(app);

    // Live update room statuses without full re-render
    sessionsChannel = subscribeToAllGameSessions(async (payload) => {
      const sessions = await fetchGameSessions();
      const roomsList = app.querySelector("#rooms-list");
      if (roomsList) roomsList.innerHTML = renderRoomsList(sessions);
    });
  }

  function cleanup() {
    if (sessionsChannel) unsubscribe(sessionsChannel);
    sessionsChannel = null;
  }

  // -------------------------------------------------------------
  // DATA FETCHERS
  // -------------------------------------------------------------
  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, phone_number, balance, role, created_at")
      .order("balance", { ascending: false })
      .limit(25);
    if (error) console.error("fetchUsers error:", error.message);
    return data || [];
  }

  async function fetchRecentTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, profiles(email, phone_number)")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) console.error("fetchRecentTransactions error:", error.message);
    return data || [];
  }

  async function fetchGameSessions() {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .order("game_type", { ascending: true });
    if (error) console.error("fetchGameSessions error:", error.message);
    return data || [];
  }

  async function fetchRecentBets() {
    const { data, error } = await supabase
      .from("bets")
      .select("amount, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) console.error("fetchRecentBets error:", error.message);
    return data || [];
  }

  // -------------------------------------------------------------
  // RENDERERS
  // -------------------------------------------------------------
  function renderRtpList(sessions) {
    return sessions.map((s) => `
      <div class="glass rounded-xl p-3 flex items-center justify-between mb-2">
        <div>
          <p class="text-xs font-semibold">${formatGameName(s.game_type)}</p>
          <p class="text-[10px] text-gray-400">RTP: <span class="rtp-val emerald-text font-bold" data-id="${s.id}">${Number(s.rtp).toFixed(2)}%</span></p>
        </div>
        <input type="range" min="85" max="99" step="0.5" value="${s.rtp}"
          class="rtp-slider w-24 accent-yellow-400" data-id="${s.id}" />
      </div>
    `).join("");
  }

  function renderRoomsList(sessions) {
    return sessions.map((s) => `
      <div class="glass rounded-xl p-3 flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${statusDot(s.status)}"></span>
          <p class="text-xs font-semibold">${formatGameName(s.game_type)}</p>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${statusBadge(s.status)}">${s.status}</span>
      </div>
    `).join("");
  }

  function renderUserList(users) {
    return users.map((u) => `
      <div class="glass rounded-xl p-3 flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full gold-grad flex items-center justify-center text-[11px] font-bold text-black">
            ${(u.email || u.phone_number || "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p class="text-xs font-semibold">${u.email || u.phone_number || "Unknown"}</p>
            <p class="text-[10px] text-gray-400">Balance: $${Number(u.balance).toFixed(2)}</p>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${u.role === "admin" ? "bg-yellow-500/20 gold-text" : "bg-emerald-500/20 emerald-text"}">${u.role}</span>
      </div>
    `).join("");
  }

  function renderTransactionLogs(transactions) {
    if (!transactions.length) {
      return `<p class="text-xs text-gray-400 text-center py-4">No transactions yet.</p>`;
    }
    return transactions.map((t) => `
      <div class="glass rounded-xl p-3 flex items-center justify-between mb-2">
        <div>
          <p class="text-xs font-semibold capitalize">${t.type} · ${t.profiles?.email || t.profiles?.phone_number || "User"}</p>
          <p class="text-[10px] text-gray-400">${new Date(t.created_at).toLocaleString()}</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold ${t.type === "deposit" ? "emerald-text" : "gold-text"}">${t.type === "deposit" ? "+" : "-"}$${Number(t.amount).toFixed(2)}</p>
          <p class="text-[10px] ${t.status === "pending" ? "text-yellow-400" : "text-gray-400"}">${t.status}</p>
        </div>
      </div>
    `).join("");
  }

  // -------------------------------------------------------------
  // RTP UPDATE HANDLER
  // -------------------------------------------------------------
  function attachRtpHandlers(app) {
    app.querySelectorAll(".rtp-slider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const valueEl = app.querySelector(`.rtp-val[data-id="${e.target.dataset.id}"]`);
        if (valueEl) valueEl.textContent = `${Number(e.target.value).toFixed(2)}%`;
      });

      slider.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const newRtp = Number(e.target.value);

        const { error } = await supabase
          .from("game_sessions")
          .update({ rtp: newRtp })
          .eq("id", id);

        if (error) {
          window.showToast("RTP update failed: " + error.message, "#f87171");
        } else {
          window.showToast(`RTP updated to ${newRtp.toFixed(2)}%`, "#50C878");
        }
      });
    });
  }

  // -------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------
  function formatGameName(slug) {
    return slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }

  function statusDot(status) {
    return { waiting: "bg-gray-500", betting: "bg-emerald-500 pulse-dot", dealing: "bg-yellow-500 pulse-dot", finished: "bg-gray-500" }[status] || "bg-gray-500";
  }

  function statusBadge(status) {
    return {
      waiting: "bg-gray-500/20 text-gray-400",
      betting: "bg-emerald-500/20 emerald-text",
      dealing: "bg-yellow-500/20 gold-text",
      finished: "bg-gray-500/20 text-gray-400"
    }[status] || "bg-gray-500/20 text-gray-400";
  }

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  window.AdminPanel = { render, cleanup };
})();
