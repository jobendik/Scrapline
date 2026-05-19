/* ============================================================================
 * World zones.
 *
 * `home` is always unlocked at game start; the others gate behind `cost`. The
 * `rect` field is the playable area in world coordinates and also where raw
 * items spawn for that zone.
 * ========================================================================== */

import type { ZoneDef } from '../types';

export const ZONES: ZoneDef[] = [
  { id: 'home',    name: 'Starter Yard',        raw: 'ironRaw',    tier: 1, cost: 0,      rect: { x: -760,  y: -520, w: 1520, h: 1040 }, spawn: 0.72, max: 70,  color: '#38f8ff' },
  { id: 'glass',   name: 'Glass Docks',         raw: 'glassRaw',   tier: 2, cost: 1600,   rect: { x: 900,   y: -620, w: 1260, h: 1060 }, spawn: 0.78, max: 86,  color: '#45ff93' },
  { id: 'plasma',  name: 'Plasma Grave',        raw: 'plasmaRaw',  tier: 3, cost: 9500,   rect: { x: -2140, y: -710, w: 1240, h: 1160 }, spawn: 0.88, max: 104, color: '#ff43df' },
  { id: 'quantum', name: 'Quantum Lot',         raw: 'quantumRaw', tier: 4, cost: 52000,  rect: { x: -690,  y: 880,  w: 1620, h: 1030 }, spawn: 0.96, max: 120, color: '#ffd45c' },
  { id: 'sing',    name: 'Singularity Foundry', raw: 'singRaw',    tier: 5, cost: 230000, rect: { x: 1120,  y: 760,  w: 1740, h: 1220 }, spawn: 1.08, max: 142, color: '#a476ff' },
];
