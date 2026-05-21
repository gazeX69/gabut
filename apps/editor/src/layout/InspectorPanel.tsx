import React, { useState, useEffect } from 'react'
import type { VGZEntity } from '@vgz/shared-types'

interface InspectorPanelProps {
  entity: VGZEntity | null | undefined
  sceneId: string | undefined
  scene?: any // VGZScene from bridge state
  onUpdateTransform?: (entityId: string, transform: Partial<{ x: number; y: number; rotation: number; scaleX: number; scaleY: number }>) => void;
  onUpdateVisible?: (entityId: string, visible: boolean) => void;
  onPlayAnimation?: (entityId: string, animationId: string, playing: boolean) => void;
  onAssignAsset?: (entityId: string, assetId: string) => void;
  onAssignScript?: (entityId: string, scriptId: string | null) => void;
}

export function InspectorPanel({ entity, sceneId, scene, onUpdateTransform, onUpdateVisible, onPlayAnimation, onAssignAsset, onAssignScript }: InspectorPanelProps) {
  const [localTransform, setLocalTransform] = useState({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
  const [localVisible, setLocalVisible] = useState(true);
  const [selectedAnimation, setSelectedAnimation] = useState('hero-idle');
  const [selectedAssetId, setSelectedAssetId] = useState('');

  useEffect(() => {
    if (entity) {
      setLocalTransform({
        x: entity.position.x,
        y: entity.position.y,
        rotation: entity.rotation ?? 0,
        scaleX: entity.scale?.x ?? 1,
        scaleY: entity.scale?.y ?? 1
      });
      setLocalVisible(entity.visible ?? true);
      
      const runtimeData = (entity as any).runtimeData;
      if (runtimeData?.currentAnimationId) {
        setSelectedAnimation(runtimeData.currentAnimationId);
      }
      setSelectedAssetId((entity as any).assetId || '');
    }
  }, [entity]);

  const handleTransformChange = (field: string, value: number) => {
    setLocalTransform(prev => ({ ...prev, [field]: value }));
    if (onUpdateTransform && entity) {
      onUpdateTransform(entity.id, { [field]: value });
    }
  };

  const handleVisibleChange = (value: boolean) => {
    setLocalVisible(value);
    if (onUpdateVisible && entity) {
      onUpdateVisible(entity.id, value);
    }
  };
  
  const handlePlayAnimation = (playing: boolean) => {
    if (onPlayAnimation && entity) {
      onPlayAnimation(entity.id, selectedAnimation, playing);
    }
  };

  const handleAssignAsset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value;
    setSelectedAssetId(assetId);
    if (onAssignAsset && entity) {
      onAssignAsset(entity.id, assetId);
    }
  };

  const handleAssignScript = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scriptId = e.target.value || null;
    if (onAssignScript && entity) {
      onAssignScript(entity.id, scriptId);
    }
  };

  const isAnimationPlaying = entity && (entity as any).runtimeData?.animationPlaying;
  
  const availableAssets = scene?.assets || [];
  const availableScripts = scene?.scripts || [];

  if (!entity) {
    return (
      <>
        <div className="panel-header">Inspector</div>
        <div className="panel-content empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No entity selected</div>
          <div className="empty-state-subtext">Select an entity in the Hierarchy or Viewport</div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="panel-header">Inspector</div>
      <div className="panel-content">
        
        {/* Entity Info Section */}
        <div className="inspector-section">
          <div className="inspector-section-title">Identity</div>
          
          <div className="property-row">
            <div className="property-label">Name</div>
            <div className="property-value">
              <input type="text" readOnly value={entity.name || '(unnamed)'} style={{ color: 'var(--text-dim)' }} />
            </div>
          </div>
          <div className="property-row">
            <div className="property-label">ID</div>
            <div className="property-value">
              <input type="text" readOnly value={entity.id} style={{ color: 'var(--text-dim)', fontSize: '11px' }} />
            </div>
          </div>
          <div className="property-row">
            <div className="property-label">Type</div>
            <div className="property-value">
              <span style={{ 
                background: 'var(--bg-input)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                color: 'var(--accent-hover)'
              }}>
                {entity.type}
              </span>
            </div>
          </div>
        </div>

        {/* Transform Section */}
        <div className="inspector-section">
          <div className="inspector-section-title">Transform</div>
          
          <div className="property-row">
            <div className="property-label">Position</div>
            <div className="property-value">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>X</span>
                <input
                  type="number"
                  value={localTransform.x}
                  onChange={e => handleTransformChange('x', parseFloat(e.target.value) || 0)}
                />
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', marginLeft: '4px' }}>Y</span>
                <input
                  type="number"
                  value={localTransform.y}
                  onChange={e => handleTransformChange('y', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          
          <div className="property-row">
            <div className="property-label">Rotation</div>
            <div className="property-value">
              <input
                type="number"
                value={localTransform.rotation}
                onChange={e => handleTransformChange('rotation', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="property-row">
            <div className="property-label">Scale</div>
            <div className="property-value">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>X</span>
                <input
                  type="number"
                  step="0.1"
                  value={localTransform.scaleX}
                  onChange={e => handleTransformChange('scaleX', parseFloat(e.target.value) || 0)}
                />
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', marginLeft: '4px' }}>Y</span>
                <input
                  type="number"
                  step="0.1"
                  value={localTransform.scaleY}
                  onChange={e => handleTransformChange('scaleY', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {entity.zOrder !== undefined && (
            <div className="property-row">
              <div className="property-label">Z-Order</div>
              <div className="property-value">
                <input type="number" readOnly value={entity.zOrder} style={{ color: 'var(--text-dim)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Rendering / Visibility Section */}
        <div className="inspector-section">
          <div className="inspector-section-title">Rendering</div>
          
          <div className="property-row">
            <div className="property-label">Visible</div>
            <div className="property-value">
              <input
                type="checkbox"
                checked={localVisible}
                onChange={e => handleVisibleChange(e.target.checked)}
                style={{ width: 'auto', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
          
          <div className="property-row">
            <div className="property-label">Sprite Asset</div>
            <div className="property-value">
              <select value={selectedAssetId} onChange={handleAssignAsset}>
                <option value="">(None)</option>
                {availableAssets.map((asset: any) => (
                  <option key={asset.id} value={asset.id}>{asset.id} ({asset.type})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Animation Section */}
        <div className="inspector-section">
          <div className="inspector-section-title">Animation</div>
          
          <div className="property-row">
            <div className="property-label">Clip</div>
            <div className="property-value">
              <select value={selectedAnimation} onChange={e => setSelectedAnimation(e.target.value)}>
                <option value="hero-idle">hero-idle</option>
                <option value="hero-walk">hero-walk</option>
              </select>
            </div>
          </div>
          
          <div className="property-row">
            <div className="property-label">Playback</div>
            <div className="property-value">
              <button 
                className="btn btn-primary"
                onClick={() => handlePlayAnimation(true)}
                disabled={isAnimationPlaying}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Play
              </button>
              <button 
                className="btn"
                onClick={() => handlePlayAnimation(false)}
                disabled={!isAnimationPlaying}
                style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--border-focus)' }}
              >
                Stop
              </button>
            </div>
          </div>
          
          <div className="property-row">
            <div className="property-label">Status</div>
            <div className="property-value">
              <span style={{ 
                color: isAnimationPlaying ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: isAnimationPlaying ? 'var(--accent)' : 'var(--text-dim)'
                }}></div>
                {isAnimationPlaying ? 'Playing' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* Script Section */}
        <div className="inspector-section">
          <div className="inspector-section-title">Scripting</div>
          
          <div className="property-row">
            <div className="property-label">Script</div>
            <div className="property-value">
              <select value={(entity as any).scriptId || ''} onChange={handleAssignScript}>
                <option value="">(None)</option>
                {availableScripts.map((script: any) => (
                  <option key={script.id} value={script.id}>{script.name}.js</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Collision & Physics */}
        {(((entity as any).collision || (entity as any).meta?.collision) || ((entity as any).trigger || (entity as any).meta?.trigger)) && (
          <div className="inspector-section">
            <div className="inspector-section-title">Physics & Trigger</div>
            
            {((entity as any).collision || (entity as any).meta?.collision) && (
              <div className="property-row">
                <div className="property-label">Solid</div>
                <div className="property-value">
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    {((entity as any).collision?.solid ?? (entity as any).meta?.collision?.solid) ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            )}
            
            {((entity as any).trigger || (entity as any).meta?.trigger) && (
              <div className="property-row">
                <div className="property-label">Interactive</div>
                <div className="property-value">
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    {((entity as any).trigger?.interactive ?? (entity as any).meta?.trigger?.interactive) ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
      </div>
    </>
  )
}
