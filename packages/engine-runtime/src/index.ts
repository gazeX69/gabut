/**
 * @vgz/engine-runtime
 *
 * Runtime scene loader for VGZ engine.
 * Validates scene JSON, normalizes data, and produces immutable runtime descriptors.
 *
 * Primary API:
 * - loadScene(unknownJSON) → RuntimeLoadResult<RuntimeScene>
 *
 * No rendering, no Phaser, no ECS execution.
 * Pure data transformation, framework-agnostic.
 */

// ─── Core ────────────────────────────────────────────────────────────────────

export type { RuntimeScene, RuntimeViewport } from './runtime-scene.js';

// ─── Loader ──────────────────────────────────────────────────────────────────

export { loadScene } from './loader/index.js';

export {
  buildRuntimeScene,
  convertTransform,
  convertEntity,
  convertLayer,
  convertAsset,
  resolveEntityLayerMap,
} from './loader/index.js';

// ─── Descriptors ─────────────────────────────────────────────────────────────

export type {
  RuntimePosition,
  RuntimeScale,
  RuntimeTransform,
} from './descriptors/index.js';

export type {
  RuntimeEntityDescriptor,
} from './descriptors/index.js';

export type {
  RuntimeTileData,
  RuntimeLayerDescriptor,
} from './descriptors/index.js';

export type {
  RuntimeAssetDescriptor,
} from './descriptors/index.js';

// ─── Registry ────────────────────────────────────────────────────────────────

export {
  TypeRegistry,
  entityTypeRegistry,
  layerTypeRegistry,
} from './registry/index.js';

// ─── Errors ──────────────────────────────────────────────────────────────────

export type {
  RuntimeLoadErrorCode,
  RuntimeLoadError,
  DescriptorBuildErrorCode,
  RegistryResolutionErrorCode,
  RuntimeLoadResult,
} from './errors/index.js';

export {
  DescriptorBuildError,
  RegistryResolutionError,
  createRuntimeLoadError,
  success,
  failure,
} from './errors/index.js';
