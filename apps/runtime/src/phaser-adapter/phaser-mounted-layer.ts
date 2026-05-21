/**
 * Phaser Mounted Layer
 * Mutable runtime lifecycle wrapper above immutable RuntimeLayerDescriptor.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeLayerDescriptor } from '@vgz/engine-runtime';

export type MountedLayerKind = 'entity' | 'tilemap';

/**
 * Mutable state of a mounted layer in the runtime.
 * Keeps the underlying RuntimeLayerDescriptor immutable.
 */
export interface RuntimeMountedLayer {
  readonly layerId: string;
  readonly descriptor: RuntimeLayerDescriptor;
  readonly kind: MountedLayerKind;
  readonly entityIds: Set<string>;
  group?: Phaser.GameObjects.Group;
  tilemap?: Phaser.Tilemaps.Tilemap;
  tilemapLayer?: Phaser.Tilemaps.TilemapLayer;
  visible: boolean;
  alpha: number;
}

export function syncMountedLayerVisibility(layer: RuntimeMountedLayer): void {
  if (layer.tilemapLayer) {
    layer.tilemapLayer.setVisible(layer.visible);
    layer.tilemapLayer.setAlpha(layer.alpha);
  }
  if (layer.group) {
    layer.group.setVisible(layer.visible);
    layer.group.setAlpha(layer.alpha);
  }
}
