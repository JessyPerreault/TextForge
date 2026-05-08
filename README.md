<p align="center">
  <img src="public/textforge-logo.svg" alt="TextForge" width="320" />
</p>

<p align="center">
  A real-time text transformation tool built for developers and IT workflows.<br/>
  Paste messy data in, get clean structured output out — instantly, with no backend, no servers, and no "Run" button.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.4.1-39FF14?style=flat-square&labelColor=070A0D&color=39FF14" alt="version" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&labelColor=070A0D" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&labelColor=070A0D" alt="Vite" />
  <img src="https://img.shields.io/badge/license-MIT-39FF14?style=flat-square&labelColor=070A0D" alt="License" />
</p>

---

## What is TextForge?

TextForge is a browser-based utility that lets you clean, filter, and restructure text data through a visual pipeline. Think of it like a Swiss Army knife for log files, CSVs, and raw text dumps.

**The core idea is simple:**

```
Raw Input  →  Transform Pipeline  →  Structured Output
```

Every change you make — toggling a transform, editing a delimiter, typing in the input box — updates the output *instantly*. No submit button. No waiting. It just works.

---

## Features

- **Real-time pipeline** — output updates as you type or toggle transforms
- **8 built-in transforms** — trim, dedupe, filter, split, and format in any combination
- **Multiple output formats** — JSON, CSV, or aligned terminal table
- **Regex filter** with include/exclude mode
- **Split by delimiter** — comma, tab, pipe, semicolon, or custom
- **Saved Pipelines** — save your transform configurations and reapply them instantly
- **Transform History** — every run is automatically saved so you can restore previous sessions
- **File upload** — drag a `.txt`, `.csv`, or `.log` file directly into the app
- **Export** — download the output as a file
- **Keyboard shortcuts** for navigation
- **Fully client-side** — no backend, no accounts, no data leaves your machine
- **localStorage persistence** — your input, steps, and settings survive a page refresh

---

## Getting Started

### Prerequisites

You need **Node.js** installed on your computer. If you don't have it:

1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the one labeled "Recommended For Most Users")
3. Run the installer

To check if Node.js is already installed, open a terminal and run:

```bash
node --version
# Should print something like: v20.11.0
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JessyPerreault/TextForge.git
   ```

2. **Navigate into the project folder**

   ```bash
   cd TextForge
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

   This downloads all the libraries the project needs (React, Vite, etc.). It only needs to run once.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser** and go to:

   ```
   http://localhost:5173
   ```

   You should see the TextForge workspace. That's it!

### Stopping the server

Press `Ctrl + C` in the terminal where `npm run dev` is running.

---

## How to Use It

### The Layout

```
┌─────────────┬───────────────────────────────────────────────────────┐
│             │  Toolbar (command display, LIVE indicator, buttons)   │
│   Sidebar   ├──────────────────┬──────────┬──────────────────────  │
│             │                  │          │                          │
│  Transform  │   INPUT PANEL    │ PIPELINE │   OUTPUT PANEL          │
│  History    │                  │  COLUMN  │                          │
│  Saved      │  Paste your      │          │  Formatted result        │
│  Settings   │  raw text here   │  ──►──►  │  appears here           │
│             │                  │          │                          │
│             ├──────────────────┴──────────┴──────────────────────  │
│             │  Status bar                                            │
└─────────────┴───────────────────────────────────────────────────────┘
```

### Step 1 — Paste your data

Click the **INPUT** pane on the left and paste any raw text. You can also:
- Click **PASTE** to paste from your clipboard
- Click **UPLOAD** to load a file (`.txt`, `.csv`, `.log`, `.json`)
- Click **CLEAR** to wipe the input

### Step 2 — Configure your pipeline

The **Pipeline** panel in the middle shows your active transforms. Each card is one step:

- **Toggle the switch** on any card to enable or disable that step
- **Expand a card** (some steps have settings, like the delimiter for Split or the regex pattern for Filter)
- **Add steps** with the `+ add step` button at the bottom
- Click anywhere on a card row to toggle it on or off

Transforms run **top to bottom** — the output of one becomes the input of the next.

### Step 3 — Read the output

The **OUTPUT** pane on the right shows the result. It updates the moment anything changes.

- Click **COPY** to copy the output to your clipboard
- Click **>_ EXPORT** in the toolbar to download it as a file
- The badge in the top-right corner (`JSON`, `CSV`, `TABLE`) shows the current format

---

## Transforms Reference

### Clean

| Transform | What it does |
|-----------|-------------|
| **Trim Whitespace** | Removes leading and trailing spaces/tabs from every line |
| **Remove Empty Lines** | Deletes any line that is blank or contains only whitespace |
| **Remove Duplicates** | Removes repeated lines while keeping the first occurrence and original order |
| **Lowercase** | Converts every character to lowercase |

### Parse

| Transform | What it does |
|-----------|-------------|
| **Regex Filter** | Keeps (or removes) lines that match a regular expression. Toggle `include` / `exclude` to flip the behavior. Example pattern: `ERROR\|WARN` |
| **Split by Delimiter** | Splits each line into columns using a separator. Supports comma, tab, pipe (&#124;), semicolon, or a custom character. Used by the format steps to build structured output. |
| **Extract Timestamp** | Pulls a timestamp out of each line and moves it to the front |

### Format

These determine the shape of the final output. Only one format step is active at a time (the last enabled one wins).

| Transform | What it does |
|-----------|-------------|
| **Convert to JSON** | Outputs a JSON array. If Split is enabled, each row becomes an object with inferred field names. |
| **Convert to CSV** | Outputs comma-separated rows with a header line |
| **Aligned Table** | Renders fixed-width columns for easy reading in a terminal |

---

## Example Workflow

**Goal:** Take a messy server log and extract only the errors as JSON.

1. Paste the log into the INPUT pane:
   ```
   2025-05-20 09:14:02, ERROR, Failed to load user, 42
   2025-05-20 09:14:08, WARN,  Timeout connecting to API, 8401
   2025-05-20 09:14:11, INFO, Retrying request, 200
   2025-05-20 09:15:01, ERROR, Stripe webhook 500, 500
   ```

2. Enable these transforms in order:
   - ✅ Trim Whitespace
   - ✅ Remove Empty Lines
   - ✅ Remove Duplicates
   - ✅ Regex Filter → pattern: `ERROR`, mode: `include`
   - ✅ Split by Delimiter → type: `comma`
   - ✅ Convert to JSON

3. The OUTPUT pane instantly shows:
   ```json
   [
     {
       "timestamp": "2025-05-20 09:14:02",
       "level": "ERROR",
       "message": "Failed to load user",
       "value": 42
     },
     {
       "timestamp": "2025-05-20 09:15:01",
       "level": "ERROR",
       "message": "Stripe webhook 500",
       "value": 500
     }
   ]
   ```

4. Click **>_ SAVE** to save this pipeline as "errors-to-json" so you can reuse it later.

---

## Saving and Reusing Pipelines

### Save a pipeline

Once you have a set of transforms configured the way you like:

1. Click **>_ SAVE** in the toolbar (or go to **Saved Pipelines** and click **+ SAVE CURRENT**)
2. Enter a name (e.g., `logs-to-json`)
3. Optionally add a description
4. It's saved locally in your browser

### Apply a saved pipeline

1. Click **Saved Pipelines** in the left sidebar
2. Click any pipeline card
3. TextForge immediately switches back to the Transform view with those steps loaded

---

## Transform History

TextForge automatically saves a snapshot of every transform session (debounced — it waits 2 seconds after your last change before saving, so you don't get a snapshot for every keystroke).

To browse history:
1. Click **History** in the left sidebar
2. Use the search bar to filter by input name
3. Click any row to restore that session — the input and pipeline steps will be restored exactly as they were

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` (or `⌘ T`) | Switch to Transform view |
| `Ctrl + H` (or `⌘ H`) | Switch to History |
| `Ctrl + P` (or `⌘ P`) | Switch to Saved Pipelines |
| `Ctrl + ,` (or `⌘ ,`) | Switch to Settings |

