/* ============================================================================
 * Upgrade definitions.
 *
 * Cost scales as: floor(base * factor ^ currentLevel). Cap at `max`.
 * `desc(level)` is rendered next to the upgrade button to preview the buff.
 *
 * Pass 2 brings the catalogue from 9 → 16. The new entries each have hooks
 * elsewhere in Game (see comments).
 * ========================================================================== */

import type { UpgradeDef } from '../types';

export const UPGRADES: UpgradeDef[] = [
  // Original 9
  { id: 'speed',     name: 'Flux Boots',       base: 80,   factor: 1.30, max: 30, desc: (l) => `Move speed +${l * 8}%` },
  { id: 'magnet',    name: 'Arc Magnet',       base: 120,  factor: 1.33, max: 30, desc: (l) => `Pickup radius +${l * 12}%` },
  { id: 'capacity',  name: 'Cargo Mesh',       base: 150,  factor: 1.34, max: 34, desc: (l) => `Capacity ${20 + l * 7} items` },
  { id: 'processor', name: 'Core Furnace',     base: 240,  factor: 1.36, max: 34, desc: (l) => `Processing speed +${l * 14}%` },
  { id: 'value',     name: 'Signal Refinery',  base: 420,  factor: 1.38, max: 30, desc: (l) => `Product value +${l * 17}%` },
  { id: 'drone',     name: 'AI Worker Drone',  base: 900,  factor: 1.70, max: 14, desc: (l) => `${l} autonomous worker${l === 1 ? '' : 's'}` },
  { id: 'spawn',     name: 'Scrap Magnetizer', base: 1300, factor: 1.45, max: 16, desc: (l) => `World spawn rate +${l * 10}%` },
  { id: 'offline',   name: 'Offline Relay',    base: 2800, factor: 1.55, max: 12, desc: (l) => `Offline income +${l * 20}%` },
  { id: 'frenzy',    name: 'Frenzy Capacitor', base: 4200, factor: 1.58, max: 10, desc: (l) => `Frenzy lasts ${30 + l * 5}s` },

  // Pass 2 additions
  // Crit chance: SellHub.sell rolls Math.random() < critChance() to double payout.
  { id: 'crit',      name: 'Lucky Routing',    base: 6500, factor: 1.62, max: 10, desc: (l) => `${l * 4}% chance of 2× sell` },
  // Pulse: Game.pulseTimer fires once per pulseInterval; collects nearby items.
  { id: 'pulse',     name: 'Magnet Pulse',     base: 12000,factor: 1.66, max: 10, desc: (l) => l === 0 ? 'Periodic AoE collect (locked)' : `AoE collect every ${Math.max(2, 8 - l).toFixed(1)}s` },
  // Recycler: every N sells, a free raw spawns at Core. Lower N = better.
  { id: 'recycler',  name: 'Slag Recycler',    base: 22000,factor: 1.70, max: 10, desc: (l) => l === 0 ? 'Free raw every N sells (locked)' : `Free raw every ${Math.max(2, 16 - l * 2)} sells` },
  // Prestige amp: multiplies the +8%/prestige bonus inside valueMult().
  { id: 'prestigeAmp', name: 'Prestige Amp',   base: 38000,factor: 1.74, max: 10, desc: (l) => `Prestige bonus ×${(1 + l * 0.15).toFixed(2)}` },
  // Drone speed: extra speed tier per level (beyond the +12/lvl from `drone`).
  { id: 'droneSpeed', name: 'Drone Boosters',  base: 64000,factor: 1.65, max: 12, desc: (l) => `Drone speed +${l * 14}%` },
  // Magnet filter: skip lower-tier items when high-tier already in cargo.
  { id: 'magnetFilter',name: 'Selective Magnet',base: 95000,factor: 1.7, max: 6,  desc: (l) => l === 0 ? 'Auto-skip lower tiers (locked)' : `Auto-skip items ≤${l} tiers lower` },
  // Offline cap extension: 8h → 8h + level*1h, max 16h with full upgrade.
  { id: 'offlineCap',name: 'Offline Bank',     base: 150000,factor: 1.72, max: 8, desc: (l) => `Offline cap ${8 + l}h` },
];
