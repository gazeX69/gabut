/**
 * Asset References: Links to external resources (tilesets, sprites, audio, etc)
 * Central registry prevents duplication
 * @module scene-types/reference
 */

/**
 * Asset type enum
 */
export type VGZAssetType = 'tileset' | 'sprite' | 'animation' | 'audio' | 'font' | 'particle';

/**
 * Asset metadata: Type-specific information about an asset
 */
export interface VGZAssetMetadata {
  /** Pixel width */
  width?: number;

  /** Pixel height */
  height?: number;

  /** Number of animation frames */
  frameCount?: number;

  /** Animation duration in milliseconds */
  duration?: number;

  /** Tileset: number of columns */
  columns?: number;

  /** Tileset: number of rows */
  rows?: number;

  /** Extensible: custom metadata */
  [key: string]: any;
}

/**
 * Asset Reference: Tells asset manager what to load
 * Central registry ensures single source of truth
 *
 * @example
 * {
 *   "id": "tileset-grass",
 *   "type": "tileset",
 *   "path": "projects/demo-project/assets/tilesets/grass",
 *   "metadata": {
 *     "width": 32,
 *     "height": 32,
 *     "columns": 16,
 *     "rows": 16
 *   }
 * }
 */
export interface VGZAssetReference {
  /** Unique identifier for this asset in the scene */
  id: string;

  /** Type of asset */
  type: VGZAssetType;

  /** Path to asset file (relative to project root or absolute URL) */
  path: string;

  /** Asset-type-specific metadata */
  metadata?: VGZAssetMetadata;

  /** Schema version */
  version: 1;
}
