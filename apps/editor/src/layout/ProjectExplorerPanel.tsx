import React, { useState } from 'react'
import type { VGZScene } from '@vgz/shared-types'

interface ProjectExplorerPanelProps {
  scene: VGZScene | null
  activeResource: {type: 'scene'|'script', id: string} | null
  onSelectResource: (resource: {type: 'scene'|'script', id: string} | null) => void
}

export function ProjectExplorerPanel({ scene, activeResource, onSelectResource }: ProjectExplorerPanelProps) {
  const [expanded, setExpanded] = useState({
    scenes: true,
    scripts: true,
    assets: true
  });

  const toggleGroup = (group: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="hierarchy-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="panel-header" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
        Project Explorer
      </div>
      <div className="hierarchy-tree" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        
        {/* SCENES */}
        <div className="hierarchy-group">
          <div className="hierarchy-item" onClick={() => toggleGroup('scenes')} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ display: 'inline-block', width: '16px', fontSize: '10px', color: 'var(--text-dim)' }}>{expanded.scenes ? '▼' : '▶'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>scenes</span>
          </div>
          {expanded.scenes && scene && (
            <div className={`hierarchy-item ${activeResource?.type === 'scene' && activeResource.id === scene.id ? 'selected' : ''}`}
                 onClick={() => onSelectResource({ type: 'scene', id: scene.id })}
                 style={{ padding: '4px 12px 4px 28px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ opacity: 0.7 }}>🎬</span> {scene.name}.scene.json
            </div>
          )}
        </div>

        {/* SCRIPTS */}
        <div className="hierarchy-group" style={{ marginTop: '4px' }}>
          <div className="hierarchy-item" onClick={() => toggleGroup('scripts')} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ display: 'inline-block', width: '16px', fontSize: '10px', color: 'var(--text-dim)' }}>{expanded.scripts ? '▼' : '▶'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>scripts</span>
          </div>
          {expanded.scripts && scene?.scripts?.map(script => (
            <div key={script.id}
                 className={`hierarchy-item ${activeResource?.type === 'script' && activeResource.id === script.id ? 'selected' : ''}`}
                 onClick={() => onSelectResource({ type: 'script', id: script.id })}
                 style={{ padding: '4px 12px 4px 28px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#E3B95C' }}>JS</span> {script.name}.js
            </div>
          ))}
          {expanded.scripts && (
             <div className="hierarchy-item"
                  onClick={() => {
                     const id = prompt('Script name:', 'new-script');
                     if (id) {
                       onSelectResource({ type: 'script', id });
                     }
                  }}
                  style={{ padding: '4px 12px 4px 28px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-dim)', fontStyle: 'italic' }}>
               + New Script...
             </div>
          )}
        </div>

        {/* ASSETS */}
        <div className="hierarchy-group" style={{ marginTop: '4px' }}>
          <div className="hierarchy-item" onClick={() => toggleGroup('assets')} style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ display: 'inline-block', width: '16px', fontSize: '10px', color: 'var(--text-dim)' }}>{expanded.assets ? '▼' : '▶'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>assets</span>
          </div>
          {expanded.assets && scene?.assets?.map(asset => (
            <div key={asset.id} className="hierarchy-item" style={{ padding: '4px 12px 4px 28px', fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ opacity: 0.5 }}>{asset.type === 'audio' ? '🎵' : '🖼️'}</span> {asset.id}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
