/* ============================================================================
 * Tiny math helpers shared by every renderer / entity.
 * ========================================================================== */

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const rand = (a: number, b: number): number => a + Math.random() * (b - a);
export const pick = <T>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];
export const len = (x: number, y: number): number => Math.hypot(x, y);
export const d2 = (a: number, b: number, c: number, d: number): number => {
  const x = a - c;
  const y = b - d;
  return x * x + y * y;
};
export const dist = (a: number, b: number, c: number, d: number): number => Math.sqrt(d2(a, b, c, d));
