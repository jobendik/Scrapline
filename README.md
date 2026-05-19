# Scrapline

Neon cyberpunk idle-tycoon prototype targeting CrazyGames. The original was a
single 60 KB HTML file; this branch ports it to a Vite + TypeScript project
with a proper module split, adds a mobile-first HUD with bottom navigation,
versions the save schema (with migration), and ships a settings panel.

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
│   ├── main.ts             # Boots CrazyGames SDK + Game singleton, drives load screen
│   ├── style.css           # All styles
│   ├── canvas.ts           # Canvas + ctx + DPR-aware resize
│   ├── dom.ts              # HUD element references + NAV_SHEETS map
│   ├── constants.ts        # SAVE_KEY (v2), SAVE_KEY_LEGACY_V1, SAVE_VERSION, isMobile()
│   ├── types.ts            # Shared TS interfaces (SaveState, SettingsState, ZoneDef, …)
│   ├── game.ts             # Game singleton (loop, save+migrate, UI, sheets, settings)
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
│   │   ├── haptics.ts      # navigator.vibrate wrapper with toggle
│   │   └── ad-bridge.ts    # CrazyGames v3 ad wrapper
│   ├── data/               # items / zones / upgrades / contracts / achievements / market
│   ├── render/             # drawItem / drawZone / label / progressCircle
│   └── entities/           # ground-item / flying-item / resource-node / core /
│                           # sell-hub / terminal / drone / player
├── public/
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml
```

## Pass 1 (mobile + save v2 + settings)

### Mobile HUD
- 5-tab bottom navigation (Home / Goals / Shop / Boosts / Menu) with red-dot
  badges on tabs that have claimable rewards. Tabs toggle full-screen sheets;
  re-tapping a tab closes it; Home tab clears everything.
- Side panels on desktop morph into bottom-up sheets on mobile via CSS — one
  DOM tree, no duplicated content nodes.
- Profile pill top-right shows Level + Prestige on mobile (the dedicated
  chips hide < 1041px). Pill is also a Menu shortcut.
- Safe-area insets honored on every absolute-positioned UI element.
- Minimum 56×56 px touch targets on the bnav; 38 px elsewhere.
- Joystick remains semi-transparent (35 %) when idle on mobile so it never
  disappears between drag gestures.
- Branded load screen runs while the CrazyGames SDK boots; fades out once
  `game.init()` returns.

### Settings panel
Lives inside the Menu sheet:
- **Sound** — wraps `AudioSys.toggle()`. Desktop Sound button stays in sync.
- **Music** — flag is persisted; the music track itself lands in Pass 5.
- **Haptics** — wraps `navigator.vibrate` via `core/haptics.ts`. Defaults
  ON on mobile, OFF on desktop, persisted thereafter.
- **Graphics** — auto / high / medium / low. Currently advisory; particle
  caps + parallax intensity will branch off this in Pass 7.
- **Save / Export / Import / Reset** — duplicated from the desktop bottom
  row so mobile users never have to leave the menu sheet.
- **Credits** — Scrapline · made by Jo Bendik.

### Haptic feedback
Wired into pickup-adjacent events: `buy`, `err`, `levelUp`, `zoneUnlock`,
`prestige`, `frenzy`. Silently no-ops when the API is missing or settings
have it muted.

### Save v2 + migration
- Active key: `scrapline.v2.save`. New fields: `version`, `settings`,
  `tutorialDone`.
- `Game.migrate()` is a forward-only ladder. v1 → v2 adds the new fields
  with sensible defaults (haptics defaults to ON on mobile, gfx to auto).
- On first load with no v2 save, `Game.load()` falls back to the legacy
  key `neon_scrapline_factory_frenzy_v1`, migrates it in-memory, writes to
  the v2 key, deletes the legacy key, and toasts "Save upgraded to v2.".
- Corrupt save → fresh state + toast "Save was corrupt — started fresh.
  Use Export to back up." Nothing is silently lost.
- Reset clears both v2 and legacy keys defensively.

### Other Pass 1 changes
- All player-facing copy renamed from "Neon Scrapline" / "Factory Frenzy"
  to **Scrapline**. The mobile title bar is hidden in favour of the bottom
  nav; the desktop title chip simply reads "Scrapline · Neon idle tycoon".
- Window global renamed: `window.NeonScraplineFactoryFrenzy` →
  `window.Scrapline`.
- Save export filename is now `scrapline-save.json` (was
  `neon-scrapline-save.json`).
- Notification badges on Goals + Shop tabs recompute every UI tick
  (~150 ms). Goals dot lights when *any* contract / market / achievement is
  ready to claim; Shop dot lights when *any* upgrade or zone is affordable
  or when prestige is available.

## Adding content

- **New item pair**: append to [`src/data/items.ts`](src/data/items.ts).
- **New zone**: append to [`src/data/zones.ts`](src/data/zones.ts).
- **New upgrade**: append to [`src/data/upgrades.ts`](src/data/upgrades.ts);
  the shop UI auto-renders the row.
- **New contract / achievement**: append to
  [`src/data/contracts.ts`](src/data/contracts.ts) /
  [`src/data/achievements.ts`](src/data/achievements.ts).
- **New save field**: extend `SaveState` in
  [`src/types.ts`](src/types.ts), bump `SAVE_VERSION` in
  [`src/constants.ts`](src/constants.ts), and add a `if (v < N) { … }`
  branch to `Game.migrate`.

## CrazyGames SDK touchpoints

Lazy-loaded with a 2.5 s timeout in [`src/main.ts`](src/main.ts); failures
silently fall through. Calls live in
[`src/core/ad-bridge.ts`](src/core/ad-bridge.ts):

- `sdk.game.gameplayStart()` / `gameplayStop()` wrap every ad break.
- `sdk.ad.requestAd('rewarded' | 'midgame')` is the only ad surface.
- Without the SDK the wrapper grants rewards locally and toasts an
  apologetic notice — game stays playable in dev / on direct GH Pages.

## GitHub Pages deployment

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds on every push to `main` and publishes `dist/` via GitHub Pages.

To enable it the first time:

1. Merge this PR (or push directly) to `main`.
2. Settings → **Pages** → set **Source** to **GitHub Actions**.
3. The action runs automatically; deployed URL appears in the workflow
   summary (typically `https://<user>.github.io/Scrapline/`).

To preview a different sub-path locally:

```bash
GITHUB_PAGES_BASE=/MyForkName/ npm run build
```

## TypeScript config

`tsconfig.json` is intentionally permissive (`strict: false`,
`noImplicitAny: false`) so the original prototype's dynamic patterns
(stat key string indexing, etc.) compile without a sweeping rewrite.
Tightening it is on the roadmap once the content passes settle.

## License

Private / unreleased.

