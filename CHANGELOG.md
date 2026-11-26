# Changelog

All notable changes to **LetMe** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-11-26

### Added
- **LetMe Studio & 3-Tab Control HUD**: Rebranded the floating inspector studio to **LetMe Studio** with dedicated **Layers**, **SCR**, and **AI Vision** tabs, auto-named layers (`Layer 1`, `Layer 2`, ...), per-layer copy/raw/delete actions, and a floating red exit button (`×`).
- **SCR Studio & Full Desktop Editor (`ScrEditorModal`)**:
  - 4 capture modes: **Area Crop**, **Full Viewport**, **Active Layer**, and **Delay 3s**.
  - Pre-capture controls: *Include Canvas Markups*, *Hide Studio HUD*, *Padding* (`0`/`16`/`32px`), *Format* (`PNG`/`JPEG`), and *Auto Copy*.
  - Screenshot Layers list (`SCR 1`, `SCR 2`, ...) with **Edit**, **Copy**, **Download**, **Send to AI**, and **Delete**.
  - Full Desktop (`100vw × 100vh`) workspace with Left Tool Dock, `Zoom: Fit / 100%`, `Space + Drag` / Middle-Click 4-way panning, hidden native scrollbars, Blueprint Frame toggle, and multi-line Caption / AI Instructions.
- **Flexible Sticky Note Tool (5 Themes)**: Added draggable, inline-editable **Sticky Notes** to both the main Studio Toolbar (`N`) and **Edit SCR**, featuring 5 switchable themes (*Amber, Rose, Sky, Mint, Blueprint*) via an icon-only theme button on each note.
- **Unified `MarkupStudio` Engine (`fullscreen` & `contained` modes)**: Unified Edit SCR on top of `MarkupStudio`, bringing **Inline Text Input** (replacing browser `prompt()`), **Move/Resize/Rotate (`select`)**, **Line**, **Ruler**, **Redo (`Ctrl+Y`)**, **Eraser (1-per-1)**, and persistent `annotations` across re-edits.
- **Smart Copy (Auto-Save + Multi-MIME + Caption Footer)**: Clicking **Copy** in Edit SCR automatically saves changes, writes both `image/png` and `text/plain` to the clipboard, and optionally renders a clean caption footer onto the exported image.
- **Framework Source Mapping & Semantic Anchors (`MAIN` World Bridge)**: Added `mainWorldBridge.js` (`world: "MAIN"`) to extract **React Fiber** (`componentName`, `ownerChain`, `filePath`, `lineRange`) and **Vue** component metadata, plus `nearestHeading`, `ariaLabel`, `role`, and `dataTestId`.
- **Closed-Loop Resolution (`letme_resolve_inspection`)**: Added status tracking (`pending` / `resolved`) on snapshots and the `letme_resolve_inspection` MCP tool so AI coding agents can mark inspections resolved after applying fixes.

### Changed
- **Compact Equal-Level Main Popup**: Removed the `AI Audit` grouping container so `Pick Studio`, `Pick with AI`, and `Screenshot` sit as equal-level buttons, with active provider/model info (`Custom: qd-Qwen4-Max`) embedded cleanly inside `Pick with AI`.
- **Release Packaging**: Updated `packageRelease.py` to dynamically version archive outputs from `manifest.json` (`release/letme-extension-v3.0.0.zip`).

---

## [0.2.0] - 2026-11-25

### Added
- **Inspector HUD v5 & v6**: Right Slider (`MCP (N)` storage + Copy History + MCP History), Undo/Redo toolbar controls, collapsible *Additional Final Instructions*, and `Settings → Config` tab with MCP port & one-click integration prompt.
- **Monochrome Blueprint Popup & Custom Shortcuts**: Added Dynamic Island screenshot selector and customizable multi-key shortcuts (`Alt+Shift+I`, `Alt+Shift+A`, `Alt+Shift+S`).

---

## [0.1.0] - 2026-11-24

### Added
- Initial monorepo architecture (`@letme/shared`, `@letme/mcp-server`, `@letme/extension`).
- Core Element Inspector, Box Model & Layout Bug Diagnostics, Canvas Markup Studio, Bidirectional Live CSS Preview (`letme_apply_css_preview`, `letme_clear_preview`), and AI Vision Auto Bug Hunter.
