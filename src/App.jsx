import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Sidebar } from './components/Sidebar.jsx'
import { TopBar } from './components/TopBar.jsx'
import { PipelinePanel } from './components/Pipeline.jsx'
import { InputPanel, FlowArrow, OutputPanel } from './components/Editor.jsx'
import { HistoryScreen, SavedScreen, SettingsScreen } from './components/Screens.jsx'
import {
  runPipeline, SAMPLE_INPUT, DEFAULT_STEPS, TRANSFORMS,
  migrateSteps,
} from './engine/engine.js'

// ── Persistence helpers ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  lineNums: true,
  glow: true,
  fontSize: '12',
  crlf: false,
  theme: 'dark',
}

function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v != null ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function saveStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── ActionBar ─────────────────────────────────────────────────────────────────
function ActionBar({ steps, result, pulse, onExport, onSavePipeline }) {
  const activeIds = steps.filter(s => s.enabled).map(s => s.id).join(',')

  return (
    <div className="tf-ws-toolbar">
      <span className="tf-ws-title">&gt;_ TRANSFORM</span>
      <span className="tf-ws-cmd">
        <span style={{ color: '#39FF14' }}>$ </span>
        <span className="c1">textforge </span>
        <span className="c2">transform </span>
        <span className="c3">--steps=</span>{activeIds || 'none'}
        <span className="c3"> --format=</span>{result.format}
      </span>
      <span className={`tf-live-dot ${pulse ? 'pulse' : ''}`}></span>
      <span className="tf-live-label">LIVE</span>
      <button className="tf-btn tf-btn-ghost" onClick={onSavePipeline}>&gt;_ SAVE</button>
      <button className="tf-btn tf-btn-secondary" onClick={onExport}>&gt;_ EXPORT</button>
    </div>
  )
}

