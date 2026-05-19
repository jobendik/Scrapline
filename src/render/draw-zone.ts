/* ============================================================================
 * drawZone — pulsing aura under a major building / resource node.
 * `c` is the accent color, `fa`/`sa` are fill / stroke alpha factors.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { hexA } from '../utils/format';

export function drawZone(
  x: number,
  y: number,
  r: number,
  c: string,
  fa: number,
  sa: number,
  phase: number,
): void {
  ctx.save();
  ctx.fillStyle = hexA(c, fa);
  ctx.beginPath();
  ctx.arc(x, y, r + Math.sin(phase * 2) * 3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexA(c, sa);
  ctx.lineWidth = 4;
  ctx.shadowColor = c;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 22, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
