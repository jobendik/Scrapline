/* ============================================================================
 * Themes — palette swaps driven by CSS variables on documentElement.
 *
 * Each theme overrides the 5 accent CSS custom properties (--cyan, --green,
 * --pink, --gold, --violet) plus the background tint. Render code reads
 * them at runtime via getComputedStyle so neon glows + particles inherit the
 * theme automatically.
 *
 * Cyan ships unlocked. The other five gate on milestones — daily streak
 * checkpoints + achievement counts — so themes act as visible progression
 * rewards without ever being purchasable for cash.
 * ========================================================================== */

import type { Game } from '../game';

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  /** CSS variable overrides applied to documentElement. */
  vars: Record<string, string>;
  /** Predicate: true when the player has unlocked this theme. */
  unlocked: (g: Game) => boolean;
  /** Unlock requirement text shown in the picker. */
  requirement: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'cyan',
    name: 'Neon Cyan',
    description: 'The original Scrapline palette.',
    vars: {
      '--cyan': '#38f8ff', '--green': '#45ff93', '--pink': '#ff43df',
      '--gold': '#ffd45c', '--violet': '#a476ff',
    },
    unlocked: () => true,
    requirement: 'Always available.',
  },
  {
    id: 'sunset',
    name: 'Hot Sunset',
    description: 'Orange + pink hothouse vibes.',
    vars: {
      '--cyan': '#ff9f43', '--green': '#ffd45c', '--pink': '#ff4f73',
      '--gold': '#ffe482', '--violet': '#ff7f50',
    },
    unlocked: (g) => (g.state.streakDays || 0) >= 7,
    requirement: '7-day login streak.',
  },
  {
    id: 'toxic',
    name: 'Toxic Lab',
    description: 'Acid-green industrial.',
    vars: {
      '--cyan': '#7eff5a', '--green': '#c3ff3d', '--pink': '#9cff52',
      '--gold': '#dfff5e', '--violet': '#39e879',
    },
    unlocked: (g) => (g.state.streakDays || 0) >= 14,
    requirement: '14-day login streak.',
  },
  {
    id: 'void',
    name: 'Deep Void',
    description: 'Purple-blue deep space.',
    vars: {
      '--cyan': '#7a6fff', '--green': '#54a2ff', '--pink': '#c777ff',
      '--gold': '#a89eff', '--violet': '#5a3fff',
    },
    unlocked: (g) => (g.state.streakDays || 0) >= 30,
    requirement: '30-day login streak.',
  },
  {
    id: 'bloodmoon',
    name: 'Blood Moon',
    description: 'Crimson + black, prestige only.',
    vars: {
      '--cyan': '#ff6b6b', '--green': '#ff8585', '--pink': '#ff385d',
      '--gold': '#ff9b6b', '--violet': '#b53d3d',
    },
    unlocked: (g) => (g.state.prestigeRuns || 0) >= 5,
    requirement: 'Prestige 5 times.',
  },
  {
    id: 'frost',
    name: 'Frost Core',
    description: 'Pale white + cyan ice.',
    vars: {
      '--cyan': '#bdf6ff', '--green': '#e8fff7', '--pink': '#7adfff',
      '--gold': '#e0f7ff', '--violet': '#9ccaff',
    },
    unlocked: (g) => (g.state.stats.zonesUnlocked || 0) >= 8,
    requirement: 'Unlock 8 zones.',
  },
];

/** Apply a theme to documentElement. Safe to call on a non-existent id (no-op). */
export function applyTheme(id: string): void {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  for (const [k, v] of Object.entries(theme.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  document.documentElement.dataset.theme = theme.id;
}
