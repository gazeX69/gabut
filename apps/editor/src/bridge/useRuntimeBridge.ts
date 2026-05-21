import { useEffect, useRef, useState, useCallback } from 'react'
import type { EditorMessage, RuntimeMessage, VGZMap } from '@vgz/shared-types'

export function useRuntimeBridge(iframeUrl: string) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mapState, setMapState] = useState<VGZMap | null>(null)

  const sendMessage = useCallback((msg: EditorMessage) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*')
    }
  }, [])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Ensure message comes from iframe and has correct schema
      const msg = e.data as RuntimeMessage
      if (!msg || !msg.type) return

      if (msg.type === 'MAP_STATE') {
        setMapState(msg.payload.map)
      } else if (msg.type === 'TILE_UPDATED') {
        // We could mutate local state here if needed, or re-request map state
        console.log('Tile updated in runtime:', msg.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Once iframe loads, we can request map state and enable edit mode
  const handleIframeLoad = useCallback(() => {
    sendMessage({ type: 'ENABLE_EDIT_MODE' })
    sendMessage({ type: 'REQUEST_MAP_STATE' })
  }, [sendMessage])

  return { iframeRef, sendMessage, mapState, handleIframeLoad, iframeUrl }
}
