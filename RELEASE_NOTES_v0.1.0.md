# LetMe v0.1.0 — Initial Open-Source Release

High-precision visual UI/UX inspector, layout bug hunter, and multi-element debugging bridge for AI Coding Agents via Model Context Protocol (MCP).

---

## 📦 Downloads & Assets

| Asset | Description | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **[`letme-extension-v0.1.0.zip`](https://github.com/jinkaka98/LetMe/releases/download/v0.1.0/letme-extension-v0.1.0.zip)** | Pre-built Google Chrome Extension (Manifest V3) | ~43 KB | `4404fd61793f68abacbfca6550662256fa86f8d5626cb378872b7e40253f692e` |

---

## ⚡ Quick Start: Installing the Chrome Extension

1. Download **`letme-extension-v0.1.0.zip`** from the Assets below.
2. Unzip it into a folder on your computer.
3. Open Google Chrome and go to `chrome://extensions/`.
4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the unzipped folder.
6. The **LetMe** icon is now installed in your browser toolbar!

---

## 🤖 Connect to your AI Assistant (Cursor / Antigravity / Claude)

Run the MCP server directly via `npx` (no git clone required):

```json
{
  "mcpServers": {
    "letme": {
      "command": "npx",
      "args": ["-y", "@letme/mcp-server"]
    }
  }
}
```

Or install globally:
```bash
npm install -g @letme/mcp-server
letme-mcp
```

---

## ✨ What's Included in v0.1.0

- **Visual Element Inspector**: Inspect DOM hierarchy, compute sub-pixel box model metrics, and detect layout overflow bugs.
- **Canvas Markup Studio**: Draw arrows, bounding boxes, text annotations, pixel rulers, and censorship blur directly over any webpage.
- **AI Vision Auto Bug Hunter**: Viewport screenshot analysis with contextual text snapping and 60 FPS scroll tracking.
- **Multi-Element Stager**: Stage multiple components across sessions with custom developer notes and consolidated MCP dispatch.
- **Interactive Screenshot Studio**: Area crop crosshairs and full-viewport captures with auto-clipboard sync.
- **Bidirectional Live CSS Preview**: AI agents test CSS fixes on your live browser tab (`letme_apply_css_preview`) before writing code.
- **100% Official Lucide SVG Icons**: Minimalist, high-contrast monochrome design (Linear/Vercel aesthetic).

---

## 👨‍💻 Author & Maintainer
Created by **G assad S Eks Xixero1445** ([@jinkaka98](https://github.com/jinkaka98)).
Full documentation available at [GitHub Repository](https://github.com/jinkaka98/LetMe).
