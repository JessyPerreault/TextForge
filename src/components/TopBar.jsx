export function TopBar({ active, stats }) {
  const crumb = {
    transform: { path: ['workspace', 'transform'] },
    history:   { path: ['workspace', 'history'] },
    saved:     { path: ['workspace', 'pipelines'] },
    settings:  { path: ['workspace', 'settings'] },
  }[active]

  return (
    <div className="tf-topbar">
      <div className="crumb">
        <span className="acc">~</span>
        <span className="sep">/</span>
        <span>{crumb.path[0]}</span>
        <span className="sep">/</span>
        <span className="cur">{crumb.path[1]}</span>
      </div>
      <div className="tf-topbar-meta">
        {active === 'transform' && (
          <>
            <span className="item"><span className="k">IN</span><span className="v">{stats.rawLines}ℓ</span></span>
            <span className="item"><span className="k">OUT</span><span className="v" style={{ color: '#39FF14' }}>{stats.kept}ℓ</span></span>
            {stats.dropped > 0 && (
              <span className="item">
                <span className="k">DROPPED</span>
                <span className="v" style={{ color: '#FFD100' }}>{stats.dropped}</span>
              </span>
            )}
            <span className="item">
              <span className="k">PIPE</span>
              <span className="v">{stats.activeSteps}/{stats.totalSteps}</span>
            </span>
          </>
        )}
        <span className="item">
          <span className="k">MODE</span>
          <span className="v" style={{ color: '#39FF14' }}>LIVE</span>
        </span>
        <span className="item" style={{ color: '#39FF14' }}>● ENGINE</span>
      </div>
    </div>
  )
}