---

## Settings

Found under **Settings** in the sidebar:

| Setting | What it does |
|---------|-------------|
| Normalize line endings to LF | Converts Windows-style `\r\n` line endings to Unix `\n` on paste and file upload |
| Show line numbers | Toggle the line number column in the editor panes |
| Subtle glow effects | Toggle the neon glow animations |
| Font size | Choose between 11px, 12px, 13px, and 14px for the editor |
| Clear history | Wipes all saved history entries from localStorage |
| Clear saved pipelines | Wipes all saved pipeline configurations |

---

## Project Structure

```
TextForge/
├── index.html                  # Entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite bundler config
├── tailwind.config.js          # TailwindCSS config
├── postcss.config.js           # PostCSS config
├── public/
│   └── fonts/
│       └── KodeMono-VariableFont_wght.ttf   # Monospace font
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Central state, history, pipeline management
    ├── styles/
    │   └── index.css           # All CSS (custom design system)
    ├── engine/
    │   └── engine.js           # Transform definitions and pipeline runner
    └── components/
        ├── Controls.jsx        # Reusable UI primitives (Button, Badge, Toggle, Input, Select)
        ├── Sidebar.jsx         # Left navigation sidebar
        ├── TopBar.jsx          # Top breadcrumb bar with live stats
        ├── Pipeline.jsx        # Pipeline panel with step cards and opts
        ├── Editor.jsx          # InputPanel, FlowArrow, OutputPanel
        └── Screens.jsx         # History, Saved Pipelines, Settings views
```

### How the engine works

`src/engine/engine.js` contains all transform logic. Each transform is a plain object:

```js
{
  id: 'filter',
  label: 'Regex Filter',
  group: 'parse',           // 'clean' | 'parse' | 'format'
  icon: 'FL',
  desc: 'Keep or remove lines matching a regex',
  defaultEnabled: false,
  defaultOpts: { pattern: 'ERROR|WARN', mode: 'include' },
  run: (lines, opts) => {
    const re = new RegExp(opts.pattern, 'i')
    return opts.mode === 'exclude'
      ? lines.filter(l => !re.test(l))
      : lines.filter(l => re.test(l))
  }
}
```

The pipeline runner does:

```js
// 1. Split input into lines
// 2. reduce() through every enabled non-format transform
// 3. Apply the last enabled format transform as a renderer
```

To add a new transform, add an entry to the `TRANSFORMS` object in `engine.js` — the Pipeline UI will automatically pick it up.

---

## Tech Stack

| Technology | Role |
|------------|------|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [TailwindCSS](https://tailwindcss.com) | CSS utility layer |
| [Kode Mono](https://fonts.google.com/specimen/Kode+Mono) | Monospace font |
| localStorage | Persistence (no database needed) |

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server at `localhost:5173` |
| `npm run build` | Build a production-ready bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

---

## License

MIT — do whatever you want with it.
