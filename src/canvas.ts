/* ============================================================================
 * Canvas singleton + DPR-aware sizing.
 * The original prototype kept `canvas`, `ctx`, `W`, `H`, `DPR` as IIFE locals.
 * We export them from a single module so every renderer can import them.
 * ========================================================================== */

import { DPR_LIMIT } from './constants';

/** Top-level canvas the game draws into. */
export const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('#game canvas not found in DOM');

/** 2D context. `alpha: false` lets the browser skip the alpha composite pass. */
export const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

/**
 * Live, mutable size + DPR. Modules importing these read fresh values at
 * runtime via the named exports — the {@link resize} function mutates them in
 * place. We keep them as an object so the binding stays live (ESM exports of
 * primitives are bound to the original variable, but readers must use
 * `state.W` / `state.H` / `state.DPR` to get the latest values).
 */
export const view = {
  DPR: 1,
  W: 1,
  H: 1,
};

/** Resize the backing buffer to match the window and devicePixelRatio. */
export function resize(): void {
  view.DPR = Math.min(DPR_LIMIT, window.devicePixelRatio || 1);
  view.W = window.innerWidth;
  view.H = window.innerHeight;
  canvas.width = Math.floor(view.W * view.DPR);
  canvas.height = Math.floor(view.H * view.DPR);
  canvas.style.width = view.W + 'px';
  canvas.style.height = view.H + 'px';
}

window.addEventListener('resize', resize, { passive: true });
resize();
