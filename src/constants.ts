/* ============================================================================
 * Global constants.
 * Pulled out of the original IIFE so every module can import them directly.
 * ========================================================================== */

/** localStorage key for the persisted game state. */
export const SAVE_KEY = 'neon_scrapline_factory_frenzy_v1';

/** Two times pi — used everywhere we draw rings, particles, polygons. */
export const TAU = Math.PI * 2;

/** Cap for devicePixelRatio. Higher gives sharper rendering but kills mobile perf. */
export const DPR_LIMIT = 2;
