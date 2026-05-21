import React from 'react'
import type { VGZScene } from '@vgz/shared-types'

interface HierarchyPanelProps {
  scene: VGZScene | null
  selectedEntityId: string | null
  onSelectEntity: (entityId: string) => void
  onDeselectEntity: () => void
  onDuplicateEntity?: (entityId: string) => void
  onDeleteEntity?: (entityId: string) => void
}

export function HierarchyPanel({
  scene,
  selectedEntityId,
  onSelectEntity,
  onDeselectEntity,
  onDuplicateEntity,
  onDeleteEntity
}: HierarchyPanelProps) {
  if (!scene) {
    return (
      <>
        <div className="panel-header">Hierarchy</div>
        <div className="panel-content empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-text">No scene loaded</div>
          <div className="empty-state-subtext">Awaiting runtime connection</div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="panel-header">Hierarchy</div>
      <div className="panel-content" onClick={onDeselectEntity}>
        
        <div className="tree-item scene-root">
          <span className="tree-item-icon">🎬</span>
          <span className="tree-item-label">{scene.name}</span>
        </div>

        {scene.layers.map(layer => (
          <div key={layer.id} className="hierarchy-layer" style={{ paddingLeft: '8px' }}>
            <div className="tree-item layer-header">
              <span className="tree-item-icon">
                {layer.type === 'tilemap' ? '🗺️' : '📦'}
              </span>
              <span className="tree-item-label" style={{ fontWeight: 600, color: 'var(--text-dim)' }}>
                {layer.name || layer.id}
              </span>
            </div>

            {layer.type === 'entity' && (
              <div className="hierarchy-children" style={{ paddingLeft: '16px' }}>
                {layer.entityIds.map(entityId => {
                  const entity = scene.entities[entityId]
                  if (!entity) return null
                  const isSelected = selectedEntityId === entityId

                  return (
                    <div
                      key={entityId}
                      className={`tree-item entity-item ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity(entityId);
                      }}
                    >
                      <span className="tree-item-icon">
                        {entity.type === 'npc' ? '👤' : '🧊'}
                      </span>
                      <span className="tree-item-label">
                        {entity.name || entity.id}
                        {!entity.visible && <span style={{ marginLeft: '4px', opacity: 0.5 }}>👻</span>}
                      </span>
                      
                      <div className="tree-item-actions">
                        <button 
                          title="Duplicate"
                          onClick={(e) => { e.stopPropagation(); onDuplicateEntity && onDuplicateEntity(entityId); }}
                        >
                          📋
                        </button>
                        <button 
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); onDeleteEntity && onDeleteEntity(entityId); }}
                          style={{ color: '#ff6b6b' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
