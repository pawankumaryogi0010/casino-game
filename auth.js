// =====================================================================
// AUTH.JS — Authentication module (Email, Google OAuth, Phone)
// Requires: supabase-config.js loaded first (window.SupabaseAPI)
// =====================================================================

(function () {
  const { supabase, getProfile, subscribeToBalance, unsubscribe } = window.SupabaseAPI;
  let balanceChannel = null;

  // -------------------------------------------------------------
  // SIGN UP — email/password
  // -------------------------------------------------------------
  async function signUpWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast("Account created! Check your email to confirm.", "success");
      return { data, error: null };
    } catch (err) {
      toast(err.message, "error");
      return { data: null, error: err };
    }
  }

  // -------------------------------------------------------------
  // SIGN IN — email/password
  // -------------------------------------------------------------
  async function signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast("Welcome back!", "success");
      await onAuthSuccess(data.session);
      return { data, error: null };
    } catch (err) {
      toast(err.message, "error");
      return { data: null, error: err };
    }
  }

  // -------------------------------------------------------------
  // SIGN IN — Google OAuth (redirect flow)
  // -------------------------------------------------------------
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/#home" }
    });
    if (error) toast(error.message, "error");
    return { error };
  }

  // -------------------------------------------------------------
  // SIGN IN — Phone OTP
  // -------------------------------------------------------------
  async function requestPhoneOtp(phone) {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) toast(error.message, "error");
    else toast("OTP sent via SMS.", "success");
    return { data, error };
  }

  async function verifyPhoneOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) {
      toast(error.message, "error");
      return { data: null, error };
    }
    toast("Phone verified!", "success");
    await onAuthSuccess(data.session);
    return { data, error: null };
  }

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------
  async function logOut() {
    if (balanceChannel) unsubscribe(balanceChannel);
    await supabase.auth.signOut();
    window.location.hash = "#home";
    window.location.reload();
  }

  // -------------------------------------------------------------
  // SESSION PERSISTENCE / BOOTSTRAP
  // -------------------------------------------------------------
  async function initSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("getSession error:", error.message);
      return null;
    }
    if (data.session) {
      await onAuthSuccess(data.session);
      return data.session;
    }
    return null;
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) onAuthSuccess(session);
    if (event === "SIGNED_OUT") updateBalanceUI(0);
  });

  // -------------------------------------------------------------
  // POST-LOGIN HOOK
  // -------------------------------------------------------------
  async function onAuthSuccess(session) {
    const userId = session.user.id;

    const profile = await getProfile(userId);
    if (profile) updateBalanceUI(profile.balance);

    if (balanceChannel) unsubscribe(balanceChannel);
    balanceChannel = subscribeToBalance(userId, (updated) => updateBalanceUI(updated.balance));

    const currentHash = window.location.hash.replace("#", "");
    if (!currentHash || ["login", "signup", ""].includes(currentHash)) {
      window.location.hash = "#home";
    }
  }

  // -------------------------------------------------------------
  // UI HELPERS
  // -------------------------------------------------------------
  function updateBalanceUI(balance) {
    const el = document.querySelector("[data-balance]");
    if (el) {
      el.textContent = `$${Number(balance || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
  }

  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = "fixed top-4 left-1/2 -translate-x-1/2 z-50 text-xs font-semibold px-4 py-2 rounded-full backdrop-blur";
    el.style.background = type === "error" ? "rgba(239,68,68,0.2)" : "rgba(80,200,120,0.2)";
    el.style.color = type === "error" ? "#f87171" : "#50C878";
    el.style.border = `1px solid ${type === "error" ? "rgba(239,68,68,0.4)" : "rgba(80,200,120,0.4)"}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // -------------------------------------------------------------
  // EXPORTS
  // -------------------------------------------------------------
  window.AuthAPI = {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    requestPhoneOtp,
    verifyPhoneOtp,
    logOut,
    initSession,
    updateBalanceUI
  };

  window.addEventListener("DOMContentLoaded", initSession);
})();
