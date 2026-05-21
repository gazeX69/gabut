import type Phaser from 'phaser'

/**
 * Minimal dynamic depth sorting system.
 * Updates the depth of registered game objects based on their Y coordinate.
 */
export class DepthSorter {
  private sortables: Phaser.GameObjects.GameObject[] = []

  /**
   * Register a game object to have its depth dynamically updated.
   */
  add(obj: Phaser.GameObjects.GameObject): void {
    if (!this.sortables.includes(obj)) {
      this.sortables.push(obj)
      this.updateObject(obj)
    }
  }

  /**
   * Remove an object from dynamic sorting.
   */
  remove(obj: Phaser.GameObjects.GameObject): void {
    this.sortables = this.sortables.filter(o => o !== obj)
  }

  /**
   * Update the depth of all registered objects based on their Y position.
   * Should be called every frame in the scene update loop.
   */
  update(): void {
    for (let i = 0; i < this.sortables.length; i++) {
      const obj = this.sortables[i]
      this.updateObject(obj)
    }
  }

  private updateObject(obj: Phaser.GameObjects.GameObject): void {
    if (obj.active && 'y' in obj && 'setDepth' in obj) {
      // Cast to any to safely read Y and setDepth.
      const yPos = (obj as any).y
      if (typeof yPos === 'number') {
        (obj as any).setDepth(yPos)
      }
    }
  }

  /**
   * Cleanup all references.
   */
  destroy(): void {
    this.sortables = []
  }
}
