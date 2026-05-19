/* ============================================================================
 * ResourceNode — one per zone. Spawns raw items inside its rect when the
 * zone is unlocked, throttled by the zone's `spawn` rate and `max`.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { d2, rand } from '../utils/math';
import { hexA, money } from '../utils/format';
import { drawZone } from '../render/draw-zone';
import { label } from '../render/label';
import { GroundItem } from './ground-item';
import type { Camera } from '../core/camera';
import type { Game } from '../game';
import type { ZoneDef } from '../types';

export class ResourceNode {
  zone: ZoneDef;
  x: number;
  y: number;
  r: number;
  timer = 0;
  phase: number;

  constructor(zone: ZoneDef) {
    this.zone = zone;
    this.x = zone.rect.x + zone.rect.w / 2;
    this.y = zone.rect.y + zone.rect.h / 2;
    this.r = 120 + zone.tier * 15;
    this.phase = rand(0, TAU);
  }

  count(game: Game): number {
    let c = 0;
    for (const it of game.items)
      if (it.type === this.zone.raw && d2(it.x, it.y, this.x, this.y) < this.r * this.r * 1.6) c++;
    return c;
  }

  update(dt: number, game: Game): void {
    if (!game.state.zones[this.zone.id]) return;
    this.phase += dt;
    this.timer += dt;
    const rate = this.zone.spawn * (1 + game.up('spawn') * 0.1) * (game.isFrenzy() ? 3.2 : 1);
    while (this.timer > 1 / rate && this.count(game) < this.zone.max * (game.isFrenzy() ? 1.25 : 1)) {
      this.timer -= 1 / rate;
      const a = rand(0, TAU);
      const r = Math.sqrt(Math.random()) * this.r * 0.78;
      game.items.push(new GroundItem(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, this.zone.raw));
    }
  }

  draw(cam: Camera, game: Game): void {
    const on = game.state.zones[this.zone.id];
    if (!cam.on(this.x, this.y, this.r + 220)) return;
    drawZone(this.x, this.y, this.r, on ? this.zone.color : '#546070', on ? 0.08 : 0.035, on ? 0.34 : 0.12, this.phase);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.zone.color;
    ctx.shadowBlur = on ? 26 : 6;
    ctx.fillStyle = on ? hexA(this.zone.color, 0.18) : 'rgba(255,255,255,.05)';
    ctx.strokeStyle = on ? this.zone.color : 'rgba(255,255,255,.16)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8;
      const rr = i % 2 ? 44 : 62;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.84;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = on ? this.zone.color : 'rgba(255,255,255,.35)';
    ctx.font = '950 34px Segoe UI,Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ITEM[this.zone.raw].name.split(' ')[0], 0, 2);
    ctx.restore();
    label(this.zone.name, this.x, this.y - this.r - 38, on ? 'Raw material source' : 'Locked zone: ' + money(this.zone.cost));
  }
}
