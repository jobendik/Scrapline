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
  | 'ring';

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

/** Persistent save state — see {@link Game.default}. */
export interface SaveState {
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
