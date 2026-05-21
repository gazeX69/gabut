/**
 * Phaser Scene Adapter
 * Mounts/unmounts RuntimeScene descriptors into a Phaser Scene.
 * Provides the mutable MountedScene API.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeScene, RuntimeLayerDescriptor } from '@vgz/engine-runtime';
import type { MountedScene } from './types.js';
import type { MountResult, AdapterError } from './phaser-runtime-errors.js';
import { createEntityObject } from './phaser-object-factory.js';
import { 
  type RuntimeMountedEntity, 
  type EntityUpdateHandler,
  syncMountedEntityTransform, 
  syncMountedEntityVisibility 
} from './phaser-mounted-entity.js';
import {
  type RuntimeMountedLayer,
  syncMountedLayerVisibility,
} from './phaser-mounted-layer.js';
import { renderStaticTilemapLayer } from './phaser-tilemap-renderer.js';
import { RuntimeSceneLoop } from './runtime-scene-loop.js';
import type { RuntimeComponent } from './runtime-component.js';
import { RuntimeInputState } from './runtime-input-state.js';
import { PhaserInputBridge } from './phaser-input-bridge.js';
import { RuntimeCameraState } from './runtime-camera-state.js';
import { PhaserCameraBridge } from './phaser-camera-bridge.js';
import { RuntimeScriptSystem } from './runtime-script-system.js';
import { RuntimeUILayer } from '../ui/runtime-ui-layer.js';
import { RuntimeAudioLayer } from '../audio/runtime-audio-layer.js';
import {
  aabbOverlap,
  entityWorldAABB,
  entitiesOverlap,
  hasActiveCollision,
  isSolidCollider,
  isValidAABB,
  pointInAABB,
  type RuntimeCollisionAABB,
} from './runtime-collision.js';
import {
  canReceiveInteraction,
  cleanupTriggerOverlapsForRemovedEntity,
  invokeInteract,
} from './runtime-trigger.js';
import {
  applyRuntimeSnapshot,
  buildRuntimeSnapshot,
  type RuntimeSnapshot,
  type RuntimeRestoreResult,
  type RuntimeSnapshotResult,
} from './runtime-snapshot.js';
import { DEMO_ANIMATION_CLIPS } from './runtime-animation.js';
import { DEMO_PREFABS } from './runtime-prefab.js';

/**
 * Mount a RuntimeScene into a Phaser Scene.
 * Creates GameObjects, layers them, and returns a MountedScene handle with mutation APIs.
 */
