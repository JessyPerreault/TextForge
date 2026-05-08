export function Sidebar({ active, onNav, savedCount, historyCount }) {
  const items = [
    { id: 'transform', label: 'Transform',       key: 'T' },
    { id: 'history',   label: 'History',          key: 'H', count: historyCount },
    { id: 'saved',     label: 'Saved Pipelines',  key: 'P', count: savedCount },
    { id: 'settings',  label: 'Settings',         key: ',' },
  ]

  return (
    <aside className="tf-sidebar">
      <div className="tf-sidebar-brand">
        <div className="tf-sidebar-logo">
          <span className="p">&gt;_</span>
          <span><span className="t">TEXT</span><span className="f">FORGE</span></span>
        </div>
      </div>

      <div className="tf-sidebar-section">// nav</div>
      <nav className="tf-nav-list">
        {items.map(it => (
          <div
            key={it.id}
            className={`tf-nav-item ${active === it.id ? 'active' : ''}`}
            onClick={() => onNav(it.id)}
          >
            <span className="tf-nav-prompt">&gt;</span>
            <span className="tf-nav-label">{it.label}</span>
            {it.count != null && <span className="tf-nav-count">{it.count}</span>}
            <span className="tf-nav-key">⌘{it.key}</span>
          </div>
        ))}
      </nav>

      <div className="tf-sidebar-footer">
        <div className="tf-sidebar-status">
          <div className="tf-status-dot-mini"></div>
          <span>ENGINE READY</span>
        </div>
        <div className="tf-sidebar-meta">
          v0.4.1 · build 2046<br />
          // clean. transform. forge.
        </div>
      </div>
    </aside>
  )
}
