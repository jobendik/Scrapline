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
  } else if (def.shape === 'gear') {
    // 8-tooth cog. Two alternating radii give the gear silhouette.
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * TAU;
      const r = i % 2 ? size : size * 0.7;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner hub.
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.32, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.stroke();
  } else if (def.shape === 'crystal') {
    // Tall elongated diamond suggesting a dark-matter shard.
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.15);
    ctx.lineTo(size * 0.55, -size * 0.2);
    ctx.lineTo(size * 0.4, size * 0.95);
    ctx.lineTo(-size * 0.4, size * 0.95);
    ctx.lineTo(-size * 0.55, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner highlight ridge.
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.15);
    ctx.lineTo(0, size * 0.95);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.stroke();
  } else if (def.shape === 'prism') {
    // Upward triangle with a horizontal split line.
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.92, size * 0.7);
    ctx.lineTo(-size * 0.92, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.05);
    ctx.lineTo(size * 0.4, -size * 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.stroke();
  } else if (def.shape === 'vortex') {
    // Concentric rings + radial spokes — a procedural "vortex" badge.
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.moveTo(Math.cos(a) * size * 0.25, Math.sin(a) * size * 0.25);
      ctx.lineTo(Math.cos(a) * size * 0.92, Math.sin(a) * size * 0.92);
    }
    ctx.stroke();
  } else if (def.shape === 'sigil') {
    // Hex with a cross + dot — reads as a runic sigil.
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.PI / 6;
      const px = Math.cos(a) * size;
      const py = Math.sin(a) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(0, size * 0.6);
    ctx.moveTo(-size * 0.6, 0);
    ctx.lineTo(size * 0.6, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
