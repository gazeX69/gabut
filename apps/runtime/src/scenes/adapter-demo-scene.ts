import Phaser from 'phaser';
import { loadScene, type RuntimeScene } from '@vgz/engine-runtime';
import {
  RuntimeSceneTransition,
  preloadRuntimeSceneAssets,
  type MountedScene,
  type RuntimeSnapshot,
  InputMoveComponent,
  defaultActorBounds,
} from '../phaser-adapter/index.js';

const DEMO_MAP_W = 12;
const DEMO_MAP_H = 10;

const UI_PANEL_ID = 'ui-hud-panel';
const UI_FPS_ID = 'ui-fps';
const UI_SCENE_ID = 'ui-scene';
const UI_TRANSITION_ID = 'ui-transition';
const UI_HINT_ID = 'ui-hint';
const UI_PAUSED_ID = 'ui-paused';
const UI_COLLISION_ID = 'ui-collision';
const UI_TRIGGER_ID = 'ui-trigger';
const UI_INTERACT_ID = 'ui-interact';
const UI_AUDIO_ID = 'ui-audio';
const UI_SNAPSHOT_ID = 'ui-snapshot';

const DEMO_AUDIO_ASSETS = [
  {
    id: 'music-scene-a',
    type: 'audio',
    path: '/projects/demo-project/assets/audio/music-scene-a.wav',
    version: 1,
  },
  {
    id: 'music-scene-b',
    type: 'audio',
    path: '/projects/demo-project/assets/audio/music-scene-b.wav',
    version: 1,
  },
  {
    id: 'sfx-interact',
    type: 'audio',
    path: '/projects/demo-project/assets/audio/sfx-interact.wav',
    version: 1,
  },
  {
    id: 'sfx-trigger',
    type: 'audio',
    path: '/projects/demo-project/assets/audio/sfx-trigger.wav',
    version: 1,
  },
  {
    id: 'sfx-blocked',
    type: 'audio',
    path: '/projects/demo-project/assets/audio/sfx-blocked.wav',
    version: 1,
  },
] as const;

function buildDemoTilesA(): number[] {
  const tiles: number[] = [];
  for (let y = 0; y < DEMO_MAP_H; y++) {
    for (let x = 0; x < DEMO_MAP_W; x++) {
      const onBorder = x === 0 || y === 0 || x === DEMO_MAP_W - 1 || y === DEMO_MAP_H - 1;
      const waterPatch = x >= 4 && x <= 6 && y >= 3 && y <= 5;
      if (onBorder) tiles.push(4);
      else if (waterPatch) tiles.push(2);
      else tiles.push(1);
    }
  }
  return tiles;
}

/** Scene B: mostly water with a small grass island. */
function buildDemoTilesB(): number[] {
  const tiles: number[] = [];
  for (let y = 0; y < DEMO_MAP_H; y++) {
    for (let x = 0; x < DEMO_MAP_W; x++) {
      const island = x >= 5 && x <= 7 && y >= 4 && y <= 6;
      if (island) tiles.push(1);
      else tiles.push(2);
    }
  }
  return tiles;
}

