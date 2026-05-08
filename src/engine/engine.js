// TextForge — Transform Engine
// Each transform: { id, label, group, icon, desc, defaultEnabled, defaultOpts, run(lines, opts) }
// Pipeline: input → split lines → reduce() through enabled non-format transforms → format render

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function csvEscape(v) {
  v = String(v)
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
}

// Generate column_1, column_2, … column_N for any column count
function genericColumns(count) {
  return Array.from({ length: count }, (_, i) => `column_${i + 1}`)
}

// Resolve column headers from a 2-D array of rows.
// hasHeader=true  → first row values become headers (falling back to generic for blank cells)
// hasHeader=false → always generate column_1, column_2, …
function resolveHeaders(rows, hasHeader) {
  if (!rows.length) return []
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0)
  if (hasHeader) {
    return rows[0].map((h, i) => h.trim() || `column_${i + 1}`)
  }
  return genericColumns(maxCols)
}

// Skip the header row when hasHeader is true
function getDataRows(rows, hasHeader) {
  return hasHeader && rows.length > 0 ? rows.slice(1) : rows
}

// Resolve the actual delimiter character from step opts.
// Handles both legacy { delim: ',' } and new { type, custom } formats.
export function getDelimChar(opts) {
  if (opts.delim !== undefined) return opts.delim
  switch (opts.type) {
    case 'tab':       return '\t'
    case 'pipe':      return '|'
    case 'semicolon': return ';'
    case 'custom':    return opts.custom || ','
    default:          return ','
  }
}

// Modular transform definitions — each implements run(lines, opts) → lines
export const TRANSFORMS = {
  trim: {
    id: 'trim', label: 'Trim Whitespace', group: 'clean', icon: 'TR',
    desc: 'Remove leading/trailing whitespace from each line',
    defaultEnabled: true, defaultOpts: {},
    run: (lines) => lines.map(l => l.trim()),
  },

  removeEmpty: {
    id: 'removeEmpty', label: 'Remove Empty Lines', group: 'clean', icon: 'RE',
    desc: 'Strip blank or whitespace-only lines',
    defaultEnabled: true, defaultOpts: {},
    run: (lines) => lines.filter(l => l.trim().length > 0),
  },

  dedupe: {
    id: 'dedupe', label: 'Remove Duplicates', group: 'clean', icon: 'DD',
    desc: 'Deduplicate lines, preserve order',
    defaultEnabled: true, defaultOpts: {},
    run: (lines) => [...new Set(lines)],
  },

  lowercase: {
    id: 'lowercase', label: 'Lowercase', group: 'clean', icon: 'LC',
    desc: 'Normalize case to lowercase',
    defaultEnabled: false, defaultOpts: {},
    run: (lines) => lines.map(l => l.toLowerCase()),
  },

  filter: {
    id: 'filter', label: 'Regex Filter', group: 'parse', icon: 'FL',
    desc: 'Keep or remove lines matching a regex',
    defaultEnabled: false, defaultOpts: { pattern: 'ERROR|WARN', mode: 'include' },
    run: (lines, opts) => {
      try {
        const re = new RegExp(opts.pattern || '.', 'i')
        return opts.mode === 'exclude'
          ? lines.filter(l => !re.test(l))
          : lines.filter(l => re.test(l))
      } catch {
        return lines
      }
    },
  },

  // splitDelim doesn't modify lines — it signals format steps to split rows into columns
  splitDelim: {
    id: 'splitDelim', label: 'Split by Delimiter', group: 'parse', icon: 'SD',
    desc: 'Split rows into structured columns',
    defaultEnabled: true, defaultOpts: { type: 'comma', custom: '', hasHeader: false },
    run: (lines) => lines,
  },

  extractTs: {
    id: 'extractTs', label: 'Extract Timestamp', group: 'parse', icon: 'TS',
    desc: 'Pull timestamp field to front',
    defaultEnabled: false, defaultOpts: {},
    run: (lines) => {
      const re = /(\d{4}-\d{2}-\d{2}[T ]?\d{0,2}:?\d{0,2}:?\d{0,2})/
      return lines.map(l => {
        const m = l.match(re)
        return m ? m[1] + ' | ' + l.replace(re, '').replace(/^[,\s]+/, '') : l
      })
    },
  },

  // Format transforms produce the final output — they are not applied through reduce()
  toJson: {
    id: 'toJson', label: 'Convert to JSON', group: 'format', icon: 'JS',
    desc: 'Structured JSON output',
    defaultEnabled: true, defaultOpts: {},
    run: (lines) => lines,
  },

  toCsv: {
    id: 'toCsv', label: 'Convert to CSV', group: 'format', icon: 'CS',
    desc: 'Properly escaped CSV rows',
    defaultEnabled: false, defaultOpts: {},
    run: (lines) => lines,
  },

  toTable: {
    id: 'toTable', label: 'Aligned Table', group: 'format', icon: 'TB',
    desc: 'Fixed-width terminal columns',
    defaultEnabled: false, defaultOpts: {},
    run: (lines) => lines,
  },
}

// Backwards-compat alias used by Pipeline component (reads .name, .opts)
export const STEP_DEFS = Object.fromEntries(
  Object.entries(TRANSFORMS).map(([k, v]) => [k, { ...v, name: v.label, opts: v.defaultOpts }])
)

