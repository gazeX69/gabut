/**
 * Runtime Boot Types
 *
 * Defines contracts for runtime initialization and lifecycle.
 * No gameplay logic, only boot state management.
 */

import type { VGZProject, VGZScene } from '@vgz/shared-types'

/**
 * Runtime boot phases
 *
 * Lifecycle:
 * IDLE → LOADING_PROJECT → PROJECT_READY
 *     → LOADING_SCENE → SCENE_READY
 *     → READY (all systems initialized)
 *     → ERROR (on any failure)
 */
export type RuntimePhase =
  | 'IDLE'           // Initial state, nothing loaded
  | 'LOADING_PROJECT'    // Fetching/validating project
  | 'PROJECT_READY'     // Project loaded and validated
  | 'LOADING_SCENE'     // Loading initial scene
  | 'SCENE_READY'       // Scene loaded and validated
  | 'READY'             // Full boot complete, ready for gameplay
  | 'ERROR'             // Boot failed

/**
 * Runtime boot state
 * Tracks all information needed to understand boot progress
 */
export interface RuntimeBootState {
  /**
   * Current phase
   */
  phase: RuntimePhase

  /**
   * Loaded project (null until PROJECT_READY)
   */
  project: VGZProject | null

  /**
   * Loaded scene (null until SCENE_READY)
   */
  scene: VGZScene | null

  /**
   * Boot start time (ISO string)
   */
  startedAt: string

  /**
   * Boot completion time (ISO string, null if not complete)
   */
  completedAt: string | null

  /**
   * Boot duration in milliseconds
   */
  duration: number

  /**
   * Error information (only if phase === 'ERROR')
   */
  error?: {
    phase: RuntimePhase
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

/**
 * Runtime boot configuration
 * Provided to boot system on initialization
 */
export interface RuntimeBootConfig {
  /**
   * Project source
   * - 'url': Load from HTTP endpoint
   * - 'json': Use provided object
   */
  projectSource: 'url' | 'json'

  /**
   * Project URL or data
   */
  projectData: string | VGZProject

  /**
   * Scene ID to load after project
   * If not specified, uses project.startSceneId
   */
  sceneId?: string

  /**
   * Enable validation on load (default: true)
   */
  validate?: boolean

  /**
   * Load timeout in milliseconds (default: 5000)
   */
  timeout?: number

  /**
   * Callback when boot phase changes
   */
  onPhaseChange?: (phase: RuntimePhase) => void

  /**
   * Callback on boot error
   */
  onError?: (error: RuntimeBootState['error']) => void
}

/**
 * Runtime boot result
 * Final state after boot completes
 */
export interface RuntimeBootResult {
  /**
   * Boot succeeded
   */
  success: boolean

  /**
   * Final boot state
   */
  state: RuntimeBootState

  /**
   * Ready to start gameplay systems
   */
  ready: boolean
}

/**
 * Runtime context
 * Available after successful boot
 * Passed to gameplay systems for scene access
 */
export interface RuntimeContext {
  /**
   * Loaded project
   */
  project: VGZProject

  /**
   * Current scene
   */
  scene: VGZScene

  /**
   * Game configuration from project
   */
  config: {
    width: number
    height: number
    tileSize: number
  }

  /**
   * Current phase
   */
  phase: RuntimePhase
}
