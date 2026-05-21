import Phaser from 'phaser'
import type { VGZEntity } from '@vgz/shared-types'

/** How long the interaction popup stays visible (ms) */
const POPUP_DURATION = 2000

/** Tracks a single interactive entity zone */
interface InteractionZone {
  entity: VGZEntity
  zone: Phaser.GameObjects.Zone
  body: Phaser.Physics.Arcade.Body
  /** true while player is inside this zone */
  isOverlapping: boolean
  /** true after trigger fired, reset on leave */
  triggerFired: boolean
}

/** Pending scene transition request */
export interface SceneTransitionRequest {
  targetSceneId: string
  targetSpawnId?: string
}

/**
 * Minimal entity interaction system.
 *
 * - trigger: auto-fires once when player enters zone, resets on leave
 * - object: fires when player overlaps AND presses E or Space
 * - npc: shows nearby label only (no interaction logic yet)
 * - prop: ignored
 *
 * Triggers with meta.targetSceneId will queue a scene transition request.
 */
export class InteractionSystem {
  private scene: Phaser.Scene
  private zones: InteractionZone[] = []
  private interactKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key

  /** Currently overlapping entity (nearest), exposed for HUD */
  nearbyEntity: VGZEntity | null = null
  /** Last interaction event text, exposed for HUD */
  lastInteraction = ''
  /** Pending scene transition request, consumed by GameScene */
  pendingTransition: SceneTransitionRequest | null = null

  private popupText: Phaser.GameObjects.Text
  private popupTimer: Phaser.Time.TimerEvent | null = null

  constructor(
    scene: Phaser.Scene,
    entities: VGZEntity[],
    playerSprite: Phaser.Physics.Arcade.Sprite,
    tileSize: number
  ) {
    this.scene = scene

    // Bind interaction keys
    if (scene.input.keyboard) {
      this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
      this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }

    // Create popup text (camera-fixed, hidden initially)
    this.popupText = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height - 80,
      '',
      {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: { x: 12, y: 8 },
        align: 'center'
      }
    )
    this.popupText.setOrigin(0.5)
    this.popupText.setScrollFactor(0)
    this.popupText.setDepth(999)
    this.popupText.setVisible(false)

    // Build overlap zones for trigger and object entities
    entities.forEach(entity => {
      if (entity.type !== 'trigger' && entity.type !== 'object') return

      const x = entity.position.x * tileSize + tileSize / 2
      const y = entity.position.y * tileSize + tileSize / 2

      const zone = scene.add.zone(x, y, tileSize, tileSize)
      scene.physics.add.existing(zone, true) // static body
      const body = zone.body as Phaser.Physics.Arcade.Body

      const iz: InteractionZone = {
        entity,
        zone,
        body,
        isOverlapping: false,
        triggerFired: false
      }
      this.zones.push(iz)

      // Register overlap with player
      scene.physics.add.overlap(playerSprite, zone, () => {
        this.onOverlap(iz)
      })
    })

    console.log(`[Runtime] InteractionSystem initialized with ${this.zones.length} zones`)
  }

  /** Called by Phaser overlap callback */
  private onOverlap(iz: InteractionZone): void {
    iz.isOverlapping = true
  }

  /** Call from scene.update() every frame */
  update(): void {
    // Determine nearest overlapping entity
    let nearest: InteractionZone | null = null

    for (const iz of this.zones) {
      if (iz.isOverlapping) {
        nearest = iz

        // --- Trigger: auto-fire once per enter ---
        if (iz.entity.type === 'trigger' && !iz.triggerFired) {
          iz.triggerFired = true
          this.fireInteraction(iz.entity)
        }

        // --- Object: require key press ---
        if (iz.entity.type === 'object') {
          if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
              Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.fireInteraction(iz.entity)
          }
        }
      } else {
        // Player left the zone — reset trigger
        iz.triggerFired = false
      }

      // Reset overlap flag; it will be re-set next frame if still overlapping
      iz.isOverlapping = false
    }

    this.nearbyEntity = nearest ? nearest.entity : null
  }

  /** Fire an interaction event */
  private fireInteraction(entity: VGZEntity): void {
    const meta = entity.meta

    // Check for scene transition trigger
    if (meta && typeof meta.targetSceneId === 'string') {
      this.pendingTransition = {
        targetSceneId: meta.targetSceneId as string,
        targetSpawnId: typeof meta.targetSpawnId === 'string'
          ? meta.targetSpawnId as string
          : undefined
      }
      this.lastInteraction = `[Transition] → ${meta.targetSceneId}`
      console.log(`[Runtime] Scene transition requested: ${meta.targetSceneId}`)
      this.showPopup(`Loading: ${meta.targetSceneId}...`)
      return
    }

    const label = entity.type === 'trigger'
      ? `[Trigger] ${entity.name}`
      : `[Interact] ${entity.name}`

    this.lastInteraction = label
    console.log(`[Runtime] Interaction: ${label} (${entity.id})`)

    // Show popup
    this.showPopup(label)
  }

  /** Display a timed popup at the bottom of the screen */
  private showPopup(text: string): void {
    this.popupText.setText(text)
    this.popupText.setVisible(true)

    // Clear previous timer
    if (this.popupTimer) {
      this.popupTimer.destroy()
    }

    this.popupTimer = this.scene.time.delayedCall(POPUP_DURATION, () => {
      this.popupText.setVisible(false)
    })
  }

  /** Destroy all zones and popup. Called during scene cleanup. */
  destroy(): void {
    this.zones.forEach(iz => {
      iz.zone.destroy()
    })
    this.zones = []
    if (this.popupTimer) {
      this.popupTimer.destroy()
      this.popupTimer = null
    }
    this.popupText.destroy()
  }
}
