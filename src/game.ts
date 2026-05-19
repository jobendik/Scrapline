/* ============================================================================
 * Game — the singleton orchestrator. Owns every entity, the input stack, the
 * save lifecycle, the HUD render and the main loop.
 *
 * Was a const-object literal in the original prototype; converted to a class
 * here so TypeScript can give us proper `this` typing. A single instance is
 * exported at the bottom of the file.
 * ========================================================================== */

import { canvas, ctx, resize, view } from './canvas';
import { SAVE_KEY, SAVE_KEY_LEGACY_V1, SAVE_VERSION, TAU, isMobile } from './constants';
import { ui, NAV_SHEETS } from './dom';
import { ACH } from './data/achievements';
import { CONTRACTS } from './data/contracts';
import { ITEM } from './data/items';
import { makeMarket, marketSeed } from './data/market';
import { UPGRADES } from './data/upgrades';
import { WORLD_BOUNDS, ZONES } from './data/zones';
import { AdBridge } from './core/ad-bridge';
import { AudioSys } from './core/audio';
import { Camera } from './core/camera';
import { Haptics } from './core/haptics';
import { Input } from './core/input';
import { Particles } from './core/particles';
import { TextPop } from './core/text-pop';
import { runDailyCheck } from './core/daily';
import { renderTutorial, tickTutorial, TUTORIAL_STEPS } from './core/tutorial';
import { chestFor } from './data/daily-chest';
import { makeChallenges } from './data/daily-challenges';
import { Core } from './entities/core';
import { Drone } from './entities/drone';
import { FlyingItem } from './entities/flying-item';
import { GroundItem } from './entities/ground-item';
import { Player } from './entities/player';
import { ResourceNode } from './entities/resource-node';
import { SellHub } from './entities/sell-hub';
import { Terminal } from './entities/terminal';
import { clamp } from './utils/math';
import { money, rr, units } from './utils/format';
import { safeStorage } from './utils/storage';
import type { Camera as CameraT } from './core/camera';
import type { GfxQuality, SaveState, SettingsState, ZoneDef } from './types';

const storage = safeStorage();
if (!storage.persistent) ui.storageWarn.classList.remove('hidden');
ui.storageOk.onclick = () => ui.storageWarn.classList.add('hidden');

type Tab = 'contracts' | 'daily' | 'market' | 'achievements';

export class Game {
  // ---------------- subsystems ----------------
  input = new Input();
  audio = new AudioSys();
  camera = new Camera();
  particles = new Particles();
  ad!: AdBridge;

  // ---------------- entities ----------------
  player!: Player;
  core!: Core;
  sell!: SellHub;
  term!: Terminal;
  nodes!: ResourceNode[];
  /** All "buildings + nodes" for the per-frame update / depth sort. */
  objects: Array<ResourceNode | Core | SellHub | Terminal> = [];

  items: GroundItem[] = [];
  flying: FlyingItem[] = [];
  texts: TextPop[] = [];
  drones: Drone[] = [];

  // ---------------- loop state ----------------
  time = 0;
  last = performance.now() / 1000;
  started = false;
  paused = false;
  nearShop = false;
  tab: Tab = 'contracts';
  toastTimer: number | ReturnType<typeof setTimeout> = 0;
  uiTimer = 0;
  saveTimer = 0;
  statusTimer = 0;
  xp = 0;
  resetArmed = false;
  // Pass 2 — countdown until the next magnet-pulse AoE collect (0 = ready).
  pulseTimer = 0;
  // Pass 2 — incremented every product sale; recycler fires when threshold hit.
  recyclerCount = 0;
  // Pass 3 — timestamp when the tutorial's final-step banner first appeared.
  tutorialBannerSeenAt = 0;
  // Pass 3 — set when init detects a fresh-day chest waiting; the Start
  // Factory button shows it after the intro dismisses.
  pendingDailyShow = false;

  // ---------------- persistent state ----------------
  state!: SaveState;

  /** Build a fresh default save state. Always returns the current SAVE_VERSION shape. */
  default(): SaveState {
    const up: Record<string, number> = {};
    UPGRADES.forEach((u) => (up[u.id] = 0));
    const zones: Record<string, boolean> = {};
    ZONES.forEach((z) => (zones[z.id] = z.id === 'home'));
    const c: Record<string, boolean> = {};
    const a: Record<string, boolean> = {};
    CONTRACTS.forEach((x) => (c[x.id] = false));
    ACH.forEach((x) => (a[x.id] = false));
    return {
      version: SAVE_VERSION,
      cash: 0,
      totalCash: 0,
      level: 1,
      prestige: 0,
      prestigeRuns: 0,
      up,
      zones,
      contracts: c,
      ach: a,
      market: makeMarket(),
      marketDay: marketSeed(),
      boostTime: 0,
      frenzyTime: 0,
      lastSave: Date.now(),
      stats: {
        collected: 0,
        processed: 0,
        sold: 0,
        productsPicked: 0,
        cashEarned: 0,
        upgradesBought: 0,
        zonesUnlocked: 0,
        droneBest: 0,
        frenzies: 0,
        singDriveSold: 0,
        // Pass 2 — per-product sale counters used by contracts/achievements.
        ironPartSold: 0,
        glassLensSold: 0,
        plasmaCellSold: 0,
        quantumCoreSold: 0,
        antiPartSold: 0,
        darkPartSold: 0,
        voidPartSold: 0,
        causalPartSold: 0,
        entropicPartSold: 0,
        // Pass 3 — daily login streak counter (ticks when Game.checkDailyLogin
        // runs and a new UTC day is observed).
        streakDays: 0,
      },
      settings: this.defaultSettings(),
      tutorialDone: false,
      tutorialStep: 0,
      // Pass 3 — daily retention defaults
      lastLoginUTC: '',
      streakDays: 0,
      chestDay: 0,
      chestClaimedToday: false,
      pendingChestDay: 0,
      dailyChallengeDay: 0,
      dailyChallenges: [],
      dailyChallengeRerolled: false,
    };
  }

  /** Default player settings. Haptics default to ON on mobile, OFF on desktop. */
  defaultSettings(): SettingsState {
    return {
      sound: false,
      music: false,
      haptics: isMobile(),
      gfx: 'auto',
    };
  }

