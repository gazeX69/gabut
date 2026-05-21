/**
 * Runtime session snapshot (JSON-safe, no Phaser objects).
 * @module apps/runtime/phaser-adapter
 */

import type { MountedScene } from './types.js';
import {
  syncMountedEntityTransform,
  syncMountedEntityVisibility,
} from './phaser-mounted-entity.js';

export const RUNTIME_SNAPSHOT_VERSION = 1 as const;

export interface RuntimeTransformSnapshot {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

export interface RuntimeEntitySnapshot {
  readonly entityId: string;
  readonly visible: boolean;
  readonly transform: RuntimeTransformSnapshot;
  readonly runtimeData?: Record<string, unknown>;
}

export interface RuntimeCameraSnapshot {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
  readonly rotation: number;
  readonly followingEntityId?: string;
}

export interface RuntimeAudioSnapshot {
  readonly masterVolume: number;
  readonly musicAssetId: string | null;
}

export interface RuntimeSnapshot {
  readonly version: typeof RUNTIME_SNAPSHOT_VERSION;
  readonly sceneId: string;
  readonly savedAt: string;
  readonly entities: ReadonlyArray<RuntimeEntitySnapshot>;
  readonly destroyedEntityIds: ReadonlyArray<string>;
  readonly camera: RuntimeCameraSnapshot;
  readonly audio: RuntimeAudioSnapshot;
}

export interface RuntimeSnapshotResult {
  readonly success: boolean;
  readonly snapshot?: RuntimeSnapshot;
  readonly warnings: ReadonlyArray<string>;
  readonly message?: string;
}

export interface RuntimeRestoreResult {
  readonly success: boolean;
  readonly warnings: ReadonlyArray<string>;
  readonly message?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-clone values that are JSON.stringify safe; never throws.
 */
export function cloneJsonSafe(
  value: unknown,
  path: string,
  warnings: string[]
): unknown | undefined {
  if (value === undefined) return undefined;

  const type = typeof value;
  if (value === null || type === 'string' || type === 'number' || type === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (let i = 0; i < value.length; i++) {
      const cloned = cloneJsonSafe(value[i], `${path}[${i}]`, warnings);
      if (cloned !== undefined) out.push(cloned);
    }
    return out;
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const cloned = cloneJsonSafe(entry, `${path}.${key}`, warnings);
      if (cloned !== undefined) out[key] = cloned;
    }
    return out;
  }

  warnings.push(`Skipped non-JSON value at ${path} (${type})`);
  return undefined;
}

function cloneEntityRuntimeData(
  entityId: string,
  data: Record<string, unknown> | undefined,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const cloned = cloneJsonSafe(data, `entities.${entityId}.runtimeData`, warnings);
  if (!cloned || !isPlainObject(cloned)) return undefined;
  return cloned;
}

function isValidSnapshot(snapshot: unknown): snapshot is RuntimeSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const s = snapshot as RuntimeSnapshot;
  return (
    s.version === RUNTIME_SNAPSHOT_VERSION &&
    typeof s.sceneId === 'string' &&
    Array.isArray(s.entities) &&
    Array.isArray(s.destroyedEntityIds) &&
    s.camera !== null &&
    typeof s.camera === 'object' &&
    s.audio !== null &&
    typeof s.audio === 'object'
  );
}

export function buildRuntimeSnapshot(
  mounted: MountedScene,
  destroyedEntityIds: ReadonlySet<string>
): RuntimeSnapshotResult {
  if (mounted.isDisposed) {
    return { success: false, warnings: [], message: 'Cannot snapshot disposed scene' };
  }

  const warnings: string[] = [];
  const entities: RuntimeEntitySnapshot[] = [];

  const sortedIds = [...mounted.mountedEntities.keys()].sort();
  for (const entityId of sortedIds) {
    const entity = mounted.mountedEntities.get(entityId);
    if (!entity || entity.destroyed) continue;

    const runtimeData = cloneEntityRuntimeData(entityId, entity.runtimeData, warnings);
    entities.push({
      entityId,
      visible: entity.visible,
      transform: {
        x: entity.transformState.x,
        y: entity.transformState.y,
        rotation: entity.transformState.rotation,
        scaleX: entity.transformState.scaleX,
        scaleY: entity.transformState.scaleY,
      },
      ...(runtimeData ? { runtimeData } : {}),
    });
  }

  const music = mounted.audio.getMusicState();

  const snapshot: RuntimeSnapshot = {
    version: RUNTIME_SNAPSHOT_VERSION,
    sceneId: mounted.sceneId,
    savedAt: new Date().toISOString(),
    entities,
    destroyedEntityIds: [...destroyedEntityIds].sort(),
    camera: {
      x: mounted.camera.x,
      y: mounted.camera.y,
      zoom: mounted.camera.zoom,
      rotation: mounted.camera.rotation,
      ...(mounted.camera.followingEntityId
        ? { followingEntityId: mounted.camera.followingEntityId }
        : {}),
    },
    audio: {
      masterVolume: mounted.audio.getMasterVolume(),
      musicAssetId: music.assetId,
    },
  };

  try {
    JSON.stringify(snapshot);
  } catch (err) {
    return {
      success: false,
      warnings,
      message: `Snapshot not JSON-safe: ${err}`,
    };
  }

  return { success: true, snapshot, warnings };
}

