/**
 * VGZ Scene Schema: Canonical scene format
 * Top-level scene container with all components
 * @module scene-types/scene
 */

import type { VGZSceneLayer } from './layer';
import type { VGZSceneEntity } from './entity';
import type { VGZAssetReference } from './reference';
import type { VGZSceneEditorMeta } from './editorMeta';

/**
 * Viewport configuration (rendering canvas size)
 */
export interface VGZViewport {
  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;
}

/**
 * VGZ Scene Schema: Complete scene definition
 *
 * Top-level structure containing:
 * - Metadata (id, name, version)
 * - Viewport (rendering size)
 * - Layers (ordered z-stack)
 * - Entities (game objects)
 * - Assets (resource registry)
 * - EditorMeta (editor-only state, stripped before runtime)
 *
 * Design principles:
 * - Separates data from behavior
 * - Pure JSON, no circular references
 * - Framework-agnostic (can be used with any engine)
 * - Extensible (version field enables schema migration)
 * - ECS-ready (entities can have components later)
 * - Undo/redo-ready (editorMeta tracks history)
 * - Multiplayer-ready (changes can be synced)
 * - Prefab-ready (entities can reference templates)
 *
 * @example
 * {
 *   "id": "scene-village",
 *   "name": "Village Square",
 *   "viewport": { "width": 1024, "height": 768 },
 *   "version": 1,
 *   "updatedAt": "2026-05-21T10:00:00Z",
 *   "layers": [...],
 *   "entities": {...},
 *   "assets": [...]
 * }
 */
export interface VGZSceneSchema {
  /** Scene unique identifier */
  id: string;

  /** Human-readable scene name */
  name: string;

  /** Rendering viewport dimensions */
  viewport: VGZViewport;

  /** Layers (ordered bottom-to-top for rendering) */
  layers: VGZSceneLayer[];

  /** All entities in scene, indexed by ID */
  entities: Record<string, VGZSceneEntity>;

  /** Asset references (central registry) */
  assets: VGZAssetReference[];

  /** Editor-only metadata (stripped before runtime export) */
  editorMeta?: VGZSceneEditorMeta;

  /** Scripts defined in the scene (for the sandbox foundation) */
  scripts?: {
    id: string;
    name: string;
    source: string;
  }[];

  /** Schema version (for migrations) */
  version: 1;

  /** ISO timestamp of last update */
  updatedAt: string;
}
