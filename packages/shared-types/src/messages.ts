import type { VGZMap } from './map'
import type { VGZScene } from './scene'

/**
 * Messages from Editor to Runtime
 * Readonly phase: only query and selection sync
 */
export type EditorMessage =
  // Legacy tile editing (deprecated in favor of inspector)
  | { type: 'SELECT_TILE'; payload: { tileIndex: number } }
  | { type: 'SET_ACTIVE_LAYER'; payload: { layerId: string } }
  | { type: 'ENABLE_EDIT_MODE' }
  | { type: 'DISABLE_EDIT_MODE' }
  | { type: 'REQUEST_MAP_STATE' }
  
  // Readonly phase: queries and selection
  | { type: 'REQUEST_SCENE'; payload: { sceneId: string } }
  | { type: 'SELECT_ENTITY'; payload: { entityId: string } }
  | { type: 'DESELECT_ENTITY' }
  | { type: 'REQUEST_SCENE_DATA' }
  
  // Transform editing phase
  | { type: 'EDITOR_UPDATE_ENTITY_TRANSFORM'; payload: { entityId: string; transform: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number }> } }
  | { type: 'EDITOR_UPDATE_ENTITY_VISIBLE'; payload: { entityId: string; visible: boolean } }
  
  // Tile painting phase
  | { type: 'EDITOR_PAINT_TILE'; payload: { layerId: string; tileX: number; tileY: number; tileIndex: number } }
  
  // Minimal Animation
  | { type: 'EDITOR_PLAY_ANIMATION'; payload: { entityId: string; animationId: string; playing: boolean } }
  
  // Asset Management
  | { type: 'EDITOR_ASSIGN_ASSET'; payload: { entityId: string; assetId: string } }
  
  // Entity Lifecycle
  | { type: 'EDITOR_CREATE_ENTITY'; payload: { prefabId: string; x: number; y: number } }
  | { type: 'EDITOR_DUPLICATE_ENTITY'; payload: { entityId: string } }
  | { type: 'EDITOR_DELETE_ENTITY'; payload: { entityId: string } }
  
  // Scripting and Reload
  | { type: 'EDITOR_RELOAD_RUNTIME'; payload: { scene: VGZScene } }
  | { type: 'EDITOR_SAVE_SCRIPT'; payload: { scriptId: string; source: string } }
  | { type: 'EDITOR_ASSIGN_SCRIPT'; payload: { entityId: string; scriptId: string | null } }

/**
 * Messages from Runtime to Editor
 * Send scene data, entity data, selection updates
 */
export type RuntimeMessage =
  // Legacy tile updates (deprecated)
  | { type: 'TILE_UPDATED'; payload: { layerId: string; x: number; y: number; tileIndex: number } }
  | { type: 'MAP_STATE'; payload: { map: VGZMap } }
  | { type: 'CURSOR_TILE'; payload: { x: number; y: number } }
  | { type: 'ACTIVE_SCENE'; payload: { sceneId: string } }
  
  // Readonly phase: scene data and selection updates
  | { type: 'SCENE_LOADED'; payload: { scene: VGZScene } }
  | { type: 'ENTITY_SELECTED'; payload: { entityId: string } }
  | { type: 'ENTITY_DESELECTED' }
  | { type: 'SCENE_DATA'; payload: { scene: VGZScene } }
  
  // Transform editing phase
  | { type: 'ENTITY_UPDATE_RESULT'; payload: { success: boolean; entityId?: string; error?: string; transform?: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }; visible?: boolean } }
  
  // Viewport selection
  | { type: 'RUNTIME_ENTITY_SELECTED'; payload: { entityId: string | null; source: 'viewport' } }
  
  // Tile painting phase
  | { type: 'RUNTIME_TILE_UPDATED'; payload: { layerId: string; tileX: number; tileY: number; tileIndex: number } }
  | { type: 'RUNTIME_ENTITY_TRANSFORM_CHANGED'; payload: { entityId: string; transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }; source: 'viewport-drag' } }
  
  // Minimal Animation
  | { type: 'RUNTIME_ANIMATION_CHANGED'; payload: { entityId: string; animationId: string; playing: boolean } }

  // Asset Management
  | { type: 'RUNTIME_ASSET_UPDATED'; payload: { entityId: string; assetId: string } }

  // Entity Lifecycle
  | { type: 'RUNTIME_ENTITY_CREATED'; payload: { entity: any } }
  | { type: 'RUNTIME_ENTITY_DELETED'; payload: { entityId: string } }
  
  // Scripting and Logs
  | { type: 'RUNTIME_SCRIPT_LOG'; payload: { level: 'info'|'warn'|'error'; message: string; timestamp: string } }
  | { type: 'RUNTIME_SCRIPT_ERROR'; payload: { entityId: string; scriptId: string; error: string; stack?: string } }
  | { type: 'RUNTIME_SCRIPT_SAVED'; payload: { scriptId: string } }
  | { type: 'RUNTIME_RUNTIME_RELOADED' }
