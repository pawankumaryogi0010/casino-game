// js/games-ui.js
// Real King Casino - gamesList + Home rendering (Hot 8, View All, click alerts)
// Place this file in js/ and include after script.js: <script src="js/games-ui.js" defer></script>

(function () {
  'use strict';

  // 1) Master games list (20) with icon and category
  const gamesList = [
    { id: 'classic-slots',     name: 'Real King Slots',  icon: '🎰', category: 'Slot' },
    { id: 'aviator',           name: 'Aviator',          icon: '✈️', category: 'Arcade' },
    { id: 'roulette',          name: 'Roulette',         icon: '🎡', category: 'Table' },
    { id: 'blackjack',         name: 'Blackjack',        icon: '🃏', category: 'Card' },
    { id: 'baccarat',          name: 'Baccarat',         icon: '🎲', category: 'Card' },
    { id: 'mines',             name: 'Mines',            icon: '💣', category: 'Arcade' },
    { id: 'plinko',            name: 'Plinko',           icon: '🎯', category: 'Arcade' },
    { id: 'teen-patti',        name: 'Teen Patti',       icon: '♠️', category: 'Card' },
    { id: 'andar-bahar',       name: 'Andar Bahar',      icon: '🂡', category: 'Card' },
    { id: 'sic-bo',            name: 'Sic Bo',           icon: '🎲', category: 'Dice' },
    { id: 'video-poker',       name: 'Video Poker',      icon: '🃏', category: 'Poker' },
    { id: 'wheel-fortune',     name: 'Wheel of Fortune', icon: '🛞', category: 'Wheel' },
    { id: 'keno-jackpot',      name: 'Keno Jackpot',     icon: '🎯', category: 'Lottery' },
    { id: 'jhandi-munda',      name: 'Jhandi Munda',     icon: '🎲', category: 'Traditional' },
    { id: 'dragon-tiger',      name: 'Dragon Tiger',     icon: '🐉', category: 'Card' },
    { id: 'red-dog',           name: 'Red Dog',          icon: '🂮', category: 'Card' },
    { id: 'hi-low',            name: 'Hi-Low',           icon: '🔢', category: 'Card' },
    { id: 'ludo-betting',      name: 'Ludo Betting',     icon: '🎲', category: 'Multiplayer' },
    { id: 'car-roulette',      name: 'Car Roulette',     icon: '🏎️', category: 'Race' },
    { id: 'classic-slots-2',   name: 'Slots - Mega',     icon: '🎰', category: 'Slot' }
  ];

  // Utility: create element
  function el(tag, props = {}, ...children) {
    const d = document.createElement(tag);
    Object.keys(props).forEach(k => {
      if (k === 'class') d.className = props[k];
      else if (k === 'html') d.innerHTML = props[k];
      else d.setAttribute(k, props[k]);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      if (typeof c === 'string' || typeof c === 'number') d.appendChild(document.createTextNode(String(c)));
      else d.appendChild(c);
    });
    return d;
  }

  // Find or create the game grid inside Home (id="game-grid" or id="game-grid-hot")
  function ensureGameGrid() {
    let grid = document.getElementById('game-grid');
    if (!grid) {
      const home = document.getElementById('view-home') || document.body;
      grid = el('div', { id: 'game-grid', class: 'game-grid' });
      // try to insert after the Hot header if present
      const hotHeader = home.querySelector('h2');
      if (hotHeader && hotHeader.parentElement) hotHeader.parentElement.insertAdjacentElement('afterend', grid);
      else home.appendChild(grid);
    }
    return grid;
  }

  // Render N games into grid
  function renderGames(list, limit = null) {
    const grid = ensureGameGrid();
    grid.innerHTML = '';
    const toShow = limit == null ? list : list.slice(0, limit);
    toShow.forEach(game => {
      const card = el('div', { class: 'game-card', 'data-game-id': game.id, role: 'button', tabindex: 0 });
      // provider badge (optional)
      const providerBadge = el('div', { class: 'provider-badge' }, game.category);
      card.appendChild(providerBadge);

      // hot ribbon for first 8 or ones flagged (we'll show ribbon on all in initial hot)
      // Show ribbon if in the "hot" subset (we will set boolean)
      // thumbnail
      const thumb = el('div', { class: 'game-thumb' }, game.icon);
      card.appendChild(thumb);

      // meta
      const meta = el('div', { class: 'game-meta' },
        el('div', { class: 'title' }, game.name),
        el('div', { class: 'rtp' }, 'RTP 95%')
      );
      card.appendChild(meta);

      // full card click launches (alert)
      function launch() {
        alert('Launching ' + game.name + ' game....');
      }
      card.addEventListener('click', launch, { passive: true });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') launch(); });

      grid.appendChild(card);
    });
  }

  // initial rendering: show 8 "Hot" games - pick first 8 in array
  function renderHotInitial() {
    const hot = gamesList.slice(0, 8);
    renderGames(hot, null);
  }

  // Add View All toggle control (renders all or 8) - creates a small control if not present
  function ensureViewAllToggle() {
    // check for element with id 'view-all-wrap' or create it below grid
    let wrap = document.getElementById('view-all-wrap');
    if (!wrap) {
      const grid = ensureGameGrid();
      wrap = el('div', { id: 'view-all-wrap', class: 'text-center', style: 'margin-top:8px' });
      grid.insertAdjacentElement('afterend', wrap);
    }
    wrap.innerHTML = '';
    const btn = el('button', { id: 'toggle-view-all', class: 'btn btn-mint' }, 'View All Games');
    wrap.appendChild(btn);

    let expanded = false;
    btn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        renderGames(gamesList, null); // render all
        btn.textContent = 'Show Less';
      } else {
        renderHotInitial();
        btn.textContent = 'View All Games';
      }
    });
  }

  // Expose gamesList to global for debugging
  window.gamesList = gamesList;

  // Initialize rendering on DOMContentLoaded
  function init() {
    renderHotInitial();
    ensureViewAllToggle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
