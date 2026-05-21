import type Phaser from 'phaser'
import type { VGZMapTileset } from '@vgz/shared-types'
import { getTilesetTextureKey } from './assetKeys'

/**
 * Generates a fallback tileset texture dynamically using HTML5 Canvas.
 * Creates distinctive colored blocks for different tile IDs so the developer
 * can visually verify that the map is loading and rendering correctly.
 */
export function createFallbackTilesetTexture(
  scene: Phaser.Scene,
  tileset: VGZMapTileset
): void {
  const key = getTilesetTextureKey(tileset)

  const tileWidth = tileset.tileWidth || 32
  const tileHeight = tileset.tileHeight || 32
  const columns = tileset.columns || 16
  const rows = 16 // Generate 16 rows of fallback tiles (256 tiles total)
  
  const width = columns * tileWidth
  const height = rows * tileHeight

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fill background with a grid pattern
  ctx.fillStyle = '#2c2c2c'
  ctx.fillRect(0, 0, width, height)

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const tileIndex = r * columns + c
      const x = c * tileWidth
      const y = r * tileHeight

      // Draw grid line borders
      ctx.strokeStyle = '#444444'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, tileWidth, tileHeight)

      // Choose different colors representing terrain/types in the demo
      if (tileIndex === 0) {
        // Tile 0 is typically empty (invisible/sky border)
        ctx.fillStyle = '#1e1e1e'
        ctx.fillRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2)
      } else {
        // Deterministic color
        if (tileIndex === 1) {
          ctx.fillStyle = '#4caf50' // Green grass
        } else if (tileIndex === 2) {
          ctx.fillStyle = '#2196f3' // Blue water
        } else {
          const hue = (tileIndex * 37) % 360
          ctx.fillStyle = `hsl(${hue}, 60%, 45%)`
        }
        ctx.fillRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2)

        // Draw index text for verification
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 9px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tileIndex.toString(), x + tileWidth / 2, y + tileHeight / 2)
      }
    }
  }

  // Remove standard missing cache reference if Phaser marked it
  if (scene.textures.exists(key)) {
    scene.textures.remove(key)
  }

  scene.textures.addCanvas(key, canvas)
  console.log(`[Runtime] Created dynamic fallback canvas texture for tileset key: ${key}`)
}
