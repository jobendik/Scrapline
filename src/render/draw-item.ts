/* ============================================================================
 * drawItem — single procedurally-drawn item icon.
 * Switches on the item's `shape` field; every shape is drawn at unit scale
 * relative to `size` so callers can vary scale freely.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { rr } from '../utils/format';

export function drawItem(type: string, x: number, y: number, size = 14, scale = 1, rot = 0): void {
  const def = ITEM[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = def.color;
  ctx.strokeStyle = 'rgba(255,255,255,.28)';
  ctx.lineWidth = 1.5;
  if (def.shape === 'hex') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const px = Math.cos(a) * size;
      const py = Math.sin(a) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.75, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.75, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? size * 0.45 : size;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'cube' || def.shape === 'rect') {
    rr(ctx, -size * 0.8, -size * 0.45, size * 1.6, size * 0.9, 4);
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'lens') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.85, size * 0.48, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'capsule') {
    rr(ctx, -size * 0.85, -size * 0.42, size * 1.7, size * 0.84, size * 0.42);
    ctx.fill();
    ctx.stroke();
  } else if (def.shape === 'ring') {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, TAU);
    ctx.arc(0, 0, size * 0.48, 0, TAU, true);
    ctx.fill('evenodd');
    ctx.stroke();
  }
  ctx.restore();
}
