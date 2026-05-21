/**
 * Phaser Adapter Errors
 * @module apps/runtime/phaser-adapter
 */

import type { MountedScene } from './types.js';

export type AdapterErrorCode =
  | 'ENTITY_SKIPPED'
  | 'TEXTURE_MISSING'
  | 'LAYER_FAILED'
  | 'MOUNT_FAILED'
  | 'UNMOUNT_FAILED';

/**
 * Structured error during the adapter mount process.
 * Not thrown - collected and returned alongside partial results.
 */
export interface AdapterError {
  readonly code: AdapterErrorCode;
  readonly message: string;
  readonly entityId?: string;
  readonly layerId?: string;
}

/**
 * Result of a mount operation.
 * Contains the MountedScene handle and any collected errors.
 */
export interface MountResult {
  readonly mounted: MountedScene;
  readonly errors: ReadonlyArray<AdapterError>;
}
