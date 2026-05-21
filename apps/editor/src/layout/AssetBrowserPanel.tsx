import React from 'react'
import type { VGZAssetReference } from '@vgz/scene-types'

interface AssetBrowserPanelProps {
  assets: VGZAssetReference[] | undefined;
}

export function AssetBrowserPanel({ assets }: AssetBrowserPanelProps) {
  if (!assets || assets.length === 0) {
    return (
      <div className="panel-content empty-state">
        <div className="empty-state-icon">📁</div>
        <div className="empty-state-text">No assets available</div>
        <div className="empty-state-subtext">Add assets to the project to see them here</div>
      </div>
    );
  }

  return (
    <div className="panel-content" style={{ flex: 1 }}>
      <div className="asset-grid">
        {assets.map(asset => (
          <div key={asset.id} className="asset-card">
            <div className="asset-card-icon">
              {asset.type === 'sprite' || asset.type === 'image' ? '🖼️' : '📁'}
            </div>
            <div className="asset-card-name" title={asset.path}>
              {asset.id}
            </div>
            <div className="asset-card-type">
              {asset.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
