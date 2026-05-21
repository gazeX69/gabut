import type { VGZMap } from '@vgz/shared-types'

/**
 * Resolves the pixel spawn position for the player.
 *
 * Priority:
 * 1. Named spawn point from map.entities (type trigger with meta.spawnId matching targetSpawnId)
 * 2. map.spawn field (tile coordinates → pixel center)
 * 3. Center of map (fallback)
 */
export function resolveSpawnPosition(
  map: VGZMap,
  tileSize: number,
  targetSpawnId?: string
): { x: number; y: number } {

  // 1. Try named spawn from entity meta
  if (targetSpawnId) {
    const spawnEntity = map.entities.find(
      e => e.meta?.spawnId === targetSpawnId
    )
    if (spawnEntity) {
      console.log(`[Runtime] Spawn resolved from entity spawnId: ${targetSpawnId}`)
      return {
        x: spawnEntity.position.x * tileSize + tileSize / 2,
        y: spawnEntity.position.y * tileSize + tileSize / 2
      }
    }
    console.warn(`[Runtime] Named spawn "${targetSpawnId}" not found. Falling back.`)
  }

  // 2. map.spawn field
  if (map.spawn) {
    return {
      x: map.spawn.x * tileSize + tileSize / 2,
      y: map.spawn.y * tileSize + tileSize / 2
    }
  }

  // 3. Fallback: center of map
  console.warn('[Runtime] No spawn point defined. Using map center as fallback.')
  return {
    x: (map.width * tileSize) / 2,
    y: (map.height * tileSize) / 2
  }
}
