/* ============================================================================
 * Upgrade definitions.
 *
 * Cost scales as: floor(base * factor ^ currentLevel). Cap at `max`.
 * `desc(level)` is rendered next to the upgrade button to preview the buff.
 * ========================================================================== */

import type { UpgradeDef } from '../types';

export const UPGRADES: UpgradeDef[] = [
  { id: 'speed',     name: 'Flux Boots',       base: 80,   factor: 1.30, max: 30, desc: (l) => `Move speed +${l * 8}%` },
  { id: 'magnet',    name: 'Arc Magnet',       base: 120,  factor: 1.33, max: 30, desc: (l) => `Pickup radius +${l * 12}%` },
  { id: 'capacity',  name: 'Cargo Mesh',       base: 150,  factor: 1.34, max: 34, desc: (l) => `Capacity ${20 + l * 7} items` },
  { id: 'processor', name: 'Core Furnace',     base: 240,  factor: 1.36, max: 34, desc: (l) => `Processing speed +${l * 14}%` },
  { id: 'value',     name: 'Signal Refinery',  base: 420,  factor: 1.38, max: 30, desc: (l) => `Product value +${l * 17}%` },
  { id: 'drone',     name: 'AI Worker Drone',  base: 900,  factor: 1.70, max: 14, desc: (l) => `${l} autonomous worker${l === 1 ? '' : 's'}` },
  { id: 'spawn',     name: 'Scrap Magnetizer', base: 1300, factor: 1.45, max: 16, desc: (l) => `World spawn rate +${l * 10}%` },
  { id: 'offline',   name: 'Offline Relay',    base: 2800, factor: 1.55, max: 12, desc: (l) => `Offline income +${l * 20}%` },
  { id: 'frenzy',    name: 'Frenzy Capacitor', base: 4200, factor: 1.58, max: 10, desc: (l) => `Frenzy lasts ${30 + l * 5}s` },
];
