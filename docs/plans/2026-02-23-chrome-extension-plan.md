# Chrome Extension: Trade Decision Checker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Manifest V3 Chrome Extension with a Side Panel that runs the trading decision tree checklist, and a Content Script that disables TradingView's Buy/Sell buttons until the check passes GO.

**Architecture:** Side Panel fetches `TradingSystemData` from Supabase REST API (read-only, hardcoded credentials), renders a vanilla TypeScript decision tree UI with glassmorphism styling. Background service worker relays `CHECK_PASSED` / `CHECK_RESET` messages between Side Panel and Content Script. Content Script uses `MutationObserver` to detect and lock/unlock TradingView trade buttons.

**Tech Stack:** TypeScript, esbuild (IIFE bundles), Chrome Extension Manifest V3 (Side Panel API, Content Scripts, chrome.storage.local), Supabase REST API (fetch, no SDK).

---

## Task 1: Project Scaffold & Build Pipeline

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/icons/` (placeholder PNGs)
- Create: `extension/tsconfig.json`
- Modify: `package.json` (add build:ext script)

### Step 1: Create the extension directory structure

```bash
mkdir -p extension/icons extension/dist
```

### Step 2: Create `extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Trade Decision Checker",
  "version": "1.0.0",
  "description": "开单前检查 — 在 TradingView 上运行交易决策树",
  "permissions": ["sidePanel", "storage"],
  "host_permissions": ["https://*.tradingview.com/*"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "dist/background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://*.tradingview.com/*"],
      "js": ["dist/content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_title": "开单检查",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Step 3: Create placeholder icons

```bash
touch extension/icons/icon16.png extension/icons/icon48.png extension/icons/icon128.png
```

> Replace with real icons before publishing. A simple green checkmark on dark background works.

### Step 4: Create `extension/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "lib": ["ES2020", "DOM"],
    "types": ["chrome"]
  },
  "include": ["*.ts"],
  "exclude": ["dist"]
}
```

### Step 5: Install chrome types & esbuild

```bash
npm install --save-dev @types/chrome esbuild
```

### Step 6: Add build scripts to `package.json`

Add to `"scripts"`:
```json
"build:ext": "esbuild extension/background.ts extension/sidepanel.ts extension/content.ts --bundle --outdir=extension/dist --format=iife --target=es2020",
"watch:ext": "esbuild extension/background.ts extension/sidepanel.ts extension/content.ts --bundle --outdir=extension/dist --format=iife --target=es2020 --watch"
```

### Step 7: Create stub TypeScript files so build works

**extension/background.ts:**
```typescript
console.log('[TDC] Background service worker loaded');
```

**extension/sidepanel.ts:**
```typescript
console.log('[TDC] Side panel loaded');
```

**extension/content.ts:**
```typescript
console.log('[TDC] Content script loaded on TradingView');
```

### Step 8: Verify build succeeds

```bash
npm run build:ext
ls extension/dist/
```

Expected: `background.js`, `sidepanel.js`, `content.js`

### Step 9: Commit

```bash
git add extension/ package.json package-lock.json
git commit -m "feat(extension): scaffold Chrome extension with Manifest V3 and esbuild build"
```

---

## Task 2: Side Panel HTML Shell & CSS

**Files:**
- Create: `extension/sidepanel.html`
- Create: `extension/sidepanel.css`

### Step 1: Create `extension/sidepanel.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>开单检查</title>
  <link rel="stylesheet" href="sidepanel.css" />
</head>
<body>
  <div id="app">
    <header id="header">
      <h1 class="header-title">开单检查</h1>
      <button id="reset-btn" class="header-btn hidden" title="重新检查">↺ 重来</button>
    </header>
    <div id="progress-area" class="hidden">
      <div class="progress-info">
        <span id="progress-step"></span>
        <span id="progress-category"></span>
      </div>
      <div class="progress-bar">
        <div id="progress-fill" class="progress-fill"></div>
      </div>
    </div>
    <main id="main"></main>
  </div>
  <script src="dist/sidepanel.js"></script>
