/* ============================================================================
 * Item catalogue.
 *
 * Each raw item has a matching product item produced by the Core. Adding a new
 * pair: append the raw entry with `kind: 'raw'` and a `product` pointer, then
 * append the product entry with `kind: 'product'`. Also register a new zone
 * (data/zones.ts) so the raw spawns somewhere in the world.
 *
 * Pass 2 brings the catalogue from 10 → 20 (5 new raw/product pairs). Values
 * follow the existing exponential progression so the per-tier income jumps
 * stay meaningful at the top end.
 * ========================================================================== */

import type { ItemTable } from '../types';

export const ITEM: ItemTable = {
  // Tier 1
  ironRaw:   { name: 'Iron Scrap',       kind: 'raw',     product: 'ironPart',    color: '#38f8ff', value: 2,    shape: 'hex' },
  // Tier 2
  glassRaw:  { name: 'Glass Shards',     kind: 'raw',     product: 'glassLens',   color: '#45ff93', value: 4,    shape: 'diamond' },
  // Tier 3
  plasmaRaw: { name: 'Plasma Junk',      kind: 'raw',     product: 'plasmaCell',  color: '#ff43df', value: 9,    shape: 'star' },
  // Tier 4
  quantumRaw:{ name: 'Quantum Alloy',    kind: 'raw',     product: 'quantumCore', color: '#ffd45c', value: 22,   shape: 'cube' },
  // Tier 5
  singRaw:   { name: 'Singularity Ore',  kind: 'raw',     product: 'singDrive',   color: '#a476ff', value: 58,   shape: 'ring' },
  // Tier 6 — new
  antiRaw:   { name: 'Antimatter Sliver',kind: 'raw',     product: 'antiPart',    color: '#ff8a4f', value: 150,  shape: 'gear' },
  // Tier 7 — new
  darkRaw:   { name: 'Dark Matter Drop', kind: 'raw',     product: 'darkPart',    color: '#6a44ff', value: 380,  shape: 'crystal' },
  // Tier 8 — new
  voidRaw:   { name: 'Void Shard',       kind: 'raw',     product: 'voidPart',    color: '#1de9b6', value: 960,  shape: 'prism' },
  // Tier 9 — new
  causalRaw: { name: 'Causality Fragment',kind: 'raw',    product: 'causalPart',  color: '#ff3ec3', value: 2400, shape: 'vortex' },
  // Tier 10 — new
  entropicRaw:{name: 'Entropic Ember',   kind: 'raw',     product: 'entropicPart',color: '#ff8c00', value: 6000, shape: 'sigil' },

  // Products
  ironPart:    { name: 'Iron Plate',        kind: 'product', color: '#9cf8ff', value: 26,      shape: 'rect' },
  glassLens:   { name: 'Fiber Lens',        kind: 'product', color: '#b5ff7a', value: 64,      shape: 'lens' },
  plasmaCell:  { name: 'Plasma Cell',       kind: 'product', color: '#ff83ee', value: 165,     shape: 'capsule' },
  quantumCore: { name: 'Quantum Core',      kind: 'product', color: '#ffe58a', value: 430,     shape: 'star' },
  singDrive:   { name: 'Singularity Drive', kind: 'product', color: '#cdb4ff', value: 1220,    shape: 'ring' },
  antiPart:    { name: 'Antimatter Drive',  kind: 'product', color: '#ffb088', value: 3500,    shape: 'gear' },
  darkPart:    { name: 'Dark Matter Lens',  kind: 'product', color: '#a487ff', value: 10500,   shape: 'crystal' },
  voidPart:    { name: 'Void Forge Engine', kind: 'product', color: '#69f0ae', value: 28000,   shape: 'prism' },
  causalPart:  { name: 'Causal Stabilizer', kind: 'product', color: '#ff9ad8', value: 75000,   shape: 'vortex' },
  entropicPart:{ name: 'Heat Death Core',   kind: 'product', color: '#ffd54f', value: 200000,  shape: 'sigil' },
};
