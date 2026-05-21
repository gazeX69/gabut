import React from 'react'

interface PrefabBrowserPanelProps {
  onCreateEntity?: (prefabId: string, x: number, y: number) => void;
}

const AVAILABLE_PREFABS = [
  { id: 'hero', name: 'Hero Character', type: 'npc' },
  { id: 'chest', name: 'Treasure Chest', type: 'interactive' },
  { id: 'wall', name: 'Brick Wall', type: 'prop' },
  { id: 'tree', name: 'Oak Tree', type: 'decoration' }
];

export function PrefabBrowserPanel({ onCreateEntity }: PrefabBrowserPanelProps) {
  const handleCreate = (prefabId: string) => {
    if (onCreateEntity) {
      // Create at center of viewport roughly
      onCreateEntity(prefabId, 100, 100);
    }
  };

  return (
    <div className="panel-content" style={{ flex: 1 }}>
      <div className="asset-grid">
        {AVAILABLE_PREFABS.map(prefab => (
          <div key={prefab.id} className="asset-card" onClick={() => handleCreate(prefab.id)}>
            <div className="asset-card-icon">
              {prefab.type === 'npc' ? '👤' : prefab.type === 'interactive' ? '🎁' : '🧊'}
            </div>
            <div className="asset-card-name" title={prefab.name}>
              {prefab.name}
            </div>
            <div className="asset-card-type">
              {prefab.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
