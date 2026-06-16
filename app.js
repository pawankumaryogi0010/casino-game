// =====================================================================
// APP.JS — Master Engine: Router, Lobby Renderer, Dynamic Game Loader
// Requires: supabase-config.js, auth.js, payment-gateway.js loaded first
// =====================================================================

// ---------------------------------------------------------------------
// 1. GAME REGISTRY — drives lobby tiles + dynamic module loading
// ---------------------------------------------------------------------
const GAME_REGISTRY = [
  { slug: "teen-patti",    name: "Teen Patti",        room: "teen-patti-room-1",    tag: "LIVE", category: "Card" },
  { slug: "andar-bahar",   name: "Andar Bahar",       room: "andar-bahar-room-1",   tag: "LIVE", category: "Card" },
  { slug: "crash",         name: "Aviator Crash",     room: "crash-room-1",         tag: "HOT",  category: "Multiplier" },
  { slug: "roulette",      name: "3D Roulette",       room: "roulette-room-1",      tag: "",     category: "Table" },
  { slug: "blackjack",     name: "Blackjack",         room: "blackjack-room-1",     tag: "",     category: "Card" },
  { slug: "baccarat",      name: "Baccarat",          room: "baccarat-room-1",      tag: "",     category: "Card" },
  { slug: "jhandi-munda",  name: "Jhandi Munda",      room: "jhandi-munda-room-1",  tag: "NEW",  category: "Dice" },
  { slug: "dragon-tiger",  name: "Dragon Tiger",      room: "dragon-tiger-room-1",  tag: "LIVE", category: "Card" },
  { slug: "seven-up-down", name: "7 Up 7 Down",       room: "seven-up-down-room-1", tag: "",     category: "Dice" },
  { slug: "car-roulette",  name: "Car Roulette",      room: "car-roulette-room-1",  tag: "NEW",  category: "Table" },
  { slug: "ludo",          name: "Ludo Betting",      room: "ludo-room-1",          tag: "",     category: "Board" },
  { slug: "plinko",        name: "Plinko",            room: "plinko-room-1",        tag: "HOT",  category: "Crash" },
  { slug: "mines",         name: "Mines",             room: "mines-room-1",         tag: "HOT",  category: "Crash" },
  { slug: "wheel-fortune", name: "Wheel of Fortune",  room: "wheel-fortune-room-1", tag: "",     category: "Wheel" },
  { slug: "slots-3reel",   name: "Classic Slots",     room: "slots-3reel-room-1",   tag: "",     category: "Slots" },
  { slug: "video-poker",   name: "Mega Video Poker",  room: "video-poker-room-1",   tag: "",     category: "Card" },
  { slug: "red-dog",       name: "Red Dog",           room: "red-dog-room-1",       tag: "",     category: "Card" },
  { slug: "sicbo",         name: "Sic Bo",            room: "sicbo-room-1",         tag: "",     category: "Dice" },
  { slug: "hilo",          name: "Hi-Lo",             room: "hilo-room-1",          tag: "",     category: "Card" },
  { slug: "keno",          name: "Keno Jackpot",      room: "keno-room-1",          tag: "NEW",  category: "Lottery" }
];

// SVG icon set (procedural — no image assets needed)
function gameIconSvg(category) {
  const icons = {
    Card: `<path d="M4 4h10v16H4z" stroke="#FFD700" stroke-width="1.5" rx="2"/><path d="M10 6h10v16H10z" stroke="#50C878" stroke-width="1.5" rx="2" opacity="0.6"/>`,
    Table: `<circle cx="12" cy="12" r="9" stroke="#FFD700" stroke-width="2"/><path d="M12 3v18M3 12h18" stroke="#FFD700" stroke-width="1" opacity="0.4"/>`,
    Dice: `<rect x="3" y="3" width="18" height="18" rx="3" stroke="#50C878" stroke-width="2"/><circle cx="8" cy="8" r="1.5" fill="#50C878"/><circle cx="16" cy="16" r="1.5" fill="#50C878"/><circle cx="12" cy="12" r="1.5" fill="#50C878"/>`,
    Multiplier: `<path d="M3 17l5-5 4 4 8-8" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 8h5v5" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    Board: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="#50C878" stroke-width="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="#50C878" stroke-width="0.75" opacity="0.5"/>`,
    Crash: `<path d="M12 2v8M12 22a8 8 0 0 0 8-8c0-3-2-5-3-7-1 2-2 3-3 3-1-2-1-4-2-6-2 3-5 6-5 10a5 5 0 0 0 5 5z" stroke="#FFD700" stroke-width="1.5" stroke-linejoin="round"/>`,
    Wheel: `<circle cx="12" cy="12" r="9" stroke="#FFD700" stroke-width="2"/><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" stroke="#FFD700" stroke-width="0.75" opacity="0.5"/>`,
    Slots: `<rect x="3" y="5" width="18" height="14" rx="2" stroke="#50C878" stroke-width="2"/><path d="M8 5v14M16 5v14" stroke="#50C878" stroke-width="1.5"/>`,
    Lottery: `<circle cx="12" cy="12" r="9" stroke="#FFD700" stroke-width="2"/><text x="12" y="16" font-size="9" fill="#FFD700" text-anchor="middle" font-weight="bold">7</text>`
  };
  return icons[category] || icons.Card;
}

