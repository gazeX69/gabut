import Phaser from 'phaser'
import type { RuntimeBootConfig, RuntimePhase, RuntimeContext } from '@vgz/runtime-types'
import { RuntimeBoot, isBootReady } from './boot'
import { getTilesetTextureKey } from './rendering/assetKeys'
import { createFallbackTilesetTexture } from './rendering/fallbackRenderer'
import { renderTilemap } from './rendering/tilemapRenderer'
import { PlayerController } from './gameplay/playerController'
import { buildCollision, addPlayerCollision } from './gameplay/collisionBuilder'
import { resolveSpawnPosition } from './gameplay/spawnResolver'
import { InteractionSystem } from './gameplay/interactionSystem'
import { DepthSorter } from './rendering/depthSorter'
import type { EditorMessage } from '@vgz/shared-types'
import { AdapterDemoScene } from './scenes/adapter-demo-scene'

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
  projectSource: 'url',
  projectData: '/projects/demo-project/project.json',
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
  // --- Phase 4 Adapter Demo ---
  if (typeof window !== 'undefined' && window.location.search.includes('demo=adapter')) {
    console.log('[Runtime] Starting Phase 4 Adapter Demo...');
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game',
      backgroundColor: '#1a1a1a',
      scene: [AdapterDemoScene]
    };
    new Phaser.Game(config);
    return;
  }

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
  initializePhaserWithScene(context, boot)
}

/**
 * Initialize Phaser game with loaded scene
 * Phaser is now consuming data from the runtime lifecycle
 */
