/* ============================================================================
 * TextPop — short-lived floating text used for +$values, LEVEL UPs, etc.
 * Lives in the per-frame `texts` array on the Game singleton.
 * ========================================================================== */

import { ctx } from '../canvas';
import { clamp } from '../utils/math';
import type { Camera } from './camera';

export class TextPop {
  x: number;
  y: number;
  t: string;
  c: string;
  s: number;
  life = 1.1;
  max = 1.1;
  vy = -48;

  constructor(x: number, y: number, t: string, c = '#e5fbff', s = 18) {
    this.x = x;
    this.y = y;
    this.t = t;
    this.c = c;
    this.s = s;
  }

  /** Returns true while the pop is still alive (Game splices when this goes false). */
  update(dt: number): boolean {
    this.life -= dt;
    this.y += this.vy * dt;
    this.vy *= Math.pow(0.25, dt);
    return this.life > 0;
  }

  draw(cam: Camera): void {
    if (!cam.on(this.x, this.y, 100)) return;
    const a = clamp(this.life / this.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `950 ${this.s}px Segoe UI,Arial`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,.65)';
    ctx.strokeText(this.t, this.x, this.y);
    ctx.fillStyle = this.c;
    ctx.shadowColor = this.c;
    ctx.shadowBlur = 12 * a;
    ctx.fillText(this.t, this.x, this.y);
    ctx.restore();
  }
}
