/**
 * RuntimeScene
 * Top-level immutable container for a loaded scene
 * @module engine-runtime
 */

import type { RuntimeLayerDescriptor } from './descriptors/runtime-layer.js';
import type { RuntimeEntityDescriptor } from './descriptors/runtime-entity.js';
import type { RuntimeAssetDescriptor } from './descriptors/runtime-asset.js';

/**
 * Immutable runtime viewport
 */
export interface RuntimeViewport {
  readonly width: number;
  readonly height: number;
}

/**
 * RuntimeScene: The fully-loaded, validated, immutable scene.
 *
 * Produced by loadScene(). Contains:
 * - Scene metadata (id, name, version)
 * - Viewport configuration
 * - Layers sorted by zIndex (ascending, bottom-first)
 * - Entities indexed by ID (ReadonlyMap for O(1) lookup)
 * - Assets indexed by ID (ReadonlyMap for O(1) lookup)
 * - Load timestamp
 *
 * All data is frozen and readonly.
 * No editor metadata. No rendering state. No gameplay logic.
 */
export interface RuntimeScene {
  readonly id: string;
  readonly name: string;
  readonly version: 1;
  readonly viewport: RuntimeViewport;
  readonly layers: ReadonlyArray<RuntimeLayerDescriptor>;
  readonly entities: ReadonlyMap<string, RuntimeEntityDescriptor>;
  readonly assets: ReadonlyMap<string, RuntimeAssetDescriptor>;
  readonly loadedAt: string;
}
