/**
 * Transform: Position, rotation, and scale for entities
 * Pure data structure, serializable as JSON
 * @module scene-types/transform
 */

/**
 * 2D Position (world space coordinates in pixels)
 */
export interface VGZPosition {
  /** X coordinate (pixels) */
  x: number;

  /** Y coordinate (pixels) */
  y: number;
}

/**
 * 2D Scale factor (1.0 = normal size)
 */
export interface VGZScale {
  /** X scale (1.0 = normal width) */
  x: number;

  /** Y scale (1.0 = normal height) */
  y: number;
}

/**
 * 3D Transform (position, rotation, scale)
 * Separates from entity to allow reuse in other contexts
 */
export interface VGZTransform {
  /** Position in world space */
  position: VGZPosition;

  /** Rotation in degrees (0-360) */
  rotation: number;

  /** Scale factor */
  scale: VGZScale;
}
