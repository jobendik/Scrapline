/* ============================================================================
 * Permanent achievements ("badges").
 * Same shape as contracts but explicitly long-form (`desc`) and meant to
 * remain visible after claim — they're prestige-stable bragging rights.
 *
 * Pass 2 expands the catalogue from 6 → 42.
 * ========================================================================== */

import type { AchievementDef } from '../types';

export const ACH: AchievementDef[] = [
  // Collection milestones
  { id: 'a_c100',  title: 'First Shift',         desc: 'Collect 100 raw scrap',         type: 'collected', target: 100,      reward: 300 },
  { id: 'a_c1k',   title: 'Magnet Apprentice',   desc: 'Collect 1,000 raw',             type: 'collected', target: 1000,     reward: 1200 },
  { id: 'a_c10k',  title: 'Magnet Adept',        desc: 'Collect 10,000 raw',            type: 'collected', target: 10000,    reward: 18000 },
  { id: 'a_c100k', title: 'Magnet Master',       desc: 'Collect 100,000 raw',           type: 'collected', target: 100000,   reward: 400000 },
  { id: 'a_c1m',   title: 'Magnet God',          desc: 'Collect 1,000,000 raw',         type: 'collected', target: 1000000,  reward: 22000000 },
  { id: 'a_c10m',  title: 'Galactic Vacuum',     desc: 'Collect 10,000,000 raw',        type: 'collected', target: 10000000, reward: 1000000000 },

  // Production milestones
  { id: 'a_p250',  title: 'Factory Online',      desc: 'Process 250 products',          type: 'processed', target: 250,      reward: 1800 },
  { id: 'a_p1k',   title: 'Forge Foreman',       desc: 'Process 1,000 products',        type: 'processed', target: 1000,     reward: 9000 },
  { id: 'a_p10k',  title: 'Forge Engineer',      desc: 'Process 10,000 products',       type: 'processed', target: 10000,    reward: 220000 },
  { id: 'a_p100k', title: 'Forge Director',      desc: 'Process 100,000 products',      type: 'processed', target: 100000,   reward: 10000000 },
  { id: 'a_p1m',   title: 'Industrial Hegemon',  desc: 'Process 1,000,000 products',    type: 'processed', target: 1000000,  reward: 500000000 },

  // Cash totals
  { id: 'a_cash_10k',  title: 'First Bag',          desc: 'Earn $10,000 total',         type: 'cashEarned', target: 10000,            reward: 500 },
  { id: 'a_cash_1m',   title: 'Neon Millionaire',   desc: 'Earn $1,000,000 total',      type: 'cashEarned', target: 1000000,          reward: 100000 },
  { id: 'a_cash_10m',  title: 'Holo Tycoon',        desc: 'Earn $10,000,000 total',     type: 'cashEarned', target: 10000000,         reward: 800000 },
  { id: 'a_cash_1b',   title: 'Cyber Baron',        desc: 'Earn $1,000,000,000 total',  type: 'cashEarned', target: 1000000000,       reward: 50000000 },
  { id: 'a_cash_1t',   title: 'Trans-System Mogul', desc: 'Earn $1T total',             type: 'cashEarned', target: 1000000000000,    reward: 5000000000 },

  // Per-item sales (one per product tier)
  { id: 'a_sell_iron50', title: 'Iron Sentry',     desc: 'Sell 50 iron plates',         type: 'ironPartSold',    target: 50,  reward: 1500 },
  { id: 'a_sell_glass50',title: 'Lens Polisher',   desc: 'Sell 50 fiber lenses',        type: 'glassLensSold',   target: 50,  reward: 8000 },
  { id: 'a_sell_plasma50',title:'Plasma Cooker',   desc: 'Sell 50 plasma cells',        type: 'plasmaCellSold',  target: 50,  reward: 30000 },
  { id: 'a_sell_quantum50',title:'Quantum Smith',  desc: 'Sell 50 quantum cores',       type: 'quantumCoreSold', target: 50,  reward: 200000 },
  { id: 'a_sell_sing40',title: 'Singularity Boss', desc: 'Sell 40 singularity drives',  type: 'singDriveSold',   target: 40,  reward: 1200000 },
  { id: 'a_sell_anti50',title: 'Antimatter Ace',   desc: 'Sell 50 antimatter drives',   type: 'antiPartSold',    target: 50,  reward: 5000000 },
  { id: 'a_sell_dark25',title: 'Dark Optician',    desc: 'Sell 25 dark matter lenses',  type: 'darkPartSold',    target: 25,  reward: 25000000 },
  { id: 'a_sell_void15',title: 'Void Engineer',    desc: 'Sell 15 void forge engines',  type: 'voidPartSold',    target: 15,  reward: 120000000 },
  { id: 'a_sell_causal10',title:'Cause & Effect',  desc: 'Sell 10 causal stabilizers',  type: 'causalPartSold',  target: 10,  reward: 800000000 },
  { id: 'a_sell_entropic5',title:'Heat Death Hand',desc: 'Sell 5 heat-death cores',     type: 'entropicPartSold',target: 5,   reward: 5000000000 },

  // Drone milestones
  { id: 'a_d3',  title: 'Automation Begins',  desc: 'Own 3 drones',                     type: 'droneBest', target: 3,  reward: 5500 },
  { id: 'a_d5',  title: 'Drone Squad',        desc: 'Own 5 drones',                     type: 'droneBest', target: 5,  reward: 80000 },
  { id: 'a_d10', title: 'Drone Battalion',    desc: 'Own 10 drones',                    type: 'droneBest', target: 10, reward: 2000000 },
  { id: 'a_d14', title: 'Full Roster',        desc: 'Own all 14 drones',                type: 'droneBest', target: 14, reward: 50000000 },

  // Zone milestones
  { id: 'a_z3',  title: 'Land Grab',          desc: 'Unlock 3 zones',                   type: 'zonesUnlocked', target: 3,  reward: 25000 },
  { id: 'a_z5',  title: 'Zone Baron',         desc: 'Unlock 5 zones',                   type: 'zonesUnlocked', target: 5,  reward: 150000 },
  { id: 'a_z7',  title: 'Galaxy Mapper',      desc: 'Unlock 7 zones',                   type: 'zonesUnlocked', target: 7,  reward: 4000000 },
  { id: 'a_z10', title: 'Whole Lot',          desc: 'Unlock every zone',                type: 'zonesUnlocked', target: 10, reward: 500000000 },

  // Frenzy milestones
  { id: 'a_f1',  title: 'First Frenzy',       desc: 'Trigger one Frenzy',               type: 'frenzies', target: 1,    reward: 8000 },
  { id: 'a_f10', title: 'Frenzied',           desc: 'Trigger 10 Frenzies',              type: 'frenzies', target: 10,   reward: 500000 },
  { id: 'a_f50', title: 'Adrenaline Junkie',  desc: 'Trigger 50 Frenzies',              type: 'frenzies', target: 50,   reward: 30000000 },
  { id: 'a_f200',title: 'Forever Frenzy',     desc: 'Trigger 200 Frenzies',             type: 'frenzies', target: 200,  reward: 5000000000 },

  // Prestige milestones
  { id: 'a_pr1', title: 'First Reboot',       desc: 'Perform your first prestige',      type: 'prestigeRuns', target: 1,  reward: 10000 },
  { id: 'a_pr5', title: 'Cycle Master',       desc: 'Prestige 5 times',                 type: 'prestigeRuns', target: 5,  reward: 2000000 },
  { id: 'a_pr10',title: 'Eternal Return',     desc: 'Prestige 10 times',                type: 'prestigeRuns', target: 10, reward: 50000000 },
  { id: 'a_pr25',title: 'Cycle Sage',         desc: 'Prestige 25 times',                type: 'prestigeRuns', target: 25, reward: 5000000000 },
  { id: 'a_pr50',title: 'Infinite Recursion', desc: 'Prestige 50 times',                type: 'prestigeRuns', target: 50, reward: 500000000000 },

  // Daily streak milestones (Pass 3 will tick streakDays when the player checks in.)
  { id: 'a_streak3', title: 'Three Days In',  desc: '3-day login streak',               type: 'streakDays', target: 3,    reward: 5000 },
  { id: 'a_streak7', title: 'A Whole Week',   desc: '7-day login streak',               type: 'streakDays', target: 7,    reward: 50000 },
  { id: 'a_streak14',title: 'Fortnight Run',  desc: '14-day login streak',              type: 'streakDays', target: 14,   reward: 500000 },
  { id: 'a_streak30',title: 'Month Engine',   desc: '30-day login streak',              type: 'streakDays', target: 30,   reward: 50000000 },
];
