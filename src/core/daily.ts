/* ============================================================================
 * Daily check-in.
 *
 * Runs once per game.init() after the save has loaded. Diffs today's UTC
 * date against state.lastLoginUTC and updates:
 *   - streakDays (+1 if yesterday, else reset to 1)
 *   - chestDay   (+1, wrapping at 30)
 *   - chestClaimedToday (false on a new day)
 *   - dailyChallenges (regenerated on new day; reroll flag reset)
 *   - lastLoginUTC = today
 *
 * Returns metadata the welcome modal uses to display the chest + streak.
 * ========================================================================== */

import { makeChallenges } from '../data/daily-challenges';
import type { Game } from '../game';

export interface DailyCheckResult {
  /** True iff this is a fresh UTC day (i.e. the chest is unclaimed). */
  newDay: boolean;
  /** True iff the player missed yesterday and the streak just reset. */
  streakBroken: boolean;
  /** Streak length after running the check (≥ 1). */
  streak: number;
  /** 1-indexed chest cycle position to show. */
  chestDay: number;
}

/** YYYY-MM-DD UTC representation. */
function utcDateString(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Difference in whole UTC days between two YYYY-MM-DD strings. */
function dayDiff(a: string, b: string): number {
  if (!a || !b) return Infinity;
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  const t1 = Date.UTC(ya, ma - 1, da);
  const t2 = Date.UTC(yb, mb - 1, db);
  return Math.round((t2 - t1) / 86400000);
}

export function runDailyCheck(game: Game): DailyCheckResult {
  const today = utcDateString();
  const last = game.state.lastLoginUTC || '';
  const diff = dayDiff(last, today);

  let newDay = false;
  let streakBroken = false;

  if (!last) {
    // First boot ever — initialise everything fresh.
    game.state.streakDays = 1;
    game.state.chestDay = 1;
    game.state.chestClaimedToday = false;
    game.state.pendingChestDay = 1;
    newDay = true;
  } else if (diff === 0) {
    // Same day, nothing to do.
    newDay = false;
  } else if (diff === 1) {
    // Consecutive day.
    game.state.streakDays = (game.state.streakDays || 0) + 1;
    game.state.chestDay = ((game.state.chestDay || 0) % 30) + 1;
    game.state.chestClaimedToday = false;
    game.state.pendingChestDay = game.state.chestDay;
    newDay = true;
  } else if (diff > 1) {
    // Missed at least one day — streak resets.
    game.state.streakDays = 1;
    game.state.chestDay = 1;
    game.state.chestClaimedToday = false;
    game.state.pendingChestDay = 1;
    streakBroken = true;
    newDay = true;
  }
  // diff < 0 (clock skew) — leave state alone.

  game.state.stats.streakDays = Math.max(game.state.stats.streakDays || 0, game.state.streakDays);
  game.state.lastLoginUTC = today;

  // Daily challenges roll over on a new UTC day.
  const seed = today.replace(/-/g, '');
  const seedInt = parseInt(seed, 10);
  if (newDay || !game.state.dailyChallenges?.length || game.state.dailyChallengeDay !== seedInt) {
    game.state.dailyChallengeDay = seedInt;
    game.state.dailyChallengeRerolled = false;
    game.state.dailyChallenges = makeChallenges(game.state.level, 0, game.state.stats);
  }

  return {
    newDay,
    streakBroken,
    streak: game.state.streakDays || 1,
    chestDay: game.state.chestDay || 1,
  };
}

/** Build a payload for the welcome modal. Pure read — does not mutate. */
export function dailyDescription(game: Game): string {
  const s = game.state.streakDays || 1;
  if (game.state.chestClaimedToday) {
    return `${s}-day streak — chest already claimed today.`;
  }
  return `${s}-day streak. Day ${game.state.chestDay} chest ready.`;
}
