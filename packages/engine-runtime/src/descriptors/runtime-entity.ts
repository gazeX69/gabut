/**
 * Runtime Entity Descriptor
 * Immutable entity data for runtime consumption
 * @module engine-runtime/descriptors
 */

import type { VGZEntityType } from '@vgz/scene-types';
import type { RuntimeTransform } from './runtime-transform.js';

/**
 * Runtime-safe entity descriptor.
 * Normalized from VGZSceneEntity with:
 * - assetId: null instead of undefined
 * - properties: empty object instead of undefined
 * - layerId: back-reference to owning layer
 * - No components, no editor state
 */
export interface RuntimeEntityDescriptor {
  readonly id: string;
  readonly name: string;
  readonly type: VGZEntityType;
  readonly scriptId?: string | null;
  readonly transform: RuntimeTransform;
  readonly visible: boolean;
  readonly assetId: string | null;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly layerId: string;
}
