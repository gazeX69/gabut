/**
 * Phaser Adapter Types
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';

import type { RuntimeMountedEntity } from './phaser-mounted-entity.js';
import type { RuntimeMountedLayer } from './phaser-mounted-layer.js';

/**
 * Handle to a mounted RuntimeScene in Phaser.
 * Contains created objects and provides a dispose method for cleanup.
 */
export interface MountedScene {
  readonly sceneId: string;
  /** True after dispose(); blocks tick and mutation APIs */
  readonly isDisposed: boolean;
  readonly mountedEntities: Map<string, RuntimeMountedEntity>;
  readonly mountedLayers: Map<string, RuntimeMountedLayer>;
  readonly createdObjects: Phaser.GameObjects.GameObject[];
  readonly mountedAt: string;
  readonly loop: import('./runtime-scene-loop.js').RuntimeSceneLoop;
  readonly input: import('./runtime-input-state.js').RuntimeInputState;
  readonly camera: import('./runtime-camera-state.js').RuntimeCameraState;
  readonly ui: import('../ui/runtime-ui-layer.js').RuntimeUILayer;
  readonly audio: import('../audio/runtime-audio-layer.js').RuntimeAudioLayer;

  // Mutation API
  getMountedEntity(entityId: string): RuntimeMountedEntity | undefined;
  getMountedLayer(layerId: string): RuntimeMountedLayer | undefined;
  setEntityPosition(entityId: string, x: number, y: number): boolean;
  setEntityRotation(entityId: string, rotation: number): boolean;
  setEntityScale(entityId: string, scaleX: number, scaleY: number): boolean;
  setEntityVisible(entityId: string, visible: boolean): boolean;
  setLayerVisible(layerId: string, visible: boolean): boolean;
  setLayerOpacity(layerId: string, opacity: number): boolean;
  destroyMountedEntity(entityId: string): boolean;

  // Update API
  registerEntityUpdate(entityId: string, handler: import('./phaser-mounted-entity.js').EntityUpdateHandler): boolean;
  unregisterEntityUpdate(entityId: string): boolean;

  // Component API
  attachComponent(entityId: string, component: import('./runtime-component.js').RuntimeComponent): boolean;
  detachComponent(entityId: string, componentId: string): boolean;
  getComponent(entityId: string, componentId: string): import('./runtime-component.js').RuntimeComponent | undefined;
  getComponents(entityId: string): import('./runtime-component.js').RuntimeComponent[];

  // Collision API (AABB, no physics)
  checkEntityOverlap(entityAId: string, entityBId: string): boolean;
  queryPoint(x: number, y: number): string[];
  queryBounds(bounds: import('./runtime-collision.js').RuntimeCollisionAABB): string[];
  moveEntityWithCollision(entityId: string, nextX: number, nextY: number): boolean;

  // Interaction API
  interactAtPoint(x: number, y: number, actorEntityId: string): boolean;
  interactWithEntity(targetEntityId: string, actorEntityId: string): boolean;

  // Session snapshot API (runtime-only, not persisted to disk)
  createRuntimeSnapshot(): import('./runtime-snapshot.js').RuntimeSnapshotResult;
  restoreRuntimeSnapshot(
    snapshot: import('./runtime-snapshot.js').RuntimeSnapshot
  ): import('./runtime-snapshot.js').RuntimeRestoreResult;

  /** Destroy all created Phaser GameObjects and groups */
  dispose(): void;
}
