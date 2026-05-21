import type { VGZMap } from './map'

export type EditorMessage =
  | { type: 'SELECT_TILE'; payload: { tileIndex: number } }
  | { type: 'SET_ACTIVE_LAYER'; payload: { layerId: string } }
  | { type: 'ENABLE_EDIT_MODE' }
  | { type: 'DISABLE_EDIT_MODE' }
  | { type: 'REQUEST_MAP_STATE' }

export type RuntimeMessage =
  | { type: 'TILE_UPDATED'; payload: { layerId: string; x: number; y: number; tileIndex: number } }
  | { type: 'MAP_STATE'; payload: { map: VGZMap } }
  | { type: 'CURSOR_TILE'; payload: { x: number; y: number } }
  | { type: 'ACTIVE_SCENE'; payload: { sceneId: string } }
