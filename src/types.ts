/* ============================================================================
 * Shared type definitions for Scrapline.
 *
 * The legacy single-file prototype used loose JS object shapes. These types
 * mirror those shapes so we can keep the existing code working unchanged while
 * giving us an anchor for future, tighter typing.
 * ========================================================================== */

import type { Game } from './game';

/** XY coordinate pair used for camera targets, label anchors, etc. */
export interface Vec2 {
  x: number;
  y: number;
}

/** Axis input from keyboard + virtual joystick. */
export interface Axis {
  x: number;
  y: number;
}

/** Item kinds: "raw" come out of resource nodes; "product" come out of the Core. */
export type ItemKind = 'raw' | 'product';

/** Render shapes for the item icons (see {@link drawItem}). */
export type ItemShape =
  | 'hex'
  | 'diamond'
  | 'star'
  | 'cube'
  | 'rect'
  | 'lens'
  | 'capsule'
  | 'ring'
  | 'gear'
  | 'crystal'
  | 'prism'
  | 'vortex'
  | 'sigil';

/** Definition for a single item type — both raw and product variants share the shape. */
export interface ItemDef {
  name: string;
  kind: ItemKind;
  color: string;
  value: number;
  shape: ItemShape;
  /** Only set on raw items: which product type the Core forges from this raw item. */
  product?: string;
}

/** Bag of all item definitions, keyed by item id. */
export type ItemTable = Record<string, ItemDef>;

/** A rectangular world-space region for a zone. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Static definition for a resource zone. */
export interface ZoneDef {
  id: string;
  name: string;
  raw: string;
  tier: number;
  cost: number;
  rect: Rect;
  /** Spawn rate (items per second, baseline). */
  spawn: number;
  /** Max simultaneous items in the zone. */
  max: number;
  color: string;
}

/** Static definition for an upgrade. */
export interface UpgradeDef {
  id: string;
  name: string;
  base: number;
  factor: number;
  max: number;
  desc: (lvl: number) => string;
}

/** Stat key recorded in {@link SaveState.stats}. */
export type StatKey =
  | 'collected'
  | 'processed'
  | 'sold'
  | 'productsPicked'
  | 'cashEarned'
  | 'upgradesBought'
  | 'zonesUnlocked'
  | 'droneBest'
  | 'frenzies'
  | 'singDriveSold'
  | 'prestigeRuns'
  // Per-item production / sale counters, e.g. "ironPartMade", "plasmaCellSold".
  | string;

/** Static definition for a contract. */
export interface ContractDef {
  id: string;
  title: string;
  type: StatKey;
  target: number;
  reward: number;
}

/** Static definition for an achievement. */
export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  type: StatKey;
  target: number;
  reward: number;
}

/** Daily-market order generated for a given UTC date. */
export interface MarketOrder {
  id: string;
  type: string;
  title: string;
  target: number;
  reward: number;
  /** Snapshot of the relevant stat at the moment the order was issued. */
  start: number;
  claimed: boolean;
}

/** Graphics quality preset chosen by the player (or 'auto'). */
export type GfxQuality = 'auto' | 'low' | 'medium' | 'high';

/** Player-facing options stored in the save. */
export interface SettingsState {
  /** SFX on/off. Mirrors AudioSys.on so it survives reloads. */
  sound: boolean;
  /** Background music on/off. (Music itself is not wired until Pass 5.) */
  music: boolean;
  /** Haptic feedback (vibrate API) on/off. Defaults: ON mobile, OFF desktop. */
  haptics: boolean;
  /** Graphics quality preset. */
  gfx: GfxQuality;
}

/** A single daily challenge active on a given UTC day. */
export interface DailyChallenge {
  id: string;
  /** Template id (see data/daily-challenges.ts). */
  template: string;
  /** Human-readable label rendered in the Goals → Daily tab. */
  title: string;
  /** Statistics key (e.g. "sold", "frenzies"). */
  type: string;
  /** Stat target the player must hit. */
  target: number;
  /** Snapshot of the stat at the moment the challenge appeared (delta tracking). */
  start: number;
  /** Cash reward when claimed. */
  reward: number;
  claimed: boolean;
}

/** Persistent save state — see {@link Game.default}. */
export interface SaveState {
  /**
   * Schema version. Bumped whenever new fields are added. The Game.load
   * migration ladder maps older saves up to the current shape.
   */
  version: number;
  cash: number;
  totalCash: number;
  level: number;
  prestige: number;
  prestigeRuns: number;
  up: Record<string, number>;
  zones: Record<string, boolean>;
  contracts: Record<string, boolean>;
  ach: Record<string, boolean>;
  market: MarketOrder[];
  marketDay: number;
  boostTime: number;
  frenzyTime: number;
  lastSave: number;
  stats: Record<StatKey, number>;
  /** v2: player-facing settings — sound, music, haptics, graphics. */
  settings: SettingsState;
  /** v2/v3: tutorial state. `tutorialDone` is sticky; `tutorialStep` advances. */
  tutorialDone: boolean;
  tutorialStep: number;

  // -------------------- Pass 3 (v3) — daily retention --------------------

  /**
   * YYYY-MM-DD UTC of the most recent login the game observed. Used to
   * decide when to extend the streak vs. reset it.
   */
  lastLoginUTC: string;
  /** Current consecutive-day login streak. Resets to 1 if a day is missed. */
  streakDays: number;
  /** Which day of the 30-day chest cycle we're on (1-30, wraps after 30). */
  chestDay: number;
  /**
   * Has the player already claimed today's chest? Cleared whenever a new
   * UTC date is observed.
   */
  chestClaimedToday: boolean;
  /**
   * Last login chest cycle position the player did **not** claim — used so
   * the welcome-back modal can offer it on next login. 0 = nothing pending.
   */
  pendingChestDay: number;

  /** UTC-date seed (YYYYMMDD) used when the daily challenges were generated. */
  dailyChallengeDay: number;
  /** Active daily challenges (always 3). Regenerated when day rolls over. */
  dailyChallenges: DailyChallenge[];
  /** Has the player used their free reroll today? */
  dailyChallengeRerolled: boolean;

  // ----------------------- Pass 4 (v4) — meta layer ----------------------

  /** Prestige tree node levels keyed by node id (see data/prestige-tree.ts). */
  prestigeNodes: Record<string, number>;
  /** Sum of PP spent across all tree nodes. availablePP = prestige - prestigeSpent. */
  prestigeSpent: number;

  /** Active theme id (matches THEMES from data/themes.ts). Defaults to 'cyan'. */
  activeTheme: string;
  /** Ids of themes the player has ever satisfied the unlock for. Cosmetic only. */
  themesOwned: string[];
}

/**
 * Any entity that participates in the per-frame update + render pipeline. Most
 * entities take the game instance as their second argument so they can publish
 * events back to the game (spawn items, award cash, etc.).
 */
export interface Entity {
  x: number;
  y: number;
  update(dt: number, game: Game): void;
  draw(cam: Camera, game: Game): void;
}

// Forward declaration so the Entity contract can reference Camera without
// creating a cyclic import at runtime.
import type { Camera } from './core/camera';