const DEMO_SCENE_A_JSON = {
  id: 'demo-scene-a',
  name: 'Scene A (Grass)',
  version: 1,
  updatedAt: new Date().toISOString(),
  viewport: { width: 800, height: 600 },
  layers: [
    {
      id: 'layer-ground',
      name: 'Ground',
      type: 'tilemap',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1.0,
      tileData: {
        width: DEMO_MAP_W,
        height: DEMO_MAP_H,
        tileSize: 32,
        tiles: buildDemoTilesA(),
        tilesetIds: ['prototype-tiles'],
        version: 1,
      },
      version: 1,
    },
    {
      id: 'layer-entities',
      name: 'Entities',
      type: 'entity',
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1.0,
      entityIds: ['ent-hero', 'ent-wall', 'ent-trigger-zone', 'ent-chest'],
      version: 1,
    },
  ],
  entities: {
    'ent-hero': {
      id: 'ent-hero',
      name: 'Hero',
      type: 'actor',
      transform: { position: { x: 192, y: 160 }, rotation: 0, scale: { x: 1, y: 1 } },
      visible: true,
      assetId: 'valid-player-sprite',
      version: 1,
    },
    'ent-wall': {
      id: 'ent-wall',
      name: 'Wall',
      type: 'prop',
      transform: { position: { x: 280, y: 160 }, rotation: 0, scale: { x: 1.5, y: 1.5 } },
      visible: true,
      version: 1,
    },
    'ent-trigger-zone': {
      id: 'ent-trigger-zone',
      name: 'Trigger Zone',
      type: 'trigger',
      transform: { position: { x: 192, y: 240 }, rotation: 0, scale: { x: 2, y: 1.2 } },
      visible: true,
      version: 1,
    },
    'ent-chest': {
      id: 'ent-chest',
      name: 'Chest',
      type: 'prop',
      transform: { position: { x: 340, y: 160 }, rotation: 0, scale: { x: 1, y: 1 } },
      visible: true,
      version: 1,
    },
  },
  assets: [
    {
      id: 'prototype-tiles',
      type: 'tileset',
      path: '/projects/demo-project/assets/tilesets/prototype-tiles.png',
      metadata: { tileWidth: 32, tileHeight: 32, columns: 3 },
      version: 1,
    },
    {
      id: 'valid-player-sprite',
      type: 'sprite',
      path: '/projects/demo-project/assets/sprites/player.png',
      version: 1,
    },
    ...DEMO_AUDIO_ASSETS,
  ],
};

const DEMO_SCENE_B_JSON = {
  id: 'demo-scene-b',
  name: 'Scene B (Water)',
  version: 1,
  updatedAt: new Date().toISOString(),
  viewport: { width: 800, height: 600 },
  layers: [
    {
      id: 'layer-water',
      name: 'Water Field',
      type: 'tilemap',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1.0,
      tileData: {
        width: DEMO_MAP_W,
        height: DEMO_MAP_H,
        tileSize: 32,
        tiles: buildDemoTilesB(),
        tilesetIds: ['prototype-tiles'],
        version: 1,
      },
      version: 1,
    },
    {
      id: 'layer-entities',
      name: 'Entities',
      type: 'entity',
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1.0,
      entityIds: ['ent-hero'],
      version: 1,
    },
  ],
  entities: {
    'ent-hero': {
      id: 'ent-hero',
      name: 'Hero',
      type: 'actor',
      transform: { position: { x: 192, y: 160 }, rotation: 0, scale: { x: 1, y: 1 } },
      visible: true,
      assetId: 'valid-player-sprite',
      version: 1,
    },
  },
  assets: [
    {
      id: 'prototype-tiles',
      type: 'tileset',
      path: '/projects/demo-project/assets/tilesets/prototype-tiles.png',
      metadata: { tileWidth: 32, tileHeight: 32, columns: 3 },
      version: 1,
    },
    {
      id: 'valid-player-sprite',
      type: 'sprite',
      path: '/projects/demo-project/assets/sprites/player.png',
      version: 1,
    },
    ...DEMO_AUDIO_ASSETS,
  ],
};

export class AdapterDemoScene extends Phaser.Scene {
  private runtimeSceneA: RuntimeScene | null = null;
  private runtimeSceneB: RuntimeScene | null = null;
  private sceneTransition!: RuntimeSceneTransition;
  private sceneIndex = 0;
  private bootMessage: Phaser.GameObjects.Text | null = null;
  private activeTimers: Phaser.Time.TimerEvent[] = [];
  private loopActive = false;
  private zoneMessage = '';
  private chestOpen = false;
  private lastTransitionMessage = '';
  private masterVolume = 0.8;
  private audioMuted = false;
  private sessionSnapshot: RuntimeSnapshot | null = null;
  private snapshotStatus = 'Snapshot: none';

  constructor() {
    super('AdapterDemoScene');
  }

