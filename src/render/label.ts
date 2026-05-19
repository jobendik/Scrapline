/* ============================================================================
 * label — pill-shaped label above a building. Optional subtitle.
 * ========================================================================== */

import { ctx } from '../canvas';
import { rr } from '../utils/format';

export function label(t: string, x: number, y: number, sub?: string): void {
  ctx.save();
  ctx.font = '950 16px Segoe UI,Arial';
  ctx.textAlign = 'center';
  const w =
    Math.max(ctx.measureText(t).width, sub ? ctx.measureText(sub).width * 0.82 : 0) + 36;
  const h = sub ? 55 : 32;
  rr(ctx, x - w / 2, y - h / 2, w, h, 16);
  ctx.fillStyle = 'rgba(2,7,16,.52)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.stroke();
  ctx.fillStyle = '#e5fbff';
  ctx.fillText(t, x, y - (sub ? 9 : 0));
  if (sub) {
    ctx.font = '800 11px Segoe UI,Arial';
    ctx.fillStyle = 'rgba(229,251,255,.62)';
    ctx.fillText(sub, x, y + 14);
  }
  ctx.restore();
}
