/* ============================================================================
 * Contracts — one-shot tiered objectives.
 * `type` matches a stats key (see SaveState.stats). The contract auto-unlocks
 * its CLAIM button when stats[type] >= target.
 *
 * Pass 2 expands from 10 → 50, grouped into Starter / Intermediate / Advanced
 * tiers. The UI only shows the next 6 unclaimed at any time so the list stays
 * readable.
 * ========================================================================== */

import type { ContractDef } from '../types';

export const CONTRACTS: ContractDef[] = [
  // ----------------------------- Starter (20) -----------------------------
  { id: 'collect50',  title: 'Collect 50 raw scrap',           type: 'collected',      target: 50,         reward: 220 },
  { id: 'process40',  title: 'Process 40 components',          type: 'processed',      target: 40,         reward: 520 },
  { id: 'sell25',     title: 'Sell 25 products',               type: 'sold',           target: 25,         reward: 820 },
  { id: 'buy5',       title: 'Buy 5 upgrades',                 type: 'upgradesBought', target: 5,          reward: 1200 },
  { id: 'zone1',      title: 'Unlock 1 new zone',              type: 'zonesUnlocked',  target: 1,          reward: 1800 },
  { id: 'drone2',     title: 'Hire 2 drones',                  type: 'droneBest',      target: 2,          reward: 4200 },
  { id: 'collect200', title: 'Collect 200 raw scrap',          type: 'collected',      target: 200,        reward: 2400 },
  { id: 'process100', title: 'Process 100 components',         type: 'processed',      target: 100,        reward: 4800 },
  { id: 'sell75',     title: 'Sell 75 products',               type: 'sold',           target: 75,         reward: 7800 },
  { id: 'buy12',      title: 'Buy 12 upgrades',                type: 'upgradesBought', target: 12,         reward: 12000 },
  { id: 'storm2',     title: 'Complete 2 frenzies',            type: 'frenzies',       target: 2,          reward: 7200 },
  { id: 'cash100k',   title: 'Earn $100K total',               type: 'cashEarned',     target: 100000,     reward: 26000 },
  { id: 'drone5',     title: 'Hire 5 drones',                  type: 'droneBest',      target: 5,          reward: 38000 },
  { id: 'zone2',      title: 'Unlock 2 new zones',             type: 'zonesUnlocked',  target: 2,          reward: 22000 },
  { id: 'collect1k',  title: 'Collect 1,000 raw',              type: 'collected',      target: 1000,       reward: 42000 },
  { id: 'process500', title: 'Process 500 components',         type: 'processed',      target: 500,        reward: 95000 },
  { id: 'sell200',    title: 'Sell 200 products',              type: 'sold',           target: 200,        reward: 140000 },
  { id: 'frenzy5',    title: 'Complete 5 frenzies',            type: 'frenzies',       target: 5,          reward: 130000 },
  { id: 'cash500k',   title: 'Earn $500K total',               type: 'cashEarned',     target: 500000,     reward: 180000 },
  { id: 'zone4',      title: 'Unlock all original 4 zones',    type: 'zonesUnlocked',  target: 4,          reward: 320000 },

  // -------------------------- Intermediate (15) --------------------------
  { id: 'iron200',    title: 'Sell 200 iron plates',           type: 'ironPartSold',   target: 200,        reward: 80000 },
  { id: 'glass150',   title: 'Sell 150 fiber lenses',          type: 'glassLensSold',  target: 150,        reward: 220000 },
  { id: 'plasma100',  title: 'Sell 100 plasma cells',          type: 'plasmaCellSold', target: 100,        reward: 600000 },
  { id: 'quantum75',  title: 'Sell 75 quantum cores',          type: 'quantumCoreSold',target: 75,         reward: 1500000 },
  { id: 'sing50',     title: 'Sell 50 singularity drives',     type: 'singDriveSold',  target: 50,         reward: 3500000 },
  { id: 'zone7',      title: 'Unlock 7 zones',                 type: 'zonesUnlocked',  target: 7,          reward: 1100000 },
  { id: 'drone10',    title: 'Hire 10 drones',                 type: 'droneBest',      target: 10,         reward: 4200000 },
  { id: 'frenzy20',   title: 'Complete 20 frenzies',           type: 'frenzies',       target: 20,         reward: 3000000 },
  { id: 'cash10m',    title: 'Earn $10M total',                type: 'cashEarned',     target: 10000000,   reward: 2200000 },
  { id: 'cash100m',   title: 'Earn $100M total',               type: 'cashEarned',     target: 100000000,  reward: 18000000 },
  { id: 'prestige1',  title: 'Perform first prestige',         type: 'prestigeRuns',   target: 1,          reward: 120000 },
  { id: 'prestige2',  title: 'Prestige 2 times',               type: 'prestigeRuns',   target: 2,          reward: 50000000 },
  { id: 'prestige5',  title: 'Prestige 5 times',               type: 'prestigeRuns',   target: 5,          reward: 300000000 },
  { id: 'collect100k',title: 'Collect 100,000 raw',            type: 'collected',      target: 100000,     reward: 40000000 },
  { id: 'process10k', title: 'Process 10,000 components',      type: 'processed',      target: 10000,      reward: 90000000 },

  // ----------------------------- Advanced (15) ----------------------------
  { id: 'zone10',     title: 'Unlock every zone',              type: 'zonesUnlocked',  target: 10,         reward: 30000000 },
  { id: 'drone14',    title: 'Hire all 14 drones',             type: 'droneBest',      target: 14,         reward: 20000000 },
  { id: 'frenzy50',   title: 'Complete 50 frenzies',           type: 'frenzies',       target: 50,         reward: 15000000 },
  { id: 'anti100',    title: 'Sell 100 antimatter drives',     type: 'antiPartSold',   target: 100,        reward: 20000000000 },
  { id: 'dark50',     title: 'Sell 50 dark matter lenses',     type: 'darkPartSold',   target: 50,         reward: 150000000000 },
  { id: 'void30',     title: 'Sell 30 void engines',           type: 'voidPartSold',   target: 30,         reward: 1500000000000 },
  { id: 'causal20',   title: 'Sell 20 causal stabilizers',     type: 'causalPartSold', target: 20,         reward: 25000000000000 },
  { id: 'entropic10', title: 'Sell 10 heat-death cores',       type: 'entropicPartSold',target: 10,        reward: 400000000000000 },
  { id: 'cash1b',     title: 'Earn $1B total',                 type: 'cashEarned',     target: 1000000000, reward: 150000000 },
  { id: 'cash100b',   title: 'Earn $100B total',               type: 'cashEarned',     target: 100000000000,reward: 5000000000 },
  { id: 'cash1t',     title: 'Earn $1T total',                 type: 'cashEarned',     target: 1000000000000,reward: 50000000000 },
  { id: 'prestige10', title: 'Prestige 10 times',              type: 'prestigeRuns',   target: 10,         reward: 5000000000 },
  { id: 'prestige25', title: 'Prestige 25 times',              type: 'prestigeRuns',   target: 25,         reward: 100000000000 },
  { id: 'prestige50', title: 'Prestige 50 times',              type: 'prestigeRuns',   target: 50,         reward: 5000000000000 },
  { id: 'collect1m',  title: 'Collect 1,000,000 raw',          type: 'collected',      target: 1000000,    reward: 20000000000 },
];
