/* ============================================================================
 * HUD / UI element references.
 * Mirrors the `ui` object from the original prototype.
 * ========================================================================== */

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing DOM element #${id}`);
  return node as T;
}

export const ui = {
  cash: el('cashValue'),
  cargo: el('cargoValue'),
  factory: el('factoryValue'),
  level: el('levelValue'),
  prestige: el('prestigeValue'),
  status: el('statusLine'),
  progress: el('progressList'),
  upgrades: el('upgradeList'),
  progressHint: el('progressHint'),
  shopHint: el('shopHint'),
  toast: el('toast'),
  intro: el('introModal'),
  start: el<HTMLButtonElement>('startBtn'),
  rewardValue: el<HTMLButtonElement>('rewardValueBtn'),
  rewardFrenzy: el<HTMLButtonElement>('rewardFrenzyBtn'),
  save: el<HTMLButtonElement>('saveBtn'),
  sound: el<HTMLButtonElement>('soundBtn'),
  export: el<HTMLButtonElement>('exportBtn'),
  import: el<HTMLButtonElement>('importBtn'),
  reset: el<HTMLButtonElement>('resetBtn'),
  tabContracts: el('tabContracts'),
  tabMarket: el('tabMarket'),
  tabAchievements: el('tabAchievements'),
  adBox: el('adBox'),
  adTitle: el('adTitle'),
  adText: el('adText'),
  adClose: el<HTMLButtonElement>('adCloseBtn'),
  edge: el('frenzyEdge'),
  mobilePad: el<HTMLDivElement>('mobilePad'),
  mobileKnob: el<HTMLDivElement>('mobileKnob'),
  storageWarn: el('storageWarn'),
  storageOk: el<HTMLButtonElement>('storageOk'),
  fileInput: el<HTMLInputElement>('fileInput'),
};

export type UI = typeof ui;
