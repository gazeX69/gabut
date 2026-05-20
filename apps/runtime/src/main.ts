import Phaser from 'phaser'
import type { RuntimeBootConfig, RuntimePhase } from '@vgz/runtime-types'
import { RuntimeBoot, isBootReady } from './boot'

/**
 * VGZ Runtime Lifecycle
 *
 * Initialization sequence:
 * 1. Load project from JSON/API
 * 2. Load initial scene from project
 * 3. Initialize Phaser with scene data
 * 4. Ready for gameplay
 *
 * No gameplay logic here, only lifecycle management.
 */

/**
 * Runtime configuration
 * In production, this would come from environment or routing
 */
const bootConfig: RuntimeBootConfig = {
  projectSource: 'json',
  projectData: getDefaultProject(),
  validate: true,
  timeout: 5000,
  onPhaseChange: (phase: RuntimePhase) => {
    console.log(`[Runtime] Boot phase: ${phase}`)
  },
  onError: (error) => {
    if (error) {
      console.error(`[Runtime] Boot error at ${error.phase}: ${error.message}`, error.details)
    }
  }
}

/**
 * Main runtime initialization
 */
async function initializeRuntime(): Promise<void> {
  console.log('[Runtime] Starting boot sequence...')

  // Boot runtime: Load project, load scene, prepare context
  const boot = new RuntimeBoot(bootConfig)
  const bootResult = await boot.boot()

  if (!isBootReady(bootResult)) {
    const error = bootResult.state.error
    throw new Error(
      `Boot failed: ${error?.message || 'Unknown error'} (phase: ${error?.phase})`
    )
  }

  // Get initialized context
  const context = boot.getContext()
  if (!context) {
    throw new Error('Boot succeeded but context unavailable')
  }

  console.log('[Runtime] Boot complete', {
    project: context.project.settings.title,
    scene: context.scene.name,
    resolution: `${context.config.width}x${context.config.height}`,
    tileSize: context.config.tileSize
  })

  // Initialize Phaser with loaded scene data
  initializePhaserWithScene(context)
}

/**
 * Initialize Phaser game with loaded scene
 * Phaser is now consuming data from the runtime lifecycle
 */
function initializePhaserWithScene(context: {
  config: { width: number; height: number; tileSize: number }
}): void {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: context.config.width,
    height: context.config.height,
    parent: 'game',
    backgroundColor: '#1a1a1a',
    render: {
      pixelArt: false,
      antialias: true
    }
  }

  const game = new Phaser.Game(config)

  console.log('[Runtime] Phaser initialized', {
    resolution: `${config.width}x${config.height}`,
    renderer: config.type
  })

  // Phaser is now ready for gameplay systems integration
  // Future: Pass context to scene manager, entity system, etc.
}

/**
 * Get default project for development
 * In production: Load from API/file
 */
function getDefaultProject() {
  return {
    id: 'dev-project',
    settings: {
      title: 'VGZ Runtime Dev',
      resolution: { width: 1024, height: 768 },
      tileSize: 32
    },
    scenes: [
      {
        id: 'scene-1',
        name: 'Starting Scene',
        version: 1,
        map: {
          id: 'map-1',
          name: 'Dev Map',
          width: 20,
          height: 15,
          tilesets: [],
          layers: [],
          entities: [],
          version: 1
        }
      }
    ],
    startSceneId: 'scene-1',
    version: 1
  }
}

/**
 * Start runtime
 */
initializeRuntime().catch((error) => {
  console.error('[Runtime] Fatal error:', error.message)
  console.error(error)
})