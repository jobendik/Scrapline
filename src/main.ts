/* ============================================================================
 * Scrapline — entry point.
 *
 * 1. Imports the global stylesheet so Vite emits a bundled CSS file.
 * 2. Loads the CrazyGames SDK shim (best-effort) — fails silently when offline
 *    or running outside the CrazyGames portal so the game stays playable.
 * 3. Boots the Game singleton.
 * ========================================================================== */

import './style.css';
import { game } from './game';

/**
 * Lazily pull in the CrazyGames v3 SDK if we're online. The AdBridge already
 * detects window.CrazyGames at runtime, so this is purely an attempt to make
 * the SDK present when running inside the CrazyGames portal.
 */
function loadCrazyGamesSDK(): void {
  if ((window as unknown as { CrazyGames?: unknown }).CrazyGames) return;
  const s = document.createElement('script');
  s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
  s.async = true;
  s.onerror = () => {
    // No-op: AdBridge fallback path grants rewards locally.
  };
  document.head.appendChild(s);
}

loadCrazyGamesSDK();
game.init();
