# Chrome Extension: Trade Decision Checker

## Overview

A Chrome Extension that overlays a trade decision checker on TradingView. It provides a Side Panel for running the decision tree checklist, and a Content Script that disables TradingView's Buy/Sell buttons until the check passes.

## Goals

- Run the decision tree checklist without leaving TradingView
- Block trading buttons until a GO result is achieved
- Read-only: no data is written back to Supabase
- Visual consistency with the portal's glassmorphism style

## Architecture

```
extension/
├── manifest.json          Manifest V3
├── background.ts          Service Worker: message relay between Side Panel and Content Script
├── sidepanel.html         Side Panel entry point
├── sidepanel.ts           Decision tree logic + DOM rendering
├── sidepanel.css          Glassmorphism dark theme styles
├── content.ts             Injected into TradingView: monitors and locks trade buttons
├── content.css            Overlay/lock styles
└── icons/                 16/48/128px extension icons
```

### Manifest V3 Configuration

- `permissions`: `sidePanel`, `storage`
- `host_permissions`: `https://*.tradingview.com/*`
- `side_panel.default_path`: `sidepanel.html`
- `background.service_worker`: `background.js`
- `content_scripts`: match `https://*.tradingview.com/*`, inject `content.js` + `content.css`
- `action`: clicking the extension icon toggles the Side Panel

### Data Flow

1. Side Panel opens → fetch `TradingSystemData` from Supabase REST API (read-only)
2. Cache config in `chrome.storage.local`; on subsequent opens, use cache first, refresh in background
3. User walks through decision tree nodes entirely in the Side Panel
4. On GO result → `chrome.runtime.sendMessage({ type: 'CHECK_PASSED' })`
5. Background relays message to Content Script → Content Script removes trade button lock
6. On reset/timeout → `chrome.runtime.sendMessage({ type: 'CHECK_RESET' })` → re-lock

### Supabase Connection

- Supabase URL and anon key hardcoded in extension source (personal use only)
- Single fetch: `GET /rest/v1/trading_systems?id=eq.default&select=data` with `apikey` header
- No writes, no auth tokens

## Side Panel UI

Width: ~360px. Three states:

### State 1: Ready
- Title: "开单检查"
- Large "开始检查" button

### State 2: Checking
- Top: progress bar + category label (e.g. "市场结构", "入场确认")
- Center: question card with option buttons (same logic as portal's QuestionCard)
- Bottom: back button

### State 3: Result
- GO: green icon + execution plan (entry/SL/TP)
- CAUTION: yellow + suggestions
- NO-GO: red + reason
- "重新检查" button returns to State 1

Style: glassmorphism dark theme matching the portal (--bg-primary: #050508, glass cards, blue/purple gradient buttons).

## Content Script: Trade Button Locking

### Detection Logic

`MutationObserver` continuously watches TradingView DOM for the order panel / Buy / Sell buttons.

Three states detected:
1. **No broker connected** — buttons show "Connect Broker" or similar → do nothing, no lock
2. **Broker connected, check not passed** — Buy/Sell buttons active → apply lock overlay with `pointer-events: none` and "请先完成检查" tooltip
3. **Broker connected, check passed (GO)** — remove lock, buttons usable

### Lock Implementation

- Overlay div positioned absolutely over each trade button
- Semi-transparent dark background + lock icon + text
- `pointer-events: none` on the original buttons via CSS class injection
- Overlay has high `z-index` to sit above TradingView UI

### Unlock Trigger

- Side Panel sends `CHECK_PASSED` message → Content Script removes overlay
- Optional: auto re-lock after configurable timeout (e.g. 5 minutes)
- Page refresh → locked again by default (Content Script re-initializes)

### Selector Strategy

- Use `MutationObserver` on `document.body` to detect order panel appearance
- Target selectors for Buy/Sell buttons (will need initial inspection of TradingView DOM)
- If selectors fail to match (TV update), gracefully degrade: no lock applied, side panel still works

## Build

- TypeScript compiled with `esbuild`
- `package.json` script: `"build:extension": "esbuild extension/background.ts extension/sidepanel.ts extension/content.ts --bundle --outdir=extension/dist --format=iife"`
- Output: `extension/dist/` loaded as unpacked extension in Chrome
- No React, no framework dependencies

## What This Extension Does NOT Do

- Does not write any data to Supabase
- Does not create Trade records (that will be done via broker API later)
- Does not read any data from TradingView page
- Does not intercept or modify TradingView network requests
