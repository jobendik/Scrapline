/* ============================================================================
 * Player — the controllable craft. Magnet-pickups any non-targeted item
 * within `magnet` radius, auto-deposits raws at Core / products at Sell when
 * standing in their rings.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { ZONES } from '../data/zones';
import { d2, dist, len, lerp } from '../utils/math';
import { money } from '../utils/format';
import { drawItem } from '../render/draw-item';
import { FlyingItem } from './flying-item';
import type { Camera } from '../core/camera';
import type { Game } from '../game';

interface TrailPoint {
  x: number;
  y: number;
  r: number;
}

/**
 * Item-id → tier lookup. Raw items are tiered by the zone they spawn in;
 * products inherit their raw's tier. Used by Selective Magnet to skip
 * low-tier items when the player is carrying high-tier ones.
 */
const TIER_OF: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const z of ZONES) {
    out[z.raw] = z.tier;
    const prod = ITEM[z.raw]?.product;
    if (prod) out[prod] = z.tier;
  }
  return out;
})();

export class Player {
  x = -90;
  y = -120;
  vx = 0;
  vy = 0;
  angle = 0;
  carry: string[] = [];
  trail: TrailPoint[];
  private game!: Game;

  constructor() {
    this.trail = Array.from({ length: 80 }, () => ({ x: this.x, y: this.y, r: 0 }));
  }

  bind(game: Game): void {
    this.game = game;
  }

  get speed(): number {
    return 230 * (1 + this.game.up('speed') * 0.08) * (this.game.isFrenzy() ? 1.55 : 1);
  }
  get capacity(): number {
    if (this.game.isFrenzy()) return 999;
    return 20 + this.game.up('capacity') * 7 + this.game.tree('t_cargo') * 4;
  }
  get magnet(): number {
    const treeMagnet = this.game.tree('t_magnet') * 0.05 + this.game.tree('t_magnet2') * 0.10;
    return 128 * (1 + this.game.up('magnet') * 0.12 + treeMagnet) * (this.game.isFrenzy() ? 1.7 : 1);
  }

  update(dt: number, game: Game): void {
    const ax = game.input.axis.x;
    const ay = game.input.axis.y;
    this.vx += ax * this.speed * dt * 9;
    this.vy += ay * this.speed * dt * 9;
    const fr = ax || ay ? 0.04 : 0.006;
    this.vx *= Math.pow(fr, dt);
    this.vy *= Math.pow(fr, dt);
    const l = len(this.vx, this.vy);
    const max = this.speed * 1.06;
    if (l > max) {
      this.vx = (this.vx / l) * max;
      this.vy = (this.vy / l) * max;
    }
    const px = this.x;
    const py = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (l > 15) this.angle = Math.atan2(this.vy, this.vx);
    const z = game.lockedAt(this.x, this.y);
    if (z) {
      this.x = px;
      this.y = py;
      this.vx *= -0.22;
      this.vy *= -0.22;
      game.status(`Unlock ${z.name} for ${money(z.cost)} to enter.`, 0.7);
    }
    this.pickup(game);
    this.deposit(game);
    this.updateTrail(dt);
    if (Math.random() < (dt * l) / 25)
      game.particles.trail(
        this.x - Math.cos(this.angle) * 20,
        this.y - Math.sin(this.angle) * 20,
        game.isFrenzy() ? '#ff43df' : '#38f8ff',
      );
  }

