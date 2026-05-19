/* ============================================================================
 * GroundItem — a raw or product item sitting in the world waiting for pickup.
 * Spawned by ResourceNode (raw) or by the Core (product).
 * ========================================================================== */

import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { rand } from '../utils/math';
import { drawItem } from '../render/draw-item';
import type { Camera } from '../core/camera';
import type { ItemDef } from '../types';

export class GroundItem {
  x: number;
  y: number;
  type: string;
  def: ItemDef;
  rot: number;
  age: number;
  size: number;
  targeted = false;

  constructor(x: number, y: number, type: string) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.def = ITEM[type];
    this.rot = rand(0, TAU);
    this.age = rand(0, 10);
    this.size = this.def.kind === 'raw' ? 15 : 18;
  }

  update(dt: number): void {
    this.age += dt;
    this.rot += dt * (this.def.kind === 'raw' ? 1.2 : 2);
  }

  draw(cam: Camera): void {
    if (!cam.on(this.x, this.y, 90)) return;
    drawItem(this.type, this.x, this.y + Math.sin(this.age * 3) * 2, this.size, 1, this.rot);
  }
}
