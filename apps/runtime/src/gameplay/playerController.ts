import Phaser from 'phaser'

/** Movement speed in pixels per second */
const PLAYER_SPEED = 160

/**
 * Minimal player controller.
 * Handles keyboard input (WASD + Arrows) and moves a physics body.
 */
export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key }
  private speed: number

  constructor(scene: Phaser.Scene, x: number, y: number, speed?: number) {
    this.speed = speed ?? PLAYER_SPEED

    const key = 'player'
    this.sprite = scene.physics.add.sprite(x, y, key)
    
    // Set custom bounds for the 32x32 sprite to make collisions feel better
    // A 16x16 hitbox centered at bottom is typical for top-down
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.setSize(16, 16)
      body.setOffset(8, 16)
    }
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDepth(100) // Render above map layers

    // Bind keyboard input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys()
      this.wasd = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      }
    }

    console.log(`[Runtime] Player spawned at (${x}, ${y})`)
  }

  /** Call from scene.update(). Applies velocity from keyboard state. */
  update(): void {
    if (!this.cursors) return

    let vx = 0
    let vy = 0

    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.cursors.down.isDown || this.wasd.down.isDown

    if (left) vx = -1
    else if (right) vx = 1

    if (up) vy = -1
    else if (down) vy = 1

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      const diag = Math.SQRT1_2
      vx *= diag
      vy *= diag
    }

    this.sprite.setVelocity(vx * this.speed, vy * this.speed)
  }
}
