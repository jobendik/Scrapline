/* ============================================================================
 * Core — the central forge. Accepts raw items, forges them into matching
 * products one at a time. Forging speed scales with the `processor` upgrade
 * and Frenzy mode.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { rand } from '../utils/math';
import { rr } from '../utils/format';
import { drawZone } from '../render/draw-zone';
import { label } from '../render/label';
import { progressCircle } from '../render/progress-circle';
import { GroundItem } from './ground-item';
import type { Camera } from '../core/camera';
import type { Game } from '../game';

export class Core {
  x: number;
  y: number;
  r = 150;
  phase = 0;
  queue: string[] = [];
  progress = 0;
  lastOut = 0;
  /** Set by Game.init so the speed getter can reach the game singleton. */
  private game!: Game;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** Game injects itself after construction to break the circular import. */
  bind(game: Game): void {
    this.game = game;
  }

  get speed(): number {
    return 1.2 * (1 + this.game.up('processor') * 0.14) * (this.game.isFrenzy() ? 1.6 : 1);
  }

  update(dt: number, game: Game): void {
    this.phase += dt;
    if (this.queue.length) {
      this.progress += dt * this.speed;
      if (this.progress >= 1) {
        this.progress -= 1;
        const raw = this.queue.shift()!;
        const prod = ITEM[raw].product!;
        const a = rand(0, TAU);
        const r = rand(70, 100);
        game.items.push(new GroundItem(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, prod));
        game.stats('processed', 1);
        game.stats(prod + 'Made', 1);
        game.text(this.x, this.y - 110, 'FORGED ' + ITEM[prod].name, ITEM[prod].color, 15);
        game.particles.burst(this.x, this.y, ITEM[prod].color, 18, 170, 20);
        game.audio.deposit();
      }
    } else {
      this.progress = 0;
    }
  }

  deposit(raw: string, n: number, game: Game): void {
    for (let i = 0; i < n; i++) this.queue.push(raw);
    game.particles.burst(this.x, this.y, ITEM[raw].color, 10, 120, 16);
  }

  draw(_cam: Camera, game: Game): void {
    drawZone(this.x, this.y, this.r, '#45ff93', 0.06, 0.28, this.phase);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.phase * 0.5);
    ctx.shadowColor = '#45ff93';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(6,44,31,.75)';
    ctx.strokeStyle = '#45ff93';
    ctx.lineWidth = 4;
    rr(ctx, -84, -58, 168, 116, 24);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-this.phase * 1.6);
    for (let i = 0; i < 10; i++) {
      ctx.rotate(TAU / 10);
      ctx.strokeStyle = i % 2 ? '#38f8ff' : '#45ff93';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(65, 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 25 + Math.sin(game.time * 5) * 4, 0, TAU);
    ctx.fillStyle = '#eafff3';
    ctx.fill();
    ctx.restore();
    label('NEON CORE', this.x, this.y - this.r - 40, 'Raw scrap → components');
    if (this.queue.length)
      progressCircle(this.x, this.y - 112, 34, this.progress, '#45ff93', this.queue.length + ' queued');
  }
}
