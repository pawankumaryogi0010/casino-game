// =============================================================
// casino-bots.js  -  Lux Royale Casino
// Simulated multiplayer activity & virtual dealer state machine
//
// PURPOSE: Give new tables a lively, crowded casino feel.
//
// HONESTY GUARANTEE (read before editing):
//   - EVERY bot action is clearly marked with `sim: true`.
//   - Bots NEVER read/write real balances or RNG outcomes.
//   - Bets are cosmetic numbers only, displayed for ambiance.
//   - "Total Pool" is simulated and does NOT affect real payouts.
//   - Real game outcomes come from server RPC (resolveBet).
//
// Public API:
//   CasinoBots.startDealer(gameName, onState)   -> dealer state emitter
//   CasinoBots.stopDealer()
//   CasinoBots.generateBotBets(gameId, onBet, onPotUpdate) -> spawn bettors
//   CasinoBots.stopBotBets(gameId)
//   CasinoBots.getPot(gameId)                    -> simulated pot total
//   CasinoBots.resetPot(gameId)
//   CasinoBots.renderActivityBadge(ctx, x, y, pot) -> canvas helper
//   CasinoBots.getActiveBettors(gameId)          -> returns recent bettor list
// =============================================================
(function () {
  'use strict';

  // ---------------------------------------------------------
  // 1. FAKE USERNAME GENERATOR (localized & diverse)
  // ---------------------------------------------------------
  const FIRST_NAMES = [
    'Rohan', 'Aarav', 'Vivaan', 'Priya', 'Neha', 'Arjun', 'Sara', 'Kabir', 'Maya', 'Dev',
    'Zara', 'Ishaan', 'Ananya', 'Dhruv', 'Kavya', 'Reyansh', 'Aadhya', 'Shaurya', 'Anvi', 'Yash'
  ];
  const HANDLES = [
    'CryptoKing', 'LuckyAce', 'NeonShark', 'GoldRush', 'HighRoller', 'SpinMaster', 
    'JackpotHunter', 'RoyalFlush', 'MysticDice', 'ThunderBet', 'SilverFox', 'DiamondHands'
  ];
  const SUFFIXES = ['_x', '_99', '_777', '_pro', '_lucky', '_ace'];

  function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateBotName() {
    const style = Math.random();
    if (style < 0.4) {
      // User_XXXx style (most common)
      const num = 100 + Math.floor(Math.random() * 900);
      return 'User_' + num + 'x';
    } else if (style < 0.7) {
      // FirstName_Number
      const name = randomElement(FIRST_NAMES);
      const num = Math.floor(Math.random() * 99) + 10;
      return name + '_' + num;
    } else {
      // Cool handle + optional number
      const handle = randomElement(HANDLES);
      if (Math.random() > 0.6) {
        return handle + Math.floor(Math.random() * 99);
      }
      return handle;
    }
  }

  function botProfile() {
    return {
      name: generateBotName(),
      avatar: '🎲',
      sim: true,      // CRITICAL: marks as simulated user
    };
  }

  // ---------------------------------------------------------
  // 2. VIRTUAL DEALER STATE MACHINE (for Teen Patti, Andar Bahar, etc)
  // ---------------------------------------------------------
  const DEALER_PHASES = [
    { state: 'shuffling', label: '🃏 Shuffling Deck', durationMs: 4000, icon: '🃟' },
    { state: 'betting',   label: '💰 Betting Open — Place your chips!', durationMs: 15000, icon: '⏱️' },
    { state: 'dealing',   label: '🎴 Dealing Cards', durationMs: 5000, icon: '🎴' },
    { state: 'result',    label: '🏆 Winner Announced!', durationMs: 6000, icon: '🏆' },
  ];

  let activeDealerTimer = null;
  let dealerPhaseIndex = 0;
  let currentDealerCallback = null;
  let currentGameNameForDealer = null;

  /**
   * Start a virtual dealer cycle for a game.
   * @param {string} gameName - Name of the game (e.g., 'Teen Patti', 'Andar Bahar')
   * @param {Function} onState - Callback receiving { game, state, label, icon, simulated }
   * @returns {Function} stop function
   */
  function startDealer(gameName, onState) {
    stopDealer();
    currentGameNameForDealer = gameName;
    currentDealerCallback = onState;
    dealerPhaseIndex = 0;

    function runPhase() {
      if (!currentDealerCallback) return;
      const phase = DEALER_PHASES[dealerPhaseIndex % DEALER_PHASES.length];
      currentDealerCallback({
        game: gameName,
        state: phase.state,
        label: phase.label,
        icon: phase.icon,
        simulated: true,
        phaseIndex: dealerPhaseIndex,
        totalPhases: DEALER_PHASES.length,
      });
      dealerPhaseIndex++;
      activeDealerTimer = setTimeout(runPhase, phase.durationMs);
    }
    runPhase();

    return function stop() { stopDealer(); };
  }

  function stopDealer() {
    if (activeDealerTimer) {
      clearTimeout(activeDealerTimer);
      activeDealerTimer = null;
    }
    dealerPhaseIndex = 0;
    currentDealerCallback = null;
    currentGameNameForDealer = null;
  }

  // ---------------------------------------------------------
  // 3. DYNAMIC BOT BETTORS (fake but lively)
  // ---------------------------------------------------------
  const BOT_OUTCOMES = [
    'ANDAR', 'BAHAR', 'PLAYER', 'BANKER', 'TIE', 'RED', 'BLACK', 'EVEN', 'ODD',
    'HIGH', 'LOW', '7 UP', '7 DOWN', 'DRAGON', 'TIGER', 'JACKPOT', 'BONUS'
  ];

  // Store simulated pots per gameId
  const pots = new Map();           // gameId -> total accumulated chips (cosmetic)
  const betIntervals = new Map();   // gameId -> interval id
  const recentBettors = new Map();  // gameId -> array of recent bets
  const MAX_RECENT = 12;

  function getPot(gameId) {
    return pots.get(gameId) || 0;
  }

  function setPot(gameId, value) {
    pots.set(gameId, Math.max(0, value));
  }

  function addToPot(gameId, amount) {
    const current = getPot(gameId);
    setPot(gameId, current + amount);
  }

  function resetPot(gameId) {
    setPot(gameId, 0);
    if (recentBettors.has(gameId)) {
      recentBettors.set(gameId, []);
    }
  }

  function getRecentBettors(gameId) {
    return recentBettors.get(gameId) || [];
  }

  function addRecentBet(gameId, bet) {
    let arr = recentBettors.get(gameId) || [];
    arr.unshift(bet);
    if (arr.length > MAX_RECENT) arr.pop();
    recentBettors.set(gameId, arr);
  }

  // Generate a random cosmetic bet amount (feels organic)
  function generateBetAmount() {
    const rand = Math.random();
    if (rand < 0.5) {
      // Small bets: 10, 20, 50, 100
      return [10, 20, 50, 100][Math.floor(Math.random() * 4)];
    } else if (rand < 0.8) {
      // Medium bets: 200, 500, 1000
      return [200, 500, 1000][Math.floor(Math.random() * 3)];
    } else {
      // High roller: 2000, 5000, 10000
      return [2000, 5000, 10000][Math.floor(Math.random() * 3)];
    }
  }

  /**
   * Generate bot bettors for a specific game.
   * @param {string} gameId - Unique identifier for the game instance
   * @param {Function} onBet - Callback (betObject, totalPot) when a bot bets
   * @param {Function} onPotUpdate - Callback (totalPot) when pot changes
   * @param {Object} options - Optional config
   * @returns {Function} stop function
   */
  function generateBotBets(gameId, onBet, onPotUpdate, options = {}) {
    // Stop any existing bettors for this gameId
    stopBotBets(gameId);

    // Initialize pot for this game if not exists
    if (!pots.has(gameId)) {
      pots.set(gameId, 0);
    }
    if (!recentBettors.has(gameId)) {
      recentBettors.set(gameId, []);
    }

    const intensity = options.intensity || 'normal'; // 'low', 'normal', 'high'
    const baseInterval = intensity === 'high' ? 800 : (intensity === 'low' ? 2500 : 1400);
    const variance = intensity === 'high' ? 400 : 800;

    // Helper to trigger a bot bet
    const spawnBet = () => {
      const bot = botProfile();
      const amount = generateBetAmount();
      const outcome = randomElement(BOT_OUTCOMES);
      const betId = 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      
      const bet = {
        id: betId,
        name: bot.name,
        avatar: bot.avatar,
        amount: amount,
        outcome: outcome,
        sim: true,
        timestamp: new Date().toISOString(),
      };
      
      // Add to pot (simulated pool)
      addToPot(gameId, amount);
      addRecentBet(gameId, bet);
      
      const currentPot = getPot(gameId);
      
      // Fire callbacks
      if (typeof onBet === 'function') {
        onBet(bet, currentPot);
      }
      if (typeof onPotUpdate === 'function') {
        onPotUpdate(currentPot);
      }
      
      return bet;
    };

    // Initial burst of 3-6 bots to make table look active
    const initialBurstCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < initialBurstCount; i++) {
      setTimeout(() => spawnBet(), i * 150);
    }

    // Start interval for continuous bot betting
    const intervalId = setInterval(() => {
      // Only spawn bot if betting is likely open (not too aggressive)
      // We always spawn but the game's UI can filter by phase
      spawnBet();
    }, baseInterval + Math.random() * variance);
    
    betIntervals.set(gameId, intervalId);
    
    // Return stop function
    return () => stopBotBets(gameId);
  }

  function stopBotBets(gameId) {
    if (betIntervals.has(gameId)) {
      clearInterval(betIntervals.get(gameId));
      betIntervals.delete(gameId);
    }
  }

  // ---------------------------------------------------------
  // 4. CANVAS RENDERING HELPER (Total Pool badge)
  // ---------------------------------------------------------
  /**
   * Render a glowing "Total Pool" badge on canvas (for game screens)
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X position (top right corner)
   * @param {number} y - Y position
   * @param {number} potAmount - Current simulated pot total
   * @param {Object} options - Optional styling
   */
  function renderActivityBadge(ctx, x, y, potAmount, options = {}) {
    if (!ctx) return;
    
    const potValue = potAmount || 0;
    const formattedPot = potValue.toLocaleString('en-IN') + ' chips';
    
    ctx.save();
    
    // Glow effect behind the badge
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Semi-transparent background pill
    ctx.fillStyle = 'rgba(21, 23, 31, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, 180, 44, 22);
    ctx.fill();
    
    // Gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 180, 44, 22);
    ctx.stroke();
    
    // Pot icon and text
    ctx.shadowBlur = 8;
    ctx.font = '600 11px system-ui';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText('💰 TABLE POOL', x + 12, y + 18);
    
    ctx.font = '700 16px system-ui';
    ctx.fillStyle = '#50C878';
    ctx.fillText(formattedPot, x + 12, y + 37);
    
    // "Simulated" label (tiny, transparent)
    ctx.font = '400 7px system-ui';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.fillText('simulated activity', x + 140, y + 40);
    
    ctx.restore();
  }

  // Helper to add roundRect if not already present
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.moveTo(x+r, y);
      this.lineTo(x+w-r, y);
      this.quadraticCurveTo(x+w, y, x+w, y+r);
      this.lineTo(x+w, y+h-r);
      this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      this.lineTo(x+r, y+h);
      this.quadraticCurveTo(x, y+h, x, y+h-r);
      this.lineTo(x, y+r);
      this.quadraticCurveTo(x, y, x+r, y);
      return this;
    };
  }

  // ---------------------------------------------------------
  // 5. BOT ACTIVITY STREAM (for side-panel / notifications)
  // ---------------------------------------------------------
  const globalActivityFeed = []; // store recent global bot bets
  const MAX_GLOBAL_FEED = 20;

  function pushToGlobalFeed(bet, gameId) {
    globalActivityFeed.unshift({
      ...bet,
      gameId: gameId,
      timestamp: Date.now(),
    });
    if (globalActivityFeed.length > MAX_GLOBAL_FEED) globalActivityFeed.pop();
  }

  // Override generateBotBets to also push to global feed
  const originalGenerateBotBets = generateBotBets;
  window.generateBotBets = function(gameId, onBet, onPotUpdate, options) {
    return originalGenerateBotBets(gameId, (bet, pot) => {
      pushToGlobalFeed(bet, gameId);
      if (onBet) onBet(bet, pot);
    }, onPotUpdate, options);
  };

  function getGlobalActivityFeed(limit = 10) {
    return globalActivityFeed.slice(0, limit);
  }

  // ---------------------------------------------------------
  // 6. EXPORT PUBLIC API
  // ---------------------------------------------------------
  window.CasinoBots = {
    // Dealer state machine
    startDealer,
    stopDealer,
    
    // Bot bettors
    generateBotBets: function(gameId, onBet, onPotUpdate, options) {
      return originalGenerateBotBets(gameId, onBet, onPotUpdate, options);
    },
    stopBotBets,
    
    // Pot management
    getPot,
    setPot,
    addToPot,
    resetPot,
    
    // Bettor history
    getRecentBettors,
    getGlobalActivityFeed,
    
    // Canvas helper
    renderActivityBadge,
    
    // Utility
    generateBotName,
    botProfile,
  };
  
  // Also expose a simpler alias for quick integration
  window.VirtualDealer = {
    start: window.CasinoBots.startDealer,
    stop: window.CasinoBots.stopDealer,
  };
  
  // Auto-initialization flag (won't auto-start, but provides console helper)
  if (typeof window !== 'undefined' && window.console) {
    console.log('[CasinoBots] Virtual multiplayer module loaded. Use CasinoBots.startDealer() and CasinoBots.generateBotBets() to animate tables.');
  }
})();
