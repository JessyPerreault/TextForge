import { useRef } from 'react'
import { TfBadge, TfToggle } from './Controls.jsx'

function syntaxHighlight(text, format) {
  if (format === 'json') {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)/g, '<span class="json-key">"$1"</span>$2')
      .replace(/: ?"([^"\\]*(?:\\.[^"\\]*)*)"/g, ': <span class="json-str">"$1"</span>')
      .replace(/: ?(-?\d+\.?\d*)/g, ': <span class="json-num">$1</span>')
      .replace(/: ?(true|false)/g, ': <span class="json-bool">$1</span>')
      .replace(/: ?null/g, ': <span class="json-null">null</span>')
      .replace(/([{}\[\],])/g, '<span class="json-punct">$1</span>')
  }
  if (format === 'csv') {
    return text.split('\n').map((line, i) => {
      if (i === 0) return `<span class="json-key">${line}</span>`
      return line.replace(/([^,]+)/g, (m) =>
        /^-?\d+\.?\d*$/.test(m.trim())
          ? `<span class="json-num">${m}</span>`
          : `<span class="json-str">${m}</span>`
      )
    }).join('\n')
  }
  if (format === 'table') {
    return text.split('\n').map((line, i) => {
      if (i === 0) return `<span class="json-key">${line}</span>`
      if (i === 1) return `<span class="json-punct">${line}</span>`
      return line
    }).join('\n')
  }
  return text
}

export function InputPanel({ stageNum, value, onChange, onPaste, onUpload, onClear, settings = {} }) {
  const lines = value.split('\n')
  const taRef = useRef(null)
  const lnRef = useRef(null)

  const showLineNums = settings.lineNums !== false
  const fontSize = settings.fontSize || '12'

  const onScroll = (e) => {
    if (lnRef.current) lnRef.current.scrollTop = e.target.scrollTop
  }

  return (
    <div className="tf-pane">
      <div className="tf-pane-head">
        <span className="tf-pane-label">
          {stageNum && <span className="stage-num">{stageNum}</span>}
          <span className="dot"></span>&gt;_ INPUT
        </span>
        <div className="tf-pane-actions">
          <button className="tf-btn tf-btn-ghost" onClick={onPaste}>PASTE</button>
          <button className="tf-btn tf-btn-ghost" onClick={onUpload}>UPLOAD</button>
          <button className="tf-btn tf-btn-ghost" onClick={onClear}>CLEAR</button>
        </div>
      </div>
      <div className="tf-pane-body">
        {showLineNums && (
          <div className="tf-line-nums" ref={lnRef} style={{ overflow: 'hidden' }}>
            {lines.map((_, i) => <div key={i}>{String(i + 1).padStart(2, '0')}</div>)}
          </div>
        )}
        <div className="tf-editor-area">
          <textarea
            ref={taRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onScroll={onScroll}
            spellCheck={false}
            placeholder=">_ Paste or type raw data — logs, CSV, unstructured text…"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>
      </div>
      <div className="tf-pane-foot">
        <span>LINES <span className="acc">{lines.length}</span></span>
        <div className="sep"></div>
        <span>CHARS <span className="acc">{value.length.toLocaleString()}</span></span>
        <div className="sep"></div>
        <span className="info">RAW</span>
        <div style={{ flex: 1 }}></div>
        <span>UTF-8</span>
      </div>
    </div>
  )
}

export function FlowArrow({ active, pulse }) {
  return (
    <div className={`tf-flow-arrow ${pulse ? 'pulse' : ''}`}>
      <span className="arr" style={{ opacity: active ? 1 : 0.25 }}>▶</span>
      {active && <div className="pulse-line"></div>}
      <span className="stage">02 · pipeline</span>
      {active && <div className="pulse-line"></div>}
      <span className="arr" style={{ opacity: active ? 1 : 0.25 }}>▶</span>
    </div>
  )
}

export function OutputPanel({ stageNum, result, fmtBadge, onCopy, onExport, onDiff, diff, copied, settings = {} }) {
  const empty = !result.output
  const text = result.output || ''
  const html = empty ? null : { __html: syntaxHighlight(text, result.format) }
  const lines = text.split('\n')

  const showLineNums = settings.lineNums !== false
  const fontSize = settings.fontSize || '12'

  return (
    <div className="tf-pane">
      <div className="tf-pane-head">
        <span className="tf-pane-label" style={{ color: '#80E5FF' }}>
          {stageNum && (
            <span
              className="stage-num"
              style={{ color: '#2A3747', borderColor: 'rgba(128,229,255,0.2)' }}
            >
              {stageNum}
            </span>
          )}
          <span className="dot" style={{ background: '#80E5FF', boxShadow: '0 0 4px rgba(128,229,255,0.7)' }}></span>
          &gt;_ OUTPUT
        </span>
        <div className="tf-pane-actions">
          <TfToggle label="DIFF" checked={diff} onChange={onDiff} />
          <button className="tf-btn tf-btn-ghost" onClick={onCopy}>
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
          <TfBadge variant={fmtBadge.variant}>{fmtBadge.label}</TfBadge>
        </div>
      </div>
      <div className="tf-pane-body">
        {showLineNums && (
          <div className="tf-line-nums">
            {!empty && lines.map((_, i) => <div key={i}>{String(i + 1).padStart(2, '0')}</div>)}
          </div>
        )}
        <div className="tf-output-area" style={{ fontSize: `${fontSize}px` }}>
          {empty
            ? <div className="tf-output-empty">// output will appear here</div>
            : <div dangerouslySetInnerHTML={html}></div>
          }
        </div>
      </div>
      <div className="tf-pane-foot">
        {result.error
          ? <span style={{ color: '#FF4545' }}>ERROR: {result.error}</span>
          : <>
              <span>LINES <span className="acc">{lines.length}</span></span>
              <div className="sep"></div>
              <span>KEPT <span className="acc">{result.kept}</span></span>
              <div className="sep"></div>
              {result.dropped > 0 && (
                <><span>DROPPED <span className="warn">{result.dropped}</span></span><div className="sep"></div></>
              )}
              <span className="info">VALID {result.format.toUpperCase()}</span>
              <div style={{ flex: 1 }}></div>
              <span className="acc">● LIVE</span>
            </>
        }
      </div>
    </div>
  )
}

// Backwards-compat aliases
export { InputPanel as InputPane, OutputPanel as OutputPane }