  init(): void {
    this.state = this.default();
    this.load();
    this.applySettings();
    this.ad = new AdBridge(this);
    this.player = new Player();
    this.player.bind(this);
    this.core = new Core(0, 80);
    this.core.bind(this);
    this.sell = new SellHub(430, 120);
    this.term = new Terminal(-360, 270);
    this.nodes = ZONES.map((z) => new ResourceNode(z));
    this.objects = [...this.nodes, this.core, this.sell, this.term];
    this.applyDrones();

    // Pre-warm spawns so the world isn't empty on first frame. Every unlocked
    // zone gets a slug of pre-spawned items so a returning player doesn't see
    // bare patches while the spawn rate ramps back up.
    for (let i = 0; i < this.nodes.length; i++) {
      if (!this.state.zones[this.nodes[i].zone.id]) continue;
      const warm = i === 0 ? 70 : 40;
      for (let k = 0; k < warm; k++) this.nodes[i].update(1, this);
    }

    this.bind();
    this.bindNav();
    this.bindSettings();
    this.setActiveNav('home');

    // Pass 3 — daily check-in. Runs once per launch and updates streak +
    // chest + challenges if a new UTC day has rolled over since last save.
    const daily = runDailyCheck(this);
    if (daily.newDay && !this.state.chestClaimedToday) {
      // Defer the modal until after the intro modal is dismissed so we don't
      // stack two full-screen overlays on first launch.
      this.pendingDailyShow = true;
    }
    if (daily.streakBroken && this.state.prestigeRuns > 0) {
      // Returning veteran missed a day — softer surface than the modal.
      setTimeout(() => this.toast('Welcome back — streak reset to day 1.'), 1200);
    }

    this.updateUI(true);
    requestAnimationFrame(() => this.loop());
  }

