/* ============================================================================
 * AudioSys — procedural WebAudio SFX + music.
 *
 * Lazy-initialized on first user gesture (iOS requires a touch/click before
 * any AudioContext starts). Exposes:
 *   - one-shot SFX (pickup, deposit, sell, buy, err, surge, levelUp,
 *     zoneUnlock, prestige) layered for richness;
 *   - a per-frame `tick(frenzy, dt)` that hums an ambient backing scale;
 *   - a per-frame `tickMusic(frenzy, dt, enabled)` that schedules a bass +
 *     lead loop, with a higher-BPM variant during Frenzy.
 *
 * Two separate GainNodes feed `master` — `sfxGain` for spikes, `musicGain`
 * for the loop — so the music level is independent of the SFX level.
 * ========================================================================== */

import { rand } from '../utils/math';

interface ExtWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/** Pentatonic scales used by the ambient tick. */
const SCALE_AMBIENT_CALM = [82.4, 123.5, 164.8, 246.9, 329.6];
const SCALE_AMBIENT_FRENZY = [110, 165, 220, 330, 440, 660];

/** Music: bass + lead note sequences. */
const MUSIC_BASS_CALM = [55, 73.4, 65.4, 82.4];
const MUSIC_LEAD_CALM = [220, 246.9, 329.6, 277.2, 246.9, 196, 329.6, 246.9];
const MUSIC_BASS_FRENZY = [82.4, 110, 98, 130.8];
const MUSIC_LEAD_FRENZY = [440, 523.3, 493.9, 587.3, 440, 493.9, 587.3, 659.3];

export class AudioSys {
  ctx: AudioContext | null = null;
  on = false;
  master: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  /** Ambient tick scheduler — when the next pad-style tick is due. */
  next = 0;
  beat = 0;

  // Music state
  musicOn = false;
  musicNextBass = 0;
  musicNextLead = 0;
  musicBassIdx = 0;
  musicLeadIdx = 0;
  /** Throttle for pickup SFX so a Frenzy burst doesn't blow the budget. */
  lastPickupAt = 0;

  ensure(): void {
    if (this.ctx) return;
    const W = window as ExtWindow;
    const A = window.AudioContext || W.webkitAudioContext;
    if (!A) return;
    this.ctx = new A();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1.0;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.55;
    this.musicGain.connect(this.master);
  }

  async toggle(): Promise<boolean> {
    this.ensure();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.on = !this.on;
    return this.on;
  }

  /** Lower-level helper. `bus` defaults to SFX; pass 'music' for music routing. */
  beep(f: number, d: number, type: OscillatorType = 'sine', gain = 0.07, bend = 1, bus: 'sfx' | 'music' = 'sfx'): void {
    if (!this.on || !this.ctx) return;
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
    const dest = bus === 'music' ? this.musicGain : this.sfxGain;
    g.connect(dest || this.master!);
    o.start(t);
    o.stop(t + d + 0.03);
  }

  /**
   * Pickup tone with optional tier-driven pitch shift. Throttled to one beep
   * per 150 ms so spammy magnet pulses don't burn the budget.
   */
  pickup(tier = 1): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastPickupAt < 0.15) return;
    this.lastPickupAt = now;
    const base = rand(560, 780);
    const tierMult = 1 + (Math.max(0, tier - 1)) * 0.16;
    this.beep(base * tierMult, 0.055, 'triangle', 0.04, 1.2);
  }

  /** Two-layer deposit — chunky thud + sparkle. */
  deposit(): void {
    this.beep(220, 0.12, 'sawtooth', 0.06, 1.9);
    this.beep(480, 0.08, 'triangle', 0.04, 1.2);
  }

  /** Upgrade purchase — short ascending arpeggio. */
  buy(): void {
    this.beep(390, 0.08, 'triangle', 0.06, 1.7);
    setTimeout(() => this.beep(520, 0.09, 'triangle', 0.05, 1.4), 65);
    setTimeout(() => this.beep(780, 0.09, 'triangle', 0.045, 1.2), 130);
  }

  err(): void {
    this.beep(140, 0.15, 'square', 0.05, 0.7);
  }

  /** Zone unlock / Frenzy — low rumble sweep. */
  surge(): void {
    this.beep(90, 0.45, 'sawtooth', 0.09, 3.6);
    setTimeout(() => this.beep(220, 0.3, 'triangle', 0.06, 2.4), 80);
    setTimeout(() => this.beep(440, 0.25, 'square', 0.04, 1.8), 220);
  }

  /** Level up — angelic chime stack. */
  levelUp(): void {
    this.beep(523, 0.18, 'triangle', 0.06, 1.6);
    setTimeout(() => this.beep(659, 0.18, 'triangle', 0.055, 1.6), 80);
    setTimeout(() => this.beep(784, 0.22, 'triangle', 0.05, 1.5), 170);
    setTimeout(() => this.beep(1047, 0.32, 'sine', 0.045, 1.3), 280);
  }

  /** Zone unlock — bigger swell on top of surge(). */
  zoneUnlock(): void {
    this.surge();
    setTimeout(() => {
      this.beep(330, 0.4, 'triangle', 0.08, 2.2);
      this.beep(495, 0.4, 'triangle', 0.06, 1.8);
    }, 400);
  }

  /** Prestige reset — warping bass drop. */
  prestige(): void {
    this.beep(220, 0.7, 'sawtooth', 0.12, 0.25);
    setTimeout(() => this.beep(110, 0.4, 'sawtooth', 0.1, 0.5), 220);
    setTimeout(() => this.beep(55, 0.6, 'square', 0.08, 0.8), 420);
  }

  /** Ambient pad tick. Same shape as the original prototype. */
  tick(frenzy: boolean, _dt: number): void {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (t < this.next) return;
    const scale = frenzy ? SCALE_AMBIENT_FRENZY : SCALE_AMBIENT_CALM;
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

  /**
   * Music sequencer. Schedules a slow bass + faster lead in 4/4. Higher BPM
   * + brighter scales during Frenzy.
   */
  tickMusic(frenzy: boolean, _dt: number, enabled: boolean): void {
    if (!enabled || !this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const bassInterval = frenzy ? 0.45 : 0.85;
    const leadInterval = frenzy ? 0.18 : 0.32;

    if (t >= this.musicNextBass) {
      const bass = frenzy ? MUSIC_BASS_FRENZY : MUSIC_BASS_CALM;
      this.beep(bass[this.musicBassIdx % bass.length], bassInterval * 0.9, 'sawtooth', 0.10, 0.95, 'music');
      this.musicBassIdx++;
      this.musicNextBass = t + bassInterval;
    }
    if (t >= this.musicNextLead) {
      const lead = frenzy ? MUSIC_LEAD_FRENZY : MUSIC_LEAD_CALM;
      const swing = (this.musicLeadIdx % 4) === 3 ? 0.15 : 0;
      this.beep(
        lead[this.musicLeadIdx % lead.length],
        leadInterval * 0.85,
        this.musicLeadIdx % 4 === 0 ? 'square' : 'triangle',
        frenzy ? 0.055 : 0.045,
        1.0,
        'music',
      );
      this.musicLeadIdx++;
      this.musicNextLead = t + leadInterval + swing;
    }
  }

  /** Settings-driven enable/disable for the music loop. */
  setMusicEnabled(enabled: boolean): void {
    this.musicOn = enabled;
    if (!this.ctx) return;
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.55 : 0.0001, this.ctx.currentTime, 0.2);
    }
  }
}

// keep `rand` referenced for tree-shaking — pickup uses it indirectly.
void rand;
