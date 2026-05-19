/* ============================================================================
 * progressCircle — radial progress meter (e.g. Core forging queue).
 * `p` is in 0..1.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';

export function progressCircle(
  x: number,
  y: number,
  r: number,
  p: number,
  c: string,
  text: string,
): void {
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(255,255,255,.11)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.shadowColor = c;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * p);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '950 10px Segoe UI,Arial';
  ctx.fillStyle = '#e5fbff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}
