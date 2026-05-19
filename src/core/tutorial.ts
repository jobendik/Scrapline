/* ============================================================================
 * Tutorial — first-time onboarding flow.
 *
 * Six short hand-pointer steps, each tied to a single observable game event
 * so the tutorial advances by what the player actually does, not by a timer.
 * A persistent state.tutorialStep tracks progress; state.tutorialDone flips
 * permanently when step 6 completes (or the player skips).
 *
 * The banner is rendered as a fixed overlay that hides itself when the
 * player progresses, then re-renders the next step.
 * ========================================================================== */

import { ui } from '../dom';
import type { Game } from '../game';

export interface TutorialStep {
  /** Header text on the banner. */
  title: string;
  /** Body / instruction text. */
  body: string;
  /**
   * Predicate evaluated each frame. When it returns true the step advances.
   * Game is passed in so steps can inspect player position, carry, cash, etc.
   */
  advance: (game: Game) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Move',
    body: 'Drag anywhere (or WASD on desktop) to fly your craft.',
    advance: (g) => Math.hypot(g.player.vx, g.player.vy) > 80,
  },
  {
    title: 'Collect',
    body: 'Float close to scrap and your magnet pulls it in.',
    advance: (g) => g.state.stats.collected >= 4,
  },
  {
    title: 'Feed the Core',
    body: 'Carry raw scrap to the green Neon Core to forge components.',
    advance: (g) => g.state.stats.processed >= 1,
  },
  {
    title: 'Sell',
    body: 'Deliver components to the gold Sell Hub for cash.',
    advance: (g) => g.state.stats.sold >= 1,
  },
  {
    title: 'Upgrade',
    body: 'Stand on the Upgrade Terminal and tap an upgrade to boost your rig.',
    advance: (g) => g.state.stats.upgradesBought >= 1,
  },
  {
    title: 'You\'re online',
    body: 'Tap Goals for contracts + daily rewards, or Shop to keep upgrading.',
    advance: (g) => g.tutorialBannerSeenAt > 0 && g.time - g.tutorialBannerSeenAt > 3,
  },
];

/**
 * Render the banner for the current step, or hide it once `tutorialDone` flips.
 * Called from updateUI every UI tick.
 */
export function renderTutorial(game: Game): void {
  if (game.state.tutorialDone) {
    ui.tutorialBanner.classList.add('hidden');
    return;
  }
  const step = TUTORIAL_STEPS[game.state.tutorialStep];
  if (!step) {
    ui.tutorialBanner.classList.add('hidden');
    return;
  }
  ui.tutorialBanner.classList.remove('hidden');
  ui.tutorialTitle.textContent = step.title;
  ui.tutorialBody.textContent = step.body;
  ui.tutorialProgress.textContent = `${game.state.tutorialStep + 1} / ${TUTORIAL_STEPS.length}`;
}

/**
 * Advance the tutorial if the current step's predicate fires. Called each
 * frame from Game.update. Cheap — early-outs the moment the tutorial is done.
 */
export function tickTutorial(game: Game): void {
  if (game.state.tutorialDone) return;
  const step = TUTORIAL_STEPS[game.state.tutorialStep];
  if (!step) {
    game.state.tutorialDone = true;
    return;
  }
  if (game.state.tutorialStep === TUTORIAL_STEPS.length - 1 && game.tutorialBannerSeenAt === 0) {
    game.tutorialBannerSeenAt = game.time;
  }
  if (step.advance(game)) {
    game.state.tutorialStep += 1;
    game.tutorialBannerSeenAt = 0;
    if (game.state.tutorialStep >= TUTORIAL_STEPS.length) {
      game.state.tutorialDone = true;
      game.toast('Tutorial complete — keep building!');
    }
  }
}
