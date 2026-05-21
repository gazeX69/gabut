import React from 'react'

interface TilePalettePanelProps {
  activeLayerId: string | null
  selectedTileIndex: number
  onTileIndexChange: (index: number) => void
  paintModeEnabled: boolean
  onPaintModeChange: (enabled: boolean) => void
}

export function TilePalettePanel({
  activeLayerId,
  selectedTileIndex,
  onTileIndexChange,
  paintModeEnabled,
  onPaintModeChange
}: TilePalettePanelProps) {
  return (
    <div className="panel-content" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: 'var(--text-dim)' }}>Paint Mode:</strong>
          <input 
            type="checkbox" 
            checked={paintModeEnabled} 
            onChange={(e) => onPaintModeChange(e.target.checked)} 
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
        
        {paintModeEnabled && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: 'var(--text-dim)' }}>Layer:</strong> 
              <span style={{ 
                background: 'var(--bg-input)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                color: 'var(--text-highlight)'
              }}>
                {activeLayerId || 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: 'var(--text-dim)' }}>Tile Index:</strong>
              <input 
                type="number" 
                value={selectedTileIndex} 
                onChange={(e) => onTileIndexChange(parseInt(e.target.value, 10) || 0)}
                style={{ width: '80px' }}
                min={0}
              />
            </div>
          </>
        )}
      </div>
      
      {paintModeEnabled && (
        <div className="palette-grid" style={{ padding: 0 }}>
          {/* Note: the original palette-grid styles will apply here. */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className={`palette-tile ${selectedTileIndex === i + 1 ? 'selected' : ''}`}
              onClick={() => onTileIndexChange(i + 1)}
            >
              <div className="tile-image" style={{ backgroundPosition: `-${(i % 3) * 32}px -${Math.floor(i / 3) * 32}px` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
