import type { VGZMapTileset } from '@vgz/shared-types'

/**
 * Gets the Phaser texture cache key for a tileset
 */
export function getTilesetTextureKey(tileset: VGZMapTileset): string {
  return `tileset:${tileset.id}`
}
