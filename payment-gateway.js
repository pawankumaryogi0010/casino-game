// =====================================================================
// PAYMENT-GATEWAY.JS — Mock deposit/withdrawal via secure RPC (v2)
// Requires: supabase-config.js + auth.js loaded first
//
// Balance mutation now goes through `adjust_balance()`, a security-definer
// Postgres function that re-checks the balance server-side under a row
// lock — this closes the devtools-spoofing hole a plain `.update()` has.
// =====================================================================

(function () {
  const { supabase, getProfile, adjustBalance } = window.SupabaseAPI;

  const MIN_DEPOSIT = 5;
  const MIN_WITHDRAWAL = 10;
  const MAX_TRANSACTION = 50000;

  // -------------------------------------------------------------
  // PUBLIC ENTRY POINTS
  // -------------------------------------------------------------
  async function deposit(amount) {
    return processTransaction("deposit", amount);
  }

  async function withdraw(amount) {
    return processTransaction("withdrawal", amount);
  }

  // -------------------------------------------------------------
  // CORE PIPELINE
  // -------------------------------------------------------------
  async function processTransaction(type, rawAmount) {
    const amount = Number(rawAmount);

    const validationError = validateAmount(type, amount);
    if (validationError) {
      playTone("error");
      showResult(false, validationError);
      return { success: false, error: validationError };
    }

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) throw new Error("You must be logged in to continue.");
      const userId = userData.user.id;

      // Pre-check for withdrawals (RPC re-validates server-side too)
      if (type === "withdrawal") {
        const profile = await getProfile(userId);
        if (!profile) throw new Error("Unable to load your profile.");
        if (amount > Number(profile.balance)) {
          throw new Error("Insufficient balance for this withdrawal.");
        }
      }

      const delta = type === "deposit" ? amount : -amount;

      // --- Atomic, server-validated balance change ---
      const { data: newBalance, error: rpcErr } = await adjustBalance(
        userId,
        delta,
        type === "deposit" ? "Mock deposit" : "Mock withdrawal"
      );
      if (rpcErr) throw rpcErr;

      // --- Ledger record ---
      const { data: txData, error: txErr } = await supabase
        .from("transactions")
        .insert([{ user_id: userId, type, amount, status: "success" }])
        .select()
        .single();
      if (txErr) throw txErr;

      window.AuthAPI?.updateBalanceUI(newBalance);
      playTone("success");
      showResult(
        true,
        `${type === "deposit" ? "Deposit" : "Withdrawal"} of $${amount.toFixed(2)} successful!`
      );

      return { success: true, transaction: txData, newBalance };
    } catch (err) {
      console.error(`${type} error:`, err.message);
      playTone("error");
      showResult(false, err.message);
      return { success: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------
  function validateAmount(type, amount) {
    if (!amount || isNaN(amount) || amount <= 0) return "Please enter a valid amount.";
    if (type === "deposit" && amount < MIN_DEPOSIT) return `Minimum deposit is $${MIN_DEPOSIT.toFixed(2)}.`;
    if (type === "withdrawal" && amount < MIN_WITHDRAWAL) return `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`;
    if (amount > MAX_TRANSACTION) return `Maximum transaction amount is $${MAX_TRANSACTION.toLocaleString()}.`;
    return null;
  }

  // -------------------------------------------------------------
  // UI FEEDBACK — toast + audio tone emulation
  // -------------------------------------------------------------
  function showResult(success, message) {
    const el = document.createElement("div");
    el.className =
      "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-xs font-semibold px-4 py-3 rounded-2xl backdrop-blur flex items-center gap-2 shadow-lg";
    el.style.background = success ? "rgba(80,200,120,0.15)" : "rgba(239,68,68,0.15)";
    el.style.color = success ? "#50C878" : "#f87171";
    el.style.border = `1px solid ${success ? "rgba(80,200,120,0.4)" : "rgba(239,68,68,0.4)"}`;
    el.style.transform = "translate(-50%, 20px)";
    el.style.opacity = "0";
    el.style.transition = "all 0.3s ease";

    const icon = success
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"/></svg>`;

    el.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = "translate(-50%, 0)";
      el.style.opacity = "1";
    });

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%, 20px)";
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  function playTone(type = "success") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "square";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
      osc.onended = () => ctx.close();
    } catch (e) {
      /* audio blocked — fail silently */
    }
  }

  // -------------------------------------------------------------
  // EXPORTS
  // -------------------------------------------------------------
  window.PaymentGateway = { deposit, withdraw };
})();
