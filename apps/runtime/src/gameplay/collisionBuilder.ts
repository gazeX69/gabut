import type Phaser from 'phaser'
import type { VGZMap, VGZMapLayer } from '@vgz/shared-types'

/**
 * Builds Arcade Physics collision bodies from layers with type === 'collision'.
 * Only non-zero tiles get collision enabled (0 = empty = no wall).
 *
 * Returns the number of collision tiles set.
 */
export function buildCollision(
  tilemap: Phaser.Tilemaps.Tilemap,
  mapData: VGZMap
): number {
  const collisionLayers: VGZMapLayer[] = mapData.layers.filter(l => l.type === 'collision')

  if (collisionLayers.length === 0) {
    console.log('[Runtime] No collision layers found in map data.')
    return 0
  }

  let collisionCount = 0

  collisionLayers.forEach(layerDef => {
    const layer = tilemap.getLayer(layerDef.id)
    if (!layer) {
      console.warn(`[Runtime] Collision layer "${layerDef.id}" not found in Phaser tilemap.`)
      return
    }

    const tilemapLayer = layer.tilemapLayer
    if (!tilemapLayer) return

    // Set collision for all non-empty tiles (index > 0)
    tilemapLayer.setCollisionByExclusion([-1])
    
    // Count collision tiles for debug info
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const idx = y * mapData.width + x
        if (layerDef.data[idx] !== 0) {
          collisionCount++
        }
      }
    }

    console.log(`[Runtime] Collision enabled on layer: ${layerDef.name} (${layerDef.id}), tiles: ${collisionCount}`)
  })

  return collisionCount
}

/**
 * Registers Arcade Physics collider between a player sprite and all collision layers.
 */
export function addPlayerCollision(
  scene: Phaser.Scene,
  playerSprite: Phaser.Physics.Arcade.Sprite,
  tilemap: Phaser.Tilemaps.Tilemap,
  mapData: VGZMap
): void {
  const collisionLayers = mapData.layers.filter(l => l.type === 'collision')

  collisionLayers.forEach(layerDef => {
    const layer = tilemap.getLayer(layerDef.id)
    if (!layer || !layer.tilemapLayer) return
    scene.physics.add.collider(playerSprite, layer.tilemapLayer)
  })
}
