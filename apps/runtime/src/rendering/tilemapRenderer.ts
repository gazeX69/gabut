import type Phaser from 'phaser'
import type { VGZMap } from '@vgz/shared-types'
import { getTilesetTextureKey } from './assetKeys'

/**
 * Compiles and renders tile map layers in Phaser
 */
export function renderTilemap(
  scene: Phaser.Scene,
  mapData: VGZMap,
  tileSize: number
): Phaser.Tilemaps.Tilemap {
  const { width, height, layers, tilesets } = mapData
  const size = tileSize || 32

  // Create an empty Phaser Tilemap
  const tilemap = scene.make.tilemap({
    tileWidth: size,
    tileHeight: size,
    width: width,
    height: height
  })

  // Add tilesets to map structure
  const phaserTilesets: Phaser.Tilemaps.Tileset[] = []
  tilesets.forEach(ts => {
    const textureKey = getTilesetTextureKey(ts)
    const tileset = tilemap.addTilesetImage(
      ts.name,
      textureKey,
      ts.tileWidth || size,
      ts.tileHeight || size,
      0,
      0
    )
    if (tileset) {
      phaserTilesets.push(tileset)
    }
  })

  // Sort and draw layers by zOrder
  const sortedLayers = [...layers].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0))

  sortedLayers.forEach(layer => {
    if (layer.visible === false) return

    // Translate flat 1D data array to grid matching Phaser's format
    const grid2D: number[][] = []
    for (let y = 0; y < height; y++) {
      const row: number[] = []
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const val = layer.data[index]
        // 0 maps to empty (-1). 1 maps to tileset index 0 (Grass), 2 to index 1 (Dirt), etc.
        row.push(val === 0 ? -1 : val - 1)
      }
      grid2D.push(row)
    }

    const tilemapLayer = tilemap.createLayer(
      layer.id,
      phaserTilesets,
      0,
      0
    )

    if (tilemapLayer) {
      // Put grid data
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          tilemapLayer.putTileAt(grid2D[y][x], x, y)
        }
      }

      if (layer.opacity !== undefined) {
        tilemapLayer.setAlpha(layer.opacity)
      }

      // Foreground layers render above dynamic entities
      if (layer.type === 'foreground') {
        tilemapLayer.setDepth(9000 + (layer.zOrder || 0))
      } else {
        // Terrain/decoration renders below dynamic entities
        tilemapLayer.setDepth(-1000 + (layer.zOrder || 0))
      }

      console.log(`[Runtime] Rendered tilemap layer: ${layer.name} (${layer.id})`)
    }
  })

  return tilemap
}