// ---------------------------------------------------------------------
// 2. ROUTER
// ---------------------------------------------------------------------
const routes = {
  "home": renderLobby,
  "live-rooms": renderLiveRooms,
  "wallet": renderWallet,
  "admin": renderAdminGuarded
};

async function router() {
  let hash = window.location.hash.replace("#", "") || "home";
  const app = document.getElementById("app");

  // Tear down any active game engine before switching views
  destroyActiveEngine();

  // Fade-out current view, swap content, fade-in new view
  app.classList.add("view-fade-out");
  await wait(140);

  // Dynamic game route: #game-<slug>
  if (hash.startsWith("game-")) {
    const slug = hash.replace("game-", "");
    await renderGame(app, slug);
  } else if (routes[hash]) {
    await routes[hash](app);
  } else {
    await renderLobby(app);
  }

  app.classList.remove("view-fade-out");
  app.classList.add("view-fade-in");
  setTimeout(() => app.classList.remove("view-fade-in"), 220);

  // Update bottom nav active state
  document.querySelectorAll(".nav-item").forEach((item) => {
    const route = item.dataset.route;
    const isActive = route === hash || (hash.startsWith("game-") && route === "home");
    item.classList.toggle("active", isActive);
  });

  app.scrollTo(0, 0);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

// PWA: register service worker for offline shell caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW registration failed:", err));
  });
}

// ---------------------------------------------------------------------
// 3. LOBBY VIEW
// ---------------------------------------------------------------------
function renderLobby(app) {
  const tiles = GAME_REGISTRY.map((g, i) => `
    <a href="#game-${g.slug}" class="tile glass rounded-2xl p-3 flex flex-col gap-2 cursor-pointer">
      <div class="w-full aspect-square rounded-xl card-grad flex items-center justify-center relative ${g.tag === "HOT" ? "shimmer" : ""}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">${gameIconSvg(g.category)}</svg>
        ${g.tag ? `<span class="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${g.tag === "HOT" ? "bg-red-500/90" : g.tag === "LIVE" ? "bg-emerald-500/90" : "bg-yellow-500/90 text-black"} text-white">${g.tag}</span>` : ""}
      </div>
      <div>
        <p class="text-xs font-semibold truncate">${g.name}</p>
        <p class="text-[10px] text-gray-400">${g.category}</p>
      </div>
    </a>
  `).join("");

  app.innerHTML = `
  <div class="page px-4 pt-4">
    <div class="rounded-2xl card-grad glass p-4 mb-4 relative overflow-hidden shimmer">
      <p class="text-[10px] uppercase tracking-widest emerald-text font-bold">Weekly Jackpot</p>
      <p class="text-2xl font-black gold-text mt-1">$128,450.90</p>
      <p class="text-xs text-gray-400 mt-1">Pooled across all 20 games</p>
    </div>

    <h2 class="text-sm font-bold mb-3 flex items-center gap-2">
      <span class="w-1 h-4 gold-grad rounded-full"></span> Game Lobby (20)
    </h2>
    <div class="grid grid-cols-3 gap-2.5 mb-4">${tiles}</div>
  </div>`;
}

