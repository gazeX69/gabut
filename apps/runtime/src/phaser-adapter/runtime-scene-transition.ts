/**
 * Runtime Scene Transition
 * Safe teardown → preload → remount for RuntimeScene swaps.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeScene } from '@vgz/engine-runtime';
import type { MountedScene } from './types.js';
import type { AdapterError } from './phaser-runtime-errors.js';
import {
  mountRuntimeScene,
  unmountRuntimeScene,
} from './phaser-scene-adapter.js';
import {
  preloadRuntimeSceneAssets,
  type PreloadResult,
} from './phaser-asset-preloader.js';

export interface SceneTransitionResult {
  readonly success: boolean;
  readonly mounted?: MountedScene;
  readonly preload: PreloadResult;
  readonly mountErrors: ReadonlyArray<AdapterError>;
  readonly message?: string;
}

export class RuntimeSceneTransition {
  private transitioning = false;
  private mounted: MountedScene | null = null;
  private runtimeScene: RuntimeScene | null = null;
  private lastError: string | null = null;

  constructor(private readonly phaserScene: Phaser.Scene) {}

  get isTransitioning(): boolean {
    return this.transitioning;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  getCurrentRuntimeScene(): RuntimeScene | null {
    return this.runtimeScene;
  }

  /** Active mount only; disposed handles return null. */
  getCurrentMountedScene(): MountedScene | null {
    if (!this.mounted || this.mounted.isDisposed) return null;
    return this.mounted;
  }

  /**
   * Stop loop, dispose current mount, preload assets, mount next scene, start loop.
   */
  async transitionTo(nextScene: RuntimeScene): Promise<SceneTransitionResult> {
    if (this.transitioning) {
      return {
        success: false,
        preload: { loaded: [], skipped: [], failed: [] },
        mountErrors: [],
        message: 'Transition already in progress',
      };
    }

    this.transitioning = true;
    this.lastError = null;

    try {
      this.teardownCurrent();

      let preload: PreloadResult = { loaded: [], skipped: [], failed: [] };
      try {
        preload = await preloadRuntimeSceneAssets(this.phaserScene, nextScene);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[SceneTransition] Preload error (non-fatal):', err);
        this.lastError = `Preload warning: ${msg}`;
      }

      if (preload.failed.length > 0) {
        const failSummary = preload.failed.map((f) => f.assetId).join(', ');
        const warn = `Assets failed: ${failSummary}`;
        this.lastError = this.lastError ? `${this.lastError}; ${warn}` : warn;
      }

      let mountResult;
      try {
        mountResult = mountRuntimeScene(this.phaserScene, nextScene);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.lastError = `Mount failed: ${msg}`;
        return {
          success: false,
          preload,
          mountErrors: [],
          message: this.lastError,
        };
      }

      this.runtimeScene = nextScene;
      this.mounted = mountResult.mounted;
      this.mounted.loop.start();

      if (mountResult.errors.length > 0) {
        console.warn('[SceneTransition] Mount completed with errors:', mountResult.errors);
      }

      return {
        success: true,
        mounted: this.mounted,
        preload,
        mountErrors: mountResult.errors,
        message: this.lastError ?? undefined,
      };
    } finally {
      this.transitioning = false;
    }
  }

  /** Remount the last transitioned RuntimeScene descriptor. */
  async reloadCurrent(): Promise<SceneTransitionResult> {
    if (this.transitioning) {
      return {
        success: false,
        preload: { loaded: [], skipped: [], failed: [] },
        mountErrors: [],
        message: 'Transition already in progress',
      };
    }
    if (!this.runtimeScene) {
      return {
        success: false,
        preload: { loaded: [], skipped: [], failed: [] },
        mountErrors: [],
        message: 'No current scene to reload',
      };
    }
    return this.transitionTo(this.runtimeScene);
  }

  private teardownCurrent(): void {
    if (!this.mounted) return;
    try {
      this.mounted.loop.stop();
      unmountRuntimeScene(this.phaserScene, this.mounted);
    } catch (err) {
      console.warn('[SceneTransition] Teardown error (isolated):', err);
    }
    this.mounted = null;
  }
}
