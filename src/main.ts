/* ============================================================================
 * Scrapline — entry point.
 *
 * 1. Imports the global stylesheet so Vite emits a bundled CSS file.
 * 2. Drives a tiny loading screen while we wait for the CrazyGames SDK to
 *    finish its script tag (best-effort — failures are silent so the game
 *    stays playable offline / direct on GitHub Pages).
 * 3. Boots the Game singleton and hides the loading screen.
 * ========================================================================== */

import './style.css';
import { game } from './game';
import { ui } from './dom';

/** Lazily pull in the CrazyGames v3 SDK if we're online. */
function loadCrazyGamesSDK(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as unknown as { CrazyGames?: unknown }).CrazyGames) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // Treat as no-SDK — AdBridge falls back locally.
    document.head.appendChild(s);
    // Cap our wait so a stuck network never blocks the splash.
    setTimeout(() => resolve(), 2500);
  });
}

/** Update the progress bar + hint on the load screen. */
function loadTick(pct: number, hint: string): void {
  ui.loadFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  ui.loadHint.textContent = hint;
}

async function boot(): Promise<void> {
  loadTick(10, 'Spooling neon grid…');
  await loadCrazyGamesSDK();
  loadTick(55, 'Routing scrap belts…');
  // Yield a frame so the bar paints to 55% before we start game.init's sync work.
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  game.init();
  loadTick(100, 'Online.');
  // Fade the loading screen out after a beat so the user sees the bar full.
  setTimeout(() => ui.loadScreen.classList.add('gone'), 220);
}

boot();
