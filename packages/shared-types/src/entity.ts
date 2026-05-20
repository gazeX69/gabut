/**
 * VGZEntity - Base serializable entity type
 *
 * Represents any game object that can be placed on a map:
 * - NPCs
 * - Interactive objects
 * - Triggers
 * - Props
 *
 * This is a serialization contract only.
 * No gameplay logic, no behavior systems, no ECS components.
 */

export interface VGZEntity {
  /**
   * Unique identifier within the scene
   * Must be stable across saves/loads
   */
  id: string

  /**
   * Display name for editor and debugging
   */
  name: string

  /**
   * Entity type classifier
   * Used to determine how editor/runtime should handle this entity
   */
  type: 'npc' | 'object' | 'trigger' | 'prop'

  /**
   * Position on the tilemap (tile coordinates)
   */
  position: {
    x: number
    y: number
  }

  /**
   * Optional z-ordering for rendering
   * Lower values render first
   */
  zOrder?: number

  /**
   * Optional rotation in degrees (0-360)
   * Default: 0
   */
  rotation?: number

  /**
   * Optional scale factor (1.0 = normal)
   * Default: 1.0
   */
  scale?: {
    x: number
    y: number
  }

  /**
   * Optional visibility
   * Default: true
   */
  visible?: boolean

  /**
   * Metadata for editor visualization
   * Not persisted to runtime
   */
  editorMeta?: {
    locked?: boolean
    hidden?: boolean
    color?: string
  }
}
