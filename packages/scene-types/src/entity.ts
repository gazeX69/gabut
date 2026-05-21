/**
 * Scene Entity: A game object in the scene
 * Minimal data: transform + type + metadata
 * Ready for component system: can add components later
 * @module scene-types/entity
 */

import type { VGZTransform } from './transform';

/**
 * Entity type enum (for editor grouping and gameplay filtering)
 */
export type VGZEntityType = 'actor' | 'prop' | 'trigger' | 'decoration';

/**
 * Component data structure (extensible for future ECS)
 * Each component is a labeled data structure
 */
export interface VGZComponentData {
  [componentName: string]: any;
}

/**
 * Scene Entity: A game object placed in the scene
 *
 * Minimal structure:
 * - Transform (position, rotation, scale)
 * - Type (for editor grouping)
 * - Asset reference (for rendering)
 * - Custom properties (for gameplay)
 *
 * Future extensions:
 * - Components (collider, animator, audio, etc)
 * - Behaviors (triggers, actions)
 * - Prefab references
 *
 * @example
 * {
 *   "id": "entity-tree-1",
 *   "name": "Old Tree",
 *   "type": "decoration",
 *   "transform": {
 *     "position": { "x": 256, "y": 128 },
 *     "rotation": 0,
 *     "scale": { "x": 1.0, "y": 1.0 }
 *   },
 *   "visible": true,
 *   "assetId": "sprite-tree",
 *   "properties": {
 *     "interactive": false
 *   }
 * }
 */
export interface VGZSceneEntity {
  /** Unique identifier within the scene */
  id: string;

  /** Display name (human-readable) */
  name: string;

  /** Entity type (for categorization and gameplay) */
  type: VGZEntityType;

  /** Transform (position, rotation, scale) */
  transform: VGZTransform;

  /** Is entity visible in scene */
  visible: boolean;

  /** Reference to asset for rendering (sprite ID) */
  assetId?: string;

  /** Custom properties (key-value for gameplay logic) */
  properties?: Record<string, any>;

  /** Future: Component data (not yet used) */
  components?: VGZComponentData;

  /** Schema version */
  version: 1;
}
