/* ============================================================================
 * One-shot contracts.
 * `type` matches a stats key (see SaveState.stats). The contract auto-unlocks
 * its CLAIM button when stats[type] >= target.
 * ========================================================================== */

import type { ContractDef } from '../types';

export const CONTRACTS: ContractDef[] = [
  { id: 'collect50',  title: 'Collect 50 raw scrap',     type: 'collected',       target: 50,     reward: 220 },
  { id: 'process40',  title: 'Process 40 components',    type: 'processed',       target: 40,     reward: 520 },
  { id: 'sell25',     title: 'Sell 25 products',         type: 'sold',            target: 25,     reward: 820 },
  { id: 'buy5',       title: 'Buy 5 upgrades',           type: 'upgradesBought',  target: 5,      reward: 1200 },
  { id: 'zone1',      title: 'Unlock 1 new zone',        type: 'zonesUnlocked',   target: 1,      reward: 1800 },
  { id: 'drone2',     title: 'Hire 2 drones',            type: 'droneBest',       target: 2,      reward: 4200 },
  { id: 'storm2',     title: 'Complete 2 frenzies',      type: 'frenzies',        target: 2,      reward: 7200 },
  { id: 'cash100k',   title: 'Earn $100K total',         type: 'cashEarned',      target: 100000, reward: 26000 },
  { id: 'zone4',      title: 'Unlock all resource zones',type: 'zonesUnlocked',   target: 4,      reward: 90000 },
  { id: 'prestige1',  title: 'Perform first prestige',   type: 'prestigeRuns',    target: 1,      reward: 120000 },
];
