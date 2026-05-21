/**
 * Runtime Boot
 *
 * Orchestrates the runtime initialization lifecycle.
 * Minimal state machine: Load Project → Load Scene → Ready
 */

import type { VGZProject, VGZScene } from '@vgz/shared-types'
import type {
  RuntimeBootState,
  RuntimeBootConfig,
  RuntimeBootResult,
  RuntimeContext,
  RuntimePhase
} from '@vgz/runtime-types'
import { loadProject } from './loaders/projectLoader'
import { loadScene } from './loaders/sceneLoader'

/**
 * Runtime boot orchestrator
 * Manages the initialization state machine
 */
export class RuntimeBoot {
  private state: RuntimeBootState
  private config: RuntimeBootConfig

  /**
   * Initialize boot orchestrator
   */
  constructor(config: RuntimeBootConfig) {
    this.config = config
    this.state = {
      phase: 'IDLE',
      project: null,
      scene: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: 0
    }
  }

  /**
   * Get current boot state
   */
  getState(): RuntimeBootState {
    return { ...this.state }
  }

  /**
   * Run the boot sequence
   * Loads project, then scene, then reports ready
   */
  async boot(): Promise<RuntimeBootResult> {
    try {
      // Phase 1: Load project
      this.setPhase('LOADING_PROJECT')
      const projectResult = await loadProject({
        source: this.config.projectSource,
        data: typeof this.config.projectData === 'object' 
          ? this.config.projectData 
          : undefined,
        url: typeof this.config.projectData === 'string' 
          ? this.config.projectData 
          : undefined,
        timeout: this.config.timeout
      })

      if (!projectResult.success || !projectResult.data) {
        return this.bootError(
          'LOADING_PROJECT',
          projectResult.error?.code || 'UNKNOWN',
          projectResult.error?.message || 'Failed to load project'
        )
      }

      const project = projectResult.data
      this.state.project = project
      this.setPhase('PROJECT_READY')

      // Phase 2: Load initial scene
      this.setPhase('LOADING_SCENE')
      const sceneId = this.config.sceneId || project.startSceneId
      const sceneResult = loadScene({
        project,
        sceneId,
        validate: this.config.validate !== false
      })

      if (!sceneResult.success || !sceneResult.data) {
        return this.bootError(
          'LOADING_SCENE',
          sceneResult.error?.code || 'UNKNOWN',
          sceneResult.error?.message || 'Failed to load scene'
        )
      }

      const scene = sceneResult.data
      this.state.scene = scene
      this.setPhase('SCENE_READY')

      // Phase 3: Boot complete
      this.setPhase('READY')

      return {
        success: true,
        state: { ...this.state },
        ready: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return this.bootError(this.state.phase, 'RUNTIME_ERROR', message)
    }
  }

  /**
   * Get runtime context after successful boot
   */
  getContext(): RuntimeContext | null {
    if (this.state.phase !== 'READY' || !this.state.project || !this.state.scene) {
      return null
    }

    return {
      project: this.state.project,
      scene: this.state.scene,
      config: {
        width: this.state.project.settings.resolution.width,
        height: this.state.project.settings.resolution.height,
        tileSize: this.state.project.settings.tileSize
      },
      phase: this.state.phase
    }
  }

  /**
   * Switch to a different scene within the already-loaded project.
   * Preserves RuntimeBoot authority over scene loading and validation.
   * Returns the updated RuntimeContext on success, or null on failure.
   */
  switchScene(sceneId: string): RuntimeContext | null {
    if (!this.state.project) {
      console.error('[RuntimeBoot] Cannot switch scene: no project loaded')
      return null
    }

    const sceneResult = loadScene({
      project: this.state.project,
      sceneId,
      validate: this.config.validate !== false
    })

    if (!sceneResult.success || !sceneResult.data) {
      const err = sceneResult.error
      console.error(`[RuntimeBoot] Scene switch failed: ${err?.message || 'Unknown'}`)
      this.config.onError?.({
        phase: 'LOADING_SCENE',
        code: err?.code || 'UNKNOWN',
        message: err?.message || 'Failed to switch scene'
      })
      return null
    }

    this.state.scene = sceneResult.data
    console.log(`[RuntimeBoot] Scene switched to: ${sceneResult.data.name} (${sceneId})`)

    return this.getContext()
  }

  /**
   * Set boot phase and call callback
   */
  private setPhase(phase: RuntimePhase): void {
    this.state.phase = phase
    this.config.onPhaseChange?.(phase)
  }

  /**
   * Handle boot error
   */
  private bootError(
    phase: RuntimePhase,
    code: string,
    message: string
  ): RuntimeBootResult {
    this.state.phase = 'ERROR'
    this.state.error = {
      phase,
      code,
      message
    }
    this.state.completedAt = new Date().toISOString()
    this.updateDuration()

    this.config.onError?.(this.state.error)

    return {
      success: false,
      state: { ...this.state },
      ready: false
    }
  }

  /**
   * Update boot duration
   */
  private updateDuration(): void {
    const now = new Date()
    const start = new Date(this.state.startedAt)
    this.state.duration = now.getTime() - start.getTime()
  }
}

/**
 * Helper to run boot and return context
 * Throws error if boot fails
 */
export async function bootRuntime(config: RuntimeBootConfig): Promise<RuntimeContext> {
  const boot = new RuntimeBoot(config)
  const result = await boot.boot()

  if (!result.success) {
    const error = result.state.error
    throw new Error(
      `Boot failed at phase ${error?.phase}: ${error?.message || 'Unknown error'}`
    )
  }

  const context = boot.getContext()
  if (!context) {
    throw new Error('Boot succeeded but context unavailable')
  }

  return context
}

/**
 * Check if boot result is ready
 */
export function isBootReady(result: RuntimeBootResult): boolean {
  return result.success && result.ready
}
