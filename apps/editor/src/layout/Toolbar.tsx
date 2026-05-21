import React from 'react'
import type { VGZScene } from '@vgz/shared-types'

interface ToolbarProps {
  scene: VGZScene | null
  isLoading: boolean
  error: string | null
  onReload: () => void
  showHierarchy: boolean
  onToggleHierarchy: () => void
  showInspector: boolean
  onToggleInspector: () => void
  showBottomDock: boolean
  onToggleBottomDock: () => void
  isDirty?: boolean
  onSave?: () => void
  onLoad?: (json: string) => void
}

export function Toolbar({
  scene,
  isLoading,
  error,
  onReload,
  showHierarchy,
  onToggleHierarchy,
  showInspector,
  onToggleInspector,
  showBottomDock,
  onToggleBottomDock,
  isDirty,
  onSave,
  onLoad
}: ToolbarProps) {
  const handleLoadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file && onLoad) {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (re.target && typeof re.target.result === 'string') {
            onLoad(re.target.result);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <header className="editor-toolbar">
      <div className="toolbar-left">
        <div className="toolbar-title" style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>✦</span>
            VGZ Engine
          </h1>
          <div className="toolbar-separator" style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 12px' }} />
          {scene ? (
            <span className="scene-name" style={{ color: 'var(--text-main)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ opacity: 0.5 }}>🎬</span> {scene.name}
              {isDirty ? (
                <span style={{ color: 'var(--accent)', marginLeft: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>●</span> Unsaved Changes
                </span>
              ) : (
                <span style={{ color: 'var(--text-dim)', marginLeft: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#4CAF50', fontSize: '12px' }}>✓</span> Saved
                </span>
              )}
            </span>
          ) : (
            <span className="scene-name" style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>
              No scene loaded
            </span>
          )}
        </div>
        
        <div style={{ marginLeft: '24px', display: 'flex', gap: '8px' }}>
          <button className="toolbar-btn" onClick={onSave} title="Save Scene" disabled={!scene}>
            💾 Save
          </button>
          <button className="toolbar-btn" onClick={handleLoadClick} title="Load Scene">
            📂 Load
          </button>
        </div>
      </div>

      <div className="toolbar-center">
        <button
          className={`toolbar-btn ${showHierarchy ? 'active' : ''}`}
          onClick={onToggleHierarchy}
          title="Toggle hierarchy panel"
        >
          <span style={{ opacity: showHierarchy ? 1 : 0.5 }}>◧</span>
        </button>
        <button
          className={`toolbar-btn ${showBottomDock ? 'active' : ''}`}
          onClick={onToggleBottomDock}
          title="Toggle bottom dock"
        >
          <span style={{ opacity: showBottomDock ? 1 : 0.5 }}>⬒</span>
        </button>
        <button
          className={`toolbar-btn ${showInspector ? 'active' : ''}`}
          onClick={onToggleInspector}
          title="Toggle inspector panel"
        >
          <span style={{ opacity: showInspector ? 1 : 0.5 }}>◨</span>
        </button>
      </div>

      <div className="toolbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px', fontSize: '11px', color: 'var(--text-dim)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLoading ? '#d7ba7d' : (scene ? '#4CAF50' : '#f44336') }} />
          {isLoading ? 'Connecting...' : (scene ? 'Connected' : 'Disconnected')}
        </div>
        <div className="toolbar-separator" style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', marginRight: '12px' }} />
        <button
          className="btn btn-primary"
          onClick={onReload}
          disabled={isLoading}
          title="Reload scene from runtime"
          style={{ padding: '4px 16px', fontWeight: 600 }}
        >
          ▶ Play
        </button>
      </div>
    </header>
  )
}
