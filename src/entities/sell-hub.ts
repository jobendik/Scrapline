/* ============================================================================
 * SellHub — drop-off for finished products. Each sale credits cash, awards
 * XP, ticks several stats and spawns a celebratory burst.
 * ========================================================================== */

import { ctx } from '../canvas';
import { TAU } from '../constants';
import { ITEM } from '../data/items';
import { money } from '../utils/format';
import { drawZone } from '../render/draw-zone';
import { label } from '../render/label';
import type { Camera } from '../core/camera';
import type { Game } from '../game';

export class SellHub {
  x: number;
  y: number;
  r = 140;
  phase = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, _game: Game): void {
    this.phase += dt;
  }

  sell(type: string, game: Game, x?: number, y?: number): void {
    const base = ITEM[type].value * game.valueMult();
    // Lucky Routing — chance to crit a sale to 2× payout.
    const crit = Math.random() < game.critChance();
    const val = Math.floor(base * (crit ? 2 : 1));
    game.state.cash += val;
    game.state.totalCash += val;
    game.stats('cashEarned', val);
    game.stats('sold', 1);
    game.stats(type + 'Sold', 1);
    game.xp += val * 0.035;
    const popColor = crit ? '#ffd45c' : '#45ff93';
    const popText = crit ? '+' + money(val) + ' ✦CRIT' : '+' + money(val);
    game.text(x || this.x, (y || this.y) - 60, popText, popColor, crit ? 20 : 18);
    game.particles.burst(x || this.x, y || this.y, ITEM[type].color, crit ? 24 : 14, crit ? 240 : 160, 20);
    game.audio.deposit();
    // Recycler upgrade may grant a free raw deposit.
    game.onProductSold(type);
  }

  draw(_cam: Camera, _game: Game): void {
    drawZone(this.x, this.y, this.r, '#ffd45c', 0.07, 0.34, this.phase);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#ffd45c';
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(58,39,5,.77)';
    ctx.strokeStyle = '#ffd45c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd45c';
    ctx.font = '950 56px Segoe UI,Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 3);
    ctx.restore();
    label('SELL HUB', this.x, this.y - this.r - 40, 'Components → cash');
  }
}