  async create() {
    const loadA = loadScene(DEMO_SCENE_A_JSON);
    const loadB = loadScene(DEMO_SCENE_B_JSON);
    if (!loadA.success || !loadB.success) {
      console.error('Failed to load demo scenes', loadA, loadB);
      this.showBootMessage('Failed to load demo scenes. Check console.');
      return;
    }

    this.runtimeSceneA = loadA.data;
    this.runtimeSceneB = loadB.data;
    this.sceneTransition = new RuntimeSceneTransition(this);

    await preloadRuntimeSceneAssets(this, this.runtimeSceneA);
    await preloadRuntimeSceneAssets(this, this.runtimeSceneB);

    if (this.sound.locked) {
      this.input.keyboard?.once('keydown', () => {
        this.sound.unlock();
      });
    }

    const initial = await this.sceneTransition.transitionTo(this.runtimeSceneA);
    if (!initial.success) {
      this.showBootMessage(initial.message ?? 'Initial mount failed');
      return;
    }

    this.loopActive = true;
    this.applyPostTransitionSetup();

    this.input.keyboard?.on('keydown-N', () => {
      void this.handleNextScene();
    });

    this.input.keyboard?.on('keydown-R', () => {
      void this.handleReloadScene();
    });

    this.input.keyboard?.on('keydown-P', () => {
      const mount = this.sceneTransition.getCurrentMountedScene();
      if (!mount || !this.loopActive || this.sceneTransition.isTransitioning) return;
      if (mount.loop.isPaused) mount.loop.resume();
      else mount.loop.pause();
    });

    this.input.keyboard?.on('keydown-M', () => {
      const mount = this.sceneTransition.getCurrentMountedScene();
      if (!mount || mount.isDisposed) return;
      this.audioMuted = !this.audioMuted;
      mount.audio.setMasterVolume(this.audioMuted ? 0 : this.masterVolume);
    });

    this.input.keyboard?.on('keydown-F5', () => this.saveRuntimeSnapshot());
    this.input.keyboard?.on('keydown-K', () => this.saveRuntimeSnapshot());
    this.input.keyboard?.on('keydown-F9', () => this.restoreRuntimeSnapshot());
    this.input.keyboard?.on('keydown-L', () => this.restoreRuntimeSnapshot());
  }

  private saveRuntimeSnapshot() {
    const mount = this.sceneTransition.getCurrentMountedScene();
    if (!mount || mount.isDisposed || this.sceneTransition.isTransitioning) {
      this.snapshotStatus = 'Snapshot: save failed (no active scene)';
      return;
    }

    const result = mount.createRuntimeSnapshot();
    if (!result.success || !result.snapshot) {
      this.snapshotStatus = `Snapshot: save failed (${result.message ?? 'unknown'})`;
      return;
    }

    try {
      JSON.stringify(result.snapshot);
    } catch (err) {
      this.snapshotStatus = `Snapshot: not JSON-safe (${err})`;
      return;
    }

    this.sessionSnapshot = result.snapshot;
    const warn = result.warnings.length ? ` (${result.warnings.length} warns)` : '';
    this.snapshotStatus = `Snapshot: saved @ ${result.snapshot.savedAt.slice(11, 19)}${warn}`;
  }

  private restoreRuntimeSnapshot() {
    const mount = this.sceneTransition.getCurrentMountedScene();
    if (!mount || mount.isDisposed || this.sceneTransition.isTransitioning) {
      this.snapshotStatus = 'Snapshot: restore failed (no active scene)';
      return;
    }
    if (!this.sessionSnapshot) {
      this.snapshotStatus = 'Snapshot: nothing saved yet';
      return;
    }

    const result = mount.restoreRuntimeSnapshot(this.sessionSnapshot);
    if (!result.success) {
      this.snapshotStatus = `Snapshot: restore failed (${result.message ?? 'unknown'})`;
      return;
    }

    this.syncDemoStateFromMount(mount);
    const warn = result.warnings.length ? ` (${result.warnings.length} warns)` : '';
    this.snapshotStatus = `Snapshot: restored${warn}`;
  }

