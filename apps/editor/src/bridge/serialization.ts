import type { VGZScene } from '@vgz/shared-types'

export function serializeEditableScene(scene: VGZScene): string {
  // Deep clone to strip out any runtime references or functions
  const cleanScene = JSON.parse(JSON.stringify(scene))
  return JSON.stringify(cleanScene, null, 2)
}

export function deserializeEditableScene(json: string): VGZScene | null {
  try {
    const scene = JSON.parse(json)
    if (!scene || typeof scene !== 'object') throw new Error('Invalid JSON structure')
    if (!scene.id || !scene.version) throw new Error('Missing scene schema properties')
    return scene as VGZScene
  } catch (err) {
    console.error('Failed to parse scene JSON:', err)
    return null
  }
}