  pickup(game: Game): void {
    if (this.carry.length >= this.capacity) return;

    // Selective Magnet — skip raws that are at least N tiers below our best
    // carried tier. Cheap: compute the highest carried raw tier once.
    const filterLvl = this.game.up('magnetFilter');
    let minTier = 0;
    if (filterLvl > 0 && this.carry.length > 0) {
      let maxCarried = 0;
      for (const t of this.carry) {
        const tier = TIER_OF[t] || 0;
        if (tier > maxCarried) maxCarried = tier;
      }
      if (maxCarried > 0) minTier = maxCarried - filterLvl;
    }

    let best = null;
    let bi = -1;
    let bd = this.magnet * this.magnet;
    for (let i = 0; i < game.items.length; i++) {
      const it = game.items[i];
      if (it.targeted) continue;
      if (minTier > 0 && (TIER_OF[it.type] || 0) < minTier) continue;
      const dd = d2(this.x, this.y, it.x, it.y);
      if (dd < bd) {
        bd = dd;
        best = it;
        bi = i;
      }
    }
    if (best) {
      game.items.splice(bi, 1);
      best.targeted = true;
      const picked = best;
      game.flying.push(
        new FlyingItem(
          picked.type,
          picked.x,
          picked.y,
          () => ({ x: this.x, y: this.y - 28 }),
          () => {
            if (this.carry.length < this.capacity) {
              this.carry.push(picked.type);
              game.audio.pickup();
              game.stats(ITEM[picked.type].kind === 'raw' ? 'collected' : 'productsPicked', 1);
              game.particles.burst(this.x, this.y - 22, ITEM[picked.type].color, 5, 75, 10);
            }
          },
          3.5,
          70,
        ),
      );
    }
  }

  deposit(game: Game): void {
    if (!this.carry.length) return;
    if (dist(this.x, this.y, game.core.x, game.core.y) < game.core.r + 25) {
      const i = this.carry.findIndex((t) => ITEM[t].kind === 'raw');
      if (i >= 0) {
        const t = this.carry.splice(i, 1)[0];
        game.flying.push(
          new FlyingItem(
            t,
            this.x,
            this.y - 24,
            () => ({ x: game.core.x, y: game.core.y }),
            () => game.core.deposit(t, 1, game),
            3.2,
            60,
          ),
        );
        return;
      }
    }
    if (dist(this.x, this.y, game.sell.x, game.sell.y) < game.sell.r + 25) {
      const i = this.carry.findIndex((t) => ITEM[t].kind === 'product');
      if (i >= 0) {
        const t = this.carry.splice(i, 1)[0];
        game.flying.push(
          new FlyingItem(
            t,
            this.x,
            this.y - 24,
            () => ({ x: game.sell.x, y: game.sell.y }),
            () => game.sell.sell(t, game, game.sell.x, game.sell.y - 50),
            3.2,
            60,
          ),
        );
      }
    }
  }

  updateTrail(dt: number): void {
    const l = len(this.vx, this.vy);
    const nx = l > 1 ? -this.vx / l : 0;
    const ny = l > 1 ? -this.vy / l : -1;
    let tx = this.x + nx * 30;
    let ty = this.y + ny * 30 - 18;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const f = 1 - Math.pow(0.0001, dt * (1 + i * 0.025));
      p.x = lerp(p.x, tx + Math.sin(this.game.time * 7 + i * 0.7) * Math.min(8, l / 45), f);
      p.y = lerp(p.y, ty - i * 5, f);
      p.r = lerp(p.r, Math.sin(this.game.time * 5 + i) * 0.25 + this.vx * 0.0007, f);
      tx = p.x;
      ty = p.y + 5;
    }
  }

  draw(_cam: Camera, game: Game): void {
    for (let i = Math.min(this.carry.length, 48) - 1; i >= 0; i--) {
      const p = this.trail[i];
      const col = i % 6;
      const row = (i / 6) | 0;
      drawItem(this.carry[i], p.x + (col - 2.5) * 7, p.y - row * 5, 9, 0.88, p.r);
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (game.isFrenzy()) {
      ctx.shadowColor = '#ff43df';
      ctx.shadowBlur = 34;
      ctx.strokeStyle = 'rgba(255,67,223,.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 42 + Math.sin(game.time * 10) * 5, 0, TAU);
      ctx.stroke();
    }
    ctx.shadowColor = '#38f8ff';
    ctx.shadowBlur = 22;
    ctx.fillStyle = 'rgba(13,45,77,.95)';
    ctx.strokeStyle = '#38f8ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(31, 0);
    ctx.lineTo(-20, -20);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-20, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.carry.length ? '#45ff93' : '#e5fbff';
    ctx.beginPath();
    ctx.arc(-4, 0, 7, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(56,248,255,.13)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.magnet, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}