function initializePhaserWithScene(context: RuntimeContext, boot: RuntimeBoot): void {

  class GameScene extends Phaser.Scene {
    private runtimeContext!: RuntimeContext
    private runtimeBoot!: RuntimeBoot
    private player!: PlayerController
    private interaction!: InteractionSystem
    private depthSorter!: DepthSorter
    private debugText!: Phaser.GameObjects.Text
    private loadingText!: Phaser.GameObjects.Text
    private collisionCount = 0
    private isTransitioning = false

    // --- Editor Bridge State ---
    private isEditMode = false
    private selectedTileIndex = 1
    private activeLayerId = 'layer-terrain'
    private bridgeListener!: (e: MessageEvent) => void

    // Track objects for cleanup
    private sceneObjects: Phaser.GameObjects.GameObject[] = []
    private currentTilemap: Phaser.Tilemaps.Tilemap | null = null

    constructor() {
      super('GameScene')
    }

    init() {
      this.runtimeContext = context
      this.runtimeBoot = boot
    }

    preload() {
      this.preloadTilesets()
      // Preload player sprite
      if (!this.textures.exists('player')) {
        this.load.image('player', '/projects/demo-project/assets/sprites/player.png')
      }
    }

    create() {
      // --- Loading overlay (camera-fixed, hidden initially) ---
      this.loadingText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        'Loading scene...',
        {
          fontSize: '24px',
          fontFamily: 'monospace',
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: { x: 24, y: 16 }
        }
      )
      this.loadingText.setOrigin(0.5)
      this.loadingText.setScrollFactor(0)
      this.loadingText.setDepth(2000)
      this.loadingText.setVisible(false)

      // --- Debug HUD (fixed to camera) ---
      this.debugText = this.add.text(16, 16, '', {
        color: '#ffffff',
        fontSize: '12px',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: { x: 8, y: 4 }
      })
      this.debugText.setScrollFactor(0)
      this.debugText.setDepth(1000)

      // Build the initial scene
      this.buildScene()

      console.log('[Runtime] GameScene created. Player active.')
    }

    update() {
      if (this.isTransitioning) return

      if (this.player) {
        this.player.update()
      }
      
      if (this.depthSorter) {
        this.depthSorter.update()
      }

      if (this.interaction) {
        this.interaction.update()

        // Check for pending scene transition
        const pending = this.interaction.pendingTransition
        if (pending) {
          this.interaction.pendingTransition = null
          this.performTransition(pending.targetSceneId, pending.targetSpawnId)
        }
      }

      // Update live debug overlay
      if (this.debugText && this.player) {
        const px = Math.round(this.player.sprite.x)
        const py = Math.round(this.player.sprite.y)
        const fps = Math.round(this.game.loop.actualFps)
        const nearby = this.interaction?.nearbyEntity
        const nearbyLabel = nearby ? `${nearby.name} (${nearby.type})` : 'none'
        const lastEvt = this.interaction?.lastInteraction || 'none'
        this.debugText.setText(
          `VGZ Runtime | ${this.runtimeContext.project.settings.title}\n` +
          `Scene: ${this.runtimeContext.scene.name}\n` +
          `Player: (${px}, ${py})\n` +
          `Collision tiles: ${this.collisionCount} | FPS: ${fps}\n` +
          `Nearby: ${nearbyLabel}\n` +
          `Last event: ${lastEvt}`
        )
      }
    }

    /** Preload tileset images for current scene */
    private preloadTilesets(): void {
      const map = this.runtimeContext.scene.map
      map.tilesets.forEach(ts => {
        const textureKey = getTilesetTextureKey(ts)
        if (!this.textures.exists(textureKey)) {
          const imagePath = `/${ts.assetPath}.png`
          console.log(`[Runtime] Preloading tileset image: ${imagePath} with key ${textureKey}`)
          this.load.image(textureKey, imagePath)
        }
      })
    }

    /** Build all scene content from current runtimeContext */
    private buildScene(targetSpawnId?: string): void {
      const map = this.runtimeContext.scene.map
      const tSize = this.runtimeContext.config.tileSize

      // --- Asset fallbacks ---
      map.tilesets.forEach(ts => {
        const key = getTilesetTextureKey(ts)
        const isMissing = !this.textures.exists(key) ||
                          this.textures.get(key).key === '__MISSING' ||
                          this.textures.get(key).source.length === 0 ||
                          this.textures.get(key).source[0].width === 0

        if (isMissing) {
          console.warn(`[Runtime] Tileset asset not found at ${ts.assetPath}.png. Generating procedural grid fallback.`)
          createFallbackTilesetTexture(this, ts)
        }
      })

      // --- Render tilemap layers ---
      const tilemap = renderTilemap(this, map, tSize)
      this.currentTilemap = tilemap

      // --- Collision setup ---
      this.collisionCount = buildCollision(tilemap, map)

      // --- Depth Sorter Setup ---
      this.depthSorter = new DepthSorter()

      // --- Entity placeholders ---
      map.entities.forEach(entity => {
        if (entity.visible === false) return
        const x = entity.position.x * tSize + tSize / 2
        const y = entity.position.y * tSize + tSize / 2

        const container = this.add.container(x, y)
        this.sceneObjects.push(container)

        const graphics = this.add.graphics()
        
        if (entity.type === 'npc') {
          graphics.fillStyle(0xe53935, 1)
          graphics.fillCircle(0, 0, tSize / 3)
        } else if (entity.type === 'object') {
          graphics.fillStyle(0xffb300, 1)
          graphics.fillRect(-tSize / 4, -tSize / 4, tSize / 2, tSize / 2)
        } else if (entity.type === 'trigger') {
          graphics.lineStyle(2, 0x00e676, 0.8)
          graphics.strokeRect(-tSize / 2, -tSize / 2, tSize, tSize)
        } else {
          graphics.fillStyle(0x90a4ae, 1)
          graphics.fillRect(-tSize / 4, -tSize / 4, tSize / 2, tSize / 2)
        }

        const label = this.add.text(0, -tSize / 2 - 4, entity.name, {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5)

        container.add([graphics, label])

        // Add container to dynamic depth sorting
        // Skip triggers since they usually shouldn't occlude things and are mostly invisible anyway
        if (entity.type !== 'trigger') {
          this.depthSorter.add(container)
        }
      })

      // --- Background color ---
      if (map.backgroundColor) {
        this.cameras.main.setBackgroundColor(map.backgroundColor)
      }

      // --- Player spawn & controller ---
      const spawnPos = resolveSpawnPosition(map, tSize, targetSpawnId)
      this.player = new PlayerController(this, spawnPos.x, spawnPos.y)
      
      // Register player for depth sorting
      this.depthSorter.add(this.player.sprite)

      // --- Player ↔ collision ---
      addPlayerCollision(this, this.player.sprite, tilemap, map)

      // --- Editor Bridge Setup ---
      this.setupEditorBridge()

      // --- Entity interaction zones ---
      this.interaction = new InteractionSystem(this, map.entities, this.player.sprite, tSize)

      // --- Camera follow ---
      const worldWidth = map.width * tSize
      const worldHeight = map.height * tSize
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    }

    /** Cleanup all scene-specific objects before rebuilding */
    private cleanupScene(): void {
      console.log('[Runtime] Cleaning up scene objects...')

      // Destroy interaction system
      if (this.interaction) {
        this.interaction.destroy()
      }

      // Cleanup depth sorter
      if (this.depthSorter) {
        this.depthSorter.destroy()
      }

      // Cleanup bridge
      if (this.bridgeListener) {
        window.removeEventListener('message', this.bridgeListener)
      }

      // Destroy player sprite
      if (this.player) {
        this.player.sprite.destroy()
      }

      // Destroy tracked scene objects (entity graphics + labels)
      this.sceneObjects.forEach(obj => obj.destroy())
      this.sceneObjects = []

      // Destroy tilemap layers
      if (this.currentTilemap) {
        this.currentTilemap.destroy()
        this.currentTilemap = null
      }

      // Clear physics world (removes all colliders and bodies)
      this.physics.world.colliders.destroy()
      this.physics.world.bodies.clear()
      this.physics.world.staticBodies.clear()

      this.collisionCount = 0
    }

    private setupEditorBridge(): void {
      this.bridgeListener = (e: MessageEvent) => {
        const msg = e.data as EditorMessage
        if (!msg || !msg.type) return

        if (msg.type === 'ENABLE_EDIT_MODE') {
          this.isEditMode = true
        } else if (msg.type === 'DISABLE_EDIT_MODE') {
          this.isEditMode = false
        } else if (msg.type === 'SELECT_TILE') {
          this.selectedTileIndex = msg.payload.tileIndex
        } else if (msg.type === 'SET_ACTIVE_LAYER') {
          this.activeLayerId = msg.payload.layerId
        } else if (msg.type === 'REQUEST_MAP_STATE') {
          window.parent.postMessage({
            type: 'MAP_STATE',
            payload: { map: this.runtimeContext.scene.map }
          }, '*')
        }
      }
      window.addEventListener('message', this.bridgeListener)

      this.input.off('pointerdown')
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!this.isEditMode || !this.currentTilemap) return

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        const tileX = this.currentTilemap.worldToTileX(worldPoint.x)
        const tileY = this.currentTilemap.worldToTileY(worldPoint.y)

        // Ignore out of bounds
        if (tileX === null || tileY === null) return
        if (tileX < 0 || tileY < 0 || tileX >= this.currentTilemap.width || tileY >= this.currentTilemap.height) return

        const phaserLayer = this.currentTilemap.getLayer(this.activeLayerId)
        if (phaserLayer && phaserLayer.tilemapLayer) {
          const phaserTileIndex = this.selectedTileIndex === 0 ? -1 : this.selectedTileIndex - 1
          phaserLayer.tilemapLayer.putTileAt(phaserTileIndex, tileX, tileY)
          
          // Mutate source data
          const map = this.runtimeContext.scene.map
          const vgzLayer = map.layers.find(l => l.id === this.activeLayerId)
          if (vgzLayer) {
            vgzLayer.data[tileY * map.width + tileX] = this.selectedTileIndex
          }

          window.parent.postMessage({
            type: 'TILE_UPDATED',
            payload: { layerId: this.activeLayerId, x: tileX, y: tileY, tileIndex: this.selectedTileIndex }
          }, '*')
        }
      })
    }

    /** Perform a scene transition through RuntimeBoot */
    private performTransition(targetSceneId: string, targetSpawnId?: string): void {
      if (this.isTransitioning) return
      this.isTransitioning = true

      // Show loading overlay
      this.loadingText.setVisible(true)

      // Delay slightly so the loading text renders before the sync work
      this.time.delayedCall(50, () => {
        // Ask RuntimeBoot to load the new scene
        const newContext = this.runtimeBoot.switchScene(targetSceneId)

        if (!newContext) {
          console.error(`[Runtime] Failed to transition to scene: ${targetSceneId}`)
          this.loadingText.setText(`Error: Scene "${targetSceneId}" not found`)
          this.time.delayedCall(2000, () => {
            this.loadingText.setVisible(false)
            this.isTransitioning = false
          })
          return
        }

        // Cleanup old scene
        this.cleanupScene()

        // Update context
        this.runtimeContext = newContext

        // Check if new tilesets need loading
        const map = this.runtimeContext.scene.map
        let needsLoad = false
        map.tilesets.forEach(ts => {
          const key = getTilesetTextureKey(ts)
          if (!this.textures.exists(key)) {
            const imagePath = `/${ts.assetPath}.png`
            this.load.image(key, imagePath)
            needsLoad = true
          }
        })

        const finishTransition = () => {
          // Build new scene
          this.buildScene(targetSpawnId)

          // Hide loading overlay
          this.loadingText.setVisible(false)
          this.isTransitioning = false

          console.log(`[Runtime] Transition complete → ${this.runtimeContext.scene.name}`)
        }

        if (needsLoad) {
          this.load.once('complete', finishTransition)
          this.load.start()
        } else {
          finishTransition()
        }
      })
    }
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: context.config.width,
    height: context.config.height,
    parent: 'game',
    backgroundColor: '#1a1a1a',

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },

    scene: [GameScene],

    render: {
      pixelArt: true,
      antialias: false
    }
  }
  const game = new Phaser.Game(config)

  console.log('[Runtime] Phaser initialized with loaded scene', {
    resolution: `${config.width}x${config.height}`,
    renderer: config.type
  })
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