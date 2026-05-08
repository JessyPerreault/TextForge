export function TfBadge({ variant = 'green', children, style }) {
  return <span className={`tf-badge tf-badge-${variant}`} style={style}>{children}</span>
}

export function TfInput({ placeholder, value, onChange, style }) {
  return (
    <div className="tf-input-wrap" style={style}>
      <span className="tf-input-prompt">&gt;_</span>
      <input className="tf-input" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  )
}

export function TfSelect({ options, value, onChange, style }) {
  return (
    <select className="tf-select" value={value} onChange={onChange} style={style}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  )
}

export function TfToggle({ label, checked, onChange }) {
  return (
    <div className="tf-toggle-wrap" onClick={(e) => { e.stopPropagation(); onChange(!checked) }}>
      <div className={`tf-toggle-track ${checked ? 'on' : ''}`}>
        <div className="tf-toggle-thumb"></div>
      </div>
      {label ? <span className="tf-toggle-label">{label}</span> : null}
    </div>
  )
}
