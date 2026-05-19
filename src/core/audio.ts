/* ============================================================================
 * AudioSys — procedural WebAudio SFX.
 *
 * Lazy-initialized on first user gesture (iOS requires a touch/click before
 * any AudioContext starts), then exposes one-shot beeps + a per-frame tick
 * that hums a tonal scale (different scale + speed when Frenzy is active).
 * ========================================================================== */

import { rand } from '../utils/math';

interface ExtWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export class AudioSys {
  ctx: AudioContext | null = null;
  on = false;
  master: GainNode | null = null;
  next = 0;
  beat = 0;

  ensure(): void {
    if (this.ctx) return;
    const W = window as ExtWindow;
    const A = window.AudioContext || W.webkitAudioContext;
    if (!A) return;
    this.ctx = new A();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.15;
    this.master.connect(this.ctx.destination);
  }

  async toggle(): Promise<boolean> {
    this.ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.on = !this.on;
    return this.on;
  }

  beep(f: number, d: number, type: OscillatorType = 'sine', gain = 0.07, bend = 1): void {
    if (!this.on || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (bend !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * bend), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + d + 0.03);
  }

  pickup(): void { this.beep(rand(560, 780), 0.055, 'triangle', 0.04, 1.2); }
  deposit(): void {
    this.beep(220, 0.12, 'sawtooth', 0.06, 1.9);
    this.beep(480, 0.08, 'triangle', 0.04, 1.2);
  }
  buy(): void {
    this.beep(390, 0.08, 'triangle', 0.06, 1.7);
    setTimeout(() => this.beep(650, 0.09, 'triangle', 0.045, 1.2), 65);
  }
  err(): void { this.beep(140, 0.15, 'square', 0.05, 0.7); }
  surge(): void { this.beep(105, 0.35, 'sawtooth', 0.08, 3.4); }

  tick(frenzy: boolean, _dt: number): void {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (t < this.next) return;
    const scale = frenzy ? [110, 165, 220, 330, 440, 660] : [82.4, 123.5, 164.8, 246.9, 329.6];
    this.beep(
      scale[this.beat % scale.length],
      frenzy ? 0.075 : 0.11,
      this.beat % 4 ? 'triangle' : 'sawtooth',
      frenzy ? 0.04 : 0.022,
      1.01,
    );
    this.beat++;
    this.next = t + (frenzy ? 0.22 : 0.48);
  }
}
