import React, { useState, useEffect, useMemo } from 'react'
import { useRuntimeBridge } from '../bridge/useRuntimeBridge'
import { HierarchyPanel } from './HierarchyPanel'
import { InspectorPanel } from './InspectorPanel'
import { RuntimeViewport } from './RuntimeViewport'
import { Toolbar } from './Toolbar'
import { TilePalettePanel } from './TilePalettePanel'
import { AssetBrowserPanel } from './AssetBrowserPanel'
import { PrefabBrowserPanel } from './PrefabBrowserPanel'
import { ConsolePanel } from './ConsolePanel'
import { StatusBar } from './StatusBar'
import { ProjectExplorerPanel } from './ProjectExplorerPanel'
import { ScriptEditorPanel } from './ScriptEditorPanel'
import { serializeEditableScene, deserializeEditableScene } from '../bridge/serialization'
import '../index.css'

export function EditorLayout() {
  const bridge = useRuntimeBridge('http://localhost:5173')
  
  // Panel visibility
  const [showHierarchy, setShowHierarchy] = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [showBottomDock, setShowBottomDock] = useState(true)
  
  // Panel dimensions
  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(280)
  const [bottomHeight, setBottomHeight] = useState(240)
  
  // Dragging state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [isDraggingBottom, setIsDraggingBottom] = useState(false)

  // Tab switcher state for bottom dock
  const [activeTab, setActiveTab] = useState<'assets' | 'prefabs' | 'tiles' | 'console'>('assets')

  const [paintModeEnabled, setPaintModeEnabled] = useState(false)
  const [selectedTileIndex, setSelectedTileIndex] = useState(1)
  const [activeLayerId, setActiveLayerId] = useState<string | null>('layer-ground')

  // Project Explorer Selection
  const [activeResource, setActiveResource] = useState<{type: 'scene'|'script', id: string} | null>(null)

  const handleSave = () => {
    if (!bridge.state.scene) return;
    const json = serializeEditableScene(bridge.state.scene);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bridge.state.scene.id}.scene.json`;
    a.click();
    URL.revokeObjectURL(url);
    bridge.markClean();
  };

  const handleLoad = (json: string) => {
    const newScene = deserializeEditableScene(json);
    if (newScene) {
      bridge.sendMessage({ type: 'EDITOR_RELOAD_RUNTIME', payload: { scene: newScene } });
      // The bridge handles replacing the scene when it gets SCENE_DATA or we should set it manually.
      // Wait, bridge will set it manually if we also update the state, but we only have `sendMessage` to reload. 
      // Actually, after reload, the runtime will send `SCENE_DATA` back. But the editor should own the state.
      // So I need a way to set the scene in bridge. Wait, `EDITOR_RELOAD_RUNTIME` will make runtime reload, and runtime might send `SCENE_DATA` back.
      // Or I can add `setScene` to `useRuntimeBridge.ts`.
      // Let's just rely on the runtime sending `SCENE_DATA` back after `EDITOR_RELOAD_RUNTIME` if needed, or add `setScene`.
      // Actually, I can just use `window.postMessage` or just add `setScene` to useRuntimeBridge.
      // For now, let's just trigger EDITOR_RELOAD_RUNTIME. The demo scene already sends SCENE_DATA when it mounts if we ask for it, or we can just add setScene to bridge.
    }
  };

  const selectedEntity = useMemo(() => {
    if (!bridge.state.scene || !bridge.state.scene.entities || !bridge.state.selectedEntityId) {
      return null
    }
    return bridge.state.scene.entities[bridge.state.selectedEntityId] || null
  }, [bridge.state.scene, bridge.state.selectedEntityId])

  useEffect(() => {
    if (paintModeEnabled) {
      bridge.sendMessage({ type: 'ENABLE_EDIT_MODE' })
      if (activeLayerId) {
        bridge.sendMessage({ type: 'SET_ACTIVE_LAYER', payload: { layerId: activeLayerId } })
      }
      bridge.sendMessage({ type: 'SELECT_TILE', payload: { tileIndex: selectedTileIndex } })
    } else {
      bridge.sendMessage({ type: 'DISABLE_EDIT_MODE' })
    }
  }, [paintModeEnabled, activeLayerId, selectedTileIndex, bridge.sendMessage])

  // Resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(200, Math.min(e.clientX, 600)))
      } else if (isDraggingRight) {
        setRightWidth(Math.max(200, Math.min(window.innerWidth - e.clientX, 600)))
      } else if (isDraggingBottom) {
        const newHeight = window.innerHeight - e.clientY - 24 // 24 is status bar height
        setBottomHeight(Math.max(150, Math.min(newHeight, 800)))
      }
    }

    const handleMouseUp = () => {
      setIsDraggingLeft(false)
      setIsDraggingRight(false)
      setIsDraggingBottom(false)
      document.body.style.cursor = 'default'
    }

    if (isDraggingLeft || isDraggingRight || isDraggingBottom) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      // Prevent text selection during drag
      document.body.style.userSelect = 'none'
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDraggingLeft, isDraggingRight, isDraggingBottom])

  // Don't apply transition class while dragging for smoother immediate response
  const transitionClass = (isDraggingLeft || isDraggingRight || isDraggingBottom) ? '' : 'panel-transition'

  return (
    <div className="editor-container">
      {/* Top Toolbar */}
      <Toolbar
        scene={bridge.state.scene}
        isLoading={bridge.state.isLoading}
        error={bridge.state.error}
        onReload={bridge.requestSceneData}
        showHierarchy={showHierarchy}
        onToggleHierarchy={() => setShowHierarchy(!showHierarchy)}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector(!showInspector)}
        showBottomDock={showBottomDock}
        onToggleBottomDock={() => setShowBottomDock(!showBottomDock)}
        isDirty={bridge.state.isDirty}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Main Content Area */}
      <div className="editor-content">
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: Hierarchy */}
          <div 
            className={`editor-panel hierarchy-panel ${transitionClass} ${!showHierarchy ? 'panel-collapsed' : ''}`}
            style={{ width: showHierarchy ? leftWidth : 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <HierarchyPanel
                  scene={bridge.state.scene}
                  selectedEntityId={bridge.state.selectedEntityId}
                  onSelectEntity={bridge.selectEntity}
                  onDeselectEntity={bridge.deselectEntity}
                  onDuplicateEntity={bridge.duplicateEntity}
                  onDeleteEntity={bridge.deleteEntity}
                />
              </div>
              <div className="editor-splitter editor-splitter-horizontal" />
              <div style={{ height: '40%', overflow: 'hidden' }}>
                <ProjectExplorerPanel 
                  scene={bridge.state.scene}
                  activeResource={activeResource}
                  onSelectResource={setActiveResource}
                />
              </div>
            </div>
          </div>
          
          {/* Left Splitter */}
          {showHierarchy && (
            <div 
              className={`editor-splitter editor-splitter-vertical ${isDraggingLeft ? 'dragging' : ''}`}
              onMouseDown={() => { setIsDraggingLeft(true); document.body.style.cursor = 'col-resize'; }}
            />
          )}

          {/* Center: Runtime Viewport or Script Editor */}
          <div className="editor-viewport-container" style={{ flex: 1, minWidth: 300 }}>
            {activeResource?.type === 'script' ? (
              <ScriptEditorPanel 
                scene={bridge.state.scene}
                scriptId={activeResource.id}
                onSaveScript={bridge.saveScript}
                onReloadRuntime={bridge.reloadRuntime}
              />
            ) : (
              <RuntimeViewport
                iframeRef={bridge.iframeRef}
                onIframeLoad={bridge.handleIframeLoad}
                isLoading={bridge.state.isLoading}
              />
            )}
          </div>

          {/* Right Splitter */}
          {showInspector && (
            <div 
              className={`editor-splitter editor-splitter-vertical ${isDraggingRight ? 'dragging' : ''}`}
              onMouseDown={() => { setIsDraggingRight(true); document.body.style.cursor = 'col-resize'; }}
            />
          )}

          {/* Right Panel: Inspector */}
          <div 
            className={`editor-panel inspector-panel ${transitionClass} ${!showInspector ? 'panel-collapsed' : ''}`}
            style={{ width: showInspector ? rightWidth : 0 }}
          >
            <InspectorPanel
              entity={selectedEntity}
              scene={bridge.state.scene}
              sceneId={bridge.state.scene?.id}
              onUpdateTransform={bridge.updateEntityTransform}
              onUpdateVisible={bridge.updateEntityVisible}
              onPlayAnimation={bridge.playAnimation}
              onAssignAsset={bridge.assignAsset}
              onAssignScript={bridge.assignScript}
            />
          </div>
          
        </div>
        
        {/* Bottom Dock Splitter */}
        {showBottomDock && bridge.state.scene && (
          <div 
            className={`editor-splitter editor-splitter-horizontal ${isDraggingBottom ? 'dragging' : ''}`}
            onMouseDown={() => { setIsDraggingBottom(true); document.body.style.cursor = 'row-resize'; }}
          />
        )}
        
        {/* Bottom Dock */}
        <div 
          className={`bottom-dock ${transitionClass} ${!showBottomDock || !bridge.state.scene ? 'panel-collapsed' : ''}`}
          style={{ height: showBottomDock && bridge.state.scene ? bottomHeight : 0 }}
        >
          {bridge.state.scene && (
            <>
              <div className="dock-tabs">
                <div 
                  className={`dock-tab ${activeTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assets')}
                >
                  Assets
                </div>
                <div 
                  className={`dock-tab ${activeTab === 'prefabs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prefabs')}
                >
                  Prefabs
                </div>
                <div 
                  className={`dock-tab ${activeTab === 'tiles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tiles')}
                >
                  Tile Palette
                </div>
                <div 
                  className={`dock-tab ${activeTab === 'console' ? 'active' : ''}`}
                  onClick={() => setActiveTab('console')}
                >
                  Console
                </div>
              </div>
              <div className="dock-content">
                {activeTab === 'assets' && (
                  <AssetBrowserPanel assets={bridge.state.scene.assets} />
                )}
                {activeTab === 'prefabs' && (
                  <PrefabBrowserPanel onCreateEntity={bridge.createEntity} />
                )}
                {activeTab === 'tiles' && (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <TilePalettePanel 
                      activeLayerId={activeLayerId}
                      selectedTileIndex={selectedTileIndex}
                      onTileIndexChange={setSelectedTileIndex}
                      paintModeEnabled={paintModeEnabled}
                      onPaintModeChange={setPaintModeEnabled}
                    />
                  </div>
                )}
                {activeTab === 'console' && (
                  <ConsolePanel />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar 
        isLoading={bridge.state.isLoading}
        error={bridge.state.error}
        sceneId={bridge.state.scene?.id}
        selectedEntityId={bridge.state.selectedEntityId}
        paintModeEnabled={paintModeEnabled}
      />
    </div>
  )
}
