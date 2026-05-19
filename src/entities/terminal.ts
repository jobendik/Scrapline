/* ============================================================================
 * Terminal — the Upgrade Terminal. Reports whether the player is standing on
 * it (so the upgrade panel knows when to enable purchases).
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { dist } from '../utils/math';
import { drawZone } from '../render/draw-zone';
import { label } from '../render/label';
import type { Camera } from '../core/camera';
import type { Game } from '../game';

export class Terminal {
  x: number;
  y: number;
  r = 135;
  phase = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, game: Game): void {
    this.phase += dt;
    game.nearShop = dist(game.player.x, game.player.y, this.x, this.y) < this.r;
  }

  draw(_cam: Camera, game: Game): void {
    drawZone(
      this.x,
      this.y,
      this.r,
      game.nearShop ? '#ff43df' : '#a476ff',
      game.nearShop ? 0.12 : 0.06,
      game.nearShop ? 0.55 : 0.28,
      this.phase,
    );
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.phase) * 0.08);
    ctx.shadowColor = '#ff43df';
    ctx.shadowBlur = game.nearShop ? 28 : 14;
    ctx.strokeStyle = game.nearShop ? '#ff43df' : '#a476ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 6;
      const x = Math.cos(a) * 56;
      const y = Math.sin(a) * 56;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = game.nearShop ? 'rgba(255,67,223,.17)' : 'rgba(164,118,255,.11)';
    ctx.fill();
    ctx.fillStyle = '#e5fbff';
    ctx.font = '950 36px Segoe UI,Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑', 0, -2);
    ctx.restore();
    label('UPGRADE TERMINAL', this.x, this.y - this.r - 40, 'Stand here for upgrades');
  }
}
