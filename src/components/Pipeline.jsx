import { useState } from 'react'
import { TfToggle } from './Controls.jsx'
import { TRANSFORMS, STEP_DEFS } from '../engine/engine.js'

function GroupTag({ group }) {
  const colors = {
    clean:  { c: '#39FF14', bg: 'rgba(57,255,20,0.08)' },
    parse:  { c: '#80E5FF', bg: 'rgba(128,229,255,0.08)' },
    format: { c: '#FFD100', bg: 'rgba(255,209,0,0.08)' },
  }[group] || { c: '#6B8299', bg: 'transparent' }
  return (
    <span
      className="tf-grp"
      style={{ color: colors.c, background: colors.bg, border: `1px solid ${colors.c}40` }}
    >
      {group}
    </span>
  )
}

// Custom opts renderers — override per step ID
function SplitDelimOpts({ step, onUpdateOpt }) {
  const type      = step.opts.type      || 'comma'
  const hasHeader = step.opts.hasHeader === true

  return (
    <div className="tf-pipe-opts" onClick={e => e.stopPropagation()}>
      <div className="tf-pipe-opt-row">
        <span className="tf-pipe-opt-label">delim</span>
        <select
          className="tf-pipe-opt-select"
          value={type}
          onChange={e => onUpdateOpt(step.id, 'type', e.target.value)}
        >
          <option value="comma">comma  ( , )</option>
          <option value="tab">tab    ( \t )</option>
          <option value="pipe">pipe   ( | )</option>
          <option value="semicolon">semi   ( ; )</option>
          <option value="custom">custom…</option>
        </select>
      </div>
      {type === 'custom' && (
        <div className="tf-pipe-opt-row">
          <span className="tf-pipe-opt-label">char</span>
          <input
            className="tf-pipe-opt-input"
            value={step.opts.custom || ''}
            placeholder="e.g. |"
            maxLength={4}
            onChange={e => onUpdateOpt(step.id, 'custom', e.target.value)}
          />
        </div>
      )}
      <div className="tf-pipe-opt-row">
        <span className="tf-pipe-opt-label">header</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['yes', true], ['no', false]].map(([label, val]) => (
            <button
              key={label}
              className={`tf-btn ${hasHeader === val ? 'tf-btn-secondary' : 'tf-btn-ghost'}`}
              style={{ padding: '2px 8px', fontSize: 9, letterSpacing: '0.1em' }}
              onClick={() => onUpdateOpt(step.id, 'hasHeader', val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterOpts({ step, onUpdateOpt }) {
  const mode = step.opts.mode || 'include'
  return (
    <div className="tf-pipe-opts" onClick={e => e.stopPropagation()}>
      <div className="tf-pipe-opt-row">
        <span className="tf-pipe-opt-label">pattern</span>
        <input
          className="tf-pipe-opt-input"
          value={step.opts.pattern || ''}
          placeholder="ERROR|WARN"
          onChange={e => onUpdateOpt(step.id, 'pattern', e.target.value)}
        />
      </div>
      <div className="tf-pipe-opt-row">
        <span className="tf-pipe-opt-label">mode</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['include', 'exclude'].map(m => (
            <button
              key={m}
              className={`tf-btn ${mode === m ? 'tf-btn-secondary' : 'tf-btn-ghost'}`}
              style={{ padding: '2px 8px', fontSize: 9, letterSpacing: '0.1em' }}
              onClick={() => onUpdateOpt(step.id, 'mode', m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepOpts({ step, def, onUpdateOpt }) {
  if (!step.enabled) return null
  if (step.id === 'splitDelim') return <SplitDelimOpts step={step} onUpdateOpt={onUpdateOpt} />
  if (step.id === 'filter')     return <FilterOpts     step={step} onUpdateOpt={onUpdateOpt} />

  // Generic: render each defaultOpt as a text input
  const keys = Object.keys(def.defaultOpts || {})
  if (!keys.length) return null

  return (
    <div className="tf-pipe-opts" onClick={e => e.stopPropagation()}>
      {keys.map(key => (
        <div key={key} className="tf-pipe-opt-row">
          <span className="tf-pipe-opt-label">{key}</span>
          <input
            className="tf-pipe-opt-input"
            value={step.opts[key] ?? def.defaultOpts[key]}
            onChange={e => onUpdateOpt(step.id, key, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}

function PipelineStep({ step, def, isLast, onToggle, onUpdateOpt, onRemove, dropped }) {
  const enabled = step.enabled

  return (
    <div>
      <div className={`tf-pipe-step-card ${enabled ? 'on' : 'off'}`}>
        <div className="tf-pipe-step-row" onClick={() => onToggle(step.id)}>
          <div className="tf-pipe-step-icon">{def.icon}</div>
          <div className="tf-pipe-step-info">
            <div className="tf-pipe-step-name">
              {def.label || def.name}
              <GroupTag group={def.group} />
            </div>
            <div className="tf-pipe-step-desc">
              {def.desc}
              {enabled && def.id === 'dedupe' && dropped > 0
                ? <span style={{ color: '#FFD100', marginLeft: 6 }}>−{dropped}</span>
                : null}
            </div>
          </div>
          <TfToggle checked={enabled} onChange={() => onToggle(step.id)} />
        </div>

        <StepOpts step={step} def={def} onUpdateOpt={onUpdateOpt} />
      </div>

      {!isLast && <div className="tf-pipe-connector"></div>}
    </div>
  )
}

export function PipelinePanel({ steps, setSteps, dropped }) {
  const [showAdd, setShowAdd] = useState(false)

  const onToggle = (id) =>
    setSteps(s => s.map(st => st.id === id ? { ...st, enabled: !st.enabled } : st))

  const onUpdateOpt = (id, key, val) =>
    setSteps(s => s.map(st => st.id === id ? { ...st, opts: { ...st.opts, [key]: val } } : st))

  const onRemove = (id) =>
    setSteps(s => s.filter(st => st.id !== id))

  const onAdd = (defId) => {
    setSteps(s => {
      if (s.find(x => x.id === defId)) return s
      const def = TRANSFORMS[defId]
      return [...s, { id: defId, enabled: true, opts: { ...def.defaultOpts } }]
    })
    setShowAdd(false)
  }

  const enabledCount = steps.filter(s => s.enabled).length
  const available = Object.values(TRANSFORMS).filter(d => !steps.find(s => s.id === d.id))

  return (
    <div className="tf-pipeline-panel">
      <div className="tf-pipeline-head">
        <span className="tf-pipeline-title">&gt;_ pipeline</span>
        <span className="tf-pipeline-meta">{enabledCount}/{steps.length} ACTIVE</span>
      </div>

      <div className="tf-pipeline-list">
        {steps.map((step, i) => {
          const def = TRANSFORMS[step.id] || STEP_DEFS[step.id]
          if (!def) return null
          return (
            <PipelineStep
              key={step.id}
              step={step}
              def={def}
              isLast={i === steps.length - 1}
              onToggle={onToggle}
              onUpdateOpt={onUpdateOpt}
              onRemove={onRemove}
              dropped={step.id === 'dedupe' ? dropped : 0}
            />
          )
        })}

        <div style={{ position: 'relative', marginTop: 6 }}>
          {!showAdd ? (
            <button
              className="tf-pipe-add-btn"
              style={{ width: '100%' }}
              onClick={() => setShowAdd(true)}
            >
              + add step
            </button>
          ) : (
            <div className="tf-add-menu">
              {['clean', 'parse', 'format'].map(g => {
                const items = available.filter(d => d.group === g)
                if (!items.length) return null
                return (
                  <div key={g}>
                    <div className="tf-add-menu-section">// {g}</div>
                    {items.map(d => (
                      <div key={d.id} className="tf-add-menu-item" onClick={() => onAdd(d.id)}>
                        <div className="tf-pipe-step-icon" style={{ width: 22, height: 22, fontSize: 8 }}>{d.icon}</div>
                        <span style={{ flex: 1 }}>{d.label}</span>
                        <span style={{ fontSize: 9, color: '#3D5268' }}>{d.desc}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
              <button
                className="tf-pipe-add-btn"
                style={{ marginTop: 4, width: '100%' }}
                onClick={() => setShowAdd(false)}
              >
                cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