</body>
</html>
```

### Step 2: Create `extension/sidepanel.css`

Port the glassmorphism dark theme. Key sections: root variables, reset, layout, header, progress bar, welcome card, question card, options, result card, execution plan, suggestions, decision path, loading state. All variables match the portal (--bg-primary: #050508, --accent-blue: #3b82f6, --accent-purple: #8b5cf6, --go-green: #22c55e, --caution-yellow: #eab308, --nogo-red: #ef4444).

Full CSS is ~250 lines covering:
- Root variables & reset
- `#app` layout (flex column, 16px padding)
- `.hidden` utility
- Header with gradient title
- Progress bar with blue-purple gradient fill
- `.welcome-card` centered with start button
- `.question-card` glass background with category badge, title, description, options list
- `.option-btn` with hover states
- `.back-btn` minimal text button
- `.result-card` with `.result-bg-go/.result-bg-caution/.result-bg-nogo` variants
- `.execution-plan` grid (entry/SL/TP)
- `.suggestions-box` with bullet list
- `.decision-path-toggle` and `.decision-path` expandable
- `.loading` spinner animation
- `@keyframes fadeSlideUp` and `@keyframes spin`

### Step 3: Verify HTML loads

```bash
npm run build:ext
```

### Step 4: Commit

```bash
git add extension/sidepanel.html extension/sidepanel.css
git commit -m "feat(extension): add Side Panel HTML shell and glassmorphism CSS"
```

---

## Task 3: Shared Types

**Files:**
- Create: `extension/types.ts`

### Step 1: Create `extension/types.ts`

Copy type definitions from `src/types/decisionTree.ts`, stripping React-specific types. Add extension message types:

```typescript
// Types needed: TreeOption, TreeNode, ExecutionPlan, ResultNode,
// DecisionTreeConfig, DecisionRecord, ContextFilter, TradingSystemData

// Extension-specific message type:
export type ExtensionMessage =
  | { type: 'CHECK_PASSED' }
  | { type: 'CHECK_RESET' }
  | { type: 'PING' };
```

### Step 2: Verify types compile

```bash
npx tsc --noEmit -p extension/tsconfig.json
```

### Step 3: Commit

```bash
git add extension/types.ts
git commit -m "feat(extension): add shared type definitions"
```

---

## Task 4: Supabase Data Fetcher

**Files:**
- Create: `extension/supabase.ts`

### Step 1: Create `extension/supabase.ts`

Minimal fetch-based client (no SDK). Hardcoded URL + anon key (personal use). Pattern:

1. `fetchTradingSystem()` — direct REST call: `GET /rest/v1/trading_systems?id=eq.default&select=data` with `apikey` header
2. `loadSystemData()` — try `chrome.storage.local` cache first, fetch remote if miss, background-refresh if hit
3. `getCached()` / `setCache()` — chrome.storage.local wrappers

> Replace `__SUPABASE_URL__` and `__SUPABASE_ANON_KEY__` with real values from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

### Step 2: Verify build

```bash
npm run build:ext
```

### Step 3: Commit

```bash
git add extension/supabase.ts
git commit -m "feat(extension): add Supabase REST fetcher with chrome.storage cache"
```

---

## Task 5: Decision Tree Engine (Vanilla TS)

**Files:**
- Create: `extension/decisionEngine.ts`

### Step 1: Create `extension/decisionEngine.ts`

Port `useDecisionTree` logic to a plain class with observer pattern:

```typescript
export class DecisionEngine {
  // State: currentNodeId, decisions[], result
  // Methods: selectOption(value), goBack(), reset(), getState(), subscribe(listener)
  // Logic identical to useDecisionTree hook but without React
}
```

Key behaviors to preserve:
- `selectOption()`: find option, push to decisions, navigate to next node or set result
- `goBack()`: if result exists, clear result and go to last decision's node; otherwise pop decision and go back
- `reset()`: return to rootNodeId, clear decisions and result
- `progress`: `Math.min((decisions.length / 10) * 100, 95)`
- Observer pattern: `subscribe(listener)` returns unsubscribe function, `emit()` calls all listeners with current state

