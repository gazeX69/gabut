/**
 * VGZScene - Serializable scene definition
 *
 * Represents a playable scene that the runtime can load and execute.
 * A scene typically contains one or more maps and scene-level metadata.
 *
 * This is a serialization contract only.
 * No gameplay logic, no scene management systems.
 */

import type { VGZMap } from './map'

export interface VGZScene {
  /**
   * Unique identifier within the project
   * Used for scene transitions and references
   */
  id: string

  /**
   * Display name shown in editor
   */
  name: string

  /**
   * The map data for this scene
   * Currently 1:1 with scene, may expand for multi-map scenes
   */
  map: VGZMap

  /**
   * Optional metadata for scene transitions and behavior
   * Used by runtime systems (not stored here - reference only)
   */
  metadata?: {
    /**
     * Camera type for this scene
     * "fixed" = camera fixed to position
     * "follow" = camera follows player
     */
    cameraMode?: 'fixed' | 'follow'

    /**
     * Optional fixed camera position (tile coordinates)
     */
    cameraPosition?: {
      x: number
      y: number
    }
  }

  /**
   * Schema version for migration safety
   */
  version: number
}
