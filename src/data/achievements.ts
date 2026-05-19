/* ============================================================================
 * Permanent achievements ("badges").
 * Same shape as contracts but explicitly long-form (`desc`) and meant to remain
 * visible after claim — they're prestige-stable bragging rights.
 * ========================================================================== */

import type { AchievementDef } from '../types';

export const ACH: AchievementDef[] = [
  { id: 'a1', title: 'First Shift',       desc: 'Collect 100 raw scrap',         type: 'collected',     target: 100,     reward: 300 },
  { id: 'a2', title: 'Factory Online',    desc: 'Process 250 products',          type: 'processed',     target: 250,     reward: 1800 },
  { id: 'a3', title: 'Automation Begins', desc: 'Own 3 drones',                  type: 'droneBest',     target: 3,       reward: 5500 },
  { id: 'a4', title: 'Neon Millionaire',  desc: 'Earn $1M total',                type: 'cashEarned',    target: 1000000, reward: 100000 },
  { id: 'a5', title: 'Zone Baron',        desc: 'Unlock every zone',             type: 'zonesUnlocked', target: 4,       reward: 150000 },
  { id: 'a6', title: 'Singularity Boss',  desc: 'Sell 40 Singularity Drives',    type: 'singDriveSold', target: 40,      reward: 250000 },
];