### Step 2: Verify build

```bash
npm run build:ext
```

### Step 3: Commit

```bash
git add extension/decisionEngine.ts
git commit -m "feat(extension): add vanilla TypeScript decision tree engine"
```

---

## Task 6: Side Panel Renderer

**Files:**
- Modify: `extension/sidepanel.ts`

### Step 1: Implement `extension/sidepanel.ts`

Main UI logic — uses DOM manipulation to render three states:

**Init flow:**
1. Show loading spinner
2. Call `loadSystemData()` from supabase.ts
3. If fail → show error with retry button
4. If success → create `DecisionEngine`, subscribe to state changes, render ready screen

**State change handler (`onStateChange`):**
- If `result` exists → `renderResult()`, hide progress, show reset btn, send `CHECK_PASSED` or `CHECK_RESET`
- If `currentNode` exists → `renderQuestion()`, show progress bar, update step/category
- Otherwise → `renderReady()`, hide progress, send `CHECK_RESET`

**Render functions:**
- `renderReady()` — welcome card with "开始检查" button
- `renderQuestion(state)` — category badge, question title, description, option buttons, back button
- `renderResult(result, decisions)` — result icon/title/message, execution plan (GO only), suggestions (non-GO), expandable decision path, back + reset buttons

**DOM construction approach:**
- Use `document.createElement()` for all elements
- Build DOM trees programmatically (no innerHTML with untrusted content)
- Bind click handlers after element creation via `addEventListener`
- Use `escapeHtml()` utility (create temp div, set textContent, read innerHTML) for any user-facing text

**Message passing:**
- On GO result: `chrome.runtime.sendMessage({ type: 'CHECK_PASSED' })`
- On reset/non-GO: `chrome.runtime.sendMessage({ type: 'CHECK_RESET' })`

### Step 2: Verify build

```bash
npm run build:ext
```

### Step 3: Commit

```bash
git add extension/sidepanel.ts
git commit -m "feat(extension): implement Side Panel decision tree UI renderer"
```

---

## Task 7: Background Service Worker

**Files:**
- Modify: `extension/background.ts`

### Step 1: Implement `extension/background.ts`

Two responsibilities:

1. **Side Panel toggle:** `chrome.action.onClicked` → `chrome.sidePanel.open({ tabId })`
2. **Message relay:** `chrome.runtime.onMessage` listener — when `CHECK_PASSED` or `CHECK_RESET` arrives from side panel (no `sender.tab`), broadcast to all TradingView tabs via `chrome.tabs.query({ url: 'https://*.tradingview.com/*' })` then `chrome.tabs.sendMessage()`

### Step 2: Verify build

```bash
npm run build:ext
```

### Step 3: Commit

```bash
git add extension/background.ts
git commit -m "feat(extension): implement background service worker for message relay"
```

---

## Task 8: Content Script — Trade Button Locking

**Files:**
- Modify: `extension/content.ts`
- Create: `extension/content.css`

### Step 1: Create `extension/content.css`

Lock overlay styles:
- `.tdc-lock-overlay`: absolute positioned, dark semi-transparent bg, blur, centered "🔒 请先完成检查" text, high z-index, cursor: not-allowed
- `.tdc-locked`: `pointer-events: none !important`, `position: relative`

### Step 2: Implement `extension/content.ts`

State: `checkPassed = false` (default locked)

**Button detection:**
- `ORDER_PANEL_SELECTORS` array targeting TradingView's order panel Buy/Sell buttons
- Common patterns: `[data-name="submit-button-buy"]`, `[data-name="submit-button-sell"]`, `button.buy-sell-button-*`
- `findTradeButtons()` queries all selectors, returns HTMLElement[]

**Broker connection check:**
- `isBrokerConnected()` — look for visible "Connect Broker" buttons; if found & visible, return false
- Default to true if no connect buttons found

