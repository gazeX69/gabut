import React from 'react'
import type { LogEntry } from '../bridge/useRuntimeBridge'

interface ConsolePanelProps {
  logs: LogEntry[]
}

export function ConsolePanel({ logs }: ConsolePanelProps) {
  if (logs.length === 0) {
    return (
      <div className="panel-content empty-state">
        <div className="empty-state-icon">⌨️</div>
        <div className="empty-state-text">No active console output</div>
        <div className="empty-state-subtext">Engine logs will appear here</div>
      </div>
    )
  }

  return (
    <div className="panel-content" style={{ padding: 0, overflowY: 'auto' }}>
      {logs.map((log) => (
        <div key={log.id} className={`console-log-row ${log.type}`}>
          <span className="console-time">[{log.time}]</span>
          <span className="console-icon">
            {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="console-message">{log.message}</span>
        </div>
      ))}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'var(--accent)', marginRight: '8px', fontWeight: 'bold' }}>&gt;</span>
        <input 
          type="text" 
          placeholder="Evaluate expression..." 
          style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-main)' }} 
          disabled
        />
      </div>
    </div>
  )
}
