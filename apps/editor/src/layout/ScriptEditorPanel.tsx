import React, { useState, useEffect } from 'react'
import type { VGZScene } from '@vgz/shared-types'

interface ScriptEditorPanelProps {
  scene: VGZScene | null
  scriptId: string
  onSaveScript: (id: string, source: string) => void
  onReloadRuntime: () => void
}

const DEFAULT_SCRIPT = `export function update({ entity, dt }) {
  entity.transform.x += 20 * dt
}`;

export function ScriptEditorPanel({ scene, scriptId, onSaveScript, onReloadRuntime }: ScriptEditorPanelProps) {
  const [source, setSource] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (scene && scene.scripts) {
      const script = scene.scripts.find(s => s.id === scriptId);
      if (script) {
        setSource(script.source);
        setIsDirty(false);
        return;
      }
    }
    // If not found, it's a new script
    setSource(DEFAULT_SCRIPT);
    setIsDirty(true);
  }, [scene, scriptId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSource(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveScript(scriptId, source);
    setIsDirty(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newSource = source.substring(0, start) + '  ' + source.substring(end);
      setSource(newSource);
      // We can't synchronously update selection here, but this is basic textarea behavior
      setIsDirty(true);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#E3B95C', fontWeight: 'bold' }}>JS</span>
          <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
            {scriptId}.js {isDirty && '*'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="toolbar-btn" onClick={handleSave} style={{ fontSize: '11px', padding: '2px 8px' }}>
            Save (Ctrl+S)
          </button>
          <button className="toolbar-btn" onClick={onReloadRuntime} style={{ fontSize: '11px', padding: '2px 8px', color: '#4CAF50' }}>
            ▶ Reload Runtime
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0' }}>
        <textarea
          value={source}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            color: '#d4d4d4',
            fontFamily: '"Fira Code", Consolas, monospace',
            fontSize: '13px',
            lineHeight: 1.5,
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </div>
  )
}