**Lock/Unlock:**
- `lockButton(btn)` — add `.tdc-locked` class, append overlay div
- `unlockButton(btn)` — remove class and overlay
- `updateLockState()` — find buttons; if none → do nothing; if broker not connected → unlock all; if checkPassed → unlock; else → lock

**Observers:**
- `MutationObserver` on `document.body` (childList + subtree) → `updateLockState()`
- `setInterval(updateLockState, 2000)` as backup
- `chrome.runtime.onMessage` listener for `CHECK_PASSED` / `CHECK_RESET`

### Step 3: Verify build

```bash
npm run build:ext
ls extension/dist/
```

### Step 4: Commit

```bash
git add extension/content.ts extension/content.css
git commit -m "feat(extension): implement Content Script for TradingView trade button locking"
```

---

## Task 9: Generate Extension Icons

**Files:**
- Modify: `extension/icons/icon16.png`, `icon48.png`, `icon128.png`

### Step 1: Generate simple colored square icons

```bash
# Using ImageMagick if available:
convert -size 16x16 xc:'#3b82f6' extension/icons/icon16.png
convert -size 48x48 xc:'#3b82f6' extension/icons/icon48.png
convert -size 128x128 xc:'#3b82f6' extension/icons/icon128.png
```

> Replace with proper designed icons later.

### Step 2: Commit

```bash
git add extension/icons/
git commit -m "feat(extension): add placeholder extension icons"
```

---

## Task 10: Fill In Supabase Credentials & End-to-End Test

**Files:**
- Modify: `extension/supabase.ts` (replace placeholder URLs)

### Step 1: Get Supabase credentials

Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project environment. Replace `__SUPABASE_URL__` and `__SUPABASE_ANON_KEY__` in `extension/supabase.ts`.

### Step 2: Build

```bash
npm run build:ext
```

### Step 3: Load extension in Chrome

1. `chrome://extensions/` → Developer mode → Load unpacked → select `extension/` directory
2. Extension appears with icon

### Step 4: Test Side Panel

1. Navigate to `https://www.tradingview.com/chart/`
2. Click extension icon → Side Panel opens
3. "开始检查" → walk through decision tree → reach result
4. GO result → console shows `CHECK_PASSED`

### Step 5: Test Content Script button locking

1. Open TradingView order panel (broker connected)
2. Before check: Buy/Sell buttons locked with overlay
3. After GO: locks removed
4. Reset: locks re-applied
5. Page refresh: locked by default

### Step 6: Debug selectors if needed

Inspect TradingView DOM for Buy/Sell button selectors. Update `ORDER_PANEL_SELECTORS` in content.ts if they don't match. Rebuild and reload.

### Step 7: Commit

```bash
git add extension/supabase.ts
git commit -m "feat(extension): add Supabase credentials and verify end-to-end flow"
```

---

## Task 11: Final Commit

### Step 1: Verify all states

1. Ready → Checking → GO/CAUTION/NO-GO results
2. Button locking: no-broker (no lock) → broker+no-check (locked) → broker+GO (unlocked) → reset (re-locked) → page refresh (re-locked)
3. Cache: first load fetches, subsequent loads use cache with background refresh

### Step 2: Final commit

```bash
git add -A
git commit -m "feat(extension): Chrome Extension v1.0 — trade decision checker with TradingView integration"
```

---

## File Summary

```
extension/
├── manifest.json          # Manifest V3 config
├── tsconfig.json          # TS config for extension
├── types.ts               # Shared type definitions
├── supabase.ts            # Supabase REST fetcher + chrome.storage cache
├── decisionEngine.ts      # Vanilla TS decision tree engine
├── background.ts          # Service worker: message relay + side panel toggle
├── sidepanel.html         # Side Panel entry point
├── sidepanel.ts           # Side Panel UI renderer (DOM manipulation)
├── sidepanel.css          # Glassmorphism dark theme
├── content.ts             # Content Script: TradingView button locking
├── content.css            # Lock overlay styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── dist/                  # Built JS (gitignored)
    ├── background.js
    ├── sidepanel.js
    └── content.js
```
