/* ============================================================================
 * Haptics — tiny wrapper around navigator.vibrate.
 *
 * Per the design spec, every meaningful interaction gets a short pulse:
 *   pickup       8ms
 *   deposit     15ms
 *   sell        20ms
 *   levelUp     [50, 30, 50]
 *   zoneUnlock  [40, 60, 40, 60, 80]
 *   prestige    [60, 40, 60, 40, 120]
 *
 * Wrapped behind a single `Haptics.enabled` flag so the settings panel can
 * mute the entire surface. Defaults to ON on mobile, OFF on desktop.
 * ========================================================================== */

type Pattern = number | number[];

class HapticsImpl {
  /** Master mute. Settings panel writes through to this. */
  enabled = false;

  /** True only when the browser actually exposes the Vibrate API. */
  readonly supported: boolean =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  private fire(p: Pattern): void {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate(p);
    } catch (_e) {
      // Some browsers throw if called too often or before a user gesture.
      // Best-effort, swallow.
    }
  }

  pickup(): void { this.fire(8); }
  deposit(): void { this.fire(15); }
  sell(): void { this.fire(20); }
  buy(): void { this.fire(12); }
  err(): void { this.fire([6, 30, 6]); }
  levelUp(): void { this.fire([50, 30, 50]); }
  zoneUnlock(): void { this.fire([40, 60, 40, 60, 80]); }
  prestige(): void { this.fire([60, 40, 60, 40, 120]); }
  frenzy(): void { this.fire([20, 40, 20, 40, 60]); }
}

export const Haptics = new HapticsImpl();
