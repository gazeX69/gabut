/**
 * Runtime Loader Types
 *
 * Defines contracts for safe project and scene loading.
 * No gameplay logic, only lifecycle data structures.
 */

import type { VGZProject, VGZScene } from '@vgz/shared-types'

/**
 * Result of a loading operation
 * Either success or error, never partial state
 */
export interface LoadResult<T> {
  /**
   * Whether operation succeeded
   */
  success: boolean

  /**
   * Loaded data (only present if success === true)
   */
  data?: T

  /**
   * Error details (only present if success === false)
   */
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * Project loading options
 */
export interface ProjectLoadOptions {
  /**
   * Project data source
   * - 'url': Load from HTTP endpoint
   * - 'json': Use provided JSON object
   */
  source: 'url' | 'json'

  /**
   * For 'url' source: endpoint URL
   */
  url?: string

  /**
   * For 'json' source: project data
   */
  data?: VGZProject

  /**
   * Timeout in milliseconds
   * Default: 5000
   */
  timeout?: number
}

/**
 * Scene loading options
 */
export interface SceneLoadOptions {
  /**
   * Project containing the scene
   */
  project: VGZProject

  /**
   * Scene ID to load
   */
  sceneId: string

  /**
   * Validate scene data (default: true)
   */
  validate?: boolean
}

/**
 * Project loading error codes
 */
export type ProjectLoadErrorCode =
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'SCHEMA_MISMATCH'
  | 'VERSION_INCOMPATIBLE'

/**
 * Scene loading error codes
 */
export type SceneLoadErrorCode =
  | 'SCENE_NOT_FOUND'
  | 'INVALID_SCENE_DATA'
  | 'MAP_VALIDATION_FAILED'

/**
 * Type for successful project load
 */
export type ProjectLoadSuccess = LoadResult<VGZProject> & {
  success: true
  data: VGZProject
}

/**
 * Type for failed project load
 */
export type ProjectLoadFailure = LoadResult<VGZProject> & {
  success: false
  error: {
    code: ProjectLoadErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * Type for successful scene load
 */
export type SceneLoadSuccess = LoadResult<VGZScene> & {
  success: true
  data: VGZScene
}

/**
 * Type for failed scene load
 */
export type SceneLoadFailure = LoadResult<VGZScene> & {
  success: false
  error: {
    code: SceneLoadErrorCode
    message: string
    details?: Record<string, unknown>
  }
}
