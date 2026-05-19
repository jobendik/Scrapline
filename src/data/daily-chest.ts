/* ============================================================================
 * Daily login chest — 30-day rotating reward cycle.
 *
 * Day 1 hands a small cash bump. Days 7 / 14 / 21 are themed milestones
 * (theme shard hooks land in Pass 4). Day 30 is the legendary capstone with
 * an oversized cash payout *plus* a prestige-points pulse. Streak resets to
 * day 1 if the player misses a UTC day.
 *
 * Cash payouts scale to the player's level + prestige bonus when claimed so
 * the chest stays meaningful late-game — see {@link rewardCashFor}.
 *
 * Hand-tuned so the curve climbs noticeably each week without ever feeling
 * "saved" — every single day is worth opening the game for.
 * ========================================================================== */

/** Reward shape stored in {@link CHEST_CYCLE}. */
export interface ChestReward {
  /** Multiplier applied to the scaled base payout. */
  cashMult: number;
  /** Free prestige points awarded immediately. */
  prestigePoints?: number;
  /** Cosmetic-tier label rendered in the modal (purely visual). */
  label: string;
  /** Optional tier flag used for the chest icon glow color. */
  tier?: 'common' | 'rare' | 'epic' | 'legendary';
}

/** 30 chest entries, indexed by day-1. */
export const CHEST_CYCLE: ChestReward[] = [
  { cashMult: 1,   label: 'Daily Cache',         tier: 'common' },
  { cashMult: 1.4, label: 'Daily Cache',         tier: 'common' },
  { cashMult: 1.9, label: 'Daily Cache',         tier: 'common' },
  { cashMult: 2.4, label: 'Daily Cache',         tier: 'common' },
  { cashMult: 3.2, label: 'Daily Cache',         tier: 'common' },
  { cashMult: 4.5, label: 'Bonus Cache',         tier: 'rare' },
  { cashMult: 8,   label: 'Week One Reward',     tier: 'epic',     prestigePoints: 1 },
  { cashMult: 5,   label: 'Daily Cache',         tier: 'common' },
  { cashMult: 6,   label: 'Daily Cache',         tier: 'common' },
  { cashMult: 7,   label: 'Daily Cache',         tier: 'common' },
  { cashMult: 8.5, label: 'Daily Cache',         tier: 'common' },
  { cashMult: 10,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 13,  label: 'Bonus Cache',         tier: 'rare' },
  { cashMult: 22,  label: 'Week Two Reward',     tier: 'epic',     prestigePoints: 2 },
  { cashMult: 14,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 17,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 21,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 26,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 32,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 42,  label: 'Bonus Cache',         tier: 'rare' },
  { cashMult: 64,  label: 'Week Three Reward',   tier: 'epic',     prestigePoints: 4 },
  { cashMult: 40,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 48,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 60,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 75,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 95,  label: 'Daily Cache',         tier: 'common' },
  { cashMult: 130, label: 'Bonus Cache',         tier: 'rare' },
  { cashMult: 180, label: 'Daily Cache',         tier: 'rare' },
  { cashMult: 260, label: 'Daily Cache',         tier: 'rare' },
  { cashMult: 600, label: 'Day 30 Legendary',    tier: 'legendary',prestigePoints: 12 },
];

/** Helper: ChestReward at 1-indexed day (clamped to the cycle). */
export function chestFor(day: number): ChestReward {
  const idx = ((day - 1) % CHEST_CYCLE.length + CHEST_CYCLE.length) % CHEST_CYCLE.length;
  return CHEST_CYCLE[idx];
}
