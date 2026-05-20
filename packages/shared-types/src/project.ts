/**
 * VGZProject - Root serializable project definition
 *
 * Represents the complete game project.
 * Contains all scenes, settings, and project metadata.
 *
 * This is a serialization contract only.
 * No gameplay logic, no project management systems.
 */

import type { VGZScene } from './scene'

export interface VGZProjectSettings {
  /**
   * Display title of the game/project
   */
  title: string

  /**
   * Optional description
   */
  description?: string

  /**
   * Project author
   */
  author?: string

  /**
   * Game resolution in pixels
   */
  resolution: {
    width: number
    height: number
  }

  /**
   * Default tile size in pixels
   * Used for rendering and collision calculations
   */
  tileSize: number
}

export interface VGZProject {
  /**
   * Unique project identifier
   * Used for asset path resolution and project references
   */
  id: string

  /**
   * Project metadata and settings
   */
  settings: VGZProjectSettings

  /**
   * All scenes in the project
   * Editor and runtime reference scenes by ID
   */
  scenes: VGZScene[]

  /**
   * ID of the starting scene
   * Runtime loads this scene on game start
   */
  startSceneId: string

  /**
   * Project schema version for migration safety
   * Increment when making breaking changes to project format
   */
  version: number

  /**
   * Timestamp of last modification (ISO 8601)
   * Optional, used for version control and UX
   */
  updatedAt?: string

  /**
   * Optional metadata for editor-only features
   * Not consumed by runtime, purely for editor workflow
   */
  editorMeta?: {
    /**
     * ID of currently active scene in editor
     */
    activeSceneId?: string

    /**
     * Editor camera position/zoom state
     */
    cameraState?: {
      x: number
      y: number
      zoom: number
    }
  }
}