  bind(): void {
    ui.start.onclick = async () => {
      // First user gesture: ensures the AudioContext is allowed to resume on
      // iOS. We always call ensure() even if sound is off so future toggles
      // don't fail silently.
      this.audio.ensure();
      if (this.state.settings.sound) {
        // Settings say "Sound: On" — sync the audio system.
        try {
          if (!this.audio.on) await this.audio.toggle();
        } catch (_e) { /* best-effort */ }
      }
      this.syncSoundLabel();
      ui.intro.classList.add('hidden');
      this.started = true;
      this.toast('Factory online. Collect raw scrap and feed the Core.');
      Haptics.zoneUnlock();
      // Pop the daily chest a beat later so the intro fade finishes first.
      if (this.pendingDailyShow) {
        this.pendingDailyShow = false;
        setTimeout(() => this.showDailyModal(), 600);
      }
    };

    const onSoundClick = async () => {
      try {
        const on = await this.audio.toggle();
        this.state.settings.sound = on;
        this.syncSoundLabel();
        this.save();
      } catch (_e) { /* best-effort */ }
    };
    ui.sound.onclick = onSoundClick;

    const onSaveClick = () => {
      this.save();
      this.toast('Saved.');
    };
    ui.save.onclick = onSaveClick;
    ui.saveDesktop && (ui.saveDesktop.onclick = onSaveClick);

    const onExport = () => this.exportSave();
    ui.export.onclick = onExport;
    ui.exportDesktop && (ui.exportDesktop.onclick = onExport);

    const onImport = () => ui.fileInput.click();
    ui.import.onclick = onImport;
    ui.importDesktop && (ui.importDesktop.onclick = onImport);
    ui.fileInput.onchange = (e) => this.importSave(e);

    const onReset = (btn: HTMLButtonElement) => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        btn.textContent = 'Confirm Reset';
        if (ui.reset !== btn) ui.reset.textContent = 'Confirm Reset';
        if (ui.resetDesktop && ui.resetDesktop !== btn) ui.resetDesktop.textContent = 'Confirm Reset';
        this.toast('Press reset again to wipe progress.');
        setTimeout(() => {
          this.resetArmed = false;
          ui.reset.textContent = 'Reset';
          if (ui.resetDesktop) ui.resetDesktop.textContent = 'Reset';
        }, 3500);
        return;
      }
      // Wipe both the current and legacy keys — defensive against a stale
      // pre-migration save lingering in some browsers.
      storage.del(SAVE_KEY);
      storage.del(SAVE_KEY_LEGACY_V1);
      location.reload();
    };
    ui.reset.onclick = () => onReset(ui.reset);
    ui.resetDesktop && (ui.resetDesktop.onclick = () => onReset(ui.resetDesktop!));

    const onRewardValue = () =>
      this.ad.rewarded('2× sell value for 3 minutes.', () => {
        this.state.boostTime = Math.max(this.state.boostTime, 180);
        this.audio.buy();
        Haptics.buy();
        this.particles.burst(this.player.x, this.player.y, '#ff43df', 36, 260, 22);
      });
    ui.rewardValue.onclick = onRewardValue;
    ui.rewardValueSheet.onclick = onRewardValue;

    const onRewardFrenzy = () =>
      this.ad.rewarded('Frenzy: speed, magnet, infinite cargo and huge scrap density.', () =>
        this.startFrenzy(),
      );
    ui.rewardFrenzy.onclick = onRewardFrenzy;
    ui.rewardFrenzySheet.onclick = onRewardFrenzy;

    ui.adClose.onclick = () => this.ad.hide();
    ui.tabContracts.onclick = () => this.setTab('contracts');
    ui.tabDaily.onclick = () => this.setTab('daily');
    ui.tabMarket.onclick = () => this.setTab('market');
    ui.tabAchievements.onclick = () => this.setTab('achievements');

    // Daily chest modal.
    ui.dailyClaim.onclick = () => this.claimDaily(false);
    ui.dailyDouble.onclick = () =>
      this.ad.rewarded('Doubles your daily chest cash payout.', () => this.claimDaily(true));
    ui.dailyClose.onclick = () => ui.dailyModal.classList.add('hidden');

    // Tutorial skip.
    ui.tutorialSkip.onclick = () => {
      this.state.tutorialDone = true;
      this.state.tutorialStep = TUTORIAL_STEPS.length;
      ui.tutorialBanner.classList.add('hidden');
      this.save();
    };

    addEventListener('beforeunload', () => this.save());
  }

  /** Sync the desktop Sound button label with the current setting. */
  private syncSoundLabel(): void {
    const on = this.state.settings.sound;
    ui.sound.textContent = 'Sound: ' + (on ? 'On' : 'Off');
  }

  /**
   * Bind the mobile bottom nav + sheet close buttons. The "home" tab simply
   * closes any open sheet. Re-tapping the active tab also closes its sheet.
   */
  bindNav(): void {
    for (const btn of ui.navButtons) {
      const which = btn.dataset.nav;
      if (!which) continue;
      btn.onclick = () => {
        if (which === 'home') {
          this.closeAllSheets();
          this.setActiveNav('home');
          return;
        }
        const sheet = NAV_SHEETS[which];
        if (!sheet) return;
        if (sheet.classList.contains('open')) {
          this.closeAllSheets();
          this.setActiveNav('home');
        } else {
          this.openSheet(which);
        }
      };
    }
    for (const btn of ui.sheetCloseButtons) {
      btn.onclick = () => {
        this.closeAllSheets();
        this.setActiveNav('home');
      };
    }
    ui.profilePill.onclick = () => this.openSheet('menu');
  }

  /** Open one sheet, hide the others, and reflect state in the bottom nav. */
  openSheet(which: string): void {
    for (const [k, el] of Object.entries(NAV_SHEETS)) {
      el.classList.toggle('open', k === which);
    }
    this.setActiveNav(which);
    // Rebuild the panel contents whenever we open it — keeps the dot/cost
    // hints in sync after offline cash etc.
    if (which === 'goals' || which === 'shop') this.updateUI(true);
  }

  closeAllSheets(): void {
    for (const el of Object.values(NAV_SHEETS)) el.classList.remove('open');
  }

  setActiveNav(which: string): void {
    for (const btn of ui.navButtons) {
      btn.classList.toggle('active', btn.dataset.nav === which);
    }
  }

  /** Wire the settings inputs in the Menu sheet. */
  bindSettings(): void {
    const setToggle = (btn: HTMLButtonElement, val: boolean): void => {
      btn.dataset.on = val ? 'true' : 'false';
      btn.setAttribute('aria-pressed', val ? 'true' : 'false');
      btn.textContent = val ? 'On' : 'Off';
    };
    setToggle(ui.settingSound, this.state.settings.sound);
    setToggle(ui.settingMusic, this.state.settings.music);
    setToggle(ui.settingHaptics, this.state.settings.haptics);
    ui.settingGfx.value = this.state.settings.gfx;

    ui.settingSound.onclick = async () => {
      const next = !this.state.settings.sound;
      this.state.settings.sound = next;
      setToggle(ui.settingSound, next);
      // Sync audio system.
      if (next) {
        this.audio.ensure();
        if (!this.audio.on) {
          try { await this.audio.toggle(); } catch (_e) { /* best-effort */ }
        }
      } else if (this.audio.on) {
        try { await this.audio.toggle(); } catch (_e) { /* best-effort */ }
      }
      this.syncSoundLabel();
      this.save();
    };
    ui.settingMusic.onclick = () => {
      const next = !this.state.settings.music;
      this.state.settings.music = next;
      setToggle(ui.settingMusic, next);
      // Music itself is wired in a later pass — flag persisted for now.
      this.save();
    };
    ui.settingHaptics.onclick = () => {
      const next = !this.state.settings.haptics;
      this.state.settings.haptics = next;
      setToggle(ui.settingHaptics, next);
      Haptics.enabled = next;
      if (next) Haptics.buy(); // small confirmation buzz
      this.save();
    };
    ui.settingGfx.onchange = () => {
      this.state.settings.gfx = ui.settingGfx.value as GfxQuality;
      this.applySettings();
      this.save();
    };
  }

  /** Apply persisted settings to the runtime subsystems. */
  applySettings(): void {
    Haptics.enabled = this.state.settings.haptics && Haptics.supported;
    // Graphics quality is currently advisory — entity culling already adapts
    // to view size. The select is wired so future passes (parallax intensity,
    // particle caps, glow shadows) can read from this single source.
    void this.state.settings.gfx;
  }

  /**
   * Load any persisted save. Migration ladder:
   *   - First, try the current schema key (scrapline.v2.save).
   *   - If absent, fall back to the v1 legacy key, migrate, and delete v1.
   *   - On parse / migrate failure, leave the fresh default save in place
   *     and surface a one-time toast so the player knows.
   * Returns silently when nothing was loaded — the constructor already
   * populated this.state with defaults.
   */
  load(): void {
    let raw = storage.get(SAVE_KEY);
    let migratedFromLegacy = false;
    if (!raw) {
      const legacy = storage.get(SAVE_KEY_LEGACY_V1);
      if (legacy) {
        raw = legacy;
        migratedFromLegacy = true;
      }
    }
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Partial<SaveState>;
      const upgraded = this.migrate(data);
      const base = this.default();
      this.state = Object.assign(base, upgraded) as SaveState;
      this.state.up = Object.assign(base.up, upgraded.up || {});
      this.state.zones = Object.assign(base.zones, upgraded.zones || {});
      this.state.contracts = Object.assign(base.contracts, upgraded.contracts || {});
      this.state.ach = Object.assign(base.ach, upgraded.ach || {});
      this.state.stats = Object.assign(base.stats, upgraded.stats || {});
      this.state.settings = Object.assign(base.settings, upgraded.settings || {});
      if (this.state.marketDay !== marketSeed()) {
        this.state.market = makeMarket();
        this.state.marketDay = marketSeed();
      }
      // offlineCap upgrade extends the 8-hour ceiling by 1h per level (max 16h).
      const capSeconds = (8 + this.up('offlineCap')) * 3600;
      const away = clamp((Date.now() - (upgraded.lastSave || Date.now())) / 1000, 0, capSeconds);
      if (away > 30) {
        const earn = this.offlineRate() * away;
        this.state.cash += earn;
        this.state.totalCash += earn;
        this.stats('cashEarned', earn);
        setTimeout(() => this.toast('Offline factory earned ' + money(earn) + '.'), 500);
      }
      // After a successful legacy-key import, write the new key and clear v1.
      if (migratedFromLegacy) {
        this.save();
        storage.del(SAVE_KEY_LEGACY_V1);
        setTimeout(() => this.toast('Save upgraded to v2.'), 1100);
      }
    } catch (e) {
      console.warn('save load failed', e);
      this.state = this.default();
      setTimeout(() => this.toast('Save was corrupt — started fresh. Use Export to back up.'), 800);
    }
  }

  /**
   * Migration ladder. Each `if` block upgrades the save shape forward by one
   * version. Old keys are tolerated; missing fields are filled from
   * defaultSettings()/etc. on the way back through Object.assign in load().
   *
   * Always returns a v2-shaped object, even when the input was v1-shaped.
   */
  migrate(data: any): Partial<SaveState> {
    if (!data || typeof data !== 'object') return {};
    const v = typeof data.version === 'number' ? data.version : 1;
    // v1 -> v2: add settings, tutorialDone, version.
    if (v < 2) {
      data.version = 2;
      data.settings = Object.assign(this.defaultSettings(), data.settings || {});
      data.tutorialDone = !!data.tutorialDone;
    }
    // v2 -> v3: add daily retention fields. Existing players are treated as
    // "tutorial done" since they've already played without the tutorial.
    if (v < 3) {
      data.version = 3;
      data.tutorialStep = typeof data.tutorialStep === 'number' ? data.tutorialStep : 0;
      // Anyone with existing progress probably knows how to play — skip tutorial.
      if (data.totalCash > 0 || data.stats?.collected > 0) data.tutorialDone = true;
      data.lastLoginUTC = data.lastLoginUTC || '';
      data.streakDays = data.streakDays || 0;
      data.chestDay = data.chestDay || 0;
      data.chestClaimedToday = !!data.chestClaimedToday;
      data.pendingChestDay = data.pendingChestDay || 0;
      data.dailyChallengeDay = data.dailyChallengeDay || 0;
      data.dailyChallenges = Array.isArray(data.dailyChallenges) ? data.dailyChallenges : [];
      data.dailyChallengeRerolled = !!data.dailyChallengeRerolled;
    }
    return data as Partial<SaveState>;
  }

  save(): void {
    this.state.lastSave = Date.now();
    this.state.version = SAVE_VERSION;
    try {
      storage.set(SAVE_KEY, JSON.stringify(this.state));
    } catch (_e) {
      this.toast('Save failed. Use Export.');
    }
  }

  exportSave(): void {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrapline-save.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  importSave(e: Event): void {
    const target = e.target as HTMLInputElement;
    const f = target.files && target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target!.result as string);
        const imported = this.migrate(parsed);
        const base = this.default();
        this.state = Object.assign(base, imported) as SaveState;
        this.state.up = Object.assign(base.up, imported.up || {});
        this.state.zones = Object.assign(base.zones, imported.zones || {});
        this.state.contracts = Object.assign(base.contracts, imported.contracts || {});
        this.state.ach = Object.assign(base.ach, imported.ach || {});
        this.state.stats = Object.assign(base.stats, imported.stats || {});
        this.state.settings = Object.assign(base.settings, imported.settings || {});
        this.applyDrones();
        this.applySettings();
        this.save();
        this.updateUI(true);
        this.toast('Save imported.');
      } catch (_err) {
        this.toast('Invalid save file.');
      }
    };
    r.readAsText(f);
    target.value = '';
  }

  up(id: string): number {
    return this.state.up[id] || 0;
  }
  stats(k: string, v: number): void {
    this.state.stats[k] = (this.state.stats[k] || 0) + v;
  }
  valueMult(): number {
    // prestigeAmp multiplies the per-prestige bonus stack:
    //   bonus = prestige * 0.08 * (1 + prestigeAmp * 0.15)
    const prestigeBonus = this.state.prestige * 0.08 * (1 + this.up('prestigeAmp') * 0.15);
    return (
      (1 + this.up('value') * 0.17) *
      (this.state.boostTime > 0 ? 2 : 1) *
      (this.isFrenzy() ? 1.35 : 1) *
      (1 + prestigeBonus)
    );
  }

  /** Probability that a single sale crits to 2× payout. */
  critChance(): number {
    return this.up('crit') * 0.04;
  }

  /** Interval (seconds) between magnet-pulse AoE collects. 0 means disabled. */
  pulseInterval(): number {
    const lvl = this.up('pulse');
    if (lvl <= 0) return 0;
    return Math.max(2, 8 - lvl);
  }

  /** How many product sells trigger a free raw recycle. 0 means disabled. */
  recyclerEvery(): number {
    const lvl = this.up('recycler');
    if (lvl <= 0) return 0;
    return Math.max(2, 16 - lvl * 2);
  }

  /**
   * Drive the magnet-pulse AoE collect. Every pulseInterval seconds, any
   * non-targeted ground items within 220px of the player get flung toward
   * them as flying items. Capped at 24 items per pulse so we don't drown the
   * particle budget.
   */
  tickPulse(dt: number): void {
    const interval = this.pulseInterval();
    if (interval <= 0) return;
    this.pulseTimer += dt;
    if (this.pulseTimer < interval) return;
    this.pulseTimer = 0;
    const radius = 220;
    const r2 = radius * radius;
    const player = this.player;
    let pulled = 0;
    for (let i = 0; i < this.items.length && pulled < 24; i++) {
      const it = this.items[i];
      if (it.targeted) continue;
      const dx = it.x - player.x;
      const dy = it.y - player.y;
      if (dx * dx + dy * dy > r2) continue;
      // Removed via a swap so we can keep iterating without index drift.
      this.items[i] = this.items[this.items.length - 1];
      this.items.pop();
      i--;
      it.targeted = true;
      const picked = it;
      this.flying.push(
        new FlyingItem(
          picked.type,
          picked.x,
          picked.y,
          () => ({ x: this.player.x, y: this.player.y - 28 }),
          () => {
            if (this.player.carry.length < this.player.capacity) {
              this.player.carry.push(picked.type);
              const kind = ITEM[picked.type].kind;
              this.stats(kind === 'raw' ? 'collected' : 'productsPicked', 1);
            }
          },
          4.2,
          80,
        ),
      );
      pulled++;
    }
    if (pulled > 0) {
      this.audio.pickup();
      this.particles.burst(player.x, player.y, '#38f8ff', 16 + pulled, 220, 18);
    }
  }

  // ============================ Pass 3 — daily ============================

  /** Base cash payout for a daily chest, scaled by level + prestige + valueMult. */
  chestBaseCash(): number {
    const lvlScale = 100 * Math.pow(this.state.level, 1.4);
    return Math.floor(lvlScale * (1 + this.state.prestige * 0.1) * this.valueMult());
  }

  /** Open the daily chest modal with today's pending chest. No-op if already claimed. */
  showDailyModal(): void {
    if (this.state.chestClaimedToday) return;
    const day = this.state.chestDay || 1;
    const reward = chestFor(day);
    const baseCash = this.chestBaseCash() * reward.cashMult;
    ui.dailyTitle.textContent = 'Day ' + day;
    ui.dailyEyebrow.textContent = reward.label;
    ui.dailyStreak.textContent = `Streak: ${this.state.streakDays || 1} day${(this.state.streakDays || 1) === 1 ? '' : 's'}.`;
    ui.dailyChestSlot.dataset.tier = reward.tier || 'common';
    ui.dailyCash.textContent = money(Math.floor(baseCash));
    ui.dailyPp.textContent = reward.prestigePoints ? '+' + reward.prestigePoints + ' PP' : '—';
    ui.dailyDouble.disabled = false;
    ui.dailyDouble.textContent = 'Watch ad — 2× claim';

    // Streak strip (30 pips). Past days = done; today = today; future = empty.
    ui.dailyStreakRow.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip';
      if (i < day) pip.classList.add('done');
      else if (i === day) pip.classList.add('today');
      if (i % 7 === 0) pip.classList.add('milestone');
      pip.textContent = String(i);
      ui.dailyStreakRow.appendChild(pip);
    }

    ui.dailyModal.classList.remove('hidden');
    if (this.started) this.audio.surge();
  }

  /** Award today's chest. `doubled` is set when the rewarded-ad path fires. */
  claimDaily(doubled: boolean): void {
    if (this.state.chestClaimedToday) {
      ui.dailyModal.classList.add('hidden');
      return;
    }
    const day = this.state.chestDay || 1;
    const reward = chestFor(day);
    const baseCash = this.chestBaseCash() * reward.cashMult * (doubled ? 2 : 1);
    const cash = Math.floor(baseCash);
    this.state.cash += cash;
    this.state.totalCash += cash;
    this.stats('cashEarned', cash);
    this.xp += cash * 0.05;
    if (reward.prestigePoints) {
      this.state.prestige += reward.prestigePoints;
    }
    this.state.chestClaimedToday = true;
    this.state.pendingChestDay = 0;
    this.audio.buy();
    Haptics.levelUp();
    this.camera.shake = 14;
    this.particles.burst(this.player.x, this.player.y, '#ffd45c', 60, 360, 24);
    this.text(this.player.x, this.player.y - 80, '+' + money(cash), '#ffd45c', 22);
    ui.dailyModal.classList.add('hidden');
    this.toast(doubled ? '2× daily chest claimed.' : 'Daily chest claimed.');
    this.save();
    this.updateUI(true);
  }

  /** Player-triggered reroll of today's challenge set. One free per UTC day. */
  rerollDailyChallenges(): void {
    if (this.state.dailyChallengeRerolled) {
      this.toast('Reroll already used today.');
      return;
    }
    this.state.dailyChallengeRerolled = true;
    this.state.dailyChallenges = makeChallenges(this.state.level, 1, this.state.stats);
    this.audio.buy();
    Haptics.buy();
    this.toast('Daily challenges rerolled.');
    this.save();
    this.updateUI(true);
  }

  /** Claim a completed daily challenge by id. */
  claimChallenge(id: string): void {
    const c = this.state.dailyChallenges.find((x) => x.id === id);
    if (!c || c.claimed) return;
    const p = this.prog(c.type) - c.start;
    if (p < c.target) return;
    c.claimed = true;
    this.state.cash += c.reward;
    this.state.totalCash += c.reward;
    this.stats('cashEarned', c.reward);
    this.xp += c.reward * 0.1;
    this.audio.buy();
    Haptics.buy();
    this.toast('Daily challenge: +' + money(c.reward));
    this.updateUI(true);
  }

  /**
   * Hook called by SellHub on every successful sale. Increments the recycler
   * counter and spawns a free raw at the Core when the threshold is reached.
   */
  onProductSold(productType: string): void {
    const every = this.recyclerEvery();
    if (every <= 0) return;
    this.recyclerCount += 1;
    if (this.recyclerCount < every) return;
    this.recyclerCount = 0;
    // Find a raw matching this product's chain by scanning ITEM definitions.
    let rawType: string | null = null;
    for (const [id, def] of Object.entries(ITEM)) {
      if (def.product === productType) { rawType = id; break; }
    }
    if (!rawType) return;
    this.core.deposit(rawType, 1, this);
    this.text(this.core.x, this.core.y - 90, '+1 RECYCLED', '#45ff93', 14);
  }
  offlineRate(): number {
    return (this.up('drone') * 0.75 + this.up('processor') * 0.35 + 1) * this.valueMult() * (1 + this.up('offline') * 0.2);
  }
  isFrenzy(): boolean {
    return this.state.frenzyTime > 0;
  }

  startFrenzy(): void {
    const d = 30 + this.up('frenzy') * 5;
    this.state.frenzyTime = Math.max(this.state.frenzyTime, d);
    this.stats('frenzies', 1);
    this.audio.surge();
    Haptics.frenzy();
    this.camera.shake = 22;
    for (const n of this.nodes)
      if (this.state.zones[n.zone.id])
        for (let i = 0; i < 20 + n.zone.tier * 4; i++) {
          const a = Math.random() * TAU;
          const r = Math.sqrt(Math.random()) * n.r * 0.8;
          this.items.push(new GroundItem(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r, n.zone.raw));
        }
    this.toast('FRENZY MODE ACTIVE. Move fast, collect everything.');
    this.particles.burst(this.player.x, this.player.y, '#ff43df', 70, 430, 26);
  }

  applyDrones(): void {
    while (this.drones.length < this.up('drone')) {
      const d = new Drone(this.drones.length, this.term ? this.term.x : 0, this.term ? this.term.y : 0);
      d.bind(this);
      this.drones.push(d);
    }
    while (this.drones.length > this.up('drone')) this.drones.pop();
    this.state.stats.droneBest = Math.max(this.state.stats.droneBest, this.drones.length);
  }

  findDroneTarget(drone: Drone): GroundItem | null {
    let best: GroundItem | null = null;
    let bd = Infinity;
    for (const it of this.items) {
      if (it.targeted) continue;
      const kind = ITEM[it.type].kind;
      if (kind === 'raw' || kind === 'product') {
        const dx = drone.x - it.x;
        const dy = drone.y - it.y;
        const dd = dx * dx + dy * dy;
        if (dd < bd) {
          bd = dd;
          best = it;
        }
      }
    }
    return best;
  }

  removeItem(it: GroundItem): void {
    const i = this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
  }

  lockedAt(x: number, y: number): ZoneDef | null {
    for (const z of ZONES) {
      if (!this.state.zones[z.id] && x >= z.rect.x && x <= z.rect.x + z.rect.w && y >= z.rect.y && y <= z.rect.y + z.rect.h)
        return z;
    }
    return null;
  }

  status(t: string, d = 2): void {
    ui.status.textContent = t;
    this.statusTimer = d;
  }

  toast(t: string): void {
    ui.toast.textContent = t;
    ui.toast.classList.add('show');
    clearTimeout(this.toastTimer as number);
    this.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2500);
  }

  text(x: number, y: number, t: string, c?: string, s?: number): void {
    this.texts.push(new TextPop(x, y, t, c, s));
  }

  loop(): void {
    const t = performance.now() / 1000;
    const dt = Math.min(0.05, t - this.last);
    this.last = t;
    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  update(dt: number): void {
    if (!this.started) {
      this.draw();
      return;
    }
    if (this.paused) {
      this.audio.tick(false, dt);
      return;
    }
    this.time += dt;
    this.input.update();
    this.state.boostTime = Math.max(0, this.state.boostTime - dt);
    this.state.frenzyTime = Math.max(0, this.state.frenzyTime - dt);
    for (const o of this.objects) o.update(dt, this);
    this.player.update(dt, this);
    for (const d of this.drones) d.update(dt, this);
    for (const it of this.items) it.update(dt);
    for (let i = this.flying.length - 1; i >= 0; i--) {
      this.flying[i].update(dt);
      if (this.flying[i].dead) this.flying.splice(i, 1);
    }
    this.particles.update(dt);
    for (let i = this.texts.length - 1; i >= 0; i--) if (!this.texts[i].update(dt)) this.texts.splice(i, 1);
    this.tickPulse(dt);
    tickTutorial(this);
    this.levelCheck();
    this.camera.update(this.player, dt);
    this.audio.tick(this.isFrenzy(), dt);
    if (this.statusTimer > 0) {
      this.statusTimer -= dt;
      if (this.statusTimer <= 0) this.defaultStatus();
    }
    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.updateUI(false);
      this.uiTimer = 0.15;
    }
    this.saveTimer += dt;
    if (this.saveTimer > 6) {
      this.saveTimer = 0;
      this.save();
    }
  }

  levelCheck(): void {
    const need = 500 + Math.pow(this.state.level, 1.72) * 360;
    if (this.xp >= need) {
      this.xp -= need;
      this.state.level++;
      this.state.cash += this.state.level * 180;
      this.text(this.player.x, this.player.y - 90, 'LEVEL ' + this.state.level, '#ffd45c', 24);
      this.particles.burst(this.player.x, this.player.y, '#ffd45c', 42, 320, 24);
      this.camera.shake = 16;
      this.audio.buy();
      Haptics.levelUp();
    }
  }

  defaultStatus(): void {
    if (this.isFrenzy()) ui.status.textContent = 'FRENZY ACTIVE: speed, magnet, cargo and spawn density boosted.';
    else if (this.state.boostTime > 0)
      ui.status.textContent = '2× sell value active. Process and sell as many components as possible.';
    else if (this.player.carry.length >= this.player.capacity)
      ui.status.textContent = 'Cargo full. Raw goes to Core, components go to Sell Hub.';
    else
      ui.status.textContent = this.nearShop
        ? 'Upgrade Terminal active. Buy upgrades or unlock zones.'
        : 'Collect raw scrap → Core → components → Sell Hub → cash.';
  }

  buyUpgrade(id: string): void {
    const u = UPGRADES.find((x) => x.id === id);
    const lvl = this.up(id);
    if (!u || lvl >= u.max) return;
    const cost = Math.floor(u.base * Math.pow(u.factor, lvl));
    if (this.state.cash < cost) {
      this.toast('Need ' + money(cost));
      this.audio.err();
      Haptics.err();
      return;
    }
    this.state.cash -= cost;
    this.state.up[id] = lvl + 1;
    this.stats('upgradesBought', 1);
    this.applyDrones();
    this.audio.buy();
    Haptics.buy();
    this.camera.shake = 8;
    this.particles.burst(this.player.x, this.player.y, '#38f8ff', 20, 180, 18);
    this.updateUI(true);
  }

  unlockZone(id: string): void {
    const z = ZONES.find((x) => x.id === id);
    if (!z || this.state.zones[id]) return;
    if (this.state.cash < z.cost) {
      this.toast(z.name + ' costs ' + money(z.cost));
      this.audio.err();
      Haptics.err();
      return;
    }
    this.state.cash -= z.cost;
    this.state.zones[id] = true;
    this.stats('zonesUnlocked', 1);
    const n = this.nodes.find((nn) => nn.zone.id === id);
    if (n) for (let i = 0; i < 45; i++) n.update(1, this);
    this.toast(z.name + ' unlocked.');
    this.status('New zone online: ' + z.name + '.', 4);
    this.camera.shake = 22;
    this.audio.surge();
    Haptics.zoneUnlock();
    if (n) this.particles.burst(n.x, n.y, z.color, 70, 380, 26);
    this.ad.mid('Zone unlocked.');
    this.updateUI(true);
  }

  prestigeGain(): number {
    return Math.max(0, Math.floor(Math.pow(this.state.totalCash / 100000, 0.45) + this.state.level / 8) - 1);
  }

  prestige(): void {
    const gain = this.prestigeGain();
    if (gain <= 0) {
      this.toast('Prestige requires more total cash and levels.');
      return;
    }
    if (!confirm('Prestige now? Reset factory for +' + gain + ' permanent prestige points.')) return;
    const keep = this.state.prestige + gain;
    const runs = this.state.prestigeRuns + 1;
    const base = this.default();
    base.prestige = keep;
    base.prestigeRuns = runs;
    base.cash = 250;
    base.totalCash = 0;
    base.stats.prestigeRuns = runs;
    this.state = base;
    this.items = [];
    this.flying = [];
    this.texts = [];
    this.drones = [];
    this.xp = 0;
    this.player = new Player();
    this.player.bind(this);
    for (let i = 0; i < 70; i++) this.nodes[0].update(1, this);
    this.toast('Prestige complete. Permanent value bonus increased.');
    this.audio.surge();
    Haptics.prestige();
    this.camera.shake = 24;
    this.save();
    this.updateUI(true);
    this.ad.mid('Prestige reset complete.');
  }

  claimContract(id: string): void {
    const c = CONTRACTS.find((x) => x.id === id);
    if (!c || this.state.contracts[id]) return;
    const p = this.prog(c.type);
    if (p < c.target) return;
    this.state.contracts[id] = true;
    this.state.cash += c.reward;
    this.state.totalCash += c.reward;
    this.xp += c.reward * 0.12;
    this.toast('Contract complete: ' + money(c.reward));
    this.audio.buy();
    Haptics.buy();
    this.updateUI(true);
  }

  claimAch(id: string): void {
    const a = ACH.find((x) => x.id === id);
    if (!a || this.state.ach[id]) return;
    if (this.prog(a.type) < a.target) return;
    this.state.ach[id] = true;
    this.state.cash += a.reward;
    this.state.totalCash += a.reward;
    this.xp += a.reward * 0.1;
    this.toast('Achievement claimed: ' + a.title);
    this.audio.buy();
    Haptics.buy();
    this.updateUI(true);
  }

  claimMarket(id: string): void {
    const m = this.state.market.find((x) => x.id === id);
    if (!m || m.claimed) return;
    const p = this.prog(m.type + 'Sold') - m.start;
    if (p < m.target) return;
    m.claimed = true;
    this.state.cash += m.reward;
    this.state.totalCash += m.reward;
    this.xp += m.reward * 0.08;
    this.toast('Market shipment paid ' + money(m.reward));
    this.audio.buy();
    Haptics.buy();
    this.updateUI(true);
  }

  prog(type: string): number {
    if (type === 'prestigeRuns') return this.state.prestigeRuns;
    return this.state.stats[type] || 0;
  }

  setTab(t: Tab): void {
    this.tab = t;
    const map: Array<[Tab, HTMLElement]> = [
      ['contracts', ui.tabContracts],
      ['daily', ui.tabDaily],
      ['market', ui.tabMarket],
      ['achievements', ui.tabAchievements],
    ];
    for (const [k, el] of map) el.classList.toggle('active', k === t);
    this.updateUI(true);
  }

  updateUI(full: boolean): void {
    ui.cash.textContent = money(this.state.cash);
    ui.cargo.textContent =
      this.player.carry.length + ' / ' + (this.player.capacity > 900 ? '∞' : this.player.capacity);
    ui.factory.textContent = money(this.offlineRate()) + '/s';
    ui.level.textContent = String(this.state.level);
    ui.prestige.textContent = String(this.state.prestige);
    // Profile pill (mobile) mirrors Level/Prestige since the dedicated chips
    // are hidden on small screens.
    ui.profileLevel.textContent = String(this.state.level);
    ui.profilePrestige.textContent = String(this.state.prestige);
    ui.edge.classList.toggle('on', this.isFrenzy());

    // Reward buttons exist twice: in the desktop bottom row and inside the
    // mobile Boosts sheet. Keep the labels + disabled state synced.
    const boostTxt =
      this.state.boostTime > 0 ? '2× Value: ' + Math.ceil(this.state.boostTime) + 's' : 'Reward: 2× Value';
    const frenzyTxt =
      this.isFrenzy() ? 'Frenzy: ' + Math.ceil(this.state.frenzyTime) + 's' : 'Reward: Frenzy';
    const boostDisabled = this.state.boostTime > 0 || this.ad.busy;
    const frenzyDisabled = this.isFrenzy() || this.ad.busy;
    ui.rewardValue.disabled = boostDisabled;
    ui.rewardValue.textContent = boostTxt;
    ui.rewardFrenzy.disabled = frenzyDisabled;
    ui.rewardFrenzy.textContent = frenzyTxt;
    // Sheet variants keep their richer "head + sub" layout, so we only swap
    // the head text and disabled state.
    const headEl = (b: HTMLButtonElement) => b.querySelector<HTMLElement>('.boostHead');
    const sheetValueHead = headEl(ui.rewardValueSheet);
    if (sheetValueHead) sheetValueHead.textContent = boostTxt.replace(/^Reward: /, 'Reward Ad · ');
    const sheetFrenzyHead = headEl(ui.rewardFrenzySheet);
    if (sheetFrenzyHead) sheetFrenzyHead.textContent = frenzyTxt.replace(/^Reward: /, 'Reward Ad · ');
    ui.rewardValueSheet.disabled = boostDisabled;
    ui.rewardFrenzySheet.disabled = frenzyDisabled;

    ui.shopHint.textContent = this.nearShop ? 'active' : 'stand near ↑';
    // Keep settings toggles in sync — the user may flip Sound via the desktop
    // button while the Menu sheet is visible.
    const syncToggle = (btn: HTMLButtonElement, val: boolean): void => {
      const cur = btn.dataset.on === 'true';
      if (cur !== val) {
        btn.dataset.on = val ? 'true' : 'false';
        btn.setAttribute('aria-pressed', val ? 'true' : 'false');
        btn.textContent = val ? 'On' : 'Off';
      }
    };
    syncToggle(ui.settingSound, this.state.settings.sound);
    syncToggle(ui.settingMusic, this.state.settings.music);
    syncToggle(ui.settingHaptics, this.state.settings.haptics);
    this.updateBadges();
    renderTutorial(this);
    if (full) {
      this.buildProgress();
      this.buildShop();
    }
  }

  /**
   * Light up the red dot on a bottom-nav tab whenever it has a claimable
   * reward (Goals) or an affordable upgrade/zone (Shop). The dot is the
   * single highest-leverage "come back tomorrow" pattern in the genre, so
   * we recompute it every UI tick.
   */
  updateBadges(): void {
    // Goals: any unclaimed contract / market / achievement / daily that's ready.
    let goalsReady = false;
    let dailyReady = !this.state.chestClaimedToday;
    for (const c of CONTRACTS) {
      if (!this.state.contracts[c.id] && this.prog(c.type) >= c.target) { goalsReady = true; break; }
    }
    if (!goalsReady) {
      for (const m of this.state.market) {
        if (!m.claimed && this.prog(m.type + 'Sold') - m.start >= m.target) { goalsReady = true; break; }
      }
    }
    if (!goalsReady) {
      for (const a of ACH) {
        if (!this.state.ach[a.id] && this.prog(a.type) >= a.target) { goalsReady = true; break; }
      }
    }
    if (!dailyReady) {
      for (const dc of this.state.dailyChallenges || []) {
        if (!dc.claimed && this.prog(dc.type) - dc.start >= dc.target) { dailyReady = true; break; }
      }
    }
    if (dailyReady) goalsReady = true;
    ui.navDotGoals.hidden = !goalsReady;
    ui.tabDailyDot.hidden = !dailyReady;

    // Shop: any affordable upgrade or zone unlock, or prestige ready.
    let shopReady = false;
    for (const u of UPGRADES) {
      const lvl = this.up(u.id);
      if (lvl >= u.max) continue;
      const cost = Math.floor(u.base * Math.pow(u.factor, lvl));
      if (this.state.cash >= cost) { shopReady = true; break; }
    }
    if (!shopReady) {
      for (const z of ZONES) {
        if (!this.state.zones[z.id] && this.state.cash >= z.cost) { shopReady = true; break; }
      }
    }
    if (!shopReady && this.prestigeGain() > 0) shopReady = true;
    ui.navDotShop.hidden = !shopReady;
  }

  buildProgress(): void {
    ui.progress.innerHTML = '';
    ui.progressHint.textContent = this.tab;
    if (this.tab === 'contracts') {
      for (const c of CONTRACTS.filter((cc) => !this.state.contracts[cc.id]).slice(0, 6))
        this.addProgressRow(c.title, 'Reward ' + money(c.reward), this.prog(c.type), c.target, () =>
          this.claimContract(c.id),
        );
      if (!ui.progress.children.length)
        ui.progress.innerHTML =
          '<div class="smallNote">All contracts complete. Prestige or keep expanding.</div>';
    } else if (this.tab === 'daily') {
      // Daily chest row.
      const day = this.state.chestDay || 1;
      const chestReward = chestFor(day);
      const cash = Math.floor(this.chestBaseCash() * chestReward.cashMult);
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div class="main"><div class="name">Day ${day} chest <span style="color:#82a6b7">streak ${this.state.streakDays || 1}</span></div><div class="desc">${chestReward.label} · ${money(cash)}${chestReward.prestigePoints ? ' + ' + chestReward.prestigePoints + ' PP' : ''}</div></div>`;
      const b = document.createElement('button');
      const claimed = this.state.chestClaimedToday;
      b.textContent = claimed ? 'CLAIMED' : 'OPEN';
      b.className = claimed ? '' : 'good';
      b.disabled = claimed;
      b.onclick = () => this.showDailyModal();
      row.appendChild(b);
      ui.progress.appendChild(row);

      // Daily challenges.
      for (const c of this.state.dailyChallenges || []) {
        const p = this.prog(c.type) - c.start;
        this.addProgressRow(c.title, 'Today · ' + money(c.reward), p, c.target, () => this.claimChallenge(c.id), c.claimed);
      }
      // Reroll button.
      const rr = document.createElement('div');
      rr.className = 'row';
      rr.innerHTML = `<div class="main"><div class="name">Reroll challenges</div><div class="desc">${this.state.dailyChallengeRerolled ? 'Already used today.' : 'Swap the current 3 for a new set. One free per day.'}</div></div>`;
      const rb = document.createElement('button');
      rb.textContent = this.state.dailyChallengeRerolled ? 'USED' : 'REROLL';
      rb.disabled = this.state.dailyChallengeRerolled;
      rb.onclick = () => this.rerollDailyChallenges();
      rr.appendChild(rb);
      ui.progress.appendChild(rr);
    } else if (this.tab === 'market') {
      for (const m of this.state.market) {
        const p = this.prog(m.type + 'Sold') - m.start;
        this.addProgressRow(
          m.title,
          'Daily market reward ' + money(m.reward),
          p,
          m.target,
          () => this.claimMarket(m.id),
          m.claimed,
        );
      }
    } else {
      for (const a of ACH)
        this.addProgressRow(
          a.title,
          a.desc + ' · ' + money(a.reward),
          this.prog(a.type),
          a.target,
          () => this.claimAch(a.id),
          this.state.ach[a.id],
        );
    }
  }

  addProgressRow(
    title: string,
    desc: string,
    p: number,
    t: number,
    fn: () => void,
    claimed = false,
  ): void {
    const done = p >= t;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="main"><div class="name">${claimed ? '✓ ' : ''}${title}</div><div class="desc">${desc}</div><div class="bar"><div style="width:${Math.round(clamp(p / t, 0, 1) * 100)}%"></div></div><div class="mini">${units(Math.min(p, t))} / ${units(t)}</div></div>`;
    const b = document.createElement('button');
    b.textContent = claimed ? 'DONE' : done ? 'CLAIM' : '...';
    b.className = done && !claimed ? 'good' : '';
    b.disabled = !done || claimed;
    b.onclick = fn;
    row.appendChild(b);
    ui.progress.appendChild(row);
  }

  buildShop(): void {
    ui.upgrades.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = this.up(u.id);
      const cost = Math.floor(u.base * Math.pow(u.factor, lvl));
      const max = lvl >= u.max;
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div class="main"><div class="name">${u.name} <span style="color:#82a6b7">L${lvl}/${u.max}</span></div><div class="desc">${u.desc(lvl)}</div></div>`;
      const b = document.createElement('button');
      b.textContent = max ? 'MAX' : money(cost);
      b.disabled = max || this.state.cash < cost;
      b.onclick = () => this.buyUpgrade(u.id);
      row.appendChild(b);
      ui.upgrades.appendChild(row);
    }
    for (const z of ZONES.filter((zz) => zz.id !== 'home')) {
      const on = this.state.zones[z.id];
      const row = document.createElement('div');
      row.className = 'row ' + (on ? '' : 'locked');
      row.innerHTML = `<div class="main"><div class="name" style="color:${z.color}">${on ? '✓ ' : ''}${z.name}</div><div class="desc">Unlocks ${ITEM[z.raw].name} resource chain.</div></div>`;
      const b = document.createElement('button');
      b.textContent = on ? 'OPEN' : money(z.cost);
      b.disabled = on || this.state.cash < z.cost;
      b.onclick = () => this.unlockZone(z.id);
      row.appendChild(b);
      ui.upgrades.appendChild(row);
    }
    const row = document.createElement('div');
    row.className = 'row';
    const gain = this.prestigeGain();
    row.innerHTML = `<div class="main"><div class="name" style="color:#ffd45c">Prestige Reboot</div><div class="desc">Reset for permanent value bonus. Gain: +${gain} prestige.</div></div>`;
    const b = document.createElement('button');
    b.textContent = gain > 0 ? 'PRESTIGE' : 'LOCKED';
    b.className = 'warn';
    b.disabled = gain <= 0;
    b.onclick = () => this.prestige();
    row.appendChild(b);
    ui.upgrades.appendChild(row);
  }

  draw(): void {
    resize();
    ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, view.H);
    bg.addColorStop(0, '#06142e');
    bg.addColorStop(0.6, '#040816');
    bg.addColorStop(1, '#02040a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.W, view.H);
    this.drawParallax();
    ctx.save();
    this.camera.apply();
    this.drawWorld();
    const render = [...this.items, ...this.objects, ...this.flying, ...this.drones, this.player] as Array<{
      y?: number;
      draw: (c: CameraT, g: Game) => void;
    }>;
    render.sort((a, b) => (a.y || 0) - (b.y || 0));
    for (const r of render) r.draw(this.camera, this);
    this.particles.draw(this.camera);
    for (const t of this.texts) t.draw(this.camera);
    ctx.restore();
    this.drawScreen();
  }

  drawParallax(): void {
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = 'rgba(56,248,255,.10)';
    ctx.lineWidth = 1;
    const step = 72;
    const ox = ((-this.camera.x * 0.07) % step + step) % step;
    const oy = ((-this.camera.y * 0.07) % step + step) % step;
    for (let x = ox; x < view.W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, view.H);
      ctx.stroke();
    }
    for (let y = oy; y < view.H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(view.W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawWorld(): void {
    for (const z of ZONES) {
      const on = this.state.zones[z.id];
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.4;
      ctx.fillStyle = on ? 'rgba(5,18,38,.27)' : 'rgba(18,8,26,.36)';
      ctx.strokeStyle = on ? z.color : 'rgba(255,79,115,.48)';
      ctx.lineWidth = on ? 3 : 2;
      ctx.shadowColor = on ? z.color : '#ff4f73';
      ctx.shadowBlur = on ? 20 : 8;
      rr(ctx, z.rect.x, z.rect.y, z.rect.w, z.rect.h, 38);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = on ? 0.16 : 0.08;
      ctx.strokeStyle = z.color;
      for (let x = Math.ceil(z.rect.x / 120) * 120; x < z.rect.x + z.rect.w; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, z.rect.y);
        ctx.lineTo(x, z.rect.y + z.rect.h);
        ctx.stroke();
      }
      for (let y = Math.ceil(z.rect.y / 120) * 120; y < z.rect.y + z.rect.h; y += 120) {
        ctx.beginPath();
        ctx.moveTo(z.rect.x, y);
        ctx.lineTo(z.rect.x + z.rect.w, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(56,248,255,.25)';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#38f8ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-760, 80);
    ctx.lineTo(760, 80);
    ctx.moveTo(0, -520);
    ctx.lineTo(0, 880);
    ctx.moveTo(-360, 270);
    ctx.lineTo(430, 120);
    ctx.stroke();
    ctx.restore();
  }

  drawScreen(): void {
    ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
    const need = 500 + Math.pow(this.state.level, 1.72) * 360;
    const p = clamp(this.xp / need, 0, 1);
    const x = view.W / 2 - 170;
    const y = view.H - 74;
    const w = 340;
    const h = 8;
    ctx.save();
    rr(ctx, x, y, w, h, 5);
    ctx.fillStyle = 'rgba(0,0,0,.36)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,248,255,.24)';
    ctx.stroke();
    rr(ctx, x, y, w * p, h, 5);
    ctx.fillStyle = '#ffd45c';
    ctx.shadowColor = '#ffd45c';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    if (this.isFrenzy()) {
      ctx.save();
      ctx.font = '950 32px Segoe UI,Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff43df';
      ctx.shadowColor = '#ff43df';
      ctx.shadowBlur = 22;
      ctx.fillText('FRENZY MODE', view.W / 2, 128);
      ctx.restore();
    }
    this.drawMinimap();
  }

  drawMinimap(): void {
    if (view.W < 980) return;
    const w = 158;
    const h = 118;
    const x = view.W - w - 18;
    const y = view.H - h - 18;
    const world = WORLD_BOUNDS;
    ctx.save();
    rr(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(4,12,27,.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,248,255,.24)';
    ctx.stroke();
    for (const z of ZONES) {
      const zx = x + ((z.rect.x - world.x) / world.w) * w;
      const zy = y + ((z.rect.y - world.y) / world.h) * h;
      const zw = (z.rect.w / world.w) * w;
      const zh = (z.rect.h / world.h) * h;
      ctx.fillStyle = this.state.zones[z.id] ? z.color : 'rgba(255,79,115,.28)';
      ctx.globalAlpha = this.state.zones[z.id] ? 0.55 : 0.22;
      ctx.fillRect(zx, zy, zw, zh);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e5fbff';
    ctx.beginPath();
    ctx.arc(
      x + ((this.player.x - world.x) / world.w) * w,
      y + ((this.player.y - world.y) / world.h) * h,
      4,
      0,
      TAU,
    );
    ctx.fill();
    ctx.restore();
  }
}

/** Singleton game instance — created at module load, started by main.ts. */
export const game = new Game();

// Expose for debugging in the browser console without polluting globals at
// module evaluation. Avoids name collisions with the rest of the page.
(window as unknown as { Scrapline?: Game }).Scrapline = game;

// Keep `canvas` referenced so tree-shaking can't strip the side-effecting
// resize listener registration.
void canvas;
