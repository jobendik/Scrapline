/* ============================================================================
 * Game — the singleton orchestrator. Owns every entity, the input stack, the
 * save lifecycle, the HUD render and the main loop.
 *
 * Was a const-object literal in the original prototype; converted to a class
 * here so TypeScript can give us proper `this` typing. A single instance is
 * exported at the bottom of the file.
 * ========================================================================== */

import { canvas, ctx, resize, view } from './canvas';
import { SAVE_KEY, TAU } from './constants';
import { ui } from './dom';
import { ACH } from './data/achievements';
import { CONTRACTS } from './data/contracts';
import { ITEM } from './data/items';
import { makeMarket, marketSeed } from './data/market';
import { UPGRADES } from './data/upgrades';
import { ZONES } from './data/zones';
import { AdBridge } from './core/ad-bridge';
import { AudioSys } from './core/audio';
import { Camera } from './core/camera';
import { Input } from './core/input';
import { Particles } from './core/particles';
import { TextPop } from './core/text-pop';
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
import type { SaveState, ZoneDef } from './types';

const storage = safeStorage();
if (!storage.persistent) ui.storageWarn.classList.remove('hidden');
ui.storageOk.onclick = () => ui.storageWarn.classList.add('hidden');

type Tab = 'contracts' | 'market' | 'achievements';

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

  // ---------------- persistent state ----------------
  state!: SaveState;

  /** Build a fresh default save state. */
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
      },
    };
  }

  init(): void {
    this.state = this.default();
    this.load();
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

    // Pre-warm spawns so the world isn't empty on first frame.
    for (let i = 0; i < 70; i++) this.nodes[0].update(1, this);
    if (this.state.zones.glass) for (let i = 0; i < 50; i++) this.nodes[1].update(1, this);

    this.bind();
    this.updateUI(true);
    requestAnimationFrame(() => this.loop());
  }

  bind(): void {
    ui.start.onclick = async () => {
      try {
        const on = await this.audio.toggle();
        ui.sound.textContent = 'Sound: ' + (on ? 'On' : 'Off');
      } catch (_e) {
        // Ignore — audio is best-effort on first gesture.
      }
      ui.intro.classList.add('hidden');
      this.started = true;
      this.toast('Factory online. Collect raw scrap and feed the Neon Core.');
    };
    ui.sound.onclick = async () => {
      const on = await this.audio.toggle();
      ui.sound.textContent = 'Sound: ' + (on ? 'On' : 'Off');
    };
    ui.save.onclick = () => {
      this.save();
      this.toast('Saved.');
    };
    ui.export.onclick = () => this.exportSave();
    ui.import.onclick = () => ui.fileInput.click();
    ui.fileInput.onchange = (e) => this.importSave(e);
    ui.reset.onclick = () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        ui.reset.textContent = 'Confirm Reset';
        this.toast('Press reset again to wipe progress.');
        setTimeout(() => {
          this.resetArmed = false;
          ui.reset.textContent = 'Reset';
        }, 3500);
        return;
      }
      storage.del(SAVE_KEY);
      location.reload();
    };
    ui.rewardValue.onclick = () =>
      this.ad.rewarded('2× sell value for 3 minutes.', () => {
        this.state.boostTime = Math.max(this.state.boostTime, 180);
        this.audio.buy();
        this.particles.burst(this.player.x, this.player.y, '#ff43df', 36, 260, 22);
      });
    ui.rewardFrenzy.onclick = () =>
      this.ad.rewarded('Frenzy: speed, magnet, infinite cargo and huge scrap density.', () =>
        this.startFrenzy(),
      );
    ui.adClose.onclick = () => this.ad.hide();
    ui.tabContracts.onclick = () => this.setTab('contracts');
    ui.tabMarket.onclick = () => this.setTab('market');
    ui.tabAchievements.onclick = () => this.setTab('achievements');
    addEventListener('beforeunload', () => this.save());
  }

  load(): void {
    try {
      const raw = storage.get(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<SaveState>;
      const base = this.default();
      this.state = Object.assign(base, data) as SaveState;
      this.state.up = Object.assign(base.up, data.up || {});
      this.state.zones = Object.assign(base.zones, data.zones || {});
      this.state.contracts = Object.assign(base.contracts, data.contracts || {});
      this.state.ach = Object.assign(base.ach, data.ach || {});
      this.state.stats = Object.assign(base.stats, data.stats || {});
      if (this.state.marketDay !== marketSeed()) {
        this.state.market = makeMarket();
        this.state.marketDay = marketSeed();
      }
      const away = clamp((Date.now() - (data.lastSave || Date.now())) / 1000, 0, 8 * 3600);
      if (away > 30) {
        const earn = this.offlineRate() * away;
        this.state.cash += earn;
        this.state.totalCash += earn;
        this.stats('cashEarned', earn);
        setTimeout(() => this.toast('Offline factory earned ' + money(earn) + '.'), 500);
      }
    } catch (e) {
      console.warn('save load failed', e);
      this.state = this.default();
    }
  }

  save(): void {
    this.state.lastSave = Date.now();
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
    a.download = 'neon-scrapline-save.json';
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
        const imported = JSON.parse(ev.target!.result as string) as Partial<SaveState>;
        const base = this.default();
        this.state = Object.assign(base, imported) as SaveState;
        this.state.up = Object.assign(base.up, imported.up || {});
        this.state.zones = Object.assign(base.zones, imported.zones || {});
        this.state.contracts = Object.assign(base.contracts, imported.contracts || {});
        this.state.ach = Object.assign(base.ach, imported.ach || {});
        this.state.stats = Object.assign(base.stats, imported.stats || {});
        this.applyDrones();
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
    return (
      (1 + this.up('value') * 0.17) *
      (this.state.boostTime > 0 ? 2 : 1) *
      (this.isFrenzy() ? 1.35 : 1) *
      (1 + this.state.prestige * 0.08)
    );
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
      return;
    }
    this.state.cash -= cost;
    this.state.up[id] = lvl + 1;
    this.stats('upgradesBought', 1);
    this.applyDrones();
    this.audio.buy();
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
    ui.edge.classList.toggle('on', this.isFrenzy());
    ui.rewardValue.disabled = this.state.boostTime > 0 || this.ad.busy;
    ui.rewardValue.textContent =
      this.state.boostTime > 0 ? '2× Value: ' + Math.ceil(this.state.boostTime) + 's' : 'Reward: 2× Value';
    ui.rewardFrenzy.disabled = this.isFrenzy() || this.ad.busy;
    ui.rewardFrenzy.textContent = this.isFrenzy() ? 'Frenzy: ' + Math.ceil(this.state.frenzyTime) + 's' : 'Reward: Frenzy';
    ui.shopHint.textContent = this.nearShop ? 'active' : 'stand near ↑';
    if (full) {
      this.buildProgress();
      this.buildShop();
    }
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
    const world = { x: -2200, y: -800, w: 5100, h: 2900 };
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
(window as unknown as { NeonScraplineFactoryFrenzy?: Game }).NeonScraplineFactoryFrenzy = game;

// Keep `canvas` referenced so tree-shaking can't strip the side-effecting
// resize listener registration.
void canvas;
