// =============================================================
// js/casino-bots.js  -  Lux Royale Casino
// Simulated table activity to make new tables feel lively.
//
// HARD RULE (do not remove): everything here is AMBIANCE ONLY.
//   - It is clearly labeled "Simulated".
//   - It NEVER reads or writes real balances, the real wagering
//     pot, or payouts. Bot bets are cosmetic numbers.
//   - It must not be presented as real people betting real money.
// Why: showing fabricated bettors/wagers as real next to a
// real-money wallet is deceptive social proof and, in regulated
// gambling, misleading conduct. Keep the label; keep it cosmetic.
//
// Public API:
//   CasinoBots.startDealer(gameName, onState)  -> dealer state machine
//   CasinoBots.stopDealer()
//   CasinoBots.generateBotBets(gameId, onBet)   -> begins spawning
//   CasinoBots.stopBotBets(gameId)
//   CasinoBots.getPot(gameId)                    -> simulated pot total
//   CasinoBots.renderActivityBadge(ctx, x, y, gameId) // canvas helper
// =============================================================
(function () {
  'use strict';

  const FIRST = ['Rohan', 'Aarav', 'Vivaan', 'Priya', 'Neha', 'Arjun', 'Sara', 'Kabir', 'Maya', 'Dev'];
  const HANDLES = ['CryptoKing', 'LuckyAce', 'NeonShark', 'GoldRush', 'HighRoller', 'SpinMaster'];
  function botName() {
    const r = Math.random();
    if (r < 0.4) return 'User_' + (100 + ((Math.random() * 900) | 0)) + 'x';
    if (r < 0.7) return FIRST[(Math.random() * FIRST.length) | 0] + '_' + ((Math.random() * 90) + 10 | 0);
    return HANDLES[(Math.random() * HANDLES.length) | 0];
  }
  // All simulated bettors carry sim:true so UI can label them.
  function botProfile() { return { name: botName(), sim: true }; }

  // ---------------------------------------------------------
  // 1) Virtual dealer state machine (pacing only)
  // ---------------------------------------------------------
  const PHASES = [
    { state: 'shuffling', label: 'Shuffling', ms: 4000 },
    { state: 'betting',   label: 'Betting Open', ms: 14000 },
    { state: 'dealing',   label: 'Dealing Cards', ms: 6000 },
    { state: 'result',    label: 'Winner Announced', ms: 6000 },
  ];
  let dealerTimer = null;
  let dealerIdx = 0;

  function startDealer(gameName, onState) {
    stopDealer();
    dealerIdx = 0;
    const tick = () => {
      const phase = PHASES[dealerIdx % PHASES.length];
      if (typeof onState === 'function') {
        onState({ game: gameName, state: phase.state, label: phase.label, simulated: true });
      }
      dealerIdx++;
      dealerTimer = setTimeout(tick, phase.ms);
    };
    tick();
    return () => stopDealer();
  }
  function stopDealer() { if (dealerTimer) { clearTimeout(dealerTimer); dealerTimer = null; } }

  // ---------------------------------------------------------
  // 2) Dynamic bot bettors (cosmetic) + 3) simulated pot
  // ---------------------------------------------------------
  const pots = {};      // gameId -> simulated total
  const betTimers = {}; // gameId -> timeout id
  const recent = {};    // gameId -> [{name, amount, outcome}]

  const OUTCOMES = ['A', 'B', 'Tie', 'High', 'Low', 'Red', 'Black'];

  function generateBotBets(gameId, onBet) {
    stopBotBets(gameId);
    pots[gameId] = pots[gameId] || 0;
    recent[gameId] = recent[gameId] || [];
    const spawn = () => {
      const p = botProfile();
      const amount = (1 + ((Math.random() * 50) | 0)) * 10; // cosmetic chips
      const outcome = OUTCOMES[(Math.random() * OUTCOMES.length) | 0];
      pots[gameId] += amount;
      const bet = { name: p.name, amount, outcome, sim: true };
      recent[gameId].unshift(bet);
      if (recent[gameId].length > 8) recent[gameId].pop();
      if (typeof onBet === 'function') onBet(bet, pots[gameId]);
      betTimers[gameId] = setTimeout(spawn, 1000 + Math.random() * 2000); // every 1-3s
    };
    spawn();
    return () => stopBotBets(gameId);
  }
  function stopBotBets(gameId) { if (betTimers[gameId]) { clearTimeout(betTimers[gameId]); delete betTimers[gameId]; } }
  function resetPot(gameId) { pots[gameId] = 0; recent[gameId] = []; }
  function getPot(gameId) { return pots[gameId] || 0; }
  function getRecent(gameId) { return recent[gameId] || []; }

  // ---------------------------------------------------------
  // Canvas helper: glowing "Table Activity" badge.
  // Always renders the "Simulated" label so it can't pose as real.
  // ---------------------------------------------------------
  function renderActivityBadge(ctx, x, y, gameId) {
    if (!ctx) return;
    const pot = getPot(gameId);
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#FFD700';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Table Pool: ' + pot.toLocaleString('en-IN') + ' chips', x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.font = '600 9px system-ui';
    ctx.fillText('SIMULATED TABLE ACTIVITY', x, y + 14);
    ctx.restore();
  }

  window.CasinoBots = {
    startDealer, stopDealer,
    generateBotBets, stopBotBets, resetPot, getPot, getRecent,
    renderActivityBadge,
  };
})();