// ---------------------------------------------------------------------
// 4. LIVE ROOMS VIEW
// ---------------------------------------------------------------------
function renderLiveRooms(app) {
  const liveGames = GAME_REGISTRY.filter((g) => g.tag === "LIVE");
  const rooms = liveGames.map((g) => `
    <a href="#game-${g.slug}" class="tile glass rounded-2xl overflow-hidden mb-3 block">
      <div class="aspect-video card-grad relative flex items-center justify-center">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none">${gameIconSvg(g.category)}</svg>
        <div class="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur px-2 py-1 rounded-full">
          <span class="w-2 h-2 rounded-full bg-red-500 pulse-dot"></span>
          <span class="text-[10px] font-bold tracking-wider">LIVE</span>
        </div>
      </div>
      <div class="p-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-bold">${g.name}</p>
          <p class="text-[11px] text-gray-400">Realtime multiplayer room</p>
        </div>
        <span class="text-xs font-bold px-3 py-1.5 rounded-full gold-grad text-black">Join</span>
      </div>
    </a>
  `).join("");

  app.innerHTML = `
  <div class="page px-4 pt-4">
    <h2 class="text-sm font-bold mb-3 flex items-center gap-2">
      <span class="w-1 h-4 gold-grad rounded-full"></span> Live Dealer Rooms
    </h2>
    ${rooms}
  </div>`;
}

// ---------------------------------------------------------------------
// 5. WALLET VIEW
// ---------------------------------------------------------------------
async function renderWallet(app) {
  const user = await window.SupabaseAPI.getCurrentUser();
  let tx = [];
  let balance = 0;

  if (user) {
    tx = await window.SupabaseAPI.getTransactions(user.id);
    const profile = await window.SupabaseAPI.getProfile(user.id);
    balance = profile?.balance || 0;
  }

  const txHtml = tx.length
    ? tx.map((t) => `
      <div class="glass rounded-xl p-3 flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:${t.type === "deposit" ? "rgba(80,200,120,0.15)" : "rgba(255,215,0,0.15)"}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${t.type === "deposit" ? "#50C878" : "#FFD700"}" stroke-width="2">
              ${t.type === "deposit" ? '<path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M12 5v14M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round"/>'}
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold capitalize">${t.type}</p>
            <p class="text-[10px] text-gray-400">${new Date(t.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold ${t.type === "deposit" ? "emerald-text" : "gold-text"}">${t.type === "deposit" ? "+" : "-"}$${Number(t.amount).toFixed(2)}</p>
          <p class="text-[10px] ${t.status === "pending" ? "text-yellow-400" : "text-gray-400"}">${t.status}</p>
        </div>
      </div>
    `).join("")
    : `<p class="text-xs text-gray-400 text-center py-6">No transactions yet.</p>`;

  app.innerHTML = `
  <div class="page px-4 pt-4">
    <div class="rounded-2xl card-grad glass p-5 mb-4 text-center">
      <p class="text-[10px] uppercase tracking-widest text-gray-400">Available Balance</p>
      <p class="text-3xl font-black gold-text mt-1">$${Number(balance).toFixed(2)}</p>
      <div class="flex gap-2 mt-4">
        <input id="amount-input" type="number" placeholder="Amount" class="flex-1 glass rounded-xl px-3 py-2 text-sm text-center outline-none" />
      </div>
      <div class="flex gap-2 mt-2">
        <button id="deposit-btn" class="flex-1 gold-grad text-black text-xs font-bold py-2.5 rounded-xl gold-glow">Deposit</button>
        <button id="withdraw-btn" class="flex-1 glass border border-emerald-400/30 emerald-text text-xs font-bold py-2.5 rounded-xl">Withdraw</button>
      </div>
    </div>

    <h2 class="text-sm font-bold mb-2 flex items-center gap-2"><span class="w-1 h-4 gold-grad rounded-full"></span> Transaction History</h2>
    <div id="tx-list">${txHtml}</div>
  </div>`;

  document.getElementById("deposit-btn").addEventListener("click", async () => {
    const amount = document.getElementById("amount-input").value;
    const result = await window.PaymentGateway.deposit(amount);
    if (result.success) renderWallet(app);
  });

  document.getElementById("withdraw-btn").addEventListener("click", async () => {
    const amount = document.getElementById("amount-input").value;
    const result = await window.PaymentGateway.withdraw(amount);
    if (result.success) renderWallet(app);
  });
}

