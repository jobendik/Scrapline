/* ============================================================================
 * AdBridge — wrapper around the CrazyGames v3 SDK with a localhost fallback.
 *
 * Surfaces three calls:
 *   - rewarded(reason, fn): show a rewarded ad and grant `fn()` on success.
 *     Without SDK, falls back to a demo overlay that grants the reward so
 *     the game stays usable in dev / direct GitHub Pages embeds.
 *   - mid(reason): fire a midgame interstitial, but only when the cooldown
 *     allows (4 minutes since the last ad, per CrazyGames best practice).
 *   - happytime(): tell the SDK that we're in a calm beat (just claimed a
 *     reward, unlocked a zone, levelled up). The SDK uses this to time its
 *     own interstitials. No-op without SDK.
 *
 * Also exposes a small `user.greeting()` helper that pulls the player's
 * CrazyGames username when the SDK is available, falling back to "Scrapper"
 * so the intro / welcome-back messaging always has *some* name to address.
 *
 * Cloud save: `cloud.put(json)` writes the same blob the local save uses
 * into sdk.data.setItem so the player can pick the run up on a second
 * device. `cloud.get()` returns a Promise<string | null> for boot-time
 * merging. Both no-op silently without SDK.
 * ========================================================================== */

import { ui } from '../dom';
import { wait } from '../utils/format';
import type { Game } from '../game';

interface CrazyGamesSDK {
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
    sdkGameLoadingStart?: () => void;
    sdkGameLoadingStop?: () => void;
  };
  ad?: { requestAd?: (type: 'rewarded' | 'midgame') => Promise<unknown> };
  user?: {
    getUser?: () => Promise<{ username?: string; profilePictureUrl?: string } | null>;
  };
  data?: {
    setItem?: (key: string, value: string) => void | Promise<void>;
    getItem?: (key: string) => string | null | Promise<string | null>;
    removeItem?: (key: string) => void | Promise<void>;
  };
}
interface CrazyGamesGlobal {
  CrazyGames?: { SDK?: CrazyGamesSDK };
}

function sdk(): CrazyGamesSDK | undefined {
  return (window as unknown as CrazyGamesGlobal).CrazyGames?.SDK;
}

/** Interval (ms) between midgame interstitials. CrazyGames recommends ≥ 4 min. */
const MID_COOLDOWN_MS = 4 * 60 * 1000;

export class AdBridge {
  game: Game;
  busy = false;
  /** Timestamp (ms) of the last interstitial we triggered. */
  private lastMidAt = 0;

  constructor(game: Game) {
    this.game = game;
  }

  async rewarded(reason: string, fn: () => void): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.game.paused = true;
    this.show(
      'Rewarded Ad',
      reason + ' Demo fallback grants the reward when the CrazyGames SDK is unavailable.',
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
      // Surface failures gracefully — we never punish the player for a
      // network/SDK hiccup. The reward goes through regardless.
      await wait(500);
      ok = true;
    }
    this.hide();
    this.game.paused = false;
    this.busy = false;
    if (ok) {
      fn();
      this.game.toast('Reward claimed.');
      // Award a happytime — this is a great moment for the SDK to know about.
      this.happytime();
    } else {
      this.game.toast('Reward not completed.');
    }
  }

  /**
   * Fire a midgame interstitial. Respects the MID_COOLDOWN_MS gate so we
   * never blast the player at zone-unlock-after-zone-unlock. Pass
   * `force: true` for events the spec marks as always-okay (prestige).
   */
  async mid(reason: string, force = false): Promise<void> {
    if (this.busy) return;
    const now = Date.now();
    if (!force && now - this.lastMidAt < MID_COOLDOWN_MS) {
      // Cooldown still active — silently skip. Cheap and safe.
      this.happytime();
      return;
    }
    this.lastMidAt = now;
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
    this.happytime();
  }

  /** Tell the SDK we're at a safe break. No-op when the SDK isn't loaded. */
  happytime(): void {
    try {
      sdk()?.game?.happytime?.();
    } catch (_e) {
      // Surface no error — happytime is best-effort.
    }
  }

  show(t: string, p: string): void {
    ui.adTitle.textContent = t;
    ui.adText.textContent = p;
    ui.adBox.classList.remove('hidden');
  }

  hide(): void {
    ui.adBox.classList.add('hidden');
  }

  // ============================ Cloud sync ============================

  /**
   * Pull a previously synced save from the SDK key-value store. Returns
   * `null` when SDK is absent, the key is missing, or the call fails for
   * any reason — never throws.
   */
  async cloudGet(key: string): Promise<string | null> {
    try {
      const fn = sdk()?.data?.getItem;
      if (!fn) return null;
      const v = await fn(key);
      return typeof v === 'string' ? v : null;
    } catch (_e) {
      return null;
    }
  }

  /** Persist a save blob to the SDK store. No-op without SDK. */
  async cloudPut(key: string, value: string): Promise<void> {
    try {
      const fn = sdk()?.data?.setItem;
      if (!fn) return;
      await fn(key, value);
    } catch (_e) {
      // Best-effort. localStorage already has the canonical copy.
    }
  }

  /**
   * Resolve the player's CrazyGames username, falling back to "Scrapper"
   * when the SDK isn't available or doesn't expose one.
   */
  async username(): Promise<string> {
    try {
      const u = await sdk()?.user?.getUser?.();
      if (u?.username) return u.username;
    } catch (_e) {
      /* no-op */
    }
    return 'Scrapper';
  }
}
