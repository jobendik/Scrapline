/* ============================================================================
 * World zones.
 *
 * `home` is always unlocked at game start; the others gate behind `cost`. The
 * `rect` field is the playable area in world coordinates and also where raw
 * items spawn for that zone.
 *
 * Pass 2 expands the world from 5 → 10 zones. Layout is roughly clockwise
 * around the starter yard so each unlock pushes the player into a fresh
 * direction:
 *
 *                  causality (N)
 *  antimatter (NW)                  darkmatter (NE)
 *      plasma (W)    home          glass (E)         heatdeath (far E)
 *       void (SW)        quantum (S)      sing (SE)
 *
 * Min world bounds expanded to x:[-3300, 4700], y:[-2200, 2000].
 * ========================================================================== */

import type { ZoneDef } from '../types';

export const ZONES: ZoneDef[] = [
  // Original 5
  { id: 'home',       name: 'Starter Yard',        raw: 'ironRaw',    tier: 1, cost: 0,         rect: { x: -760,  y: -520, w: 1520, h: 1040 }, spawn: 0.72, max: 70,  color: '#38f8ff' },
  { id: 'glass',      name: 'Glass Docks',         raw: 'glassRaw',   tier: 2, cost: 1600,      rect: { x: 900,   y: -620, w: 1260, h: 1060 }, spawn: 0.78, max: 86,  color: '#45ff93' },
  { id: 'plasma',     name: 'Plasma Grave',        raw: 'plasmaRaw',  tier: 3, cost: 9500,      rect: { x: -2140, y: -710, w: 1240, h: 1160 }, spawn: 0.88, max: 104, color: '#ff43df' },
  { id: 'quantum',    name: 'Quantum Lot',         raw: 'quantumRaw', tier: 4, cost: 52000,     rect: { x: -690,  y: 880,  w: 1620, h: 1030 }, spawn: 0.96, max: 120, color: '#ffd45c' },
  { id: 'sing',       name: 'Singularity Foundry', raw: 'singRaw',    tier: 5, cost: 230000,    rect: { x: 1120,  y: 760,  w: 1740, h: 1220 }, spawn: 1.08, max: 142, color: '#a476ff' },
  // Pass 2 additions
  { id: 'antimatter', name: 'Antimatter Refinery', raw: 'antiRaw',    tier: 6, cost: 1100000,   rect: { x: -2700, y: -2100,w: 1400, h: 1200 }, spawn: 1.18, max: 158, color: '#ff8a4f' },
  { id: 'darkmatter', name: 'Dark Matter Wellhead',raw: 'darkRaw',    tier: 7, cost: 5500000,   rect: { x: 1700,  y: -2000,w: 1400, h: 1100 }, spawn: 1.28, max: 174, color: '#6a44ff' },
  { id: 'void',       name: 'Void Forge',          raw: 'voidRaw',    tier: 8, cost: 30000000,  rect: { x: -3300, y: 800,  w: 1300, h: 1200 }, spawn: 1.38, max: 190, color: '#1de9b6' },
  { id: 'causality',  name: 'Causality Mill',      raw: 'causalRaw',  tier: 9, cost: 150000000, rect: { x: -700,  y: -2200,w: 1400, h: 1100 }, spawn: 1.48, max: 206, color: '#ff3ec3' },
  { id: 'heatdeath',  name: 'Heat Death Reactor',  raw: 'entropicRaw',tier: 10,cost: 800000000, rect: { x: 3200,  y: -100, w: 1500, h: 1600 }, spawn: 1.58, max: 222, color: '#ff8c00' },
];

/** World-space bounding box for the minimap projection. Recomputed from ZONES. */
export const WORLD_BOUNDS = {
  x: -3300,
  y: -2200,
  w: 8000,
  h: 4200,
};