// ---------------------------------------------------------------------
// 6. ADMIN VIEW (route-guarded)
// ---------------------------------------------------------------------
async function renderAdminGuarded(app) {
  const user = await window.SupabaseAPI.getCurrentUser();
  if (!user) {
    app.innerHTML = `<div class="page px-4 pt-10 text-center text-sm text-gray-400">Please log in to continue.</div>`;
    return;
  }

  const profile = await window.SupabaseAPI.getProfile(user.id);
  if (!profile || profile.role !== "admin") {
    app.innerHTML = `
      <div class="page px-4 pt-10 text-center">
        <svg class="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"/></svg>
        <p class="text-sm font-bold text-red-400">Access Denied</p>
        <p class="text-xs text-gray-400 mt-1">Admin privileges required.</p>
      </div>`;
    return;
  }

  // Delegate to admin.js (loaded on demand)
  if (!window.AdminPanel) {
    await loadScript("admin.js");
  }
  window.AdminPanel.render(app);
}

// ---------------------------------------------------------------------
// 7. DYNAMIC GAME LOADER
// ---------------------------------------------------------------------
const loadedGameScripts = new Set();
let activeGameModule = null; // module exposing { mount, cleanup } or { mount, destroy }

async function renderGame(app, slug) {
  const game = GAME_REGISTRY.find((g) => g.slug === slug);

  app.innerHTML = `
    <div class="page px-4 pt-4">
      <div class="flex items-center justify-between mb-3">
        <a href="#home" class="glass w-9 h-9 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <h2 class="text-sm font-bold">${game ? game.name : "Game"}</h2>
        <div class="w-9"></div>
      </div>
      <div id="game-canvas" class="glass rounded-2xl p-3 min-h-[400px] relative overflow-hidden">
        <canvas id="game-gl" class="absolute inset-0 w-full h-full"></canvas>
        <div id="game-ui" class="relative w-full">
          <p class="text-xs text-gray-400 text-center py-10">Loading game...</p>
        </div>
      </div>
    </div>`;

  if (!game) {
    document.getElementById("game-ui").innerHTML = `<p class="text-xs text-red-400">Game not found.</p>`;
    return;
  }

  try {
    // Engine must be present before any game module that extends CasinoGameEngine
    if (!window.CasinoGameEngine) {
      await loadScript("games/_engine.js");
    }

    // Card utilities shared by card/dice-based games
    const CARD_GAMES = ["teen-patti", "andar-bahar", "blackjack", "baccarat", "dragon-tiger", "jhandi-munda", "seven-up-down", "car-roulette"];
    if (CARD_GAMES.includes(game.slug) && !window.CardUtils) {
      await loadScript("games/_cards.js");
    }

    if (!loadedGameScripts.has(game.slug)) {
      await loadScript(`games/${game.slug}.js`);
      loadedGameScripts.add(game.slug);
    }

    const moduleKey = toCamelCase(game.slug); // e.g. teenPatti
    const gameModule = window.CasinoGames?.[moduleKey];

    if (gameModule && typeof gameModule.mount === "function") {
      const uiContainer = document.getElementById("game-ui");
      const canvas = document.getElementById("game-gl");
      activeGameModule = gameModule;
      await gameModule.mount(uiContainer, game, canvas);
    } else {
      document.getElementById("game-ui").innerHTML = renderPlaceholder(game);
    }
  } catch (err) {
    console.error("Game load error:", err);
    document.getElementById("game-ui").innerHTML = renderPlaceholder(game);
  }
}

// Tears down the currently mounted game module (engine + realtime channels)
function destroyActiveEngine() {
  if (activeGameModule) {
    if (typeof activeGameModule.cleanup === "function") activeGameModule.cleanup();
    if (typeof activeGameModule.destroy === "function") activeGameModule.destroy();
    activeGameModule = null;
  }
}

function renderPlaceholder(game) {
  return `
    <div class="text-center py-10 px-2">
      <svg class="mx-auto mb-3 shimmer" width="48" height="48" viewBox="0 0 24 24" fill="none">${gameIconSvg(game.category)}</svg>
      <p class="text-sm font-bold gold-text">${game.name}</p>
      <p class="text-xs text-gray-400 mt-1">Coming online soon — RTP ${game.tag ? "live" : "96%"}</p>
      <p class="text-[10px] text-gray-500 mt-3">Room: ${game.room}</p>
    </div>`;
}

// ---------------------------------------------------------------------
// 8. UTILITIES
// ---------------------------------------------------------------------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Toast helper shared across game modules
window.showToast = function (msg, color = "#FFD700") {
  const el = document.createElement("div");
  el.className = "fixed bottom-24 left-1/2 -translate-x-1/2 glass text-xs font-semibold px-4 py-2 rounded-full z-50 page";
  el.style.color = color;
  el.style.border = `1px solid ${color}40`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
};
