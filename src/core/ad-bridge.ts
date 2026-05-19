/* ============================================================================
 * AdBridge — thin wrapper around the CrazyGames v3 SDK with a localhost
 * fallback. The fallback always grants rewards so the game stays usable in
 * dev / when the SDK fails to load.
 * ========================================================================== */

import { ui } from '../dom';
import { wait } from '../utils/format';
import type { Game } from '../game';

interface CrazyGamesSDK {
  game?: { gameplayStart?: () => void; gameplayStop?: () => void };
  ad?: { requestAd?: (type: 'rewarded' | 'midgame') => Promise<unknown> };
}
interface CrazyGamesGlobal {
  CrazyGames?: { SDK?: CrazyGamesSDK };
}

function sdk(): CrazyGamesSDK | undefined {
  return (window as unknown as CrazyGamesGlobal).CrazyGames?.SDK;
}

export class AdBridge {
  game: Game;
  busy = false;

  constructor(game: Game) {
    this.game = game;
  }

  async rewarded(reason: string, fn: () => void): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.game.paused = true;
    this.show(
      'Rewarded Ad',
      reason + ' Demo fallback grants the reward. Replace with official CrazyGames SDK after acceptance.',
    );
    let ok = false;
    try {
      const s = sdk();
      s?.game?.gameplayStop?.();
      if (s?.ad?.requestAd) {
        const r = await s.ad.requestAd('rewarded');
        ok = r !== false;
      } else {
        await wait(1000);
        ok = true;
      }
      s?.game?.gameplayStart?.();
    } catch (_e) {
      await wait(500);
      ok = true;
    }
    this.hide();
    this.game.paused = false;
    this.busy = false;
    if (ok) {
      fn();
      this.game.toast('Reward claimed.');
    } else {
      this.game.toast('Reward not completed.');
    }
  }

  async mid(reason: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.game.paused = true;
    this.show('Midgame Break', reason + ' This only fires at a safe break.');
    try {
      const s = sdk();
      s?.game?.gameplayStop?.();
      if (s?.ad?.requestAd) await s.ad.requestAd('midgame');
      else await wait(700);
      s?.game?.gameplayStart?.();
    } catch (_e) {
      await wait(400);
    }
    this.hide();
    this.game.paused = false;
    this.busy = false;
  }

  show(t: string, p: string): void {
    ui.adTitle.textContent = t;
    ui.adText.textContent = p;
    ui.adBox.classList.remove('hidden');
  }

  hide(): void {
    ui.adBox.classList.add('hidden');
  }
}
