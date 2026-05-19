/* ============================================================================
 * Debug overlay — opt-in via the `?debug=1` URL flag.
 *
 * Renders a small panel in the bottom-left with:
 *   - frames per second (rolling avg over the last 60 frames)
 *   - particle / item / drone counts
 *   - cheat buttons: +1M cash, +1B cash, skip 1 UTC day, max upgrades,
 *     trigger prestige, complete tutorial, reset save, spawn 100 items.
 *
 * Lives entirely outside the build flag — when the URL flag is absent the
 * overlay never renders and pays zero per-frame cost.
 * ========================================================================== */

import { ITEM } from '../data/items';
import { TAU } from '../constants';
import { UPGRADES } from '../data/upgrades';
import { ZONES } from '../data/zones';
import { rand } from '../utils/math';
import { GroundItem } from '../entities/ground-item';
import type { Game } from '../game';

export function isDebugMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch (_e) {
    return false;
  }
}

/** Per-frame FPS history (last 60 samples). */
const fpsBuffer: number[] = [];
const FPS_WINDOW = 60;

export function sampleFps(dt: number): number {
  if (dt > 0) fpsBuffer.push(1 / dt);
  while (fpsBuffer.length > FPS_WINDOW) fpsBuffer.shift();
  if (!fpsBuffer.length) return 0;
  let sum = 0;
  for (const v of fpsBuffer) sum += v;
  return sum / fpsBuffer.length;
}

let mounted = false;
let panel: HTMLDivElement | null = null;
let metrics: HTMLDivElement | null = null;

/** Render the debug panel once. Subsequent calls just update the metrics row. */
export function renderDebugOverlay(game: Game): void {
  if (!isDebugMode()) return;
  if (!mounted) {
    mount(game);
    mounted = true;
  }
  if (metrics) {
    const fps = sampleFps(0);
    void fps; // sampling happens elsewhere; render reads the buffer average.
    let s = 0;
    for (const v of fpsBuffer) s += v;
    const avg = fpsBuffer.length ? s / fpsBuffer.length : 0;
    metrics.innerHTML =
      `<div><b>FPS</b> ${avg.toFixed(1)}</div>` +
      `<div><b>items</b> ${game.items.length}</div>` +
      `<div><b>flying</b> ${game.flying.length}</div>` +
      `<div><b>drones</b> ${game.drones.length}</div>` +
      `<div><b>parts</b> ${game.particles.a.length}</div>` +
      `<div><b>texts</b> ${game.texts.length}</div>` +
      `<div><b>cash</b> ${Math.floor(game.state.cash)}</div>` +
      `<div><b>save</b> ${(JSON.stringify(game.state).length / 1024).toFixed(1)} KB</div>`;
  }
}

function mount(game: Game): void {
  panel = document.createElement('div');
  panel.id = 'debugPanel';
  panel.style.cssText = [
    'position:fixed', 'left:8px', 'bottom:74px', 'z-index:9999',
    'background:rgba(0,0,0,.85)', 'color:#7eff5a',
    'font:11px ui-monospace,Menlo,Consolas,monospace',
    'border:1px solid #45ff93', 'border-radius:10px',
    'padding:8px 10px', 'min-width:160px', 'pointer-events:auto',
    'box-shadow:0 0 22px rgba(69,255,147,.35)',
  ].join(';');
  panel.innerHTML = `<div style="font-weight:900;letter-spacing:.1em;margin-bottom:6px">DEBUG · ?debug=1</div>`;
  metrics = document.createElement('div');
  metrics.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;margin-bottom:8px';
  panel.appendChild(metrics);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px';
  const addBtn = (label: string, fn: () => void): void => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'font-size:10px;padding:5px 6px;min-height:0';
    b.onclick = () => { fn(); game.updateUI(true); };
    grid.appendChild(b);
  };

  addBtn('+1M $', () => { game.state.cash += 1e6; game.state.totalCash += 1e6; });
  addBtn('+1B $', () => { game.state.cash += 1e9; game.state.totalCash += 1e9; });
  addBtn('Skip day', () => {
    // Roll back lastLoginUTC by one day so the next runDailyCheck triggers.
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    game.state.lastLoginUTC = `${y}-${m}-${day}`;
    game.toast('lastLoginUTC rewound — reload to trigger fresh day.');
  });
  addBtn('Max upgrades', () => {
    for (const u of UPGRADES) game.state.up[u.id] = u.max;
    game.applyDrones();
  });
  addBtn('+10 PP', () => { game.state.prestige += 10; });
  addBtn('Prestige now', () => {
    // Provide enough cash to force a meaningful prestigeGain.
    game.state.totalCash = Math.max(game.state.totalCash, 1e7);
    game.state.level = Math.max(game.state.level, 25);
    game.prestige();
  });
  addBtn('Tutorial done', () => { game.state.tutorialDone = true; });
  addBtn('Reset save', () => {
    if (!confirm('DEBUG: wipe save + reload?')) return;
    localStorage.clear();
    location.reload();
  });
  addBtn('+100 items', () => {
    const z = ZONES.find((zz) => game.state.zones[zz.id]) || ZONES[0];
    const raw = z.raw;
    const cx = z.rect.x + z.rect.w / 2;
    const cy = z.rect.y + z.rect.h / 2;
    for (let i = 0; i < 100; i++) {
      const a = rand(0, TAU);
      const r = Math.sqrt(Math.random()) * 200;
      game.items.push(new GroundItem(cx + Math.cos(a) * r, cy + Math.sin(a) * r, raw));
    }
  });
  addBtn('Unlock all zones', () => {
    for (const z of ZONES) game.state.zones[z.id] = true;
    game.state.stats.zonesUnlocked = ZONES.length;
  });
  addBtn('Frenzy', () => { game.startFrenzy(); });
  addBtn('2× boost', () => { game.state.boostTime = 180; });
  addBtn('All themes', () => {
    // Force-unlock every theme so we can preview them.
    game.state.themesOwned = Array.from(new Set([...(game.state.themesOwned || []), ...((['cyan','sunset','toxic','void','bloodmoon','frost']) as string[])]));
  });
  void ITEM;
  panel.appendChild(grid);
  document.body.appendChild(panel);
}
