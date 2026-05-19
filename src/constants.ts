/* ============================================================================
 * Global constants.
 * Pulled out of the original IIFE so every module can import them directly.
 * ========================================================================== */

/** Current persisted save schema version. Bumped whenever SaveState changes. */
export const SAVE_VERSION = 2;

/** localStorage key for the current schema. */
export const SAVE_KEY = 'scrapline.v2.save';

/**
 * Legacy save key from the v1 prototype (Neon Scrapline: Factory Frenzy).
 * Read once on first load, then deleted after a successful migration to v2.
 */
export const SAVE_KEY_LEGACY_V1 = 'neon_scrapline_factory_frenzy_v1';

/** Two times pi — used everywhere we draw rings, particles, polygons. */
export const TAU = Math.PI * 2;

/** Cap for devicePixelRatio. Higher gives sharper rendering but kills mobile perf. */
export const DPR_LIMIT = 2;

/** Detect a small-screen device for haptics + UI defaults. */
export function isMobile(): boolean {
  return window.matchMedia('(max-width: 1040px)').matches;
}
