import React from 'react'

interface RuntimeViewportProps {
  iframeRef: React.RefObject<HTMLIFrameElement>
  onIframeLoad: () => void
  isLoading: boolean
}

export function RuntimeViewport({
  iframeRef,
  onIframeLoad,
  isLoading
}: RuntimeViewportProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className="editor-viewport-chrome">
        <span>🎬 Runtime Viewport</span>
        <span>Scale: 100% | 60 FPS</span>
      </div>
      
      <div className="runtime-iframe-wrapper">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p style={{ margin: 0, fontWeight: 600 }}>Loading Engine...</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.7 }}>Establishing runtime bridge connection</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="runtime-iframe"
          src="http://localhost:3001"
          title="Runtime Viewport"
          onLoad={onIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    </div>
  )
}
