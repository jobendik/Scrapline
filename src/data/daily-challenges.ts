/* ============================================================================
 * Daily challenges.
 *
 * 3 challenges per UTC day, deterministic per-date so every player sees the
 * same set on the same calendar day. Free reroll once per day rotates the
 * triplet via the same seeded RNG but with a 1-bit offset.
 *
 * Each challenge targets a delta in a single stat: stats[type] - challenge.start
 * must reach `target` before the player can claim.
 * ========================================================================== */

import type { DailyChallenge } from '../types';
import { ITEM } from './items';

interface ChallengeTemplate {
  id: string;
  /** Stats key to track. */
  type: string;
  /** Base target — scaled by `targetScale(player_level)` at generation time. */
  baseTarget: number;
  /** Base cash reward — also scaled. */
  baseReward: number;
  /** Title with `{n}` placeholder for the (scaled) target. */
  title: string;
}

const TEMPLATES: ChallengeTemplate[] = [
  // Collect / process / sell generics
  { id: 'collect',  type: 'collected',       baseTarget: 60,  baseReward: 1400,  title: 'Collect {n} raw scrap' },
  { id: 'process',  type: 'processed',       baseTarget: 40,  baseReward: 2200,  title: 'Process {n} components' },
  { id: 'sell',     type: 'sold',            baseTarget: 25,  baseReward: 3000,  title: 'Sell {n} products' },
  { id: 'frenzy',   type: 'frenzies',        baseTarget: 2,   baseReward: 5500,  title: 'Use Frenzy {n} times' },
  { id: 'upgrade',  type: 'upgradesBought',  baseTarget: 1,   baseReward: 3000,  title: 'Buy {n} upgrade' },
  // Tier-specific sells encourage rotating which zone you focus on
  { id: 'sell_iron',    type: 'ironPartSold',    baseTarget: 30, baseReward: 4500,  title: 'Sell {n} iron plates' },
  { id: 'sell_glass',   type: 'glassLensSold',   baseTarget: 20, baseReward: 9000,  title: 'Sell {n} fiber lenses' },
  { id: 'sell_plasma',  type: 'plasmaCellSold',  baseTarget: 15, baseReward: 20000, title: 'Sell {n} plasma cells' },
  { id: 'sell_quantum', type: 'quantumCoreSold', baseTarget: 10, baseReward: 55000, title: 'Sell {n} quantum cores' },
  { id: 'sell_sing',    type: 'singDriveSold',   baseTarget: 8,  baseReward: 180000,title: 'Sell {n} singularity drives' },
  { id: 'sell_anti',    type: 'antiPartSold',    baseTarget: 6,  baseReward: 500000,title: 'Sell {n} antimatter drives' },
];

/** Deterministic LCG. */
function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** YYYYMMDD integer for today's UTC date. */
export function challengeSeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/**
 * Build today's 3 challenges. `offset` is incremented by reroll to rotate
 * the selection while staying deterministic.
 */
export function makeChallenges(playerLevel: number, offset = 0, stats?: Record<string, number>): DailyChallenge[] {
  const r = rng(challengeSeed() * 31 + offset);
  // Shuffle templates by seed; take first three with no duplicates.
  const pool = TEMPLATES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, 3);

  // Scale by level: linear ramp + small noise.
  const lvlScale = Math.max(1, Math.pow(playerLevel, 0.55));
  return chosen.map((t, i) => {
    const noise = 0.85 + r() * 0.6;
    const target = Math.max(1, Math.round(t.baseTarget * noise * Math.min(4, lvlScale * 0.4 + 0.6)));
    const reward = Math.floor(t.baseReward * noise * (0.8 + lvlScale * 0.5));
    const start = stats ? stats[t.type] || 0 : 0;
    const friendlyN = t.id.startsWith('sell_') ? target : target;
    const itemName = (t.type.endsWith('Sold') && ITEM[t.type.replace(/Sold$/, '')]?.name) || '';
    void itemName;
    return {
      id: 'dc' + i,
      template: t.id,
      title: t.title.replace('{n}', friendlyN.toString()),
      type: t.type,
      target,
      start,
      reward,
      claimed: false,
    };
  });
}
