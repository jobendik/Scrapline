/* ============================================================================
 * Prestige tree — 12 spendable-PP nodes across three tiers.
 *
 * `state.prestige` continues to grant the automatic +8 % value bonus from
 * the original prototype. The tree is *additional* progression on top of
 * that; you spend PP from the same pool but the automatic bonus is never
 * taken away. This was intentionally tuned to be additive so existing
 * players never feel their progression was retroactively penalised by the
 * tree's arrival.
 *
 * Effects are baked into Game getters via {@link Game.tree}. Each node has
 * up to `max` levels; cost is `baseCost * (level+1)` per purchase so later
 * levels feel meaningful.
 * ========================================================================== */

import type { Game } from '../game';

/** Tier the node belongs to. Drives UI grouping + unlock gate. */
export type TreeTier = 'reboot' | 'reset' | 'singularity';

export interface TreeNodeDef {
  id: string;
  tier: TreeTier;
  name: string;
  desc: (lvl: number) => string;
  baseCost: number;
  max: number;
  /** Minimum total PP earned to consider this tier unlocked. */
  gate: number;
  /** Other node ids that must be at the given level first. */
  requires?: Array<{ id: string; level: number }>;
}

export const TREE_NODES: TreeNodeDef[] = [
  // ----------------------- Tier 1 — Reboot tree -----------------------
  { id: 't_magnet',  tier: 'reboot', name: 'Resonant Magnet',  baseCost: 1, max: 5, gate: 0,
    desc: (l) => `Magnet radius +${l * 5}%` },
  { id: 't_forge',   tier: 'reboot', name: 'Forge Tuning',     baseCost: 1, max: 5, gate: 0,
    desc: (l) => `Core speed +${l * 5}%` },
  { id: 't_bank',    tier: 'reboot', name: 'Reboot Bank',      baseCost: 1, max: 5, gate: 0,
    desc: (l) => `Start each prestige with +$${l * 250}` },
  { id: 't_cargo',   tier: 'reboot', name: 'Quantum Cargo',    baseCost: 2, max: 5, gate: 5,
    desc: (l) => `Capacity +${l * 4}` },
  { id: 't_magnet2', tier: 'reboot', name: 'Inverse Magnet',   baseCost: 2, max: 3, gate: 10,
    desc: (l) => `Magnet radius +${l * 10}%`, requires: [{ id: 't_magnet', level: 3 }] },

  // ----------------------- Tier 2 — Reset tree ------------------------
  { id: 't_drone',   tier: 'reset',  name: 'Drone Slot',       baseCost: 3, max: 3, gate: 30,
    desc: (l) => `Bonus drones +${l}` },
  { id: 't_resonance',tier: 'reset', name: 'Resonance Lattice',baseCost: 3, max: 5, gate: 40,
    desc: (l) => `Sell value +${l * 5}%` },
  { id: 't_offline', tier: 'reset',  name: 'Eternal Engine',   baseCost: 3, max: 5, gate: 50,
    desc: (l) => `Offline rate +${l * 12}%` },

  // -------------------- Tier 3 — Singularity tree ---------------------
  { id: 't_crit',    tier: 'singularity', name: 'Singular Luck',    baseCost: 5, max: 3, gate: 120,
    desc: (l) => `Crit chance +${l * 3}%` },
  { id: 't_forge2',  tier: 'singularity', name: 'Hyper Forge',      baseCost: 5, max: 5, gate: 180,
    desc: (l) => `Core speed +${l * 12}%`,
    requires: [{ id: 't_forge', level: 5 }] },
  { id: 't_pulse',   tier: 'singularity', name: 'Pulse Cascade',    baseCost: 6, max: 3, gate: 240,
    desc: (l) => `Magnet pulse interval −${l * 12}%` },
  { id: 't_bloom',   tier: 'singularity', name: 'Singularity Bloom',baseCost: 10, max: 1, gate: 320,
    desc: (l) => l > 0 ? 'Sells pay 2×.' : 'Sells pay 2× when active.' },
];

/** Cost to upgrade a node from `level` → `level + 1`. */
export function nodeCost(def: TreeNodeDef, level: number): number {
  return def.baseCost * (level + 1);
}

/** True iff the player meets the gate + prereqs for a node. */
export function nodeUnlocked(game: Game, def: TreeNodeDef): boolean {
  if ((game.state.prestige || 0) < def.gate) return false;
  if (!def.requires) return true;
  for (const r of def.requires) {
    if ((game.state.prestigeNodes?.[r.id] || 0) < r.level) return false;
  }
  return true;
}
