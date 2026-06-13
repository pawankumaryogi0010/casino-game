import { auth } from './js/auth.js';
import { GAME_REGISTRY } from './js/games/registry.js';

const stage = document.getElementById('stage');

export async function loadGame(id) {
  const entry = GAME_REGISTRY[id];
  if (!entry) return renderNotFound();
  stage.innerHTML = '<div class="loader neon">Loading…</div>';
  const mod = await entry.import();        // dynamic import -> tiny initial bundle
  stage.innerHTML = '';
  mod.mount(stage);                        // each game exports mount()/unmount()
}
