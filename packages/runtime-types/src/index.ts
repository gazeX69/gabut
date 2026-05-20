/**
 * @vgz/runtime-types
 *
 * Runtime lifecycle type definitions for VGZ.
 *
 * Defines contracts for:
 * - Project loading
 * - Scene loading
 * - Boot orchestration
 * - Runtime context
 *
 * These are lifecycle contracts only.
 * They do NOT contain:
 * - Gameplay logic
 * - Behavior systems
 * - Event systems
 * - ECS components
 * - Rendering logic
 *
 * For gameplay systems, see @vgz/engine-core
 */

export type {
  LoadResult,
  ProjectLoadOptions,
  SceneLoadOptions,
  ProjectLoadErrorCode,
  SceneLoadErrorCode,
  ProjectLoadSuccess,
  ProjectLoadFailure,
  SceneLoadSuccess,
  SceneLoadFailure
} from './loader'

export type {
  RuntimePhase,
  RuntimeBootState,
  RuntimeBootConfig,
  RuntimeBootResult,
  RuntimeContext
} from './boot'
