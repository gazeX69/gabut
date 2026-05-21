/**
 * Scene Converter
 * Pure functions that transform validated VGZSceneSchema into runtime descriptors.
 * All functions assume validated input (validation boundary is in scene-loader).
 * @module engine-runtime/loader
 */

import type { VGZSceneSchema } from '@vgz/scene-types';
import type { VGZSceneLayer } from '@vgz/scene-types';
import type { VGZSceneEntity } from '@vgz/scene-types';
import type { VGZAssetReference } from '@vgz/scene-types';
import type { VGZTransform } from '@vgz/scene-types';

import type { RuntimeTransform } from '../descriptors/runtime-transform.js';
import type { RuntimeEntityDescriptor } from '../descriptors/runtime-entity.js';
import type { RuntimeLayerDescriptor, RuntimeTileData } from '../descriptors/runtime-layer.js';
import type { RuntimeAssetDescriptor } from '../descriptors/runtime-asset.js';
import type { RuntimeScene, RuntimeViewport } from '../runtime-scene.js';

// ─── Transform ───────────────────────────────────────────────────────────────

/**
 * Convert a VGZTransform to an immutable RuntimeTransform.
 * Freezes position, scale, and the transform itself.
 */
export function convertTransform(transform: VGZTransform): RuntimeTransform {
  return Object.freeze({
    position: Object.freeze({
      x: transform.position.x,
      y: transform.position.y,
    }),
    rotation: transform.rotation,
    scale: Object.freeze({
      x: transform.scale.x,
      y: transform.scale.y,
    }),
  });
}

// ─── Entity ──────────────────────────────────────────────────────────────────

/**
 * Convert a VGZSceneEntity to an immutable RuntimeEntityDescriptor.
 * Normalizes:
 * - assetId: undefined → null
 * - properties: undefined → {}
 * - Adds layerId back-reference
 * - Strips components (future ECS, not runtime-safe yet)
 */
export function convertEntity(
  entity: VGZSceneEntity,
  layerId: string,
): RuntimeEntityDescriptor {
  return Object.freeze({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    transform: convertTransform(entity.transform),
    visible: entity.visible,
    assetId: entity.assetId ?? null,
    properties: Object.freeze({ ...(entity.properties ?? {}) }),
    layerId,
  });
}

// ─── Tile Data ───────────────────────────────────────────────────────────────

/**
 * Convert VGZSceneLayerTileData to immutable RuntimeTileData.
 * Creates frozen copies of tiles and tilesetIds arrays.
 */
function convertTileData(
  tileData: NonNullable<VGZSceneLayer['tileData']>,
): RuntimeTileData {
  return Object.freeze({
    width: tileData.width,
    height: tileData.height,
    tileSize: tileData.tileSize,
    tiles: Object.freeze([...tileData.tiles]),
    tilesetIds: Object.freeze([...tileData.tilesetIds]),
  });
}

// ─── Layer ───────────────────────────────────────────────────────────────────

/**
 * Convert a VGZSceneLayer to an immutable RuntimeLayerDescriptor.
 * Normalizes:
 * - entityIds: undefined → []
 * - tileData: undefined → null
 * - Strips 'locked' (editor-only)
 */
export function convertLayer(layer: VGZSceneLayer): RuntimeLayerDescriptor {
  return Object.freeze({
    id: layer.id,
    name: layer.name,
    type: layer.type,
    zIndex: layer.zIndex,
    visible: layer.visible,
    opacity: layer.opacity,
    entityIds: Object.freeze([...(layer.entityIds ?? [])]),
    tileData: layer.tileData ? convertTileData(layer.tileData) : null,
  });
}

// ─── Asset ───────────────────────────────────────────────────────────────────

/**
 * Convert a VGZAssetReference to an immutable RuntimeAssetDescriptor.
 * Normalizes: metadata undefined → {}.
 */
export function convertAsset(asset: VGZAssetReference): RuntimeAssetDescriptor {
  return Object.freeze({
    id: asset.id,
    type: asset.type,
    path: asset.path,
    metadata: Object.freeze({ ...(asset.metadata ?? {}) }),
  });
}

// ─── Entity → Layer Map ──────────────────────────────────────────────────────

/**
 * Build a map from entityId → layerId for back-references.
 * Iterates all entity-type layers and records which layer owns each entity.
 * If an entity appears in multiple layers, the first layer wins.
 */
export function resolveEntityLayerMap(
  layers: VGZSceneLayer[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const layer of layers) {
    if (layer.type === 'entity' && layer.entityIds) {
      for (const entityId of layer.entityIds) {
        if (!map.has(entityId)) {
          map.set(entityId, layer.id);
        }
      }
    }
  }

  return map;
}

// ─── Scene Assembly ──────────────────────────────────────────────────────────

/**
 * Build a complete RuntimeScene from a validated VGZSceneSchema.
 *
 * Pipeline:
 * 1. Convert and sort layers by zIndex (ascending = bottom first)
 * 2. Build entity→layer back-reference map
 * 3. Convert entities with layerId back-references
 * 4. Convert assets into lookup map
 * 5. Assemble and freeze RuntimeScene
 *
 * Editor metadata (editorMeta) is silently discarded.
 */
export function buildRuntimeScene(scene: VGZSceneSchema): RuntimeScene {
  // 1. Convert layers, sorted by zIndex ascending
  const layers = scene.layers
    .map(convertLayer)
    .sort((a, b) => a.zIndex - b.zIndex);

  // 2. Build entity→layer back-reference map from raw schema layers
  const entityLayerMap = resolveEntityLayerMap(scene.layers);

  // 3. Convert entities with layerId back-reference
  const entityEntries: [string, RuntimeEntityDescriptor][] = [];
  for (const [id, entity] of Object.entries(scene.entities)) {
    const layerId = entityLayerMap.get(id) ?? '';
    entityEntries.push([id, convertEntity(entity, layerId)]);
  }
  const entities: ReadonlyMap<string, RuntimeEntityDescriptor> =
    new Map(entityEntries);

  // 4. Convert assets into lookup map
  const assetEntries: [string, RuntimeAssetDescriptor][] = scene.assets.map(
    (asset) => [asset.id, convertAsset(asset)] as [string, RuntimeAssetDescriptor],
  );
  const assets: ReadonlyMap<string, RuntimeAssetDescriptor> =
    new Map(assetEntries);

  // 5. Assemble viewport
  const viewport: RuntimeViewport = Object.freeze({
    width: scene.viewport.width,
    height: scene.viewport.height,
  });

  // 6. Assemble and freeze RuntimeScene
  return Object.freeze({
    id: scene.id,
    name: scene.name,
    version: scene.version,
    viewport,
    layers: Object.freeze(layers),
    entities,
    assets,
    loadedAt: new Date().toISOString(),
  });
}