  private syncDemoStateFromMount(mount: MountedScene) {
    const chest = mount.getMountedEntity('ent-chest');
    if (chest?.runtimeData && typeof chest.runtimeData.open === 'boolean') {
      this.chestOpen = chest.runtimeData.open;
    }
  }

  update(_time: number, delta: number) {
    const mount = this.sceneTransition.getCurrentMountedScene();
    if (!this.loopActive || !mount || this.sceneTransition.isTransitioning) return;

    try {
      mount.loop.tick(delta);
      this.handleInteractInput(mount);
      this.updateRuntimeUI(delta, mount);
    } catch (err) {
      console.warn('[AdapterDemo] Loop tick error (isolated):', err);
    }
  }

  private async handleNextScene() {
    if (this.sceneTransition.isTransitioning || !this.runtimeSceneA || !this.runtimeSceneB) return;

    this.activeTimers.forEach((t) => t.destroy());
    this.activeTimers = [];
    this.zoneMessage = '';
    this.chestOpen = false;
    this.loopActive = false;
    this.sessionSnapshot = null;
    this.snapshotStatus = 'Snapshot: cleared (scene change)';

    this.sceneIndex = this.sceneIndex === 0 ? 1 : 0;
    const next = this.sceneIndex === 0 ? this.runtimeSceneA : this.runtimeSceneB;

    const result = await this.sceneTransition.transitionTo(next);
    this.lastTransitionMessage = result.message ?? '';

    if (result.success) {
      this.loopActive = true;
      this.applyPostTransitionSetup();
    } else {
      this.showBootMessage(result.message ?? 'Transition failed');
    }
  }

  private async handleReloadScene() {
    if (this.sceneTransition.isTransitioning) return;

    this.activeTimers.forEach((t) => t.destroy());
    this.activeTimers = [];
    this.zoneMessage = '';
    this.chestOpen = false;
    this.loopActive = false;
    this.sessionSnapshot = null;
    this.snapshotStatus = 'Snapshot: cleared (reload)';

    const result = await this.sceneTransition.reloadCurrent();
    this.lastTransitionMessage = result.message ?? '';

    if (result.success) {
      this.loopActive = true;
      this.applyPostTransitionSetup();
    } else {
      this.showBootMessage(result.message ?? 'Reload failed');
    }
  }

  private applyPostTransitionSetup() {
    if (this.bootMessage) {
      this.bootMessage.destroy();
      this.bootMessage = null;
    }

    const mount = this.sceneTransition.getCurrentMountedScene();
    if (!mount) return;

    const scene = this.sceneTransition.getCurrentRuntimeScene();
    if (scene?.id === 'demo-scene-a') {
      this.setupCollisionSceneA(mount);
      this.setupTriggersSceneA(mount);
      this.scheduleCameraDemo(mount);
    } else {
      this.setupCollisionSceneB(mount);
      mount.camera.followEntity('ent-hero');
      const moveComp = new InputMoveComponent('comp-input-move', 0.5);
      mount.attachComponent('ent-hero', moveComp);
    }

    this.setupSceneAudio(mount);
    this.setupRuntimeUI(mount);
  }

  private setupSceneAudio(mount: MountedScene) {
    mount.audio.setMasterVolume(this.audioMuted ? 0 : this.masterVolume);
    const scene = this.sceneTransition.getCurrentRuntimeScene();
    const musicId = scene?.id === 'demo-scene-b' ? 'music-scene-b' : 'music-scene-a';
    mount.audio.playMusic(musicId, { volume: 0.35, loop: true });
  }

  private setupCollisionSceneA(mount: MountedScene) {
    const hero = mount.getMountedEntity('ent-hero');
    if (hero) {
      hero.collisionEnabled = true;
      hero.collisionBounds = defaultActorBounds();
      hero.collisionTags = ['actor'];
    }
    const wall = mount.getMountedEntity('ent-wall');
    if (wall) {
      wall.collisionEnabled = true;
      wall.collisionBounds = { halfWidth: 28, halfHeight: 28 };
      wall.collisionTags = ['solid'];
    }
  }

