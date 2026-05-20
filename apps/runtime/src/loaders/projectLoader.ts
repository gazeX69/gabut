/**
 * Project Loader
 *
 * Safe project loading with validation.
 * No execution, only data loading and basic validation.
 */

import type { VGZProject } from '@vgz/shared-types'
import type { ProjectLoadOptions, LoadResult } from '@vgz/runtime-types'

export type ProjectLoadErrorCode = 
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'SCHEMA_MISMATCH'
  | 'VERSION_INCOMPATIBLE'

/**
 * Load a VGZProject from URL or JSON
 *
 * Handles:
 * - URL fetching with timeout
 * - JSON parsing
 * - Basic schema validation
 * - Error reporting
 *
 * Does NOT:
 * - Execute any code
 * - Modify project
 * - Load scenes (handled by SceneLoader)
 */
export async function loadProject(
  options: ProjectLoadOptions
): Promise<LoadResult<VGZProject>> {
  try {
    let projectData: VGZProject

    // Load data based on source
    if (options.source === 'url') {
      if (!options.url) {
        return createError('INVALID_URL', 'URL required for source=url')
      }
      projectData = await loadProjectFromUrl(options.url, options.timeout)
    } else {
      if (!options.data) {
        return createError('INVALID_JSON', 'Data required for source=json')
      }
      projectData = options.data
    }

    // Validate basic schema
    const validation = validateProjectSchema(projectData)
    if (!validation.valid) {
      return createError(
        validation.errorCode || 'SCHEMA_MISMATCH',
        validation.message || 'Project validation failed',
        validation.details
      )
    }

    // Validate version compatibility
    if (projectData.version !== 1) {
      return createError(
        'VERSION_INCOMPATIBLE',
        `Project version ${projectData.version} not supported (expected 1)`,
        { version: projectData.version }
      )
    }

    return {
      success: true,
      data: projectData
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return createError('INVALID_JSON', `Failed to load project: ${message}`)
  }
}

/**
 * Load project from HTTP URL with timeout
 */
async function loadProjectFromUrl(url: string, timeoutMs = 5000): Promise<VGZProject> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Validate project schema
 * Checks required fields and basic structure
 */
function validateProjectSchema(data: unknown): {
  valid: boolean
  message?: string
  errorCode?: ProjectLoadErrorCode
  details?: Record<string, unknown>
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      message: 'Project data must be an object',
      errorCode: 'SCHEMA_MISMATCH'
    }
  }

  const project = data as Record<string, unknown>

  // Check required fields
  if (typeof project.id !== 'string') {
    return {
      valid: false,
      message: 'Project.id must be a string',
      errorCode: 'SCHEMA_MISMATCH',
      details: { field: 'id', received: typeof project.id }
    }
  }

  if (typeof project.startSceneId !== 'string') {
    return {
      valid: false,
      message: 'Project.startSceneId must be a string',
      errorCode: 'SCHEMA_MISMATCH',
      details: { field: 'startSceneId', received: typeof project.startSceneId }
    }
  }

  if (!Array.isArray(project.scenes)) {
    return {
      valid: false,
      message: 'Project.scenes must be an array',
      errorCode: 'SCHEMA_MISMATCH',
      details: { field: 'scenes', received: typeof project.scenes }
    }
  }

  if (!project.settings || typeof project.settings !== 'object') {
    return {
      valid: false,
      message: 'Project.settings must be an object',
      errorCode: 'SCHEMA_MISMATCH',
      details: { field: 'settings', received: typeof project.settings }
    }
  }

  const settings = project.settings as Record<string, unknown>
  if (typeof settings.title !== 'string') {
    return {
      valid: false,
      message: 'Project.settings.title must be a string',
      errorCode: 'SCHEMA_MISMATCH'
    }
  }

  // Check version field exists
  if (typeof project.version !== 'number') {
    return {
      valid: false,
      message: 'Project.version must be a number',
      errorCode: 'SCHEMA_MISMATCH',
      details: { field: 'version', received: typeof project.version }
    }
  }

  return { valid: true }
}

/**
 * Helper to create error result
 */
function createError(
  code: ProjectLoadErrorCode,
  message: string,
  details?: Record<string, unknown>
): LoadResult<VGZProject> {
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
 * Useful for type narrowing
 */
export function isProjectLoadSuccess(
  result: LoadResult<VGZProject>
): result is LoadResult<VGZProject> & { success: true; data: VGZProject } {
  return result.success === true && result.data !== undefined
}

/**
 * Check if result is failure
 */
export function isProjectLoadFailure(
  result: LoadResult<VGZProject>
): result is LoadResult<VGZProject> & { success: false; error: NonNullable<LoadResult<VGZProject>['error']> } {
  return result.success === false && result.error !== undefined
}
