# Scrapline

Neon cyberpunk idle-tycoon for CrazyGames. Vite + TypeScript build.

The original was a 60 KB single-file HTML prototype; this branch ports it to
a modular project and delivers all 7 design-spec passes:

| Pass | Focus |
| ---- | ----- |
| 0 | Vite + TS scaffolding + GitHub Pages workflow |
| 1 | Mobile-first HUD, save v2 + migration, settings panel, rename to Scrapline |
| 2 | Content scale-up (10 zones, 20 items, 16 upgrades, 50 contracts, 42 achievements) |
| 3 | Daily login chest (30-day cycle), 3 daily challenges, onboarding tutorial — save v3 |
| 4 | Prestige tree (12 nodes, 3 tiers), drone roster (5 types), 6 unlockable themes — save v4 |
| 5 | Procedural music (calm + Frenzy variants), layered SFX, cash counter roll-up, camera punch-zoom |
| 6 | CrazyGames SDK refinement — happytime, midgame cooldown, getUser welcome, cloud save |
| 7 | Performance auto-quality, `?debug=1` overlay with cheats, keyboard shortcuts, focus-visible a11y |

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
npm run typecheck  # tsc --noEmit
```

Append `?debug=1` to the URL to surface the debug panel with FPS / entity
counters + cheat buttons (+$1M, +$1B, skip day, max upgrades, prestige,
spawn 100 items, unlock all zones, all themes).

Node 20+ is required (Vite 5 / TypeScript 5.6).

## Bundle

Final build:
- **98 KB JS** (30 KB gzipped)
- **20 KB CSS** (5 KB gzipped)
- **12 KB HTML** (3.5 KB gzipped)
- Well under the spec's 800 KB transferred budget.

## File layout

```
.
├── index.html              # Vite entry — shell HTML, mounts /src/main.ts
├── src/
│   ├── main.ts             # Boots SDK + Game, drives load screen
│   ├── style.css           # All styles (mobile-first, theme-driven)
│   ├── canvas.ts           # Canvas + ctx + DPR-aware resize
│   ├── dom.ts              # HUD element references
│   ├── constants.ts        # SAVE_KEY (v4), SAVE_VERSION, isMobile()
│   ├── types.ts            # Shared TS interfaces
│   ├── game.ts             # Game singleton — loop, save+migrate, UI
│   ├── utils/
│   │   ├── math.ts         # clamp / lerp / rand / pick / len / d2 / dist
│   │   ├── format.ts       # money / units / rr / hexA / wait
│   │   └── storage.ts      # safeStorage with in-memory fallback
│   ├── core/
│   │   ├── audio.ts        # SFX + procedural music loop
│   │   ├── input.ts        # Keyboard + virtual joystick + nav shortcuts
│   │   ├── camera.ts       # Smoothed follow + screen shake + punch-zoom
│   │   ├── particles.ts    # Particle + Particles (cap-aware)
│   │   ├── text-pop.ts     # Floating +$ / level-up text
│   │   ├── haptics.ts      # navigator.vibrate wrapper
│   │   ├── ad-bridge.ts    # CrazyGames v3 SDK (ads, happytime, cloud, user)
│   │   ├── tutorial.ts     # 6-step onboarding state machine
│   │   ├── daily.ts        # UTC-day check-in (streak + chest + challenges)
│   │   ├── debug.ts        # ?debug=1 overlay + cheats
│   │   └── perf.ts         # Auto-quality detection
│   ├── data/
│   │   ├── items.ts        # 20 items (10 raw, 10 product)
│   │   ├── zones.ts        # 10 zones (Starter Yard → Heat Death Reactor)
│   │   ├── upgrades.ts     # 16 upgrades
│   │   ├── contracts.ts    # 50 contracts (starter / intermediate / advanced)
│   │   ├── achievements.ts # 42 achievements
│   │   ├── market.ts       # Daily market (deterministic per UTC day)
│   │   ├── daily-chest.ts  # 30-day rotating chest cycle
│   │   ├── daily-challenges.ts # Per-day challenge templates
│   │   ├── prestige-tree.ts# 12-node skill tree (Reboot/Reset/Singularity)
│   │   ├── drones.ts       # 5 drone types (Scout/Hauler/Processor/Trader/Elite)
│   │   └── themes.ts       # 6 themes (Cyan/Sunset/Toxic/Void/BloodMoon/Frost)
│   ├── render/             # drawItem / drawZone / label / progressCircle
│   └── entities/           # ground-item / flying-item / resource-node /
│                           # core / sell-hub / terminal / drone / player
├── public/
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml
```

## Retention systems

- **Daily chest** — 30-day rotating cycle. Days 7, 14, 21 are themed
  milestones; day 30 is the legendary capstone (huge cash + 12 PP). Streak
  resets if a day is missed. Modal pops on a new UTC day; rewarded-ad
  doubles the payout.
- **Daily challenges** — 3 deterministic per-day challenges scaled to
  player level. Free reroll once per UTC day.
- **Tutorial** — 6 hand-pointer steps that advance based on game events
  (move, collect, deposit, sell, upgrade, complete). Skippable from the
  banner.
- **Notification badges** — red dots on Goals/Shop nav tabs whenever
  something is claimable / affordable; per-tab dot on Daily within Goals.
- **Theme unlocks** — 6 themes gated on streak / prestige / zone-count
  milestones. Pure cosmetic; CSS-variable swap.
- **Prestige tree** — 12 nodes across 3 tiers (Reboot 0+ PP, Reset 30+,
  Singularity 120+). PP spent on tree nodes is preserved across resets.

## Save schema

Current version `4` under key `scrapline.v2.save`. Forward-only migration
ladder in `Game.migrate()`:

- v1 → v2: settings + tutorialDone
- v2 → v3: daily retention fields (streakDays, chestDay, dailyChallenges, …)
- v3 → v4: prestigeNodes, prestigeSpent, activeTheme, themesOwned

Corrupt save → fresh defaults + toast, never silently lost. Reset clears
both v2 key and legacy `neon_scrapline_factory_frenzy_v1`.

Cloud save sync (Pass 6): when the CrazyGames SDK exposes `data.setItem`,
saves are debounced-mirrored to it; on init we fetch the cloud copy and
restore it if it has a newer `lastSave` timestamp.

## CrazyGames SDK touchpoints

Lazy-loaded with a 2.5 s timeout in `src/main.ts`. Calls live in
`src/core/ad-bridge.ts`:

- `sdk.game.gameplayStart()` / `gameplayStop()` wrap every ad break.
- `sdk.ad.requestAd('rewarded' | 'midgame')` is the only ad surface.
- `sdk.game.happytime()` fires after rewarded claims, level-ups,
  zone unlocks, contract / achievement claims — tells the SDK when it's
  safe to schedule its own interstitials.
- `sdk.user.getUser()` powers the welcome toast.
- `sdk.data.setItem / getItem` mirror saves to the cloud (debounced 60 s).
- Midgame interstitials cooldown-gated at 4 minutes between fires, and
  only fire on zone-unlock after the player has unlocked at least 3 zones.

Without the SDK every path gracefully falls back so the game stays usable
on direct GitHub Pages embeds.

## Performance

`Perf` module samples frame time for the first 5 seconds on `auto`
quality and resolves to high / medium / low. Each level adjusts:

- particle cap (300 / 200 / 100)
- parallax grid (full / thin / off)
- glow blur multiplier (1.0 / 0.7 / 0.0)

Player can override via the Graphics select in the Menu sheet.

## Debug mode

Append `?debug=1`:

```
https://<user>.github.io/Scrapline/?debug=1
```

Shows the debug panel with FPS / item / particle / drone counts plus
buttons: `+1M $`, `+1B $`, `Skip day`, `Max upgrades`, `+10 PP`,
`Prestige now`, `Tutorial done`, `Reset save`, `+100 items`,
`Unlock all zones`, `Frenzy`, `2× boost`, `All themes`.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` builds on every push to
`main` and publishes `dist/` via GitHub Pages.

To enable it the first time:

1. Merge this branch (or push directly) to `main`.
2. Settings → **Pages** → set **Source** to **GitHub Actions**.
3. Action runs automatically; deployed URL appears in the workflow
   summary (typically `https://<user>.github.io/Scrapline/`).

To preview a different sub-path locally:

```bash
GITHUB_PAGES_BASE=/MyForkName/ npm run build
```

## License

Private / unreleased.
