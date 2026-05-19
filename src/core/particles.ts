/* ============================================================================
 * Particle + Particles — additive glow puffs used for every juice moment.
 * Each particle decays its own life timer; the system culls dead ones once
 * per frame.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { clamp, rand } from '../utils/math';
import type { Camera } from './camera';

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  max: number;
  size: number;
  glow: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number, size: number, glow: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.max = life;
    this.size = size;
    this.glow = glow;
  }

  update(dt: number): void {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.06, dt);
    this.vy *= Math.pow(0.06, dt);
  }

  draw(): void {
    const a = clamp(this.life / this.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glow * a;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (0.3 + a), 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

export class Particles {
  a: Particle[] = [];
  /** Soft cap. Excess particles are dropped LIFO before being appended. */
  cap = 300;

  /** Radial burst — used for sells, deposits, frenzy starts, zone unlocks. */
  burst(x: number, y: number, c: string, n = 12, p = 150, g = 18): void {
    const room = Math.max(0, this.cap - this.a.length);
    const spawn = Math.min(n, room);
    for (let i = 0; i < spawn; i++) {
      const a = rand(0, TAU);
      const s = rand(p * 0.2, p);
      this.a.push(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, c, rand(0.25, 0.85), rand(2, 6), g));
    }
  }

  /** Light puff used by Player/Drone trails. */
  trail(x: number, y: number, c: string): void {
    if (this.a.length >= this.cap) return;
    this.a.push(
      new Particle(
        x + rand(-8, 8),
        y + rand(-8, 8),
        rand(-25, 25),
        rand(-25, 25),
        c,
        rand(0.14, 0.36),
        rand(1.5, 3.5),
        10,
      ),
    );
  }

  update(dt: number): void {
    for (const p of this.a) p.update(dt);
    this.a = this.a.filter((p) => p.life > 0);
  }

  draw(cam: Camera): void {
    for (const p of this.a) if (cam.on(p.x, p.y, 70)) p.draw();
  }
}
