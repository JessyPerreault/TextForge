import { useState } from 'react'
import { TfBadge, TfInput, TfSelect, TfToggle } from './Controls.jsx'
import { TRANSFORMS } from '../engine/engine.js'

// Relative time formatter
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 10)  return 'just now'
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="tf-empty-state">
      <div className="tf-empty-icon">{icon}</div>
      <div className="tf-empty-title">{title}</div>
      <div className="tf-empty-sub">{sub}</div>
    </div>
  )
}

// ── History ────────────────────────────────────────────────────────────────────
export function HistoryScreen({ history, onRestore }) {
  const [search, setSearch] = useState('')
  const filtered = history.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="tf-screen">
      <div className="tf-screen-head">
        <div className="tf-screen-title">
          <span className="pre">&gt;_</span><span>HISTORY</span>
          <span className="sub">// {filtered.length} transforms</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <TfInput
          placeholder="search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      </div>
      <div className="tf-screen-body">
        {filtered.length === 0 ? (
          <EmptyState
            icon=">_"
            title="No history yet"
            sub="// paste some data and run a transform to get started"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="tf-hist-row"
                onClick={() => onRestore(item)}
                title="Click to restore this session"
              >
                <span className="idx">{String(idx + 1).padStart(3, '0')}</span>
                <span className="name">{item.name}</span>
                <TfBadge
                  variant={
                    item.format === 'json'  ? 'green' :
                    item.format === 'csv'   ? 'cyan'  :
                    item.format === 'table' ? 'amber' : 'muted'
                  }
                >
                  {item.format?.toUpperCase() || 'TEXT'}
                </TfBadge>
                <span className="meta">{item.lines?.toLocaleString() ?? 0} ln</span>
                <span className="meta">{relTime(item.timestamp)}</span>
                <TfBadge
                  variant={
                    item.status === 'success' ? 'green' :
                    item.status === 'error'   ? 'red'   : 'amber'
                  }
                >
                  {item.status}
                </TfBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Saved Pipelines ────────────────────────────────────────────────────────────
export function SavedScreen({ savedPipelines, onApply, onDelete, onSave }) {
  return (
    <div className="tf-screen">
      <div className="tf-screen-head">
        <div className="tf-screen-title">
          <span className="pre">&gt;_</span><span>SAVED PIPELINES</span>
          <span className="sub">// {savedPipelines.length} configs · click to apply</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <button className="tf-btn tf-btn-secondary" onClick={onSave}>+ SAVE CURRENT</button>
      </div>
      <div className="tf-screen-body">
        {savedPipelines.length === 0 ? (
          <EmptyState
            icon="[]"
            title="No saved pipelines"
            sub="// configure a pipeline in the Transform view, then click '+ SAVE CURRENT'"
          />
        ) : (
          <div className="tf-saved-grid">
            {savedPipelines.map(p => (
              <div
                key={p.id}
                className="tf-saved-card"
                onClick={() => onApply(p)}
                title="Click to apply this pipeline"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div className="name">{p.name}</div>
                  <button
                    className="tf-btn tf-btn-ghost"
                    style={{ padding: '2px 6px', fontSize: 9, flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                    title="Delete this pipeline"
                  >
                    ✕
                  </button>
                </div>
                {p.desc && <div className="desc">{p.desc}</div>}
                <div className="steps">
                  {p.steps.map(s => {
                    const def = TRANSFORMS[s.id]
                    if (!def || !s.enabled) return null
                    return (
                      <span key={s.id} className="step-pill">{def.icon}</span>
                    )
                  })}
                </div>
                <div className="foot">
                  <span>{p.runs} RUNS</span>
                  <span>{p.lastUsed ? relTime(p.lastUsed) : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Settings ───────────────────────────────────────────────────────────────────
export function SettingsScreen({ settings, onSettingsChange, onClearHistory, onClearPipelines }) {
  const set = (key, val) => onSettingsChange({ ...settings, [key]: val })

  return (
    <div className="tf-screen">
      <div className="tf-screen-head">
        <div className="tf-screen-title">
          <span className="pre">&gt;_</span><span>SETTINGS</span>
          <span className="sub">// preferences · v0.4.1</span>
        </div>
      </div>
      <div className="tf-screen-body">
        <div className="tf-set-section">
          <div className="tf-set-title">// engine</div>
          <div className="tf-set-row">
            <div>
              <div className="lab">Auto-run pipeline on input change</div>
              <div className="help">Pipeline is always reactive — this is always on</div>
            </div>
            <TfToggle checked={true} onChange={() => {}} />
          </div>
          <div className="tf-set-row">
            <div>
              <div className="lab">Normalize line endings to LF</div>
              <div className="help">Converts CRLF → LF on paste</div>
            </div>
            <TfToggle checked={settings.crlf} onChange={v => set('crlf', v)} />
          </div>
        </div>
        <div className="tf-set-section">
          <div className="tf-set-title">// editor</div>
          <div className="tf-set-row">
            <div className="lab">Show line numbers</div>
            <TfToggle checked={settings.lineNums} onChange={v => set('lineNums', v)} />
          </div>
          <div className="tf-set-row">
            <div className="lab">Subtle glow effects</div>
            <TfToggle checked={settings.glow} onChange={v => set('glow', v)} />
          </div>
          <div className="tf-set-row">
            <div className="lab">Font size</div>
            <TfSelect
              options={['11', '12', '13', '14']}
              value={settings.fontSize}
              onChange={e => set('fontSize', e.target.value)}
              style={{ width: 100 }}
            />
          </div>
        </div>
        <div className="tf-set-section">
          <div className="tf-set-title">// appearance</div>
          <div className="tf-set-row">
            <div className="lab">Theme</div>
            <TfSelect
              options={[
                { value: 'dark',   label: 'Dark (Default)' },
                { value: 'matrix', label: 'Matrix' },
                { value: 'amber',  label: 'Amber CRT' },
              ]}
              value={settings.theme}
              onChange={e => set('theme', e.target.value)}
              style={{ width: 180 }}
            />
          </div>
        </div>
        <div className="tf-set-section">
          <div className="tf-set-title">// data</div>
          <div className="tf-set-row">
            <div>
              <div className="lab">Clear transform history</div>
              <div className="help">Removes all saved history entries from localStorage</div>
            </div>
            <button className="tf-btn tf-btn-tertiary" onClick={onClearHistory}>CLEAR</button>
          </div>
          <div className="tf-set-row">
            <div>
              <div className="lab">Clear saved pipelines</div>
              <div className="help">Removes all user-saved pipeline configurations</div>
            </div>
            <button className="tf-btn tf-btn-tertiary" onClick={onClearPipelines}>CLEAR</button>
          </div>
        </div>
        <div className="tf-set-section">
          <div className="tf-set-title">// about</div>
          <div className="tf-set-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div className="lab" style={{ color: '#39FF14' }}>TextForge v0.4.1 · build 2046</div>
            <div className="help">// clean. transform. forge.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
