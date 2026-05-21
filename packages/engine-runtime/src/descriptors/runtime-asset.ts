/**
 * Runtime Asset Descriptor
 * Immutable asset reference for runtime consumption
 * @module engine-runtime/descriptors
 */

import type { VGZAssetType } from '@vgz/scene-types';

/**
 * Runtime-safe asset descriptor.
 * Normalized from VGZAssetReference with:
 * - metadata: empty object instead of undefined
 */
export interface RuntimeAssetDescriptor {
  readonly id: string;
  readonly type: VGZAssetType;
  readonly path: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
