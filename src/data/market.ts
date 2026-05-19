/* ============================================================================
 * Daily market generator.
 *
 * Deterministic per-UTC-day seed so every player sees the same orders for the
 * same calendar day. Rerolls automatically when the date changes — see the
 * Game.load() guard against `state.marketDay`.
 * ========================================================================== */

import { ITEM } from './items';
import type { MarketOrder } from '../types';

/** Convert today's UTC date to a single integer seed (YYYYMMDD). */
export function marketSeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/**
 * Tiny LCG so we don't pull in a PRNG dep. Matches the original Math.random
 * fallback in distribution; deterministic for a given seed.
 */
export function rng(seed: number): () => number {
  let s = seed % 2147483647;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Build today's market orders. Caller stores the active `marketDay`. */
export function makeMarket(): MarketOrder[] {
  const r = rng(marketSeed());
  const products = ['ironPart', 'glassLens', 'plasmaCell', 'quantumCore', 'singDrive'];
  return products.slice(0, 3).map((p, i) => {
    const t = Math.floor((8 + i * 5) * (1 + r() * 1.5));
    return {
      id: 'm' + i,
      type: p,
      title: 'Ship ' + t + ' ' + ITEM[p].name,
      target: t,
      reward: Math.floor(ITEM[p].value * t * (3.2 + i * 1.3)),
      start: 0,
      claimed: false,
    };
  });
}
