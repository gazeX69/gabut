/**
 * @vgz/shared-types
 *
 * Shared type definitions and serialization contracts for VGZ.
 *
 * These types define the data structures for:
 * - Editor project creation and editing
 * - Runtime project loading and execution
 * - Save/load serialization
 * - Editor/Runtime communication
 *
 * IMPORTANT: These are serialization contracts only.
 * They do NOT contain:
 * - Gameplay logic
 * - Behavior systems
 * - Event systems
 * - Save systems
 * - ECS components
 *
 * For runtime gameplay systems, see @vgz/engine-core
 */

export type { VGZEntity } from './entity'
export type { VGZMap, VGZMapLayer, VGZMapTileset } from './map'
export type { VGZScene } from './scene'
export type { VGZProject, VGZProjectSettings } from './project'
export * from './messages'
