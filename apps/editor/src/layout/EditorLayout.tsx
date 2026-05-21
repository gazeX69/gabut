import React, { useState, useEffect } from 'react'
import { useRuntimeBridge } from '../bridge/useRuntimeBridge'
import '../index.css'

const TILES = [
  { id: 1, name: 'Grass', x: 0, y: 0 },
  { id: 2, name: 'Dirt', x: -32, y: 0 },
  { id: 3, name: 'Path', x: -64, y: 0 },
  { id: 4, name: 'Wall', x: 0, y: -32 },
  { id: 5, name: 'Water', x: -32, y: -32 },
  { id: 6, name: 'Object', x: -64, y: -32 },
]

export function EditorLayout() {
  const { iframeRef, sendMessage, mapState, handleIframeLoad } = useRuntimeBridge('http://localhost:3001')
  
  const [selectedTile, setSelectedTile] = useState(1)
  const [activeLayer, setActiveLayer] = useState('layer-terrain')

  // Send updates to runtime whenever selection changes
  useEffect(() => {
    sendMessage({ type: 'SELECT_TILE', payload: { tileIndex: selectedTile } })
  }, [selectedTile, sendMessage])

  useEffect(() => {
    sendMessage({ type: 'SET_ACTIVE_LAYER', payload: { layerId: activeLayer } })
  }, [activeLayer, sendMessage])

  return (
    <div className="editor-container">
      {/* Top Toolbar */}
      <header className="editor-header">
        <h1>VGZ Engine Editor</h1>
        <div className="toolbar-controls">
          <label>Active Layer:</label>
          <select 
            value={activeLayer} 
            onChange={(e) => setActiveLayer(e.target.value)}
          >
            {mapState?.layers.map(layer => (
              <option key={layer.id} value={layer.id}>{layer.name}</option>
            )) || (
              <>
                <option value="layer-terrain">Terrain</option>
                <option value="layer-canopy">Canopy</option>
              </>
            )}
          </select>
        </div>
      </header>

      <div className="editor-main">
        {/* Left Palette */}
        <aside className="editor-sidebar">
          <h3>Tileset</h3>
          <div className="palette-grid">
            {TILES.map(tile => (
              <div 
                key={tile.id}
                className={`palette-tile ${selectedTile === tile.id ? 'selected' : ''}`}
                onClick={() => setSelectedTile(tile.id)}
                title={tile.name}
              >
                <div 
                  className="tile-image"
                  style={{
                    backgroundPosition: `${tile.x}px ${tile.y}px`
                  }}
                />
              </div>
            ))}
          </div>
          {/* Empty Tile Tool */}
          <div 
            className={`palette-tile ${selectedTile === 0 ? 'selected' : ''}`}
            onClick={() => setSelectedTile(0)}
            title="Eraser (Empty)"
            style={{ marginTop: '1rem', width: '32px', height: '32px', border: '1px dashed #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            X
          </div>
        </aside>

        {/* Center Preview */}
        <main className="editor-viewport">
          <iframe 
            ref={iframeRef}
            src="http://localhost:3001" 
            title="Runtime Preview"
            onLoad={handleIframeLoad}
            className="runtime-iframe"
          />
        </main>

        {/* Right Inspector (Placeholder) */}
        <aside className="editor-inspector">
          <h3>Inspector</h3>
          {mapState ? (
            <div className="inspector-content">
              <p><strong>Map:</strong> {mapState.name}</p>
              <p><strong>Size:</strong> {mapState.width}x{mapState.height}</p>
              <p><strong>Entities:</strong> {mapState.entities.length}</p>
            </div>
          ) : (
            <p>Loading map data...</p>
          )}
        </aside>
      </div>

      {/* Bottom Status */}
      <footer className="editor-footer">
        Status: {mapState ? 'Connected' : 'Connecting to Runtime...'} | Selected Tile: {selectedTile}
      </footer>
    </div>
  )
}
