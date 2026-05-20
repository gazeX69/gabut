/**
 * Scene Loader
 *
 * Safe scene loading from project with validation.
 * No execution or rendering, only data validation.
 */

import type { VGZProject, VGZScene } from '@vgz/shared-types'
import type { SceneLoadOptions, LoadResult } from '@vgz/runtime-types'

export type SceneLoadErrorCode =
  | 'SCENE_NOT_FOUND'
  | 'INVALID_SCENE_DATA'
  | 'MAP_VALIDATION_FAILED'

/**
 * Load a VGZScene from a project
 *
 * Handles:
 * - Scene lookup by ID
 * - Basic scene validation
 * - Map data validation
 * - Error reporting
 *
 * Does NOT:
 * - Execute any code
 * - Modify scene
 * - Create Phaser scenes
 * - Load assets
 */
export function loadScene(options: SceneLoadOptions): LoadResult<VGZScene> {
  try {
    const { project, sceneId, validate = true } = options

    // Find scene in project
    const scene = project.scenes.find((s: VGZScene) => s.id === sceneId)
    if (!scene) {
      return createError(
        'SCENE_NOT_FOUND',
        `Scene not found: ${sceneId}`,
        {
          sceneId,
          availableScenes: project.scenes.map((s: VGZScene) => s.id)
        }
      )
    }

    // Validate if requested
    if (validate) {
      const validation = validateScene(scene)
      if (!validation.valid) {
        return createError(
          validation.errorCode || 'INVALID_SCENE_DATA',
          validation.message || 'Scene validation failed',
          validation.details
        )
      }
    }

    return {
      success: true,
      data: scene
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return createError('INVALID_SCENE_DATA', `Failed to load scene: ${message}`)
  }
}

/**
 * Validate scene structure and data
 */
function validateScene(scene: VGZScene): {
  valid: boolean
  message?: string
  errorCode?: SceneLoadErrorCode
  details?: Record<string, unknown>
} {
  // Check required fields
  if (typeof scene.id !== 'string') {
    return {
      valid: false,
      message: 'Scene.id must be a string',
      errorCode: 'INVALID_SCENE_DATA'
    }
  }

  if (typeof scene.name !== 'string') {
    return {
      valid: false,
      message: 'Scene.name must be a string',
      errorCode: 'INVALID_SCENE_DATA'
    }
  }

  if (typeof scene.version !== 'number') {
    return {
      valid: false,
      message: 'Scene.version must be a number',
      errorCode: 'INVALID_SCENE_DATA'
    }
  }

  // Validate map
  if (!scene.map || typeof scene.map !== 'object') {
    return {
      valid: false,
      message: 'Scene.map must be an object',
      errorCode: 'INVALID_SCENE_DATA'
    }
  }

  const mapValidation = validateMap(scene.map)
  if (!mapValidation.valid) {
    return {
      valid: false,
      message: mapValidation.message,
      errorCode: 'MAP_VALIDATION_FAILED',
      details: mapValidation.details
    }
  }

  return { valid: true }
}

/**
 * Validate map structure
 */
function validateMap(map: unknown): {
  valid: boolean
  message?: string
  details?: Record<string, unknown>
} {
  if (!map || typeof map !== 'object') {
    return {
      valid: false,
      message: 'Map must be an object'
    }
  }

  const mapData = map as Record<string, unknown>

  // Check required fields
  if (typeof mapData.id !== 'string') {
    return {
      valid: false,
      message: 'Map.id must be a string'
    }
  }

  if (typeof mapData.name !== 'string') {
    return {
      valid: false,
      message: 'Map.name must be a string'
    }
  }

  if (typeof mapData.width !== 'number' || mapData.width <= 0) {
    return {
      valid: false,
      message: 'Map.width must be a positive number'
    }
  }

  if (typeof mapData.height !== 'number' || mapData.height <= 0) {
    return {
      valid: false,
      message: 'Map.height must be a positive number'
    }
  }

  if (!Array.isArray(mapData.layers)) {
    return {
      valid: false,
      message: 'Map.layers must be an array'
    }
  }

  if (!Array.isArray(mapData.entities)) {
    return {
      valid: false,
      message: 'Map.entities must be an array'
    }
  }

  if (!Array.isArray(mapData.tilesets)) {
    return {
      valid: false,
      message: 'Map.tilesets must be an array'
    }
  }

  // Validate layer data
  const layerValidation = validateMapLayers(mapData.layers as unknown[])
  if (!layerValidation.valid) {
    return {
      valid: false,
      message: layerValidation.message,
      details: layerValidation.details
    }
  }

  return { valid: true }
}

/**
 * Validate map layers
 */
function validateMapLayers(layers: unknown[]): {
  valid: boolean
  message?: string
  details?: Record<string, unknown>
} {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    if (!layer || typeof layer !== 'object') {
      return {
        valid: false,
        message: `Layer ${i} must be an object`,
        details: { layerIndex: i }
      }
    }

    const layerData = layer as Record<string, unknown>

    if (typeof layerData.id !== 'string') {
      return {
        valid: false,
        message: `Layer ${i} id must be a string`,
        details: { layerIndex: i }
      }
    }

    if (!Array.isArray(layerData.data)) {
      return {
        valid: false,
        message: `Layer ${i} data must be an array`,
        details: { layerIndex: i }
      }
    }
  }

  return { valid: true }
}

/**
 * Helper to create error result
 */
function createError(
  code: SceneLoadErrorCode,
  message: string,
  details?: Record<string, unknown>
): LoadResult<VGZScene> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  }
}

/**
 * Check if result is success
 */
export function isSceneLoadSuccess(
  result: LoadResult<VGZScene>
): result is LoadResult<VGZScene> & { success: true; data: VGZScene } {
  return result.success === true && result.data !== undefined
}

/**
 * Check if result is failure
 */
export function isSceneLoadFailure(
  result: LoadResult<VGZScene>
): result is LoadResult<VGZScene> & { success: false; error: NonNullable<LoadResult<VGZScene>['error']> } {
  return result.success === false && result.error !== undefined
}