export function mountRuntimeScene(phaserScene: Phaser.Scene, runtimeScene: RuntimeScene): MountResult {
  const errors: AdapterError[] = [];
  const mountedEntities = new Map<string, RuntimeMountedEntity>();
  const mountedLayers = new Map<string, RuntimeMountedLayer>();
  const createdObjects: Phaser.GameObjects.GameObject[] = [];
  let isDisposed = false;
  const destroyedEntityIds = new Set<string>();

  const layerDepthBase = (zIndex: number) => zIndex * 1000;

  const mountTilemapLayer = (layer: RuntimeLayerDescriptor) => {
    const depth = layerDepthBase(layer.zIndex);
    const tilesetId = layer.tileData?.tilesetIds[0];
    const tilesetAsset = tilesetId ? runtimeScene.assets.get(tilesetId) : undefined;

    const mountedLayer: RuntimeMountedLayer = {
      layerId: layer.id,
      descriptor: layer,
      kind: 'tilemap',
      entityIds: new Set(),
      visible: layer.visible,
      alpha: layer.opacity,
    };

    try {
      const result = renderStaticTilemapLayer(phaserScene, {
        layer,
        tilesetAsset,
        depth,
      });

      if (result) {
        mountedLayer.tilemap = result.tilemap;
        mountedLayer.tilemapLayer = result.tilemapLayer;
        syncMountedLayerVisibility(mountedLayer);
      } else {
        errors.push({
          code: 'ENTITY_SKIPPED',
          message: `Tilemap layer '${layer.id}' could not be rendered`,
          layerId: layer.id,
        });
      }
    } catch (err) {
      errors.push({
        code: 'ENTITY_SKIPPED',
        message: `Tilemap layer '${layer.id}' failed: ${err}`,
        layerId: layer.id,
      });
    }

    mountedLayers.set(layer.id, mountedLayer);
  };

  const mountEntityLayer = (layer: RuntimeLayerDescriptor) => {
    const group = phaserScene.add.group();

    const mountedLayer: RuntimeMountedLayer = {
      layerId: layer.id,
      descriptor: layer,
      kind: 'entity',
      entityIds: new Set(layer.entityIds),
      group,
      visible: layer.visible,
      alpha: layer.opacity,
    };
    mountedLayers.set(layer.id, mountedLayer);
    syncMountedLayerVisibility(mountedLayer);

    layer.entityIds.forEach((entityId, entityIndexInLayer) => {
      const entity = runtimeScene.entities.get(entityId);
      if (!entity) {
        errors.push({
          code: 'ENTITY_SKIPPED',
          message: `Entity ${entityId} not found in scene`,
          entityId,
          layerId: layer.id,
        });
        return;
      }

      try {
        const asset = entity.assetId ? runtimeScene.assets.get(entity.assetId) : undefined;
        const obj = createEntityObject(phaserScene, entity, asset);

        const depth = layerDepthBase(layer.zIndex) + entityIndexInLayer + 1;
        (obj as any).setDepth(depth);

        group.add(obj);
        createdObjects.push(obj);

        const mountedEntity: RuntimeMountedEntity = {
          entityId,
          descriptor: entity,
          gameObject: obj,
          transformState: {
            x: entity.transform.position.x,
            y: entity.transform.position.y,
            rotation: entity.transform.rotation,
            scaleX: entity.transform.scale.x,
            scaleY: entity.transform.scale.y,
          },
          visible: entity.visible,
          alpha: layer.opacity,
          destroyed: false,
          collisionEnabled: false,
          collisionBounds: null,
          collisionTags: [],
          triggerEnabled: false,
          interactionEnabled: false,
          triggerTags: [],
          activeTriggerOverlaps: new Set(),
          triggerCallbacks: undefined,
          components: [],
        };

        syncMountedEntityVisibility(mountedEntity);

        mountedEntities.set(entityId, mountedEntity);
      } catch (err) {
        errors.push({
          code: 'ENTITY_SKIPPED',
          message: `Failed to create object: ${err}`,
          entityId,
          layerId: layer.id,
        });
      }
    });
  };

  // Layers are sorted by zIndex in RuntimeScene: tilemaps first, then entities (depth uses zIndex)
  for (const layer of runtimeScene.layers) {
    if (layer.type === 'tilemap') {
      mountTilemapLayer(layer);
    }
  }
  for (const layer of runtimeScene.layers) {
    if (layer.type === 'entity') {
      mountEntityLayer(layer);
    }
  }

  // Initialize Input Boundary
  const inputState = new RuntimeInputState();
  const inputBridge = new PhaserInputBridge(phaserScene, inputState);

  // Initialize Camera Boundary
  const cameraState = new RuntimeCameraState();
  const cameraBridge = new PhaserCameraBridge(phaserScene.cameras.main, cameraState);
  
  const uiLayer = new RuntimeUILayer(phaserScene, () => isDisposed);
  const audioLayer = new RuntimeAudioLayer(phaserScene, () => isDisposed);
  
  const scriptSystem = new RuntimeScriptSystem();
  scriptSystem.initFromScene(runtimeScene);

  // Create partial mounted scene first, to pass to the loop
  const partialMounted = {
    sceneId: runtimeScene.id,
    get isDisposed() {
      return isDisposed;
    },
    mountedEntities,
    mountedLayers,
    createdObjects,
    mountedAt: new Date().toISOString(),
    input: inputState,
    camera: cameraState,
    ui: uiLayer,
    audio: audioLayer,
    scriptSystem,
  } as Partial<MountedScene>;

  const loop = new RuntimeSceneLoop(partialMounted as MountedScene, cameraBridge);
  (partialMounted as any).loop = loop;

  // Mutation API implementation
  const getMountedEntity = (entityId: string) => {
    if (isDisposed) return undefined;
    return mountedEntities.get(entityId);
  };
  const getMountedLayer = (layerId: string) => {
    if (isDisposed) return undefined;
    return mountedLayers.get(layerId);
  };

  const checkValid = (entityId: string): RuntimeMountedEntity | null => {
    if (isDisposed) return null;
    const entity = getMountedEntity(entityId);
    if (!entity || entity.destroyed) return null;
    return entity;
  };

  const setEntityPosition = (entityId: string, x: number, y: number): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.transformState.x = x;
    entity.transformState.y = y;
    syncMountedEntityTransform(entity);
    return true;
  };

  const setEntityRotation = (entityId: string, rotation: number): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.transformState.rotation = rotation;
    syncMountedEntityTransform(entity);
    return true;
  };

  const setEntityScale = (entityId: string, scaleX: number, scaleY: number): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.transformState.scaleX = scaleX;
    entity.transformState.scaleY = scaleY;
    syncMountedEntityTransform(entity);
    return true;
  };

  const setEntityVisible = (entityId: string, visible: boolean): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.visible = visible;
    syncMountedEntityVisibility(entity);
    return true;
  };

  const setLayerVisible = (layerId: string, visible: boolean): boolean => {
    if (isDisposed) return false;
    const layer = getMountedLayer(layerId);
    if (!layer) return false;
    layer.visible = visible;
    syncMountedLayerVisibility(layer);
    return true;
  };

  const setLayerOpacity = (layerId: string, opacity: number): boolean => {
    const layer = getMountedLayer(layerId);
    if (!layer) return false;
    layer.alpha = Math.max(0, Math.min(1, opacity));
    syncMountedLayerVisibility(layer);
    return true;
  };

  const assignScript = (entityId: string, scriptId: string | null): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    (entity.descriptor as any).scriptId = scriptId;
    return true;
  };

  const setTile = (layerId: string, tileX: number, tileY: number, tileIndex: number): boolean => {
    if (isDisposed) return false;
    const layer = getMountedLayer(layerId);
    if (!layer || layer.kind !== 'tilemap') return false;
    if (!layer.tilemapLayer || !layer.descriptor.tileData) return false;

    const { width, height } = layer.descriptor.tileData;
    if (!Number.isFinite(tileX) || !Number.isFinite(tileY) || !Number.isFinite(tileIndex)) return false;
    if (tileX < 0 || tileY < 0 || tileX >= width || tileY >= height) return false;
    if (tileIndex < 0) return false;

    // Update the Phaser tilemap visually (tileIndex 0 = empty, Phaser uses tileIndex-1)
    const phaserIndex = tileIndex <= 0 ? -1 : tileIndex - 1;
    if (phaserIndex < 0) {
      layer.tilemapLayer.removeTileAt(tileX, tileY);
    } else {
      layer.tilemapLayer.putTileAt(phaserIndex, tileX, tileY);
    }

    // Update the runtime tile data array (mutable copy held by the layer)
    const tiles = layer.descriptor.tileData.tiles;
    const idx = tileY * width + tileX;
    if (idx >= 0 && idx < tiles.length) {
      (tiles as number[])[idx] = tileIndex;
    }

    return true;
  };

  const destroyMountedEntity = (entityId: string): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false; // Already destroyed or invalid

    entity.destroyed = true;
    entity.updateHandler = undefined;
    entity.activeTriggerOverlaps.clear();

    cleanupTriggerOverlapsForRemovedEntity(entityId, mountedEntities.values());

    // Detach all components securely
    const components = [...entity.components]; // Copy array
    entity.components = []; // Clear original
    for (const comp of components) {
      if (comp.onDetach) {
        try {
          comp.onDetach();
        } catch (err) {
          console.warn(`[PhaserAdapter] Error in onDetach for component '${comp.id}' on entity '${entityId}':`, err);
        }
      }
      comp.mountedEntity = undefined;
      comp.mountedScene = undefined;
    }

    // Destroy phaser object
    if (entity.gameObject) {
      entity.gameObject.destroy();
    }

    destroyedEntityIds.add(entityId);

    // Remove from maps
    mountedEntities.delete(entityId);
    
    // Remove from created array safely
    const idx = createdObjects.indexOf(entity.gameObject);
    if (idx > -1) {
      createdObjects.splice(idx, 1);
    }

    // Remove from layer membership
    for (const layer of mountedLayers.values()) {
      if (layer.entityIds.has(entityId)) {
        layer.entityIds.delete(entityId);
        break; // Entities only belong to one layer in this system usually
      }
    }

    return true;
  };

  // Registration API
  const registerEntityUpdate = (entityId: string, handler: EntityUpdateHandler): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.updateHandler = handler;
    return true;
  };

  const unregisterEntityUpdate = (entityId: string): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    entity.updateHandler = undefined;
    return true;
  };

  // Component API
  const attachComponent = (entityId: string, component: RuntimeComponent): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    
    if (entity.components.some(c => c.id === component.id)) {
      console.warn(`[PhaserAdapter] Entity '${entityId}' already has a component with id '${component.id}'. Ignoring.`);
      return false;
    }
    
    component.mountedEntity = entity;
    component.mountedScene = partialMounted as MountedScene;
    entity.components.push(component);
    
    if (component.onAttach) {
      try {
        component.onAttach();
      } catch (err) {
        console.warn(`[PhaserAdapter] Error in onAttach for component '${component.id}' on entity '${entityId}':`, err);
      }
    }
    
    return true;
  };

  const detachComponent = (entityId: string, componentId: string): boolean => {
    if (isDisposed) return false;
    const entity = getMountedEntity(entityId);
    if (!entity || entity.destroyed) return false;

    const idx = entity.components.findIndex(c => c.id === componentId);
    if (idx === -1) return false;

    const component = entity.components[idx];
    entity.components.splice(idx, 1);
    
    if (component.onDetach) {
      try {
        component.onDetach();
      } catch (err) {
        console.warn(`[PhaserAdapter] Error in onDetach for component '${component.id}' on entity '${entityId}':`, err);
      }
    }
    
    component.mountedEntity = undefined;
    component.mountedScene = undefined;
    return true;
  };

  const getComponent = (entityId: string, componentId: string): RuntimeComponent | undefined => {
    const entity = checkValid(entityId);
    if (!entity) return undefined;
    return entity.components.find(c => c.id === componentId);
  };

  const getComponents = (entityId: string): RuntimeComponent[] => {
    const entity = checkValid(entityId);
    if (!entity) return [];
    return [...entity.components]; // Return a copy for safety
  };

  const checkEntityOverlap = (entityAId: string, entityBId: string): boolean => {
    if (isDisposed) return false;
    const a = getMountedEntity(entityAId);
    const b = getMountedEntity(entityBId);
    if (!a || !b || a.destroyed || b.destroyed) return false;
    if (!hasActiveCollision(a) || !hasActiveCollision(b)) return false;
    return entitiesOverlap(a, b);
  };

  const queryPoint = (x: number, y: number): string[] => {
    if (isDisposed || !Number.isFinite(x) || !Number.isFinite(y)) return [];
    const hits: string[] = [];
    for (const entity of mountedEntities.values()) {
      if (!hasActiveCollision(entity)) continue;
      const box = entityWorldAABB(entity);
      if (box && pointInAABB(x, y, box)) hits.push(entity.entityId);
    }
    return hits;
  };

  const queryBounds = (bounds: RuntimeCollisionAABB): string[] => {
    if (isDisposed || !isValidAABB(bounds)) return [];
    const hits: string[] = [];
    for (const entity of mountedEntities.values()) {
      if (!hasActiveCollision(entity)) continue;
      const box = entityWorldAABB(entity);
      if (box && aabbOverlap(bounds, box)) hits.push(entity.entityId);
    }
    return hits;
  };

  const moveEntityWithCollision = (entityId: string, nextX: number, nextY: number): boolean => {
    const entity = checkValid(entityId);
    if (!entity || !Number.isFinite(nextX) || !Number.isFinite(nextY)) return false;

    const proposed = entityWorldAABB(entity, nextX, nextY);
    if (!proposed) {
      return setEntityPosition(entityId, nextX, nextY);
    }

    for (const other of mountedEntities.values()) {
      if (other.entityId === entityId || other.destroyed || !isSolidCollider(other)) continue;
      const solidBox = entityWorldAABB(other);
      if (solidBox && aabbOverlap(proposed, solidBox)) {
        return false;
      }
    }

    return setEntityPosition(entityId, nextX, nextY);
  };

  const interactAtPoint = (x: number, y: number, actorEntityId: string): boolean => {
    if (isDisposed || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const actor = getMountedEntity(actorEntityId);
    if (!actor || actor.destroyed) return false;

    const hits = queryPoint(x, y)
      .filter((id) => id !== actorEntityId)
      .sort();

    let acted = false;
    for (const targetId of hits) {
      const target = getMountedEntity(targetId);
      if (!target || !canReceiveInteraction(target)) continue;
      invokeInteract(target, actorEntityId);
      acted = true;
    }
    return acted;
  };

  const interactWithEntity = (targetEntityId: string, actorEntityId: string): boolean => {
    if (isDisposed) return false;
    const actor = getMountedEntity(actorEntityId);
    const target = getMountedEntity(targetEntityId);
    if (!actor || actor.destroyed || !target || target.destroyed) return false;
    if (!canReceiveInteraction(target)) return false;
    if (!hasActiveCollision(actor) || !hasActiveCollision(target)) return false;
    if (!entitiesOverlap(actor, target)) return false;
    invokeInteract(target, actorEntityId);
    return true;
  };

  const createRuntimeSnapshot = (): RuntimeSnapshotResult => {
    if (isDisposed) {
      return { success: false, warnings: [], message: 'Cannot snapshot disposed scene' };
    }
    return buildRuntimeSnapshot(partialMounted as MountedScene, destroyedEntityIds);
  };

  const restoreRuntimeSnapshot = (snapshot: RuntimeSnapshot): RuntimeRestoreResult => {
    if (isDisposed) {
      return { success: false, warnings: [], message: 'Cannot restore to disposed scene' };
    }
    return applyRuntimeSnapshot(
      partialMounted as MountedScene,
      snapshot,
      destroyedEntityIds,
      () => cameraBridge.syncToPhaser()
    );
  };

  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;
    loop.stop();
    audioLayer.dispose();
    uiLayer.dispose();

    // Clear handlers before detach so nothing schedules work during teardown
    mountedEntities.forEach((entity) => {
      entity.updateHandler = undefined;
    });
    inputBridge.dispose();
    inputState.dispose();
    cameraBridge.dispose();
    cameraState.dispose();

    // Safely detach all components from all entities
    mountedEntities.forEach((entity, entityId) => {
      // Re-use destroyMountedEntity logic without destroying objects yet
      const components = [...entity.components];
      entity.components = [];
      for (const comp of components) {
        if (comp.onDetach) {
          try {
            comp.onDetach();
          } catch (err) {}
        }
        comp.mountedEntity = undefined;
        comp.mountedScene = undefined;
      }
    });

    createdObjects.forEach(obj => obj.destroy());
    mountedLayers.forEach((layer) => {
      if (layer.tilemapLayer) {
        layer.tilemapLayer.destroy();
      }
      if (layer.tilemap) {
        layer.tilemap.destroy();
      }
      if (layer.group) {
        layer.group.destroy(true);
      }
    });
    mountedEntities.clear();
    mountedLayers.clear();
    createdObjects.length = 0;
  };

  const playAnimation = (entityId: string, clipId: string): boolean => {
    const entity = checkValid(entityId);
    if (!entity) return false;
    const clip = DEMO_ANIMATION_CLIPS[clipId];
    if (!clip) return false;
    
    entity.currentAnimationId = clipId;
    entity.animationState = {
      clipId,
      playing: true,
      currentFrameIndex: 0,
      elapsedMs: 0,
      loop: clip.loop
    };
    
    // Apply first frame immediately
    if (clip.frames.length > 0 && entity.gameObject && (entity.gameObject as any).setFrame) {
      (entity.gameObject as any).setFrame(clip.frames[0]);
    }
    return true;
  };

  const stopAnimation = (entityId: string): boolean => {
    const entity = checkValid(entityId);
    if (!entity || !entity.animationState) return false;
    entity.animationState.playing = false;
    return true;
  };

  const assignAsset = (entityId: string, assetId: string, assetType: string, url: string): boolean => {
    const entity = checkValid(entityId);
    if (!entity || !entity.gameObject) return false;
    
    // Minimal implementation: if it's a sprite, and the new asset is a sprite texture, set the texture.
    // For this minimal foundation, we assume the texture is already in the Phaser cache.
    // In a full implementation, we'd need to load the texture if it's not present.
    // We assume the assetId corresponds to the texture key.
    
    // Stop any playing animation
    if (entity.animationState) {
      entity.animationState.playing = false;
    }
    
    // Attempt to set texture
    if ((entity.gameObject as any).setTexture) {
      try {
        (entity.gameObject as any).setTexture(assetId);
      } catch (err) {
        console.warn(`[PhaserAdapter] Failed to assign asset ${assetId} to entity ${entityId}:`, err);
        return false;
      }
    }
    
    // Update local descriptor copy for bridge sync (although descriptors are technically immutable, 
    // the runtime bridge will patch it on the React side. Here we just update the assetId in a safe way if needed, 
    // but the actual source of truth for the editor is the React state).
    return true;
  };

  const tickAnimation = (entityId: string, deltaMs: number): void => {
    const entity = checkValid(entityId);
    if (!entity || !entity.animationState || !entity.animationState.playing) return;
    
    const state = entity.animationState;
    const clip = DEMO_ANIMATION_CLIPS[state.clipId];
    if (!clip || clip.frames.length === 0) return;

    state.elapsedMs += deltaMs;
    const frameDurationMs = 1000 / clip.fps;

    if (state.elapsedMs >= frameDurationMs) {
      const framesToAdvance = Math.floor(state.elapsedMs / frameDurationMs);
      state.elapsedMs -= framesToAdvance * frameDurationMs;

      state.currentFrameIndex += framesToAdvance;

      if (state.currentFrameIndex >= clip.frames.length) {
        if (state.loop) {
          state.currentFrameIndex = state.currentFrameIndex % clip.frames.length;
        } else {
          state.currentFrameIndex = clip.frames.length - 1;
          state.playing = false;
        }
      }

      if (entity.gameObject && (entity.gameObject as any).setFrame) {
        (entity.gameObject as any).setFrame(clip.frames[state.currentFrameIndex]);
      }
    }
  };

  const deleteEntity = (entityId: string): boolean => {
    return destroyMountedEntity(entityId);
  };

  const createEntityFromPrefab = (prefabId: string, x: number, y: number): any | null => {
    if (isDisposed) return null;
    const prefab = DEMO_PREFABS[prefabId];
    if (!prefab) return null;

    const newId = `ent-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const entityDesc: any = {
      id: newId,
      name: prefab.name,
      type: prefab.entityType,
      assetId: prefab.assetId,
      transform: {
        position: { x, y },
        rotation: 0,
        scale: { x: prefab.defaultTransform.scaleX, y: prefab.defaultTransform.scaleY }
      },
      visible: true,
      zOrder: prefab.defaultTransform.zOrder,
      collision: prefab.collision,
      trigger: prefab.interactive ? { interactive: true, eventId: '' } : undefined,
    };

    // Find the first entity layer to add to, or create one
    let targetLayer: RuntimeMountedLayer | undefined;
    for (const layer of mountedLayers.values()) {
      if (layer.kind === 'entity') {
        targetLayer = layer;
        break;
      }
    }
    
    if (!targetLayer) return null; // Shouldn't happen in a proper scene

    const asset = entityDesc.assetId ? runtimeScene.assets.get(entityDesc.assetId) : undefined;
    const obj = createEntityObject(phaserScene, entityDesc, asset);
    const depth = layerDepthBase(targetLayer.descriptor.zIndex) + targetLayer.entityIds.size + 1;
    (obj as any).setDepth(depth);

    targetLayer.group!.add(obj);
    createdObjects.push(obj);

    const mountedEntity: RuntimeMountedEntity = {
      entityId: newId,
      descriptor: entityDesc,
      gameObject: obj,
      transformState: {
        x: entityDesc.transform.position.x,
        y: entityDesc.transform.position.y,
        rotation: entityDesc.transform.rotation,
        scaleX: entityDesc.transform.scale.x,
        scaleY: entityDesc.transform.scale.y,
      },
      visible: entityDesc.visible,
      alpha: targetLayer.alpha,
      destroyed: false,
      collisionEnabled: !!entityDesc.collision?.solid,
      collisionBounds: entityDesc.collision ? ({
        width: entityDesc.collision.bodySize?.width || 32,
        height: entityDesc.collision.bodySize?.height || 32,
        offsetX: entityDesc.collision.bodyOffset?.x || 0,
        offsetY: entityDesc.collision.bodyOffset?.y || 0
      } as any) : null,
      collisionTags: [],
      triggerEnabled: !!entityDesc.trigger,
      interactionEnabled: !!entityDesc.trigger?.interactive,
      triggerTags: [],
      activeTriggerOverlaps: new Set(),
      triggerCallbacks: undefined,
      components: [],
      animationState: prefab.animation ? { clipId: prefab.animation.clipId, playing: prefab.animation.playing, currentFrameIndex: 0, elapsedMs: 0, loop: true } : undefined,
    };

    if (mountedEntity.animationState) {
      (mountedEntity as any).currentAnimationId = prefab.animation!.clipId;
    }

    syncMountedEntityVisibility(mountedEntity);
    mountedEntities.set(newId, mountedEntity);
    targetLayer.entityIds.add(newId);
    
    // Mutate runtimeScene to keep it in sync for bridge logic
    (runtimeScene.entities as Map<string, any>).set(newId, entityDesc);
    (targetLayer.descriptor.entityIds as string[]).push(newId);

    return entityDesc;
  };

  const duplicateEntity = (entityId: string): any | null => {
    if (isDisposed) return null;
    const existing = mountedEntities.get(entityId);
    if (!existing) return null;

    const newId = `ent-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const clonedDesc = JSON.parse(JSON.stringify(existing.descriptor));
    clonedDesc.id = newId;
    clonedDesc.name = `${clonedDesc.name} (Copy)`;
    clonedDesc.transform.position.x += 16; // offset slightly
    clonedDesc.transform.position.y += 16;

    let targetLayer: RuntimeMountedLayer | undefined;
    for (const layer of mountedLayers.values()) {
      if (layer.kind === 'entity' && layer.entityIds.has(entityId)) {
        targetLayer = layer;
        break;
      }
    }
    if (!targetLayer) return null;

    const asset = clonedDesc.assetId ? runtimeScene.assets.get(clonedDesc.assetId) : undefined;
    const obj = createEntityObject(phaserScene, clonedDesc, asset);
    const depth = layerDepthBase(targetLayer.descriptor.zIndex) + targetLayer.entityIds.size + 1;
    (obj as any).setDepth(depth);

    targetLayer.group!.add(obj);
    createdObjects.push(obj);

    const mountedEntity: RuntimeMountedEntity = {
      entityId: newId,
      descriptor: clonedDesc,
      gameObject: obj,
      transformState: {
        x: clonedDesc.transform.position.x,
        y: clonedDesc.transform.position.y,
        rotation: clonedDesc.transform.rotation,
        scaleX: clonedDesc.transform.scale.x,
        scaleY: clonedDesc.transform.scale.y,
      },
      visible: clonedDesc.visible,
      alpha: targetLayer.alpha,
      destroyed: false,
      collisionEnabled: existing.collisionEnabled,
      collisionBounds: existing.collisionBounds ? { ...existing.collisionBounds } : null,
      collisionTags: [...existing.collisionTags],
      triggerEnabled: existing.triggerEnabled,
      interactionEnabled: existing.interactionEnabled,
      triggerTags: [...existing.triggerTags],
      activeTriggerOverlaps: new Set(),
      triggerCallbacks: undefined, // Need to rewire scripts manually or rely on component attach
      components: [], // Components aren't cloned deeply in minimal foundation
      animationState: existing.animationState ? { ...existing.animationState, elapsedMs: 0 } : undefined,
    };
    
    if (mountedEntity.animationState) {
      (mountedEntity as any).currentAnimationId = (existing as any).currentAnimationId;
    }

    syncMountedEntityVisibility(mountedEntity);
    mountedEntities.set(newId, mountedEntity);
    targetLayer.entityIds.add(newId);
    
    (runtimeScene.entities as Map<string, any>).set(newId, clonedDesc);
    (targetLayer.descriptor.entityIds as string[]).push(newId);

    return clonedDesc;
  };

  Object.assign(partialMounted, {
    getMountedEntity,
    getMountedLayer,
    setEntityPosition,
    setEntityRotation,
    setEntityScale,
    setEntityVisible,
    setLayerVisible,
    setLayerOpacity,
    setTile,
    destroyMountedEntity,
    registerEntityUpdate,
    unregisterEntityUpdate,
    playAnimation,
    stopAnimation,
    assignAsset,
    assignScript,
    tickAnimation,
    createEntityFromPrefab,
    duplicateEntity,
    deleteEntity,
    attachComponent,
    detachComponent,
    getComponent,
    getComponents,
    checkEntityOverlap,
    queryPoint,
    queryBounds,
    moveEntityWithCollision,
    interactAtPoint,
    interactWithEntity,
    createRuntimeSnapshot,
    restoreRuntimeSnapshot,
    dispose,
  });

  return { mounted: partialMounted as MountedScene, errors };
}

/**
 * Unmount a mounted scene, cleaning up all objects.
 */
export function unmountRuntimeScene(phaserScene: Phaser.Scene, mounted: MountedScene): void {
  mounted.dispose();
}

/**
 * Convenience to remount (unmount old, mount new).
 */
export function remountRuntimeScene(
  phaserScene: Phaser.Scene, 
  newRuntimeScene: RuntimeScene, 
  oldMounted: MountedScene
): MountResult {
  unmountRuntimeScene(phaserScene, oldMounted);
  return mountRuntimeScene(phaserScene, newRuntimeScene);
}
