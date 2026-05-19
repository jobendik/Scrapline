/* ============================================================================
 * Item catalogue.
 *
 * Each raw item has a matching product item produced by the Core. Adding a new
 * pair: append the raw entry with `kind: 'raw'` and a `product` pointer, then
 * append the product entry with `kind: 'product'`. Also register a new zone
 * (data/zones.ts) so the raw spawns somewhere in the world.
 * ========================================================================== */

import type { ItemTable } from '../types';

export const ITEM: ItemTable = {
  ironRaw:   { name: 'Iron Scrap',       kind: 'raw',     product: 'ironPart',    color: '#38f8ff', value: 2,    shape: 'hex' },
  glassRaw:  { name: 'Glass Shards',     kind: 'raw',     product: 'glassLens',   color: '#45ff93', value: 4,    shape: 'diamond' },
  plasmaRaw: { name: 'Plasma Junk',      kind: 'raw',     product: 'plasmaCell',  color: '#ff43df', value: 9,    shape: 'star' },
  quantumRaw:{ name: 'Quantum Alloy',    kind: 'raw',     product: 'quantumCore', color: '#ffd45c', value: 22,   shape: 'cube' },
  singRaw:   { name: 'Singularity Ore',  kind: 'raw',     product: 'singDrive',   color: '#a476ff', value: 58,   shape: 'ring' },
  ironPart:    { name: 'Iron Plate',       kind: 'product', color: '#9cf8ff', value: 26,   shape: 'rect' },
  glassLens:   { name: 'Fiber Lens',       kind: 'product', color: '#b5ff7a', value: 64,   shape: 'lens' },
  plasmaCell:  { name: 'Plasma Cell',      kind: 'product', color: '#ff83ee', value: 165,  shape: 'capsule' },
  quantumCore: { name: 'Quantum Core',     kind: 'product', color: '#ffe58a', value: 430,  shape: 'star' },
  singDrive:   { name: 'Singularity Drive',kind: 'product', color: '#cdb4ff', value: 1220, shape: 'ring' },
};
