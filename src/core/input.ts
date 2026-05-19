/* ============================================================================
 * Input — keyboard + virtual joystick.
 *
 * `axis` is a normalized -1..1 vector consumed by Player.update each frame.
 * Pointer events live on the canvas so multi-touch on mobile works without
 * fighting browser scroll (canvas has touch-action: none in CSS).
 * ========================================================================== */

import { canvas } from '../canvas';
import { ui } from '../dom';

interface Pointer {
  active: boolean;
  id: number | null;
  sx: number;
  sy: number;
  x: number;
  y: number;
}

export class Input {
  keys = new Set<string>();
  axis = { x: 0, y: 0 };
  p: Pointer = { active: false, id: null, sx: 0, sy: 0, x: 0, y: 0 };

  constructor() {
    addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    canvas.addEventListener('lostpointercapture', () => this.cancel());
  }

  down(e: PointerEvent): void {
    if (this.p.active) return;
    this.p = { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    this.pad();
    e.preventDefault();
  }
  move(e: PointerEvent): void {
    if (!this.p.active || e.pointerId !== this.p.id) return;
    this.p.x = e.clientX;
    this.p.y = e.clientY;
    this.pad();
    e.preventDefault();
  }
  up(e: PointerEvent): void {
    if (e.pointerId !== this.p.id) return;
    this.cancel();
  }
  cancel(): void {
    this.p.active = false;
    this.p.id = null;
    ui.mobileKnob.style.left = '42px';
    ui.mobileKnob.style.top = '42px';
  }

  pad(): void {
    if (!this.p.active) return;
    const dx = this.p.x - this.p.sx;
    const dy = this.p.y - this.p.sy;
    const l = Math.hypot(dx, dy) || 1;
    const r = Math.min(48, l);
    ui.mobilePad.style.left = this.p.sx - 64 + 'px';
    ui.mobilePad.style.top = this.p.sy - 64 + 'px';
    ui.mobileKnob.style.left = 42 + (dx / l) * r + 'px';
    ui.mobileKnob.style.top = 42 + (dy / l) * r + 'px';
  }

  update(): void {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x--;
    if (this.keys.has('d') || this.keys.has('arrowright')) x++;
    if (this.keys.has('w') || this.keys.has('arrowup')) y--;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y++;
    if (this.p.active) {
      const dx = this.p.x - this.p.sx;
      const dy = this.p.y - this.p.sy;
      const l = Math.hypot(dx, dy);
      if (l > 7) {
        x += dx / Math.max(70, l);
        y += dy / Math.max(70, l);
      }
    }
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    this.axis.x = x;
    this.axis.y = y;
  }
}
