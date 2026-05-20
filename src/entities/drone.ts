/* ============================================================================
 * Drone — autonomous worker. State machine: search -> toItem -> toCore/toSell
 * -> back to search. Picks the nearest non-targeted item via game.findDroneTarget.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { DRONE_TYPES, droneTypeForSlot } from '../data/drones';
import { dist, lerp, rand } from '../utils/math';
import { drawItem } from '../render/draw-item';
import type { Camera } from '../core/camera';
import type { Game } from '../game';
import type { GroundItem } from './ground-item';
import type { DroneType } from '../data/drones';

type DroneState = 'search' | 'toItem' | 'toCore' | 'toSell';

export class Drone {
  i: number;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  carry: string | null = null;
  target: GroundItem | null = null;
  state: DroneState = 'search';
  phase: number;
  delay: number;
  type: DroneType;
  private game!: Game;

  constructor(i: number, x = 200, y = 200) {
    this.i = i;
    this.x = x;
    this.y = y;
    this.phase = rand(0, TAU);
    this.delay = rand(0, 0.4);
    this.type = droneTypeForSlot(i);
  }

  bind(game: Game): void {
    this.game = game;
  }

  get def() { return DRONE_TYPES[this.type]; }

  get speed(): number {
    // droneSpeed upgrade adds 14% per level on top of the base + per-drone-tier scaling.
    // Multiply by the drone-type speedMult so Haulers feel sluggish vs Elites.
    const base = 190 + this.game.up('drone') * 12 + (this.game.isFrenzy() ? 90 : 0);
    return base * (1 + this.game.up('droneSpeed') * 0.14) * this.def.speedMult;
  }

  update(dt: number, game: Game): void {
    this.phase += dt;
    this.delay -= dt;
    if (Math.random() < dt * 5) game.particles.trail(this.x, this.y, this.def.color);
    if (this.state === 'search') {
      if (this.delay > 0) return;
      this.target = game.findDroneTarget(this);
      if (this.target) {
        this.target.targeted = true;
        this.state = 'toItem';
      } else {
        this.delay = 0.35;
      }
    } else if (this.state === 'toItem') {
      if (!this.target || !game.items.includes(this.target)) {
        this.state = 'search';
        this.target = null;
        return;
      }
      this.move(this.target.x, this.target.y, dt);
      if (dist(this.x, this.y, this.target.x, this.target.y) < 28) {
        const type = this.target.type;
        game.removeItem(this.target);
        this.carry = type;
        game.particles.burst(this.x, this.y, ITEM[type].color, 6, 90, 12);
        this.state = ITEM[type].kind === 'raw' ? 'toCore' : 'toSell';
        this.target = null;
      }
    } else if (this.state === 'toCore') {
      this.move(game.core.x, game.core.y, dt);
      if (dist(this.x, this.y, game.core.x, game.core.y) < 90) {
        if (this.carry) game.core.deposit(this.carry, 1, game);
        game.stats('collected', 1);
        this.carry = null;
        this.state = 'search';
        this.delay = rand(0.05, 0.25);
      }
    } else if (this.state === 'toSell') {
      this.move(game.sell.x, game.sell.y, dt);
      if (dist(this.x, this.y, game.sell.x, game.sell.y) < 95) {
        if (this.carry) {
          const goldRoll = Math.random() < this.def.goldChance;
          game.sell.sell(this.carry, game, this.x, this.y - 20, goldRoll ? 2 : 1);
          if (goldRoll) {
            game.particles.burst(this.x, this.y - 20, '#ffd45c', 18, 220, 22);
          }
        }
        this.carry = null;
        this.state = 'search';
        this.delay = rand(0.05, 0.25);
      }
    }
  }

  move(tx: number, ty: number, dt: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const l = Math.hypot(dx, dy) || 1;
    const sp = this.speed;
    this.vx = lerp(this.vx, (dx / l) * sp, 1 - Math.pow(0.001, dt));
    this.vy = lerp(this.vy, (dy / l) * sp, 1 - Math.pow(0.001, dt));
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(cam: Camera): void {
    if (!cam.on(this.x, this.y, 90)) return;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.phase * 4) * 4);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    ctx.shadowColor = this.def.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(25,15,54,.9)';
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.def.accent;
    ctx.beginPath();
    ctx.arc(7, -4, 3, 0, TAU);
    ctx.arc(7, 5, 3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(-14, 0);
    ctx.moveTo(24, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    if (this.carry) drawItem(this.carry, -2, -30, 10, 1, this.phase);
    ctx.restore();
  }
}