  private setupCollisionSceneB(mount: MountedScene) {
    const hero = mount.getMountedEntity('ent-hero');
    if (hero) {
      hero.collisionEnabled = true;
      hero.collisionBounds = defaultActorBounds();
      hero.collisionTags = ['actor'];
    }
  }

  private setupTriggersSceneA(mount: MountedScene) {
    const zone = mount.getMountedEntity('ent-trigger-zone');
    if (zone) {
      zone.triggerEnabled = true;
      zone.collisionEnabled = true;
      zone.collisionBounds = { halfWidth: 56, halfHeight: 36 };
      zone.collisionTags = ['trigger'];
      zone.triggerTags = ['zone'];
      zone.triggerCallbacks = {
        onTriggerEnter: () => {
          this.zoneMessage = 'Entered trigger zone';
          mount.audio.playSound('sfx-trigger', { volume: 0.5 });
        },
        onTriggerExit: () => {
          this.zoneMessage = '';
        },
      };
    }

    const chest = mount.getMountedEntity('ent-chest');
    if (chest) {
      chest.interactionEnabled = true;
      chest.collisionEnabled = true;
      chest.collisionBounds = { halfWidth: 22, halfHeight: 22 };
      chest.collisionTags = ['interactable'];
      chest.triggerCallbacks = {
        onInteract: () => {
          this.chestOpen = !this.chestOpen;
          if (chest.runtimeData) chest.runtimeData.open = this.chestOpen;
          mount.audio.playSound('sfx-interact', { volume: 0.55 });
        },
      };
    }
  }

  private handleInteractInput(mount: MountedScene) {
    if (mount.isDisposed || !mount.input.wasKeyPressed('E')) return;
    const scene = this.sceneTransition.getCurrentRuntimeScene();
    if (scene?.id !== 'demo-scene-a') return;

    const hero = mount.getMountedEntity('ent-hero');
    if (!hero || hero.destroyed) return;
    mount.interactWithEntity('ent-chest', 'ent-hero');
  }

  private setupRuntimeUI(mount: MountedScene) {
    const ui = mount.ui;

    ui.createPanel(UI_PANEL_ID, 8, 8, 360, 162, { fillColor: 0x111111, fillAlpha: 0.75 });
    ui.createText(UI_FPS_ID, 16, 16, 'FPS: --', {
      fontSize: '14px',
      color: '#00ff88',
      backgroundColor: '#00000088',
    });
    ui.createText(UI_SCENE_ID, 16, 34, 'Scene: --', {
      fontSize: '12px',
      color: '#ffffff',
    });
    ui.createText(UI_TRANSITION_ID, 16, 50, 'Transition: idle', {
      fontSize: '12px',
      color: '#aaaaaa',
    });
    ui.createText(UI_HINT_ID, 16, 66, 'WASD | F5/K save | F9/L load | N next | M mute', {
      fontSize: '11px',
      color: '#cccccc',
    });
    ui.createText(UI_SNAPSHOT_ID, 16, 82, 'Snapshot: none', {
      fontSize: '12px',
      color: '#aaddff',
    });
    ui.createText(UI_AUDIO_ID, 16, 98, 'Audio: --', {
      fontSize: '12px',
      color: '#cc99ff',
    });
    ui.createText(UI_COLLISION_ID, 16, 114, 'Collision: --', {
      fontSize: '12px',
      color: '#88ccff',
    });
    ui.createText(UI_TRIGGER_ID, 16, 130, 'Zone: (outside)', {
      fontSize: '12px',
      color: '#ffcc88',
    });
    ui.createText(UI_INTERACT_ID, 16, 146, 'Chest: n/a', {
      fontSize: '12px',
      color: '#ddaaff',
    });
    ui.createText(UI_PAUSED_ID, 280, 20, 'PAUSED', {
      fontSize: '16px',
      color: '#ffaa00',
      backgroundColor: '#000000aa',
    });
    ui.setVisible(UI_PAUSED_ID, false);
  }

