# 🎯 LetMe v2: Visual UI/UX Inspector & Debugger for AI (via MCP)

> **Jembatan visual presisi antara browser pengguna dan AI Coding Agent (Cursor, Antigravity, Claude Desktop, Windsurf, Cline) menggunakan Model Context Protocol (MCP).**

LetMe memungkinkan Anda memilih elemen UI/UX di web frontend, menggambar anotasi visual, mendeteksi bug layout & wireframe secara otomatis (dengan bantuan AI Vision), mengambil screenshot area interaktif, serta men-stage banyak elemen sekaligus dalam 1 klik — lengkap dengan kemampuan **Live CSS Preview dua arah**.

---

## 🚀 Fitur Baru di LetMe v2

- 🔲 **Desain Monokrom Anti-AI Slop**: Antarmuka hitam-putih minimalis bergaya Linear/Vercel tanpa gradien berlebihan dan teks promosi generik.
- 🎯 **Identitas Visual Baru (Pixel Grid Lens)**: Ikon kustom monokrom berbentuk lensa fokus dengan grid piksel dan target reticle presisi tinggi.
- 👆 **Multi-Element Stager (Pick Element)**:
  - Kemampuan memilih beberapa elemen sekaligus di halaman web.
  - Setiap elemen yang diklik langsung **otomatis ter-copy ke clipboard**.
  - **Floating Staging Pill** di pojok layar untuk mengelola daftar elemen terpilih, menghapus item tertentu, dan tombol **"Copy All Staged to AI"** untuk prompt multi-elemen terstruktur.
- ✂️ **Interactive Area Crop & Full Viewport Screenshot**:
  - Drag crosshair untuk crop area mana pun di layar.
  - Gambar PNG otomatis ter-copy ke clipboard dan dapat langsung di-download atau dikirim ke MCP.
- 🤖 **AI Auto Bug Detection (Vision AI)**:
  - Konfigurasi Base URL (OpenAI-compatible / OpenRouter / Groq / Ollama), API Key, dan Vision Model (e.g. `gpt-4o-mini`, `gemini-2.0-flash`).
  - Analisis otomatis visual screenshot: otomatis menaruh pin bug interaktif bernomor di layar dengan saran perbaikan CSS.
- 💬 **Draggable Text & Modal Inline**:
  - Modal input teks inline kustom langsung di kanvas (tanpa dialog `prompt()` browser).
  - Anotasi teks dapat di-drag dan dipindahkan posisinya secara bebas.
- 🔄 **Bidirectional Live Preview**:
  - AI dapat memanggil tool `letme_apply_css_preview` untuk langsung menguji perbaikan CSS di layar browser Anda secara instan tanpa reload.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                       CHROME BROWSER                        │
│                                                             │
│  [Webpage] ──> [Inspector / Multi-Pick / Area Crop]         │
│                          │                                  │
│                          ▼                                  │
│        [Background Service Worker (WebSocket)]              │
└──────────────────────────────┬──────────────────────────────┘
                               │  ws://127.0.0.1:8765
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      LOCAL MCP BRIDGE                       │
│                                                             │
│          [WebSocket Server (127.0.0.1:8765)]                │
│                         ↕                                   │
│      [MCP Server (@modelcontextprotocol/sdk)]               │
└──────────────────────────────┬──────────────────────────────┘
                               │  Stdio (Standard MCP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         AI HARNESS                          │
│          (Cursor / Antigravity / Claude / Windsurf)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalasi & Cara Pakai

### 1. Build Proyek
```bash
git clone https://github.com/your-username/LetMe.git
cd LetMe
npm install
npm run build
```

### 2. Pasang Ekstensi di Google Chrome
1. Buka Chrome dan navigasi ke `chrome://extensions/`.
2. Aktifkan **Developer mode** di pojok kanan atas.
3. Klik tombol **Load unpacked**.
4. Pilih folder: `LetMe/packages/extension/dist`.
5. Ekstensi **LetMe v2** dengan logo Pixel Grid Lens siap digunakan!

### 3. Konfigurasi AI Harness (Antigravity / Claude / Cursor)

Tambahkan ke konfigurasi MCP Anda (`~/.gemini/config/mcp_config.json` atau `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "letme": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/LetMe/packages/mcp-server/dist/index.js"]
    }
  }
}
```

---

## 🎮 Alur Penggunaan

### A. Element Inspector (Manual / Auto Bug Detect)
1. Tekan **`Alt + Shift + I`** atau klik ikon LetMe -> **Start Inspecting**.
2. Pilih mode **Manual** (coret-coret panah, ruler, box, teks draggable) atau **AI Auto Bug** (analisis otomatis via Vision AI).
3. Klik **Send to AI** (atau **Copy Prompt**).

### B. Multi-Element Stager
1. Buka popup LetMe -> Klik **Pick Elements & Staging**.
2. Klik elemen-elemen di halaman (setiap klik otomatis tercopy ke clipboard dan masuk ke *Staging Pill*).
3. Buka *Staging Pill* -> Klik **Copy All to AI** atau **Sync to MCP**.

### C. Screenshot Area
1. Buka popup LetMe -> Klik **Area Crop**.
2. Tarik kotak seleksi pada bagian yang ingin ditangkap.
3. Gambar otomatis tercopy ke clipboard dan siap di-download atau dikirim ke MCP.

---

## 🛠️ Daftar Tool MCP

| Nama Tool | Deskripsi |
| :--- | :--- |
| `letme_get_active_element` | Mengambil elemen yang terakhir diinspeksi: screenshot beranotasi (image block), CSS selector unik, HTML snippet, box model, laporan bug layout, dan catatan pengguna. |
| `letme_list_inspections` | Menampilkan riwayat seluruh elemen yang telah ditandai/distage oleh pengguna. |
| `letme_apply_css_preview` | Menyuntikkan aturan CSS live preview langsung ke elemen di browser pengguna. |
| `letme_clear_preview` | Mengembalikan tampilan styling di browser ke keadaan semula. |
| `letme_get_console_logs` | Mengambil log error dan peringatan konsol browser dari halaman yang aktif. |

---

## 🧪 Pengujian
```bash
npm test
```

## 📄 Lisensi
MIT
