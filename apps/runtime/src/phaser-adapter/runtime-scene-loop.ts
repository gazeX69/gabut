/**
 * Runtime Scene Loop
 * Minimal deterministic runtime update loop layer above mounted entities.
 * @module apps/runtime/phaser-adapter
 */

import type { MountedScene } from './types.js';
import type { PhaserCameraBridge } from './phaser-camera-bridge.js';
import { processAllTriggerOverlaps } from './runtime-trigger.js';

export class RuntimeSceneLoop {
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public elapsedMs: number = 0;
  public deltaMs: number = 0;
  public frameCount: number = 0;

  constructor(
    private mountedScene: MountedScene, 
    private cameraBridge: PhaserCameraBridge
  ) {}

  /** Start the loop */
  start() {
    this.isRunning = true;
    this.isPaused = false;
  }

  /** Stop the loop permanently (usually on dispose) */
  stop() {
    this.isRunning = false;
  }

  /** Pause the loop */
  pause() {
    this.isPaused = true;
  }

  /** Resume the loop */
  resume() {
    this.isPaused = false;
  }

  /** Tick the loop forward by deltaMs */
  tick(deltaMs: number) {
    if (this.mountedScene.isDisposed) return;

    const shouldUpdate = this.isRunning && !this.isPaused;

    if (shouldUpdate) {
      this.deltaMs = deltaMs;
      this.elapsedMs += deltaMs;
      this.frameCount++;

      // Snapshot entities so dispose/destroy during callbacks cannot corrupt iteration
      for (const entity of [...this.mountedScene.mountedEntities.values()]) {
        if (this.mountedScene.isDisposed || entity.destroyed) continue;
        if (!this.mountedScene.mountedEntities.has(entity.entityId)) continue;

        if (entity.updateHandler) {
          try {
            entity.updateHandler(entity, deltaMs, this);
          } catch (err) {
            console.warn(`[RuntimeSceneLoop] Error in updateHandler for entity '${entity.entityId}':`, err);
          }
        }

        if (this.mountedScene.isDisposed) break;
        if (entity.destroyed || !this.mountedScene.mountedEntities.has(entity.entityId)) continue;

        // Snapshot after updateHandler so destroy during handler does not run stale components
        for (const component of [...entity.components]) {
          if (this.mountedScene.isDisposed || entity.destroyed) break;
          if (!entity.components.includes(component)) continue;
          if (!component.enabled || !component.onUpdate) continue;

          try {
            component.onUpdate(deltaMs);
          } catch (err) {
            console.warn(`[RuntimeSceneLoop] Component '${component.id}' on entity '${entity.entityId}' error:`, err);
          }
        }
      }

      if (!this.mountedScene.isDisposed && this.mountedScene.camera.followingEntityId) {
        const target = this.mountedScene.getMountedEntity(this.mountedScene.camera.followingEntityId);
        if (target && !target.destroyed) {
          this.mountedScene.camera.setPosition(target.transformState.x, target.transformState.y);
        } else {
          this.mountedScene.camera.stopFollow();
        }
      }

      if (!this.mountedScene.isDisposed) {
        this.cameraBridge.syncToPhaser();
      }

      if (!this.mountedScene.isDisposed) {
        try {
          processAllTriggerOverlaps(this.mountedScene);
        } catch (err) {
          console.warn('[RuntimeSceneLoop] Trigger processing error (isolated):', err);
        }
        try {
          this.mountedScene.audio.tick();
        } catch (err) {
          console.warn('[RuntimeSceneLoop] Audio tick error (isolated):', err);
        }
      }
    }

    // Clear per-frame input even when paused/stopped so bridge events do not stick
    if (!this.mountedScene.isDisposed) {
      this.mountedScene.input.resetFrameState();
    }
  }
}