// Core pipeline execution
// 1. Split input into lines
// 2. reduce() through enabled non-format transforms in order
// 3. Apply the last enabled format transform as a renderer
export function runPipeline(input, steps) {
  const result = {
    rawLines: 0, kept: 0, dropped: 0,
    format: 'text', output: '', rows: null, headers: null, error: null,
  }

  if (!input.trim()) return { ...result, output: '' }

  let lines = input.split('\n')
  result.rawLines = lines.length

  // Apply all enabled non-format transforms sequentially
  for (const step of steps) {
    if (!step.enabled) continue
    const def = TRANSFORMS[step.id]
    if (!def || def.group === 'format') continue
    try {
      lines = def.run(lines, step.opts)
    } catch (e) {
      result.error = e.message
    }
  }

  result.kept = lines.length
  result.dropped = result.rawLines - result.kept

  // Determine format (last enabled format step wins)
  const fmtStep = [...steps].reverse().find(s => s.enabled && TRANSFORMS[s.id]?.group === 'format')
  const splitStep = steps.find(s => s.enabled && s.id === 'splitDelim')

  if (!fmtStep || fmtStep.id === 'toJson') {
    result.format = 'json'
    if (splitStep) {
      const delim = getDelimChar(splitStep.opts)
      const delimRe = new RegExp(`\\s*${escapeRe(delim)}\\s*`)
      const hasHeader = splitStep.opts.hasHeader === true
      const allRows = lines.map(l => l.split(delimRe))
      const headers = resolveHeaders(allRows, hasHeader)
      const data = getDataRows(allRows, hasHeader)
      const objs = data.map(r => {
        const o = {}
        headers.forEach((h, i) => { o[h] = r[i] ?? '' })
        return o
      })
      result.output = JSON.stringify(objs, null, 2)
      result.rows = objs
      result.headers = headers
    } else {
      result.output = JSON.stringify(lines, null, 2)
    }
  } else if (fmtStep.id === 'toCsv') {
    result.format = 'csv'
    if (splitStep) {
      const delim = getDelimChar(splitStep.opts)
      const delimRe = new RegExp(`\\s*${escapeRe(delim)}\\s*`)
      const hasHeader = splitStep.opts.hasHeader === true
      const allRows = lines.map(l => l.split(delimRe))
      const headers = resolveHeaders(allRows, hasHeader)
      const data = getDataRows(allRows, hasHeader)
      result.output = [headers.map(csvEscape).join(','), ...data.map(r => r.map(csvEscape).join(','))].join('\n')
      result.headers = headers
      result.rows = data
    } else {
      result.output = lines.join('\n')
    }
  } else if (fmtStep.id === 'toTable') {
    result.format = 'table'
    if (splitStep) {
      const delim = getDelimChar(splitStep.opts)
      const delimRe = new RegExp(`\\s*${escapeRe(delim)}\\s*`)
      const hasHeader = splitStep.opts.hasHeader === true
      const allRows = lines.map(l => l.split(delimRe))
      const headers = resolveHeaders(allRows, hasHeader)
      const data = getDataRows(allRows, hasHeader)
      const widths = headers.map((h, i) => Math.max(h.length, ...data.map(r => (r[i] || '').length)))
      const fmtRow = (r) => headers.map((_, i) => (r[i] || '').padEnd(widths[i])).join('  ')
      result.output = [fmtRow(headers), widths.map(w => '─'.repeat(w)).join('  '), ...data.map(fmtRow)].join('\n')
      result.headers = headers
      result.rows = data
    } else {
      result.output = lines.join('\n')
    }
  }

  return result
}

export const SAMPLE_INPUT = `2025-05-20 09:14:02, ERROR, Failed to load user, 42
2025-05-20 09:14:02, ERROR, Failed to load user, 42
2025-05-20 09:14:08, WARN,  Timeout connecting to API, 8401
   2025-05-20 09:14:11, INFO, Retrying request, 200
2025-05-20 09:14:13, INFO, Success, 200

2025-05-20 09:14:14, DEBUG, Response time: 143ms, 143
2025-05-20 09:15:01, ERROR, Stripe webhook 500, 500
2025-05-20 09:15:09, INFO, Cache miss, 0
2025-05-20 09:15:09, INFO, Cache miss, 0
2025-05-20 09:15:22, WARN,  Slow query 2.3s, 2300`

export const DEFAULT_STEPS = [
  { id: 'trim',        enabled: true,  opts: {} },
  { id: 'removeEmpty', enabled: true,  opts: {} },
  { id: 'dedupe',      enabled: true,  opts: {} },
  { id: 'splitDelim',  enabled: true,  opts: { type: 'comma', custom: '', hasHeader: false } },
  { id: 'toJson',      enabled: true,  opts: {} },
]

// Migrate steps loaded from localStorage (legacy format → current format)
export function migrateSteps(steps) {
  return steps.map(step => {
    if (step.id === 'splitDelim') {
      let opts = { ...step.opts }
      // legacy { delim: ',' } → { type, custom }
      if (opts.delim !== undefined) {
        const typeMap = { ',': 'comma', '\t': 'tab', '|': 'pipe', ';': 'semicolon' }
        const type = typeMap[opts.delim] || 'custom'
        opts = { type, custom: type === 'custom' ? opts.delim : '', hasHeader: false }
      }
      // add hasHeader if missing
      if (opts.hasHeader === undefined) opts = { ...opts, hasHeader: false }
      return { ...step, opts }
    }
    if (step.id === 'filter' && step.opts.mode === undefined) {
      return { ...step, opts: { ...step.opts, mode: 'include' } }
    }
    return step
  })
}
