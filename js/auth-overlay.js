// js/auth-overlay.js
// Auth overlay (Login / Register) — dark themed, mobile-first, mock login/register
// - Injects CSS & HTML overlay
// - Shows automatically if no stored user (localStorage 'rk_user')
// - On success stores mock user (localStorage) and hides overlay
// - Updates main UI elements (profile, balance) if present
// - Wires btn-auth to open overlay and transforms into Sign out when logged in

(function () {
  'use strict';

  const STORAGE_KEY = 'rk_user';

  /* ---------- Inject CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
  /* Auth overlay styles injected by auth-overlay.js */
  .rk-auth-overlay { position: fixed; inset: 0; z-index: 99999; display:flex; align-items:center; justify-content:center; padding:16px; background: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.85)); }
  .rk-auth-card { width:100%; max-width:420px; border-radius:16px; overflow:hidden; background: linear-gradient(180deg,#14141c,#0f0f14); border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 30px 80px rgba(0,0,0,0.7); color:#fff; font-family: system-ui, -apple-system, sans-serif; }
  .rk-auth-header { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px 16px; }
  .rk-auth-title { font-weight:900; font-size:18px; letter-spacing:0.2px; color: #fff; }
  .rk-auth-tabs { display:flex; gap:8px; padding:0 16px 12px 16px; }
  .rk-tab { flex:1; padding:8px 10px; text-align:center; border-radius:10px; cursor:pointer; font-weight:700; font-size:14px; color: rgba(255,255,255,0.7); background: transparent; border:1px solid rgba(255,255,255,0.02); }
  .rk-tab.active { background: linear-gradient(90deg,#f5b342,#f5b342); color:#07110a; box-shadow: 0 8px 30px rgba(245,179,66,0.08); }
  .rk-auth-body { padding:12px 16px 18px 16px; display:flex; flex-direction:column; gap:12px; }
  .rk-field { display:flex; flex-direction:column; gap:6px; }
  .rk-field label { font-size:12px; color: rgba(255,255,255,0.78); }
  .rk-input { width:100%; padding:10px 12px; border-radius:10px; background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); color:#fff; font-size:14px; outline:none; }
  .rk-actions { display:flex; gap:8px; margin-top:4px; }
  .rk-btn { flex:1; padding:10px 12px; border-radius:10px; border:none; cursor:pointer; font-weight:800; font-size:14px; }
  .rk-btn.primary { background: linear-gradient(90deg,#f5b342,#e0a93a); color:#07110a; box-shadow: 0 10px 30px rgba(245,179,66,0.07); }
  .rk-btn.ghost { background: transparent; border:1px solid rgba(255,255,255,0.04); color: #fff; }
  .rk-small { font-size:12px; color: rgba(255,255,255,0.7); text-align:center; }
  .rk-close { background:transparent; color: rgba(255,255,255,0.7); border:none; font-weight:700; cursor:pointer; }
  .rk-checkbox-row { display:flex; gap:12px; align-items:center; font-size:13px; color: rgba(255,255,255,0.75); }
  .rk-footer { padding:12px 16px 18px 16px; display:flex; justify-content:center; }
  @media (prefers-reduced-motion: reduce) { .rk-auth-card, .rk-tab, .rk-btn { transition:none !important; } }
  `;
  document.head.appendChild(style);

  /* ---------- HTML template builder ---------- */
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'rk-auth-overlay';
    overlay.id = 'rk-auth-overlay';

    const card = document.createElement('div');
    card.className = 'rk-auth-card';

    // header
    const header = document.createElement('div');
    header.className = 'rk-auth-header';
    const title = document.createElement('div');
    title.className = 'rk-auth-title';
    title.textContent = 'Welcome to Real King';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'rk-close';
    closeBtn.id = 'rk-auth-close';
    closeBtn.innerText = '×';
    header.appendChild(title);
    header.appendChild(closeBtn);

    // tabs
    const tabs = document.createElement('div');
    tabs.className = 'rk-auth-tabs';
    const tabLogin = document.createElement('button');
    tabLogin.className = 'rk-tab active';
    tabLogin.id = 'rk-tab-login';
    tabLogin.innerText = 'Login';
    const tabSignup = document.createElement('button');
    tabSignup.className = 'rk-tab';
    tabSignup.id = 'rk-tab-signup';
    tabSignup.innerText = 'Sign Up';
    tabs.appendChild(tabLogin);
    tabs.appendChild(tabSignup);

    // body
    const body = document.createElement('div');
    body.className = 'rk-auth-body';

    // Login form
    const formLogin = document.createElement('div');
    formLogin.id = 'rk-form-login';
    formLogin.style.display = 'block';
    formLogin.innerHTML = `
      <div class="rk-field">
        <label for="rk-login-identity">Email or Mobile</label>
        <input id="rk-login-identity" class="rk-input" type="text" placeholder="you@domain.com or mobile" />
      </div>
      <div class="rk-field">
        <label for="rk-login-password">Password</label>
        <input id="rk-login-password" class="rk-input" type="password" placeholder="Enter password" />
      </div>
      <div class="rk-checkbox-row">
        <label style="display:flex;align-items:center;gap:8px"><input id="rk-remember" type="checkbox" /> Remember me</label>
        <a href="#" id="rk-forgot" style="color:rgba(255,255,255,0.8);font-size:13px;text-decoration:none">Forgot?</a>
      </div>
      <div class="rk-actions">
        <button id="rk-login-btn" class="rk-btn primary">Login</button>
        <button id="rk-guest-btn" class="rk-btn ghost">Guest</button>
      </div>
    `;

    // Signup form
    const formSignup = document.createElement('div');
    formSignup.id = 'rk-form-signup';
    formSignup.style.display = 'none';
    formSignup.innerHTML = `
      <div class="rk-field">
        <label for="rk-sign-username">Username</label>
        <input id="rk-sign-username" class="rk-input" type="text" placeholder="Choose a username" />
      </div>
      <div class="rk-field">
        <label for="rk-sign-email">Email</label>
        <input id="rk-sign-email" class="rk-input" type="email" placeholder="you@domain.com" />
      </div>
      <div class="rk-field">
        <label for="rk-sign-password">Password</label>
        <input id="rk-sign-password" class="rk-input" type="password" placeholder="Create password" />
      </div>
      <div class="rk-field">
        <label for="rk-sign-confirm">Confirm Password</label>
        <input id="rk-sign-confirm" class="rk-input" type="password" placeholder="Confirm password" />
      </div>
      <div class="rk-actions">
        <button id="rk-signup-btn" class="rk-btn primary">Sign Up</button>
        <button id="rk-cancel-signup" class="rk-btn ghost">Cancel</button>
      </div>
    `;

    body.appendChild(formLogin);
    body.appendChild(formSignup);

    // footer (checkboxes for Don't show again and Never remind — stored but since auth overlay hides when logged we still implement storage)
    const footer = document.createElement('div');
    footer.className = 'rk-footer';
    footer.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;width:100%;align-items:center;">
        <label class="rk-checkbox-row"><input id="rk-dont-show-today" type="checkbox" /> Don't show again today</label>
        <label class="rk-checkbox-row"><input id="rk-never-remind" type="checkbox" /> Never remind</label>
      </div>
    `;

    card.appendChild(header);
    card.appendChild(tabs);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);

    document.body.appendChild(overlay);
    return overlay;
  }

  /* ---------- Utilities ---------- */
  function getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function setStoredUser(user) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch (e) {}
  }
  function clearStoredUser() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  function genId() { return Math.floor(100000000 + Math.random()*900000000).toString(); }

  /* ---------- Behavior ---------- */
  function showOverlay() {
    // if 'never remind' or user already logged, do not show
    const user = getStoredUser();
    const never = localStorage.getItem('rk_auth_never');
    if (user || never === '1') return;
    // if don't show today set for today
    const dontToday = localStorage.getItem('rk_auth_dont_today');
    if (dontToday) {
      const data = JSON.parse(dontToday);
      // if same date skip
      if (isSameDay(Date.now(), data.ts)) return;
    }

    const overlay = buildOverlay();
    wireOverlay(overlay);
  }

  function hideOverlay() {
    const o = document.getElementById('rk-auth-overlay');
    if (o) o.remove();
  }

  function isSameDay(ts1, ts2) {
    const d1 = new Date(ts1), d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }

  function wireOverlay(overlay) {
    if (!overlay) return;
    // elements
    const tabLogin = overlay.querySelector('#rk-tab-login');
    const tabSignup = overlay.querySelector('#rk-tab-signup');
    const formLogin = overlay.querySelector('#rk-form-login');
    const formSignup = overlay.querySelector('#rk-form-signup');
    const closeBtn = overlay.querySelector('#rk-auth-close');

    const loginBtn = overlay.querySelector('#rk-login-btn');
    const guestBtn = overlay.querySelector('#rk-guest-btn');
    const signupBtn = overlay.querySelector('#rk-signup-btn');
    const cancelSignup = overlay.querySelector('#rk-cancel-signup');

    const dontToday = overlay.querySelector('#rk-dont-show-today');
    const neverRemind = overlay.querySelector('#rk-never-remind');

    // Tab switching
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active'); tabSignup.classList.remove('active');
      formLogin.style.display = 'block'; formSignup.style.display = 'none';
    });
    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active'); tabLogin.classList.remove('active');
      formSignup.style.display = 'block'; formLogin.style.display = 'none';
    });

    // Close: hide overlay (but if never remind checked, set storage)
    closeBtn.addEventListener('click', () => {
      const dont = overlay.querySelector('#rk-dont-show-today').checked;
      const never = overlay.querySelector('#rk-never-remind').checked;
      if (dont) {
        localStorage.setItem('rk_auth_dont_today', JSON.stringify({ ts: Date.now() }));
      }
      if (never) localStorage.setItem('rk_auth_never', '1');
      overlay.remove();
    });

    // Guest: create a lightweight guest user, persist for session
    guestBtn.addEventListener('click', () => {
      const guest = { id: 'guest-' + genId(), username: 'Guest', email: null, balance: 0.00, vip: 0 };
      setStoredUser(guest);
      overlay.remove();
      onAuthSuccess(guest);
    });

    // Login handler (mock)
    loginBtn.addEventListener('click', () => {
      const identity = overlay.querySelector('#rk-login-identity').value.trim();
      const password = overlay.querySelector('#rk-login-password').value.trim();
      if (!identity || !password) {
        alert('Enter email/mobile and password (mock).');
        return;
      }
      // Simulate async login
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      setTimeout(() => {
        const user = { id: genId(), username: identity.includes('@') ? identity.split('@')[0] : ('U' + identity.slice(-4)), email: identity.includes('@') ? identity : null, balance: 0.00, vip: 0 };
        setStoredUser(user);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        overlay.remove();
        onAuthSuccess(user);
      }, 800);
    });

    // Sign up handler (mock)
    signupBtn.addEventListener('click', () => {
      const username = overlay.querySelector('#rk-sign-username').value.trim();
      const email = overlay.querySelector('#rk-sign-email').value.trim();
      const pwd = overlay.querySelector('#rk-sign-password').value;
      const confirm = overlay.querySelector('#rk-sign-confirm').value;
      if (!username || !email || !pwd || !confirm) { alert('Complete all fields.'); return; }
      if (pwd !== confirm) { alert('Passwords do not match.'); return; }
      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating...';
      setTimeout(() => {
        const user = { id: genId(), username: username, email: email, balance: 0.00, vip: 0 };
        setStoredUser(user);
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
        overlay.remove();
        onAuthSuccess(user);
        // show registration success popup (simple)
        setTimeout(() => {
          showRegistrationPopup(user);
        }, 200);
      }, 900);
    });

    // Cancel signup -> show login
    cancelSignup.addEventListener('click', () => { tabLogin.click(); });

    // checkboxes behaviours
    dontToday.addEventListener('change', () => {
      if (dontToday.checked) localStorage.setItem('rk_auth_dont_today', JSON.stringify({ ts: Date.now() }));
      else localStorage.removeItem('rk_auth_dont_today');
    });
    neverRemind.addEventListener('change', () => {
      if (neverRemind.checked) localStorage.setItem('rk_auth_never', '1');
      else localStorage.removeItem('rk_auth_never');
    });
  }

  /* ---------- On Auth Success: update UI ---------- */
  function onAuthSuccess(user) {
    // Update profile UI fields if present
    try {
      const usernameEl = document.getElementById('profile-username');
      const idEl = document.getElementById('profile-id');
      const balanceEl = document.getElementById('profile-balance');
      const mainBalanceEl = document.getElementById('balance');
      const walletBalanceEl = document.getElementById('wallet-balance');

      if (usernameEl) usernameEl.textContent = user.username || (user.email ? user.email.split('@')[0] : 'Player');
      if (idEl) idEl.textContent = 'ID: ' + (user.id || '');
      if (balanceEl) balanceEl.textContent = (typeof user.balance === 'number') ? Number(user.balance).toFixed(2) : '0.00';
      if (mainBalanceEl) mainBalanceEl.textContent = (typeof user.balance === 'number') ? Number(user.balance).toFixed(2) : '0.00';
      if (walletBalanceEl) walletBalanceEl.textContent = (typeof user.balance === 'number') ? Number(user.balance).toFixed(2) : '0.00';
    } catch (e) { console.warn('onAuthSuccess update UI error', e); }

    // change Sign in button to Sign out
    try {
      const authBtn = document.getElementById('btn-auth');
      if (authBtn) {
        authBtn.textContent = 'Sign out';
        authBtn.classList.remove('bg-mint');
        authBtn.classList.add('btn-glass');
        // Remove previous handler if any
        authBtn.onclick = null;
        authBtn.addEventListener('click', () => {
          if (confirm('Sign out?')) {
            clearStoredUser();
            location.reload();
          }
        });
      }
    } catch (e) {}

    // Call app helper(s) if present
    try { if (typeof updateBalanceUI === 'function') updateBalanceUI(); } catch(e) {}
    try { if (typeof onUserLogin === 'function') onUserLogin(user); } catch(e) {}
  }

  /* ---------- Registration Success Popup (simple) ---------- */
  function showRegistrationPopup(user) {
    // small popup saying "Congratulations on Successful Registration!" with Deposit button
    const ov = document.createElement('div');
    ov.className = 'rk-auth-overlay';
    ov.style.zIndex = 100000;
    const box = document.createElement('div');
    box.className = 'rk-popup';
    box.style.maxWidth = '420px';
    box.innerHTML = `
      <div class="hero" style="align-items:center;">
        <div class="icon">🎉</div>
        <div>
          <div class="title">Congratulations on Successful Registration!</div>
          <div class="subtitle">Welcome ${user.username || ''} — claim a bonus and deposit now.</div>
        </div>
      </div>
      <div class="body">
        <div class="small-muted">Your account was created successfully. Your ID: <strong>${user.id}</strong></div>
      </div>
      <div class="footer">
        <div class="actions" style="display:flex;gap:8px;">
          <button id="popup-deposit" class="rk-btn primary">Deposit Now</button>
          <button id="popup-close" class="rk-btn ghost">Close</button>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:center;gap:12px;">
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="popup-dont-today"> Don't show again today</label>
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="popup-never"> Never remind</label>
        </div>
      </div>
    `;
    ov.appendChild(box);
    document.body.appendChild(ov);

    ov.querySelector('#popup-close').addEventListener('click', () => ov.remove());
    ov.querySelector('#popup-deposit').addEventListener('click', () => {
      ov.remove();
      // call deposit flow if present
      if (typeof openTopupPrompt === 'function') openTopupPrompt();
      else alert('Deposit flow not configured.');
    });
    ov.querySelector('#popup-dont-today').addEventListener('change', (e) => {
      if (e.target.checked) localStorage.setItem('rk_popup_dont_today', JSON.stringify({ ts: Date.now() }));
    });
    ov.querySelector('#popup-never').addEventListener('change', (e) => {
      if (e.target.checked) localStorage.setItem('rk_popup_never', '1');
    });

    // auto-remove after 6s if user doesn't interact
    setTimeout(() => { try { ov.remove(); } catch (e) {} }, 8000);
  }

  /* ---------- Init: show overlay if not logged ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const user = getStoredUser();
    if (user) {
      // if already logged, update UI
      onAuthSuccess(user);
      return;
    }
    // else show overlay
    showOverlay();

    // Wire global btn-auth if exists to re-open overlay
    const authBtn = document.getElementById('btn-auth');
    if (authBtn) {
      authBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // if user logged show sign out
        const u = getStoredUser();
        if (u) {
          if (confirm('Sign out?')) {
            clearStoredUser();
            location.reload();
          }
          return;
        }
        showOverlay();
      }, { passive: true });
    }
  });

  // Expose small API
  window.RKAuth = {
    isLogged: () => !!getStoredUser(),
    getUser: getStoredUser,
    logout: () => { clearStoredUser(); location.reload(); }
  };

})();