// ── Transform View ─────────────────────────────────────────────────────────────
function TransformView({ steps, setSteps, input, setInput, result, settings, onSavePipeline }) {
  const [diff, setDiff] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pulse, setPulse] = useState(false)

  // Pulse the live dot on every pipeline recompute
  useEffect(() => {
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 280)
    return () => clearTimeout(t)
  }, [result.output])

  const fmtBadge = {
    json:  { variant: 'green', label: 'JSON' },
    csv:   { variant: 'cyan',  label: 'CSV' },
    table: { variant: 'amber', label: 'TABLE' },
    text:  { variant: 'muted', label: 'TEXT' },
  }[result.format] || { variant: 'green', label: 'JSON' }

  const handleCopy = () => {
    navigator.clipboard?.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setInput(settings.crlf ? t.replace(/\r\n/g, '\n') : t)
    } catch {}
  }

  const handleUpload = () => {
    const el = document.createElement('input')
    el.type = 'file'
    el.accept = '.txt,.csv,.log,.json,.tsv'
    el.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        let text = ev.target.result
        if (settings.crlf) text = text.replace(/\r\n/g, '\n')
        setInput(text)
      }
      reader.readAsText(file)
    }
    el.click()
  }

  const handleExport = () => {
    if (!result.output) return
    const ext = result.format === 'json' ? 'json' : result.format === 'csv' ? 'csv' : 'txt'
    const blob = new Blob([result.output], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `textforge-output.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <PipelinePanel steps={steps} setSteps={setSteps} dropped={result.dropped} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <ActionBar
          steps={steps}
          result={result}
          pulse={pulse}
          onExport={handleExport}
          onSavePipeline={onSavePipeline}
        />

        <div className="tf-ws-body">
          <InputPanel
            stageNum="01"
            value={input}
            onChange={setInput}
            onPaste={handlePaste}
            onUpload={handleUpload}
            onClear={() => setInput('')}
            settings={settings}
          />
          <FlowArrow active={result.kept > 0} pulse={pulse} />
          <OutputPanel
            stageNum="03"
            result={result}
            fmtBadge={fmtBadge}
            onCopy={handleCopy}
            onExport={handleExport}
            onDiff={setDiff}
            diff={diff}
            copied={copied}
            settings={settings}
          />
        </div>
      </div>
    </div>
  )
}

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive]           = useState(() => loadStorage('tf:view', 'transform'))
  const [input, setInputRaw]          = useState(() => loadStorage('tf:input', null) ?? SAMPLE_INPUT)
  const [steps, setSteps]             = useState(() => migrateSteps(loadStorage('tf:steps', DEFAULT_STEPS)))
  const [settings, setSettings]       = useState(() => loadStorage('tf:settings', DEFAULT_SETTINGS))
  const [history, setHistory]         = useState(() => loadStorage('tf:history', []))
  const [savedPipelines, setSaved]    = useState(() => loadStorage('tf:pipelines', []))

  const historyTimerRef = useRef(null)

  // Wrap setInput to optionally normalize CRLF
  const setInput = useCallback((val) => {
    setInputRaw(typeof val === 'function' ? val : (settings.crlf ? val.replace(/\r\n/g, '\n') : val))
  }, [settings.crlf])

  // Derive output from input + steps — this is the entire reactive core
  const result = useMemo(() => runPipeline(input, steps), [input, steps])

  // ── Persistence ──
  useEffect(() => saveStorage('tf:view', active), [active])
  useEffect(() => saveStorage('tf:input', input), [input])
  useEffect(() => saveStorage('tf:steps', steps), [steps])
  useEffect(() => saveStorage('tf:settings', settings), [settings])
  useEffect(() => saveStorage('tf:history', history), [history])
  useEffect(() => saveStorage('tf:pipelines', savedPipelines), [savedPipelines])

  // ── Auto-save history (debounced 2 s) ──
  useEffect(() => {
    if (!result.output || !input.trim()) return
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    historyTimerRef.current = setTimeout(() => {
      const firstLine = input.split('\n').find(l => l.trim())?.trim() || 'untitled'
      const name = firstLine.length > 42 ? firstLine.slice(0, 42) + '…' : firstLine
      const entry = {
        id: Date.now().toString(),
        name,
        input,
        steps: JSON.parse(JSON.stringify(steps)),
        output: result.output,
        format: result.format,
        lines: result.kept,
        rawLines: result.rawLines,
        dropped: result.dropped,
        timestamp: Date.now(),
        status: result.error ? 'error' : 'success',
      }
      setHistory(prev => {
        // Skip exact duplicate (same input + same enabled steps)
        const sig = input + steps.map(s => `${s.id}:${s.enabled}`).join(',')
        const deduped = prev.filter(h => {
          const hSig = h.input + (h.steps || []).map(s => `${s.id}:${s.enabled}`).join(',')
          return hSig !== sig
        })
        return [entry, ...deduped].slice(0, 50)
      })
    }, 2000)
    return () => { if (historyTimerRef.current) clearTimeout(historyTimerRef.current) }
  }, [result.output]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() === 't') { e.preventDefault(); setActive('transform') }
      if (e.key.toLowerCase() === 'h') { e.preventDefault(); setActive('history') }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); setActive('saved') }
      if (e.key === ',')               { e.preventDefault(); setActive('settings') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Pipeline actions ──
  const savePipeline = useCallback(() => {
    const name = window.prompt('Pipeline name:', `pipeline-${new Date().toISOString().slice(0, 10)}`)
    if (!name?.trim()) return
    const desc = window.prompt('Description (optional):', '') ?? ''
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      desc: desc.trim(),
      steps: JSON.parse(JSON.stringify(steps)),
      createdAt: Date.now(),
      runs: 0,
      lastUsed: Date.now(),
    }
    setSaved(prev => [entry, ...prev])
  }, [steps])

  const applyPipeline = useCallback((pipeline) => {
    setSteps(migrateSteps(pipeline.steps))
    setSaved(prev =>
      prev.map(p => p.id === pipeline.id ? { ...p, runs: p.runs + 1, lastUsed: Date.now() } : p)
    )
    setActive('transform')
  }, [])

  const deletePipeline = useCallback((id) => {
    setSaved(prev => prev.filter(p => p.id !== id))
  }, [])

  const restoreHistory = useCallback((item) => {
    setInputRaw(item.input)
    setSteps(migrateSteps(item.steps || steps))
    setActive('transform')
  }, [steps])

  const stats = {
    rawLines: result.rawLines,
    kept: result.kept,
    dropped: result.dropped,
    activeSteps: steps.filter(s => s.enabled).length,
    totalSteps: steps.length,
  }

  return (
    <div className="tf-app">
      <Sidebar
        active={active}
        onNav={setActive}
        savedCount={savedPipelines.length}
        historyCount={history.length}
      />
      <div className="tf-main">
        <TopBar active={active} stats={stats} />

        {active === 'transform' && (
          <TransformView
            steps={steps}
            setSteps={setSteps}
            input={input}
            setInput={setInput}
            result={result}
            settings={settings}
            onSavePipeline={savePipeline}
          />
        )}

        {active === 'history' && (
          <HistoryScreen
            history={history}
            onRestore={restoreHistory}
          />
        )}

        {active === 'saved' && (
          <SavedScreen
            savedPipelines={savedPipelines}
            onApply={applyPipeline}
            onDelete={deletePipeline}
            onSave={savePipeline}
          />
        )}

        {active === 'settings' && (
          <SettingsScreen
            settings={settings}
            onSettingsChange={setSettings}
            onClearHistory={() => { if (window.confirm('Clear all history?')) setHistory([]) }}
            onClearPipelines={() => { if (window.confirm('Clear all saved pipelines?')) setSaved([]) }}
          />
        )}
      </div>
    </div>
  )
}
