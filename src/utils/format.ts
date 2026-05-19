/* ============================================================================
 * Number formatting + small canvas helpers.
 * ========================================================================== */

/** Format a number as a currency string with K/M/B/T suffixes. */
export function money(n: number): string {
  if (!isFinite(n)) return '$0';
  n = Math.max(0, n);
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.floor(n).toLocaleString('en-US');
}

/** Format an integer-ish count with K/M suffixes (no leading $). */
export function units(n: number): string {
  n = Math.max(0, n || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

/** Build a rounded-rectangle path on a context. Does not stroke/fill itself. */
export function rr(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Convert a #rrggbb hex color + alpha to an rgba() string. */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

/** Promise-based setTimeout used by the ad bridge for fallback delays. */
export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
