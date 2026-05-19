/* ============================================================================
 * Drone roster — 5 type templates.
 *
 * Drones are assigned a type by rotating through TYPES as the worker count
 * upgrade increases. Type drives:
 *   - render color
 *   - speed multiplier
 *   - target preference (raw vs product)
 *   - "gold pickup" chance for the elite type
 *
 * Players unlock a new drone *type* every 3 worker slots they buy:
 *   slot 1  → Scout
 *   slot 2  → Scout
 *   slot 3  → Hauler
 *   slot 4  → Hauler
 *   slot 5  → Processor
 *   slot 6  → Processor
 *   slot 7  → Trader
 *   slot 8  → Trader
 *   slot 9+ → Elite (mix in)
 * ========================================================================== */

export type DroneType = 'scout' | 'hauler' | 'processor' | 'trader' | 'elite';

export interface DroneTypeDef {
  type: DroneType;
  name: string;
  desc: string;
  /** Multiplier on the base Drone.speed expression. */
  speedMult: number;
  /** Glow / hull accent. */
  color: string;
  /** Secondary accent (eyes, antenna lights). */
  accent: string;
  /**
   * Target preference: 'any' picks the nearest available, 'raw' prefers raw
   * scrap (deposits to Core), 'product' prefers products (sells via Sell Hub).
   */
  prefer: 'any' | 'raw' | 'product';
  /** Probability of a 2× cash bonus on Sell deposits. */
  goldChance: number;
}

export const DRONE_TYPES: Record<DroneType, DroneTypeDef> = {
  scout: {
    type: 'scout',
    name: 'Scout',
    desc: 'Fast generalist. Picks the closest available item.',
    speedMult: 1.2,
    color: '#a476ff',
    accent: '#38f8ff',
    prefer: 'any',
    goldChance: 0,
  },
  hauler: {
    type: 'hauler',
    name: 'Hauler',
    desc: 'Slower but ranges further. Targets oldest items first.',
    speedMult: 0.85,
    color: '#54a2ff',
    accent: '#9cf8ff',
    prefer: 'any',
    goldChance: 0,
  },
  processor: {
    type: 'processor',
    name: 'Processor',
    desc: 'Prefers raw scrap → Core deposits.',
    speedMult: 1.0,
    color: '#45ff93',
    accent: '#38f8ff',
    prefer: 'raw',
    goldChance: 0,
  },
  trader: {
    type: 'trader',
    name: 'Trader',
    desc: 'Prefers products → Sell Hub deposits.',
    speedMult: 1.0,
    color: '#ffd45c',
    accent: '#ff43df',
    prefer: 'product',
    goldChance: 0,
  },
  elite: {
    type: 'elite',
    name: 'Elite',
    desc: 'Fast, gilded. 8% chance of double-pay on sells.',
    speedMult: 1.35,
    color: '#ff43df',
    accent: '#ffd45c',
    prefer: 'any',
    goldChance: 0.08,
  },
};

/**
 * Slot index → DroneType assignment. Designed so each new pair of worker
 * upgrades introduces a new role; once all 4 specialist roles are filled,
 * additional drones come in as Elites.
 */
export function droneTypeForSlot(slot: number): DroneType {
  if (slot < 2) return 'scout';
  if (slot < 4) return 'hauler';
  if (slot < 6) return 'processor';
  if (slot < 8) return 'trader';
  return 'elite';
}
