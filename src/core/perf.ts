/* ============================================================================
 * Performance auto-quality.
 *
 * The Graphics setting has four positions:
 *   - auto: sample frame time for the first ~5 seconds, then settle on a
 *     level. If average frame time > 22ms (i.e. < ~45fps) we downgrade.
 *   - high / medium / low: explicit player choice, no sampling.
 *
 * The chosen quality drives three knobs in the render loop:
 *   - particle cap (300 / 200 / 100)
 *   - parallax grid drawn? (yes / yes-thinned / no)
 *   - glow shadow blur multiplier (1 / 0.7 / 0)
 *
 * Other modules (game.draw etc.) read PerfState.snapshot() once per frame.
 * ========================================================================== */

import type { GfxQuality } from '../types';

export type ResolvedQuality = 'high' | 'medium' | 'low';

export interface PerfSnapshot {
  quality: ResolvedQuality;
  particleCap: number;
  parallax: 'full' | 'thin' | 'off';
  glowMult: number;
}

const QUALITY_TABLE: Record<ResolvedQuality, PerfSnapshot> = {
  high:   { quality: 'high',   particleCap: 300, parallax: 'full', glowMult: 1.0 },
  medium: { quality: 'medium', particleCap: 200, parallax: 'thin', glowMult: 0.7 },
  low:    { quality: 'low',    particleCap: 100, parallax: 'off',  glowMult: 0.0 },
};

class PerfImpl {
  private resolved: ResolvedQuality = 'high';
  private sampling = false;
  private sampleStart = 0;
  private sampleTotalMs = 0;
  private sampleFrames = 0;
  /** Hardware hints used to pick a starting quality before sampling. */
  private deviceLikelyLow = false;

  constructor() {
    this.deviceLikelyLow =
      (navigator.hardwareConcurrency || 8) <= 4 &&
      (window.devicePixelRatio || 1) < 2;
  }

  /** Apply a player setting. 'auto' triggers a fresh sampling window. */
  applySetting(q: GfxQuality): void {
    if (q === 'auto') {
      // Initial guess based on device hints; sampling may downgrade further.
      this.resolved = this.deviceLikelyLow ? 'medium' : 'high';
      this.sampling = true;
      this.sampleStart = performance.now();
      this.sampleTotalMs = 0;
      this.sampleFrames = 0;
    } else {
      this.resolved = q as ResolvedQuality;
      this.sampling = false;
    }
  }

  /**
   * Per-frame tick. Caller passes the frame's delta-time in seconds. Once
   * the sampling window finishes (5s) we lock in a resolved quality based
   * on the average frame time.
   */
  tick(dtSeconds: number): void {
    if (!this.sampling) return;
    this.sampleTotalMs += dtSeconds * 1000;
    this.sampleFrames += 1;
    if (performance.now() - this.sampleStart < 5000) return;
    // 5s window finished — decide.
    const avg = this.sampleTotalMs / Math.max(1, this.sampleFrames);
    this.sampling = false;
    if (avg > 28) this.resolved = 'low';
    else if (avg > 22) this.resolved = 'medium';
    else this.resolved = 'high';
  }

  snapshot(): PerfSnapshot {
    return QUALITY_TABLE[this.resolved];
  }

  quality(): ResolvedQuality { return this.resolved; }
}

export const Perf = new PerfImpl();
