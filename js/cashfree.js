// js/cashfree.js
// Mock Cashfree integration for Wallet page
// Adds "Deposit via Cashfree" button and exposes initiateCashfreePayment(amount)

(function () {
  'use strict';

  const LEDGER_KEY = 'rk_deposits';

  // Helper: show modal overlay with message and optional spinner
  function showModal(message = '', { showSpinner = true } = {}) {
    // remove existing if any
    const existing = document.getElementById('rk-cashfree-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rk-cashfree-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = 99999;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)';

    const box = document.createElement('div');
    box.style.width = '92%';
    box.style.maxWidth = '420px';
    box.style.borderRadius = '12px';
    box.style.padding = '16px';
    box.style.background = 'linear-gradient(180deg,#14141c,#0f0f14)';
    box.style.border = '1px solid rgba(255,255,255,0.04)';
    box.style.boxShadow = '0 30px 80px rgba(0,0,0,0.7)';
    box.style.color = '#fff';
    box.style.textAlign = 'center';

    const txt = document.createElement('div');
    txt.style.marginBottom = '12px';
    txt.style.fontWeight = 700;
    txt.innerText = message;

    box.appendChild(txt);

    if (showSpinner) {
      const spinner = document.createElement('div');
      spinner.style.width = '48px';
      spinner.style.height = '48px';
      spinner.style.margin = '0 auto';
      spinner.style.borderRadius = '50%';
      spinner.style.border = '4px solid rgba(255,255,255,0.08)';
      spinner.style.borderTopColor = '#f5b342';
      spinner.style.animation = 'rk-spin 1s linear infinite';
      box.appendChild(spinner);
    }

    // small cancel button
    const cancel = document.createElement('button');
    cancel.innerText = 'Cancel';
    cancel.style.marginTop = '12px';
    cancel.className = 'btn btn-glass';
    cancel.addEventListener('click', () => overlay.remove());
    box.appendChild(cancel);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // add spinner keyframes if not already present
    if (!document.getElementById('rk-cashfree-spinner-style')) {
      const s = document.createElement('style');
      s.id = 'rk-cashfree-spinner-style';
      s.textContent = "@keyframes rk-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
      document.head.appendChild(s);
    }

    return overlay;
  }

  // Helper: get and set deposit ledger in localStorage
  function getLedger() {
    try {
      const raw = localStorage.getItem(LEDGER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function pushLedger(entry) {
    const arr = getLedger();
    arr.unshift(entry);
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  // Update on-page balances (attempts known elements, falls back to showToast)
  function updateBalancesUI(newBalance) {
    try {
      // if you have an updateBalanceUI helper, call it
      if (typeof updateBalanceUI === 'function') {
        updateBalanceUI();
      } else {
        // else update main selectors if present
        const mainBal = document.getElementById('balance');
        const walletBal = document.getElementById('wallet-balance');
        const profileBal = document.getElementById('profile-balance');

        if (mainBal) mainBal.textContent = Number(newBalance).toFixed(2);
        if (walletBal) walletBal.textContent = Number(newBalance).toFixed(2) + ' USD';
        if (profileBal) profileBal.textContent = Number(newBalance).toFixed(2);
      }
    } catch (e) { /* ignore */ }
  }

  // Append transaction to on-page transaction list(s)
  function addTransactionToUI(tx) {
    try {
      // wallet transactions list
      const walletList = document.getElementById('wallet-transactions');
      if (walletList) {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `<div><strong>Deposit</strong><div class="small-muted">${tx.method} • ${new Date(tx.ts).toLocaleString()}</div></div><div style="text-align:right"><div>+${Number(tx.amount).toFixed(2)}</div><div class="small-muted">${tx.status}</div></div>`;
        walletList.insertBefore(li, walletList.firstChild);
      }

      // history list (if present)
      const history = document.getElementById('history-list') || document.getElementById('history');
      if (history) {
        const entry = document.createElement('div');
        entry.className = 'list-item';
        entry.innerHTML = `<div><strong>Deposit</strong><div class="small-muted">${tx.method}</div></div><div style="text-align:right"><div>+${Number(tx.amount).toFixed(2)}</div><div class="small-muted">${tx.status}</div></div>`;
        history.insertBefore(entry, history.firstChild);
      }

      // call optional helper if present
      if (typeof addDepositToLedgerTable === 'function') {
        try { addDepositToLedgerTable(tx); } catch (e) {}
      }
    } catch (e) {
      console.warn('addTransactionToUI error', e);
    }
  }

  // Main exported function
  async function initiateCashfreePayment(amount) {
    // parse amount
    const amt = Number(amount);
    if (!amt || amt <= 0 || Number.isNaN(amt)) {
      alert('Enter a valid amount to deposit.');
      return;
    }

    // show modal
    const modal = showModal('Redirecting to Cashfree Gateway... (Mock)', { showSpinner: true });

    // simulate redirect & processing
    await new Promise(res => setTimeout(res, 2000));

    // simulate success
    modal.remove();

    const tx = {
      id: 'cf_' + Date.now(),
      amount: amt,
      status: 'success',
      ts: Date.now(),
      method: 'cashfree-mock'
    };

    // push to ledger
    pushLedger(tx);

    // update balances: prefer using existing profile data if present
    let newBalance = null;
    try {
      // if you have a function to get current balance from server/app, call it
      if (typeof getCurrentBalance === 'function') {
        const current = await Promise.resolve(getCurrentBalance());
        newBalance = Number(current) + amt;
      } else {
        // attempt to read #balance element
        const balEl = document.getElementById('balance');
        const current = balEl ? parseFloat(balEl.textContent || '0') : 0;
        newBalance = Number(current) + amt;
      }
    } catch (e) {
      newBalance = amt;
    }

    // update UI
    updateBalancesUI(newBalance);
    addTransactionToUI(tx);

    // notify user
    if (typeof showToast === 'function') showToast('Deposit successful via Cashfree (mock): +' + Number(amt).toFixed(2), 'success');
    else alert('Deposit successful via Cashfree (mock): +' + Number(amt).toFixed(2));
    return tx;
  }

  // Add "Deposit via Cashfree" button to wallet area (if present)
  function addCashfreeButton() {
    try {
      const walletCard = document.querySelector('#view-wallet .glass') || document.getElementById('view-wallet');
      if (!walletCard) return;
      // create container below top buttons
      const container = document.createElement('div');
      container.style.marginTop = '10px';
      container.style.display = 'flex';
      container.style.gap = '8px';
      container.style.flexWrap = 'wrap';

      const btn = document.createElement('button');
      btn.className = 'btn btn-gold';
      btn.innerText = 'Deposit via Cashfree';
      btn.addEventListener('click', () => {
        // try read amount from #add-amount
        const amtInput = document.getElementById('add-amount');
        let val = amtInput ? amtInput.value : '';
        if (!val) {
          val = prompt('Enter deposit amount (mock):', '100');
        }
        if (!val) return;
        initiateCashfreePayment(val).catch(err => {
          console.error(err);
          alert('Payment failed (mock).');
        });
      });

      container.appendChild(btn);

      // place container after wallet top buttons
      const target = walletCard.querySelector('.divider') || walletCard;
      walletCard.insertBefore(container, target.nextSibling);
    } catch (e) {
      console.warn('addCashfreeButton error', e);
    }
  }

  // Expose function globally
  window.initiateCashfreePayment = initiateCashfreePayment;

  // on DOM ready add the button & load previous ledger entries into UI
  document.addEventListener('DOMContentLoaded', () => {
    addCashfreeButton();
    // render existing deposits in ledger to UI
    const ledger = getLedger();
    ledger.slice().reverse().forEach(tx => addTransactionToUI(tx)); // show recent first
  });

})();
