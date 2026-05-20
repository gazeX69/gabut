/**
 * VGZMap - Serializable map/level definition
 *
 * Represents a single playable area or level.
 * Contains tilemap data and entity placement.
 *
 * This is a serialization contract only.
 * No gameplay logic, no scene systems, no rendering logic.
 */

import type { VGZEntity } from './entity'

export interface VGZMapTileset {
  /**
   * Unique identifier for this tileset
   */
  id: string

  /**
   * Display name
   */
  name: string

  /**
   * Asset path/reference
   * Format: projects/{projectId}/assets/tilesets/{tilesetId}
   */
  assetPath: string

  /**
   * Tile dimensions in pixels
   */
  tileWidth: number
  tileHeight: number

  /**
   * Number of columns in the tileset image
   */
  columns: number
}

export interface VGZMapLayer {
  /**
   * Unique identifier for this layer
   */
  id: string

  /**
   * Display name (e.g., "Ground", "Objects", "Decorations")
   */
  name: string

  /**
   * Layer type determines rendering and interaction behavior
   */
  type: 'terrain' | 'collision' | 'decoration'

  /**
   * Tile data as 1D array
   * Maps to 2D with: tile = data[y * width + x]
   * Value is index into tileset (0 = empty)
   */
  data: number[]

  /**
   * Optional visibility toggle
   */
  visible?: boolean

  /**
   * Optional opacity (0-1)
   */
  opacity?: number

  /**
   * Z-ordering for rendering
   */
  zOrder: number
}

export interface VGZMap {
  /**
   * Unique identifier within the project
   * Used for references and saves
   */
  id: string

  /**
   * Display name
   */
  name: string

  /**
   * Map dimensions in tiles
   */
  width: number
  height: number

  /**
   * Tilesets used by this map
   */
  tilesets: VGZMapTileset[]

  /**
   * Tilemap layers
   */
  layers: VGZMapLayer[]

  /**
   * Entities (NPCs, objects, triggers) placed on this map
   */
  entities: VGZEntity[]

  /**
   * Optional spawn point for player
   */
  spawn?: {
    x: number
    y: number
  }

  /**
   * Optional background color (hex format)
   */
  backgroundColor?: string

  /**
   * Schema version for migration safety
   */
  version: number
}
