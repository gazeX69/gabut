/**
 * Phaser Adapter Barrel Export
 * @module apps/runtime/phaser-adapter
 */

export type { MountedScene } from './types.js';
export type { AdapterErrorCode, AdapterError, MountResult } from './phaser-runtime-errors.js';
export { mountRuntimeScene, unmountRuntimeScene, remountRuntimeScene } from './phaser-scene-adapter.js';
export { createEntityObject } from './phaser-object-factory.js';
export type { RuntimeAssetLoadError, PreloadResult } from './phaser-asset-preloader.js';
export { collectSceneAssets, preloadRuntimeSceneAssets } from './phaser-asset-preloader.js';
export type { RuntimeMountedEntity, EntityUpdateHandler } from './phaser-mounted-entity.js';
export type { RuntimeMountedLayer, MountedLayerKind } from './phaser-mounted-layer.js';
export { syncMountedLayerVisibility } from './phaser-mounted-layer.js';
export { renderStaticTilemapLayer } from './phaser-tilemap-renderer.js';
export type { TilemapRenderResult, TilemapRenderOptions } from './phaser-tilemap-renderer.js';
export { RuntimeSceneLoop } from './runtime-scene-loop.js';
export type { RuntimeComponent } from './runtime-component.js';
export { SpinComponent } from './components/spin-component.js';
export { FloatComponent } from './components/float-component.js';
export { InputMoveComponent } from './components/input-move-component.js';
export { RuntimeInputState } from './runtime-input-state.js';
export { RuntimeCameraState } from './runtime-camera-state.js';
export { RuntimeUILayer } from '../ui/runtime-ui-layer.js';
export { RuntimeAudioLayer } from '../audio/runtime-audio-layer.js';
export type { RuntimePlayingSound, RuntimeMusicState, PlaySoundOptions, PlayMusicOptions } from '../audio/runtime-audio-layer.js';
export type { RuntimeUIText, RuntimeUIPanel, RuntimeUIElement } from '../ui/runtime-ui-element.js';
export type {
  RuntimeCollisionBounds,
  RuntimeCollisionAABB,
  CollisionLayer,
} from './runtime-collision.js';
export {
  isValidCollisionBounds,
  hasActiveCollision,
  isSolidCollider,
  entityWorldAABB,
  entitiesOverlap,
  defaultActorBounds,
} from './runtime-collision.js';
export type { RuntimeTriggerCallbacks } from './runtime-trigger.js';
export {
  processAllTriggerOverlaps,
  canEmitTriggers,
  canBeTriggerProbe,
  canReceiveInteraction,
} from './runtime-trigger.js';
export { RuntimeSceneTransition } from './runtime-scene-transition.js';
export type { SceneTransitionResult } from './runtime-scene-transition.js';
export type {
  RuntimeSnapshot,
  RuntimeSnapshotResult,
  RuntimeRestoreResult,
  RuntimeEntitySnapshot,
  RuntimeCameraSnapshot,
  RuntimeAudioSnapshot,
} from './runtime-snapshot.js';
export { RUNTIME_SNAPSHOT_VERSION, cloneJsonSafe, buildRuntimeSnapshot, applyRuntimeSnapshot } from './runtime-snapshot.js';





