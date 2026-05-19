/* ============================================================================
 * Camera — smoothed follow + screen-shake.
 * `apply()` sets the canvas transform so subsequent draw calls are in world
 * coordinates. `sx`/`sy` project world -> screen for HUD overlays.
 * ========================================================================== */

import { ctx, view } from '../canvas';
import { lerp, rand } from '../utils/math';

export class Camera {
  x = 0;
  y = 0;
  shake = 0;

  update(target: { x: number; y: number }, dt: number): void {
    const t = 1 - Math.pow(0.001, dt);
    this.x = lerp(this.x, target.x, t);
    this.y = lerp(this.y, target.y, t);
    this.shake = Math.max(0, this.shake - dt * 18);
  }

  /**
   * Set the canvas transform to world-space. `punch` is a small extra zoom
   * factor used by milestone events (zone unlock, prestige) to give the
   * world a brief breathing motion.
   */
  apply(punch = 0): void {
    const scale = view.DPR * (1 + punch);
    ctx.setTransform(
      scale,
      0,
      0,
      scale,
      view.W / 2 - this.x * (1 + punch) + rand(-this.shake, this.shake),
      view.H / 2 - this.y * (1 + punch) + rand(-this.shake, this.shake),
    );
  }

  /** Project world X to screen X. */
  sx(x: number): number { return x - this.x + view.W / 2; }
  /** Project world Y to screen Y. */
  sy(y: number): number { return y - this.y + view.H / 2; }

  /** Cheap on-screen test with `p` pixel padding. */
  on(x: number, y: number, p = 150): boolean {
    return (
      this.sx(x) > -p &&
      this.sx(x) < view.W + p &&
      this.sy(y) > -p &&
      this.sy(y) < view.H + p
    );
  }
}
