/**
 * Scene Layers: Rendering units with z-ordering
 * Can contain entities OR tile data
 * Supports future: shadow layers, light layers, particle layers
 * @module scene-types/layer
 */

/**
 * Layer type enum
 */
export type VGZLayerType = 'tilemap' | 'entity' | 'particle' | 'light' | 'shadow';

/**
 * Tilemap layer data: Tile grid with indices and tileset references
 */
export interface VGZSceneLayerTileData {
  /** Tile grid width (in tiles, not pixels) */
  width: number;

  /** Tile grid height (in tiles, not pixels) */
  height: number;

  /** Size of each tile in pixels (typically 32) */
  tileSize: number;

  /** Flat array of tile indices [0, 1, 2, 0, ...] */
  tiles: number[];

  /** List of tileset IDs used in this layer */
  tilesetIds: string[];

  /** Schema version */
  version: 1;
}

/**
 * Scene Layer: Rendering unit with z-ordering
 *
 * Types:
 * - tilemap: Contains tile grid data
 * - entity: Contains entity references (by ID)
 * - particle: Future particle system layer
 * - light: Future lighting layer
 * - shadow: Future shadow layer
 *
 * @example Tilemap Layer
 * {
 *   "id": "layer-ground",
 *   "name": "Ground",
 *   "type": "tilemap",
 *   "zIndex": 0,
 *   "visible": true,
 *   "locked": false,
 *   "opacity": 1.0,
 *   "tileData": {
 *     "width": 32,
 *     "height": 24,
 *     "tileSize": 32,
 *     "tiles": [1, 1, 1, ...],
 *     "tilesetIds": ["tileset-grass"]
 *   }
 * }
 *
 * @example Entity Layer
 * {
 *   "id": "layer-objects",
 *   "name": "Objects",
 *   "type": "entity",
 *   "zIndex": 1,
 *   "visible": true,
 *   "locked": false,
 *   "opacity": 1.0,
 *   "entityIds": ["entity-tree-1", "entity-fountain"]
 * }
 */
export interface VGZSceneLayer {
  /** Layer unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Layer type */
  type: VGZLayerType;

  /** Z-order for rendering (0 = bottom, higher = front) */
  zIndex: number;

  /** Is layer visible in editor/runtime */
  visible: boolean;

  /** Is layer locked in editor (prevents accidental edits) */
  locked: boolean;

  /** Layer opacity (0.0 = transparent, 1.0 = opaque) */
  opacity: number;

  /** Entity layer: list of entity IDs in this layer */
  entityIds?: string[];

  /** Tilemap layer: tile grid data */
  tileData?: VGZSceneLayerTileData;

  /** Schema version */
  version: 1;
}
