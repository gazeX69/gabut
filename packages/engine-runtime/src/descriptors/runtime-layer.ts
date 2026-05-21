/**
 * Runtime Layer Descriptor
 * Immutable layer data for runtime consumption
 * @module engine-runtime/descriptors
 */

import type { VGZLayerType } from '@vgz/scene-types';

/**
 * Immutable tile data for tilemap layers
 */
export interface RuntimeTileData {
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly tiles: ReadonlyArray<number>;
  readonly tilesetIds: ReadonlyArray<string>;
}

/**
 * Runtime-safe layer descriptor.
 * Normalized from VGZSceneLayer with:
 * - entityIds: empty array for non-entity layers
 * - tileData: null for non-tilemap layers
 * - locked field stripped (editor-only concern)
 */
export interface RuntimeLayerDescriptor {
  readonly id: string;
  readonly name: string;
  readonly type: VGZLayerType;
  readonly zIndex: number;
  readonly visible: boolean;
  readonly opacity: number;
  readonly entityIds: ReadonlyArray<string>;
  readonly tileData: RuntimeTileData | null;
}
