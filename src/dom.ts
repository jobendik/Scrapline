/* ============================================================================
 * HUD / UI element references.
 *
 * Centralised so Game (and a future store) can address any control without
 * walking the DOM. New entries added in Pass 1: profile pill, bottom nav,
 * sheet duplicates of the reward/save/etc buttons, settings inputs, load
 * screen.
 * ========================================================================== */

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing DOM element #${id}`);
  return node as T;
}

function maybe<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Query helper for nodelists where we expect zero-or-many. */
function all<T extends HTMLElement = HTMLElement>(sel: string): T[] {
  return Array.from(document.querySelectorAll<T>(sel));
}

export const ui = {
  // Top chips
  cash: el('cashValue'),
  cargo: el('cargoValue'),
  factory: el('factoryValue'),
  level: el('levelValue'),
  prestige: el('prestigeValue'),

  // Profile pill (mobile)
  profilePill: el<HTMLButtonElement>('profilePill'),
  profileLevel: el('profileLevel'),
  profilePrestige: el('profilePrestige'),

  status: el('statusLine'),
  progress: el('progressList'),
  upgrades: el('upgradeList'),
  progressHint: el('progressHint'),
  shopHint: el('shopHint'),
  toast: el('toast'),

  // Modals
  intro: el('introModal'),
  start: el<HTMLButtonElement>('startBtn'),

  // Reward buttons — both desktop (.bottom) and mobile (sheet) variants.
  rewardValue: el<HTMLButtonElement>('rewardValueBtn'),
  rewardFrenzy: el<HTMLButtonElement>('rewardFrenzyBtn'),
  rewardValueSheet: el<HTMLButtonElement>('rewardValueBtnSheet'),
  rewardFrenzySheet: el<HTMLButtonElement>('rewardFrenzyBtnSheet'),

  // Save/sound/export/import/reset — mobile duplicates included.
  save: el<HTMLButtonElement>('saveBtn'),
  saveDesktop: maybe<HTMLButtonElement>('saveBtnDesktop'),
  sound: el<HTMLButtonElement>('soundBtn'),
  export: el<HTMLButtonElement>('exportBtn'),
  exportDesktop: maybe<HTMLButtonElement>('exportBtnDesktop'),
  import: el<HTMLButtonElement>('importBtn'),
  importDesktop: maybe<HTMLButtonElement>('importBtnDesktop'),
  reset: el<HTMLButtonElement>('resetBtn'),
  resetDesktop: maybe<HTMLButtonElement>('resetBtnDesktop'),

  // Tabs inside the Goals sheet.
  tabContracts: el('tabContracts'),
  tabDaily: el('tabDaily'),
  tabMarket: el('tabMarket'),
  tabAchievements: el('tabAchievements'),
  tabDailyDot: el('tabDailyDot'),

  // Ad box.
  adBox: el('adBox'),
  adTitle: el('adTitle'),
  adText: el('adText'),
  adClose: el<HTMLButtonElement>('adCloseBtn'),

  // World pulse + joystick.
  edge: el('frenzyEdge'),
  mobilePad: el<HTMLDivElement>('mobilePad'),
  mobileKnob: el<HTMLDivElement>('mobileKnob'),

  // Storage notice (sandboxed iframes).
  storageWarn: el('storageWarn'),
  storageOk: el<HTMLButtonElement>('storageOk'),
  fileInput: el<HTMLInputElement>('fileInput'),

  // Bottom nav (mobile) + sheet container references.
  navButtons: all<HTMLButtonElement>('.bnav .nbtn'),
  navDotGoals: el('navDotGoals'),
  navDotShop: el('navDotShop'),
  panelGoals: el('panelGoals'),
  panelShop: el('panelShop'),
  panelBoosts: el('panelBoosts'),
  panelMenu: el('panelMenu'),
  sheetCloseButtons: all<HTMLButtonElement>('[data-sheet-close]'),

  // Settings inputs.
  settingSound: el<HTMLButtonElement>('settingSound'),
  settingMusic: el<HTMLButtonElement>('settingMusic'),
  settingHaptics: el<HTMLButtonElement>('settingHaptics'),
  settingGfx: el<HTMLSelectElement>('settingGfx'),
  themePicker: el('themePicker'),

  // Loading screen (hidden by main.ts once boot finishes).
  loadScreen: el('loadScreen'),
  loadFill: el('loadFill'),
  loadHint: el('loadHint'),

  // Daily chest modal.
  dailyModal: el('dailyModal'),
  dailyTitle: el('dailyTitle'),
  dailyEyebrow: el('dailyEyebrow'),
  dailyStreak: el('dailyStreak'),
  dailyChestSlot: el('dailyChestSlot'),
  dailyCash: el('dailyCash'),
  dailyPp: el('dailyPp'),
  dailyClaim: el<HTMLButtonElement>('dailyClaimBtn'),
  dailyDouble: el<HTMLButtonElement>('dailyDoubleBtn'),
  dailyClose: el<HTMLButtonElement>('dailyCloseBtn'),
  dailyStreakRow: el('dailyStreakRow'),

  // Tutorial banner.
  tutorialBanner: el('tutorialBanner'),
  tutorialTitle: el('tutorialTitle'),
  tutorialBody: el('tutorialBody'),
  tutorialProgress: el('tutorialProgress'),
  tutorialSkip: el<HTMLButtonElement>('tutorialSkipBtn'),
};

export type UI = typeof ui;

/** Map nav tab id -> sheet element. Defined here so game.ts can iterate. */
export const NAV_SHEETS: Record<string, HTMLElement> = {
  goals: ui.panelGoals,
  shop: ui.panelShop,
  boosts: ui.panelBoosts,
  menu: ui.panelMenu,
};
