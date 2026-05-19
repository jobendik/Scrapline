# Scrapline

Neon cyberpunk idle-tycoon prototype targeting CrazyGames. The original was a
single 60 KB HTML file; this branch ports it to a Vite + TypeScript project
with a proper module split so we can extend it without choking on a wall of
minified JS.

> Working title in the running game is still **"Neon Scrapline: Factory
> Frenzy"** — the rename to plain "Scrapline" is intentionally deferred to a
> later content pass so this branch stays a pure structural refactor.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
npm run typecheck  # tsc --noEmit
```

Node 20+ is required (Vite 5 / TypeScript 5.6).

## File layout

```
.
├── index.html              # Vite entry — shell HTML, mounts /src/main.ts
├── src/
│   ├── main.ts             # Boots CrazyGames SDK + Game singleton
│   ├── style.css           # All styles (extracted from the original <style>)
│   ├── canvas.ts           # Canvas + ctx + DPR-aware resize
│   ├── dom.ts              # HUD element references (the `ui` object)
│   ├── constants.ts        # SAVE_KEY, TAU, DPR cap
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── game.ts             # Game singleton (loop, save, UI, render orchestration)
│   ├── utils/
│   │   ├── math.ts         # clamp / lerp / rand / pick / len / d2 / dist
│   │   ├── format.ts       # money / units / rr / hexA / wait
│   │   └── storage.ts      # safeStorage with in-memory fallback
│   ├── core/
│   │   ├── audio.ts        # AudioSys (procedural WebAudio SFX)
│   │   ├── input.ts        # Keyboard + virtual joystick
│   │   ├── camera.ts       # Smoothed follow + screen shake
│   │   ├── particles.ts    # Particle + Particles
│   │   ├── text-pop.ts     # Floating +$ / level-up text
│   │   └── ad-bridge.ts    # CrazyGames v3 ad wrapper
│   ├── data/
│   │   ├── items.ts        # ITEM catalogue (raw + product pairs)
│   │   ├── zones.ts        # ZONES (Starter Yard → Singularity Foundry)
│   │   ├── upgrades.ts     # UPGRADES (Flux Boots → Frenzy Capacitor)
│   │   ├── contracts.ts    # CONTRACTS (one-shot rewards)
│   │   ├── achievements.ts # ACH (permanent badges)
│   │   └── market.ts       # Deterministic daily market generator
│   ├── render/
│   │   ├── draw-item.ts    # Shape-switch icon renderer
│   │   ├── draw-zone.ts    # Pulsing aura under buildings/nodes
│   │   ├── label.ts        # Pill label above buildings
│   │   └── progress-circle.ts
│   └── entities/
│       ├── ground-item.ts
│       ├── flying-item.ts
│       ├── resource-node.ts
│       ├── core.ts         # The Neon Core (forge)
│       ├── sell-hub.ts
│       ├── terminal.ts     # The Upgrade Terminal
│       ├── drone.ts
│       └── player.ts
├── public/                 # Static assets copied as-is into dist/
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml  # GitHub Pages build + deploy
```

## Adding content

- **New item pair**: append a raw + product to [`src/data/items.ts`](src/data/items.ts).
- **New zone**: append a `ZoneDef` to [`src/data/zones.ts`](src/data/zones.ts) (refers to the raw item id).
- **New upgrade**: append to [`src/data/upgrades.ts`](src/data/upgrades.ts); the shop UI auto-renders the row.
- **New contract / achievement**: append to [`src/data/contracts.ts`](src/data/contracts.ts) or
  [`src/data/achievements.ts`](src/data/achievements.ts). `type` references a key
  in `SaveState.stats`.
- **Daily market reshuffle**: see [`src/data/market.ts`](src/data/market.ts) —
  the seed is the UTC date so every player gets the same orders for the same day.

## Save schema

Versioned under the legacy key `neon_scrapline_factory_frenzy_v1` (preserved
so anyone running an earlier build keeps their save). The shape is documented
in [`src/types.ts`](src/types.ts) as `SaveState`. `Game.load()` is
forward-defensive: unknown keys are kept, missing keys fall back to defaults
from `Game.default()`.

## CrazyGames SDK touchpoints

The SDK script is lazy-loaded in [`src/main.ts`](src/main.ts); failures are
silently ignored. Calls live in [`src/core/ad-bridge.ts`](src/core/ad-bridge.ts):

- `sdk.game.gameplayStart()` / `gameplayStop()` wrap every ad break.
- `sdk.ad.requestAd('rewarded' | 'midgame')` is the only ad surface.
- When the SDK is absent the wrapper grants the reward locally and shows a
  toast — so the game stays usable in dev and on direct GitHub Pages embeds.

## GitHub Pages deployment

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds on every push to `main` and publishes `dist/` via GitHub Pages.

To enable it the first time:

1. Push this branch to `main` (or merge the PR).
2. In the repo settings → **Pages**, set **Source** to **GitHub Actions**.
3. The action will run automatically; the deployed URL appears in the
   workflow summary (typically `https://<user>.github.io/Scrapline/`).

The build picks the correct asset base path from the repo name via
`GITHUB_PAGES_BASE`. To build for a different sub-path locally:

```bash
GITHUB_PAGES_BASE=/MyForkName/ npm run build
```

## Notes on the port

- The original prototype was ~60 KB of single-line, comma-chained minified JS
  inside one `<script>`. The split here is byte-for-byte semantically
  identical — only formatting, indentation, type annotations and module
  boundaries changed.
- TypeScript is intentionally permissive (`strict: false`,
  `noImplicitAny: false`). Tightening it up is a planned later pass — there is
  no point fighting the type system before the upcoming content / mobile-HUD
  overhaul lands.
- Classes that used to read `Game.up('speed')` / `Game.isFrenzy()` as
  static-like calls (Player, Core, Drone) now take an explicit `game`
  reference via a small `bind(game)` method to break the import cycle
  cleanly.

## License

Private / unreleased.
