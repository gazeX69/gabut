/**
 * @vgz/scene-types
 *
 * Canonical scene schema type definitions for VGZ.
 *
 * Exports:
 * - VGZSceneSchema: Root scene container
 * - VGZSceneLayer: Rendering layers with z-ordering
 * - VGZSceneEntity: Game objects in scene
 * - VGZTransform: Position/rotation/scale
 * - VGZAssetReference: Resource registry
 * - VGZSceneEditorMeta: Editor-only state
 *
 * All types are serializable as JSON.
 * No runtime or gameplay logic - pure data definitions.
 */

// Scene root
export type { VGZSceneSchema, VGZViewport } from './scene';

// Layers
export type {
  VGZSceneLayer,
  VGZSceneLayerTileData,
  VGZLayerType,
} from './layer';

// Entities
export type {
  VGZSceneEntity,
  VGZEntityType,
  VGZComponentData,
} from './entity';

// Transform
export type {
  VGZTransform,
  VGZPosition,
  VGZScale,
} from './transform';

// Assets
export type {
  VGZAssetReference,
  VGZAssetType,
  VGZAssetMetadata,
} from './reference';

// Editor metadata
export type {
  VGZSceneEditorMeta,
  VGZEditorCamera,
  VGZSceneChange,
  VGZSceneHistory,
  VGZSceneCollaborationMeta,
} from './editorMeta';