  private updateRuntimeUI(frameDeltaMs: number, mount: MountedScene) {
    const { ui, loop, camera } = mount;
    const runtimeScene = this.sceneTransition.getCurrentRuntimeScene();

    const fps = frameDeltaMs > 0 ? Math.round(1000 / frameDeltaMs) : 0;
    ui.setText(
      UI_FPS_ID,
      `FPS: ${fps}  Frame: ${loop.frameCount}  Cam: (${Math.round(camera.x)}, ${Math.round(camera.y)})`
    );
    ui.setVisible(UI_PAUSED_ID, loop.isPaused);

    const sceneLabel = runtimeScene
      ? `${runtimeScene.name} (${runtimeScene.id})`
      : 'none';
    ui.setText(UI_SCENE_ID, `Scene: ${sceneLabel}`);

    const music = mount.audio.getMusicState();
    const volPct = Math.round(mount.audio.getMasterVolume() * 100);
    ui.setText(
      UI_AUDIO_ID,
      `Audio: ${this.audioMuted ? 'MUTED' : `${volPct}%`}  music: ${music.playing ? music.assetId : 'none'}`
    );

    let transitionLine = 'Transition: idle';
    if (this.sceneTransition.isTransitioning) {
      transitionLine = 'Transition: in progress...';
    } else if (this.lastTransitionMessage) {
      transitionLine = `Transition: ${this.lastTransitionMessage}`;
    }
    ui.setText(UI_TRANSITION_ID, transitionLine);
    ui.setText(UI_SNAPSHOT_ID, this.snapshotStatus);

    const isSceneA = runtimeScene?.id === 'demo-scene-a';
    const hero = mount.getMountedEntity('ent-hero');
    let collisionLine = 'Collision: no hero';
    if (hero && !hero.destroyed) {
      if (isSceneA) {
        const blocked = mount.checkEntityOverlap('ent-hero', 'ent-wall');
        collisionLine = blocked ? 'Collision: BLOCKED (wall)' : 'Collision: clear';
      } else {
        collisionLine = 'Collision: clear (open water)';
      }
    }
    ui.setText(UI_COLLISION_ID, collisionLine);

    if (isSceneA) {
      ui.setText(
        UI_TRIGGER_ID,
        this.zoneMessage ? `Zone: ${this.zoneMessage}` : 'Zone: (outside)'
      );
      ui.setText(UI_INTERACT_ID, `Chest: ${this.chestOpen ? 'OPEN' : 'closed'}`);
    } else {
      ui.setText(UI_TRIGGER_ID, 'Zone: n/a');
      ui.setText(UI_INTERACT_ID, 'Chest: n/a');
    }
  }

  private showBootMessage(text: string) {
    if (this.bootMessage) this.bootMessage.destroy();
    this.bootMessage = this.add.text(10, 10, text, {
      color: '#aaaaaa',
      fontSize: '14px',
      fontFamily: 'monospace',
    });
    this.bootMessage.setScrollFactor(0);
    this.bootMessage.setDepth(20_000);
  }

  private scheduleCameraDemo(mount: MountedScene) {
    mount.camera.followEntity('ent-hero');
    const moveComp = new InputMoveComponent('comp-input-move', 0.5);
    mount.attachComponent('ent-hero', moveComp);

    this.activeTimers.forEach((t) => t.destroy());
    this.activeTimers = [];

    this.activeTimers.push(
      this.time.delayedCall(2000, () => mount.camera.setZoom(1.5))
    );
    this.activeTimers.push(
      this.time.delayedCall(3000, () => mount.camera.setRotation(0.2))
    );
    this.activeTimers.push(this.time.delayedCall(4000, () => {
      mount.camera.stopFollow();
      mount.camera.setZoom(1);
      mount.camera.setRotation(0);
    }));
    this.activeTimers.push(
      this.time.delayedCall(5000, () => mount.camera.followEntity('ent-hero'))
    );
  }
}
