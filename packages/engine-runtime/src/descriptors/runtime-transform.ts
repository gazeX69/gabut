/**
 * Runtime Transform Descriptor
 * Immutable transform data for runtime entities
 * @module engine-runtime/descriptors
 */

/**
 * Immutable 2D position (world-space pixels)
 */
export interface RuntimePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Immutable 2D scale factor
 */
export interface RuntimeScale {
  readonly x: number;
  readonly y: number;
}

/**
 * Immutable transform: position, rotation, scale
 */
export interface RuntimeTransform {
  readonly position: RuntimePosition;
  readonly rotation: number;
  readonly scale: RuntimeScale;
}
