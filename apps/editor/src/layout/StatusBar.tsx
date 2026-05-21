import React from 'react'

interface StatusBarProps {
  isLoading: boolean
  error: string | null
  sceneId: string | undefined
  selectedEntityId: string | null
  paintModeEnabled: boolean
}

export function StatusBar({
  isLoading,
  error,
  sceneId,
  selectedEntityId,
  paintModeEnabled
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span>{isLoading ? 'Connecting...' : error ? 'Error' : 'Runtime Connected'}</span>
        {sceneId && <span>Scene: {sceneId}</span>}
      </div>
      <div className="status-bar-right">
        {selectedEntityId && <span>Selected: {selectedEntityId}</span>}
        {paintModeEnabled && <span style={{ color: '#ffdd57' }}>Paint Mode Active</span>}
        <span>60 FPS</span>
      </div>
    </div>
  )
}
