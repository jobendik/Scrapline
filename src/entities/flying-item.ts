/* ============================================================================
 * FlyingItem — short-lived projectile used for pickup -> player and
 * player -> deposit animations. `getTarget` is called each frame so it can
 * track a moving destination (the player).
 * ========================================================================== */

import { TAU } from '../constants';
import { lerp, rand } from '../utils/math';
import { drawItem } from '../render/draw-item';
import type { Camera } from '../core/camera';
import type { Vec2 } from '../types';

export class FlyingItem {
  type: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  getTarget: () => Vec2;
  onArrive?: () => void;
  t = 0;
  speed: number;
  curve: number;
  dead = false;
  rot: number;

  constructor(
    type: string,
    x: number,
    y: number,
    getTarget: () => Vec2,
    onArrive?: () => void,
    speed = 3,
    curve = 60,
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.sx = x;
    this.sy = y;
    this.getTarget = getTarget;
    this.onArrive = onArrive;
    this.speed = speed;
    this.curve = curve;
    this.rot = rand(0, TAU);
  }

  update(dt: number): void {
    this.t = Math.min(1, this.t + dt * this.speed);
    const e = this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2;
    const t = this.getTarget();
    this.x = lerp(this.sx, t.x, e);
    this.y = lerp(this.sy, t.y, e) - Math.sin(this.t * Math.PI) * this.curve;
    this.rot += dt * 6;
    if (this.t >= 1) {
      this.dead = true;
      this.onArrive?.();
    }
  }

  draw(cam: Camera): void {
    if (cam.on(this.x, this.y, 90))
      drawItem(this.type, this.x, this.y, 15, 1 + Math.sin(this.t * Math.PI) * 0.35, this.rot);
  }
}