export function applyRuntimeSnapshot(
  mounted: MountedScene,
  snapshot: RuntimeSnapshot,
  destroyedEntityIds: Set<string>,
  syncCameraToPhaser?: () => void
): RuntimeRestoreResult {
  if (mounted.isDisposed) {
    return { success: false, warnings: [], message: 'Cannot restore to disposed scene' };
  }

  if (!isValidSnapshot(snapshot)) {
    return { success: false, warnings: [], message: 'Invalid snapshot structure' };
  }

  if (snapshot.sceneId !== mounted.sceneId) {
    return {
      success: false,
      warnings: [],
      message: `Snapshot scene '${snapshot.sceneId}' does not match mounted '${mounted.sceneId}'`,
    };
  }

  const warnings: string[] = [];
  const destroyedSet = new Set(snapshot.destroyedEntityIds);

  destroyedEntityIds.clear();
  for (const id of destroyedSet) {
    destroyedEntityIds.add(id);
  }

  const snapshotById = new Map(snapshot.entities.map((e) => [e.entityId, e]));

  for (const entityId of snapshotById.keys()) {
    if (!mounted.mountedEntities.has(entityId)) {
      warnings.push(`Snapshot entity '${entityId}' not in mounted scene (skipped)`);
    }
  }

  for (const [entityId, entity] of mounted.mountedEntities) {
    if (entity.destroyed) continue;

    if (destroyedSet.has(entityId)) {
      warnings.push(`Entity '${entityId}' is destroyed in snapshot (skipped)`);
      continue;
    }

    const saved = snapshotById.get(entityId);
    if (!saved) continue;

    const t = saved.transform;
    if (
      !Number.isFinite(t.x) ||
      !Number.isFinite(t.y) ||
      !Number.isFinite(t.rotation) ||
      !Number.isFinite(t.scaleX) ||
      !Number.isFinite(t.scaleY)
    ) {
      warnings.push(`Invalid transform for '${entityId}' (skipped)`);
      continue;
    }

    entity.transformState.x = t.x;
    entity.transformState.y = t.y;
    entity.transformState.rotation = t.rotation;
    entity.transformState.scaleX = t.scaleX;
    entity.transformState.scaleY = t.scaleY;
    entity.visible = saved.visible;

    if (saved.runtimeData) {
      const cloned = cloneEntityRuntimeData(entityId, saved.runtimeData, warnings);
      if (cloned) entity.runtimeData = cloned;
    }

    syncMountedEntityTransform(entity);
    syncMountedEntityVisibility(entity);
  }

  const cam = snapshot.camera;
  if (
    Number.isFinite(cam.x) &&
    Number.isFinite(cam.y) &&
    Number.isFinite(cam.zoom) &&
    Number.isFinite(cam.rotation)
  ) {
    mounted.camera.setPosition(cam.x, cam.y);
    mounted.camera.setZoom(cam.zoom);
    mounted.camera.setRotation(cam.rotation);

    const followId = cam.followingEntityId;
    if (followId) {
      if (destroyedSet.has(followId)) {
        mounted.camera.stopFollow();
        warnings.push(`Camera follow target '${followId}' was destroyed (follow cleared)`);
      } else {
        const followEntity = mounted.getMountedEntity(followId);
        if (followEntity && !followEntity.destroyed) {
          mounted.camera.followEntity(followId);
        } else {
          mounted.camera.stopFollow();
          warnings.push(`Camera follow target '${followId}' missing (follow cleared)`);
        }
      }
    } else {
      mounted.camera.stopFollow();
    }
  } else {
    warnings.push('Invalid camera snapshot (skipped camera restore)');
  }

  if (Number.isFinite(snapshot.audio.masterVolume)) {
    mounted.audio.setMasterVolume(snapshot.audio.masterVolume);
  } else {
    warnings.push('Invalid audio master volume (skipped)');
  }

  try {
    syncCameraToPhaser?.();
  } catch (err) {
    warnings.push(`Camera sync warning: ${err}`);
  }

  return {
    success: true,
    warnings,
    message: warnings.length > 0 ? 'Restored with warnings' : 'Restored',
  };
}
