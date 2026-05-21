import { useEffect, useRef, useState, useCallback } from 'react'
import type { EditorMessage, RuntimeMessage, VGZScene, VGZMap } from '@vgz/shared-types'

export interface LogEntry {
  id: string
  type: 'info' | 'warn' | 'error'
  message: string
  time: string
}

export interface EditorBridgeState {
  scene: VGZScene | null
  selectedEntityId: string | null
  isLoading: boolean
  error: string | null
  isDirty: boolean
  logs: LogEntry[]
}

/**
 * Runtime Bridge Hook
 * 
 * Manages communication between Editor (React) and Runtime (Phaser iframe)
 * 
 * Responsibilities:
 * - Load scene data from runtime
 * - Send selection updates
 * - Receive entity selection from runtime
 * - Query scene hierarchy
 * 
 * Safety:
 * - No direct Phaser manipulation
 * - No RuntimeScene mutation
 * - Selection state editor-only
 */
export function useRuntimeBridge(iframeUrl: string) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<EditorBridgeState>({
    scene: null,
    selectedEntityId: null,
    isLoading: false,
    error: null,
    isDirty: false,
    logs: [
      { id: 'boot1', type: 'info', message: '[Editor] Runtime bridge initialized', time: new Date().toLocaleTimeString() }
    ]
  })

  // Legacy map state for backward compatibility
  const [mapState, setMapState] = useState<VGZMap | null>(null)

  const sendMessage = useCallback((msg: EditorMessage) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*')
    }
  }, [])

  // Load scene data from runtime
  const requestSceneData = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }))
    sendMessage({ type: 'REQUEST_SCENE_DATA' })
  }, [sendMessage])

  // Select entity in both editor and runtime
  const selectEntity = useCallback((entityId: string) => {
    setState(prev => ({ ...prev, selectedEntityId: entityId }))
    sendMessage({ type: 'SELECT_ENTITY', payload: { entityId } })
  }, [sendMessage])

  // Deselect entity
  const deselectEntity = useCallback(() => {
    setState(prev => ({ ...prev, selectedEntityId: null }))
    sendMessage({ type: 'DESELECT_ENTITY' })
  }, [sendMessage])

  const updateEntityTransform = useCallback((entityId: string, transform: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number }>) => {
    sendMessage({ type: 'EDITOR_UPDATE_ENTITY_TRANSFORM', payload: { entityId, transform } })
  }, [sendMessage])

  const updateEntityVisible = useCallback((entityId: string, visible: boolean) => {
    sendMessage({ type: 'EDITOR_UPDATE_ENTITY_VISIBLE', payload: { entityId, visible } })
  }, [sendMessage])

  const saveScript = useCallback((scriptId: string, source: string) => {
    setState(prev => {
      if (!prev.scene) return prev;
      const scene = { ...prev.scene };
      const scripts = scene.scripts ? [...scene.scripts] : [];
      const idx = scripts.findIndex(s => s.id === scriptId);
      if (idx !== -1) {
        scripts[idx] = { ...scripts[idx], source };
      } else {
        scripts.push({ id: scriptId, name: scriptId, source });
      }
      scene.scripts = scripts;
      return { ...prev, scene, isDirty: true };
    });
    sendMessage({ type: 'EDITOR_SAVE_SCRIPT', payload: { scriptId, source } });
  }, [sendMessage]);

  const assignScript = useCallback((entityId: string, scriptId: string | null) => {
    setState(prev => {
      if (!prev.scene || !prev.scene.entities) return prev;
      const scene = { ...prev.scene };
      const e = scene.entities[entityId];
      if (e) {
        scene.entities = { ...scene.entities, [entityId]: { ...e, scriptId } };
      }
      return { ...prev, scene, isDirty: true };
    });
    sendMessage({ type: 'EDITOR_ASSIGN_SCRIPT', payload: { entityId, scriptId } });
  }, [sendMessage]);

  const reloadRuntime = useCallback(() => {
    if (state.scene) {
      sendMessage({ type: 'EDITOR_RELOAD_RUNTIME', payload: { scene: state.scene } });
    }
  }, [state.scene, sendMessage]);

  const markClean = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: false }));
  }, []);


  // Handle messages from runtime
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const msg = e.data as RuntimeMessage
        if (!msg?.type) return

        if (msg.type === 'SCENE_DATA' && msg.payload) {
          setState(prev => ({
            ...prev,
            scene: msg.payload.scene,
            isLoading: false,
            error: null
          }))
        } else if (msg.type === 'SCENE_LOADED' && msg.payload) {
          setState(prev => ({
            ...prev,
            scene: msg.payload.scene,
            isLoading: false,
            error: null
          }))
        } else if (msg.type === 'ENTITY_SELECTED' && msg.payload) {
          setState(prev => ({
            ...prev,
            selectedEntityId: msg.payload.entityId
          }))
        } else if (msg.type === 'ENTITY_DESELECTED') {
          setState(prev => ({
            ...prev,
            selectedEntityId: null
          }))
        } else if (msg.type === 'RUNTIME_SCRIPT_LOG' && msg.payload) {
          setState(prev => ({
            ...prev,
            logs: [...prev.logs, { id: Math.random().toString(), type: msg.payload.level, message: msg.payload.message, time: msg.payload.timestamp }].slice(-100)
          }))
        } else if (msg.type === 'RUNTIME_SCRIPT_ERROR' && msg.payload) {
          const { entityId, scriptId, error, stack } = msg.payload;
          const msgStr = `[SCRIPT ERROR][${entityId}][${scriptId}]\n${error}${stack ? '\n' + stack : ''}`;
          setState(prev => ({
            ...prev,
            logs: [...prev.logs, { id: Math.random().toString(), type: 'error', message: msgStr, time: new Date().toLocaleTimeString() }].slice(-100)
          }))
        } else if (msg.type === 'RUNTIME_RUNTIME_RELOADED') {
          setState(prev => ({
            ...prev,
            logs: [...prev.logs, { id: Math.random().toString(), type: 'info', message: '[Bridge] Runtime fully reloaded from scene state', time: new Date().toLocaleTimeString() }].slice(-100)
          }))
        } else if (msg.type === 'RUNTIME_ENTITY_SELECTED' && msg.payload) {
          setState(prev => ({
            ...prev,
            selectedEntityId: msg.payload.entityId
          }))
        } else if (msg.type === 'RUNTIME_ENTITY_TRANSFORM_CHANGED' && msg.payload) {
          setState(prev => {
            if (!prev.scene || !prev.scene.entities) return prev;
            const scene = { ...prev.scene };
            const e = scene.entities[msg.payload.entityId];
            if (e) {
              const newE = { ...e };
              const t = msg.payload.transform;
              if (t.x !== undefined || t.y !== undefined) {
                newE.position = { x: t.x ?? e.position?.x ?? 0, y: t.y ?? e.position?.y ?? 0 };
                if (newE.transform) {
                   newE.transform = { ...newE.transform, position: { ...newE.position } };
                }
              }
              if (t.rotation !== undefined) {
                newE.rotation = t.rotation;
                if (newE.transform) newE.transform.rotation = t.rotation;
              }
              if (t.scaleX !== undefined || t.scaleY !== undefined) {
                newE.scale = { x: t.scaleX ?? e.scale?.x ?? 1, y: t.scaleY ?? e.scale?.y ?? 1 };
                if (newE.transform) newE.transform.scale = { ...newE.scale };
              }
              scene.entities = { ...scene.entities, [e.id]: newE };
            }
            return { ...prev, scene };
          });
        } else if (msg.type === 'ENTITY_UPDATE_RESULT' && msg.payload) {
          if (msg.payload.success && msg.payload.entityId) {
            setState(prev => {
              if (!prev.scene || !prev.scene.entities) return prev;
              const scene = { ...prev.scene };
              const e = scene.entities[msg.payload.entityId!];
              if (e) {
                const newE = { ...e };
                if (msg.payload.transform) {
                  const t = msg.payload.transform;
                  if (t.x !== undefined || t.y !== undefined) {
                    newE.position = { x: t.x ?? e.position?.x ?? 0, y: t.y ?? e.position?.y ?? 0 };
                    if (newE.transform) {
                       newE.transform = { ...newE.transform, position: { ...newE.position } };
                    }
                  }
                  if (t.rotation !== undefined) {
                    newE.rotation = t.rotation;
                    if (newE.transform) newE.transform.rotation = t.rotation;
                  }
                  if (t.scaleX !== undefined || t.scaleY !== undefined) {
                    newE.scale = { x: t.scaleX ?? e.scale?.x ?? 1, y: t.scaleY ?? e.scale?.y ?? 1 };
                    if (newE.transform) newE.transform.scale = { ...newE.scale };
                  }
                }
                if (msg.payload.visible !== undefined) {
                  newE.visible = msg.payload.visible;
                }
                scene.entities = { ...scene.entities, [e.id]: newE };
              }
              return { ...prev, scene, error: null };
            });
          } else if (!msg.payload.success && msg.payload.error) {
            setState(prev => ({ ...prev, error: msg.payload.error! }));
          }
        } else if (msg.type === 'RUNTIME_TILE_UPDATED' && msg.payload) {
          setState(prev => {
            if (!prev.scene) return prev;
            const { layerId, tileX, tileY, tileIndex } = msg.payload;
            const scene = { ...prev.scene };
            if (scene.layers) {
              scene.layers = scene.layers.map(layer => {
                if (layer.id === layerId && layer.type === 'tilemap' && layer.tileData) {
                  const newLayer = { ...layer };
                  newLayer.tileData = { ...newLayer.tileData };
                  newLayer.tileData.tiles = [...newLayer.tileData.tiles];
                  const idx = tileY * newLayer.tileData.width + tileX;
                  if (idx >= 0 && idx < newLayer.tileData.tiles.length) {
                    newLayer.tileData.tiles[idx] = tileIndex;
                  }
                  return newLayer;
                }
                return layer;
              });
            }
            return { ...prev, scene };
          });
        } else if (msg.type === 'RUNTIME_ANIMATION_CHANGED' && msg.payload) {
          setState(prev => {
            if (!prev.scene || !prev.scene.entities) return prev;
            const { entityId, animationId, playing } = msg.payload;
            const scene = { ...prev.scene };
            const e = scene.entities[entityId];
            if (e) {
              const newE = { ...e };
              newE.runtimeData = { ...newE.runtimeData, currentAnimationId: animationId, animationPlaying: playing };
              scene.entities = { ...scene.entities, [e.id]: newE };
            }
            return { ...prev, scene };
          });
        } else if (msg.type === 'RUNTIME_ASSET_UPDATED' && msg.payload) {
          setState(prev => {
            if (!prev.scene || !prev.scene.entities) return prev;
            const { entityId, assetId } = msg.payload;
            const scene = { ...prev.scene };
            const e = scene.entities[entityId];
            if (e) {
              const newE = { ...e, assetId };
              scene.entities = { ...scene.entities, [e.id]: newE };
            }
            return { ...prev, scene };
          });
        } else if (msg.type === 'RUNTIME_ENTITY_CREATED' && msg.payload) {
          setState(prev => {
            if (!prev.scene || !prev.scene.entities) return prev;
            const { entity } = msg.payload;
            const scene = { ...prev.scene };
            scene.entities = { ...scene.entities, [entity.id]: entity };
            
            if (scene.layers) {
              scene.layers = scene.layers.map(layer => {
                if (layer.type === 'entity') {
                  const newLayer = { ...layer };
                  newLayer.entityIds = [...newLayer.entityIds, entity.id];
                  return newLayer;
                }
                return layer;
              });
            }
            
            return { ...prev, scene, selectedEntityId: entity.id };
          });
        } else if (msg.type === 'RUNTIME_ENTITY_DELETED' && msg.payload) {
          setState(prev => {
            if (!prev.scene || !prev.scene.entities) return prev;
            const { entityId } = msg.payload;
            const scene = { ...prev.scene };
            const newEntities = { ...scene.entities };
            delete newEntities[entityId];
            scene.entities = newEntities;
            
            if (scene.layers) {
              scene.layers = scene.layers.map(layer => {
                if (layer.type === 'entity') {
                  const newLayer = { ...layer };
                  newLayer.entityIds = newLayer.entityIds.filter(id => id !== entityId);
                  return newLayer;
                }
                return layer;
              });
            }
            
            return { 
              ...prev, 
              scene, 
              selectedEntityId: prev.selectedEntityId === entityId ? null : prev.selectedEntityId 
            };
          });
        } else if (msg.type === 'MAP_STATE' && msg.payload) {
          // Legacy map state support
          setMapState(msg.payload.map)
        }
      } catch (err) {
        console.warn('[RuntimeBridge] Error handling message:', err);
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Initialize on iframe load
  const handleIframeLoad = useCallback(() => {
    // Request scene data after a short delay to ensure runtime is ready
    setTimeout(() => {
      requestSceneData()
    }, 500)
  }, [requestSceneData])

  const paintTile = useCallback((layerId: string, tileX: number, tileY: number, tileIndex: number) => {
    sendMessage({ type: 'EDITOR_PAINT_TILE', payload: { layerId, tileX, tileY, tileIndex } })
  }, [sendMessage])
  
  const playAnimation = useCallback((entityId: string, animationId: string, playing: boolean) => {
    sendMessage({ type: 'EDITOR_PLAY_ANIMATION', payload: { entityId, animationId, playing } })
  }, [sendMessage])

  const assignAsset = useCallback((entityId: string, assetId: string) => {
    sendMessage({ type: 'EDITOR_ASSIGN_ASSET', payload: { entityId, assetId } })
  }, [sendMessage])

  const createEntity = useCallback((prefabId: string, x: number, y: number) => {
    sendMessage({ type: 'EDITOR_CREATE_ENTITY', payload: { prefabId, x, y } })
  }, [sendMessage])

  const duplicateEntity = useCallback((entityId: string) => {
    sendMessage({ type: 'EDITOR_DUPLICATE_ENTITY', payload: { entityId } })
  }, [sendMessage])

  const deleteEntity = useCallback((entityId: string) => {
    sendMessage({ type: 'EDITOR_DELETE_ENTITY', payload: { entityId } })
  }, [sendMessage])

  return {
    iframeRef,
    sendMessage,
    state,
    mapState,
    handleIframeLoad,
    iframeUrl,
    requestSceneData,
    selectEntity,
    deselectEntity,
    updateEntityTransform,
    updateEntityVisible,
    paintTile,
    playAnimation,
    assignAsset,
    createEntity,
    duplicateEntity,
    deleteEntity,
    saveScript,
    assignScript,
    reloadRuntime,
    markClean
  }
}
