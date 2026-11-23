<p align="center">
  <img src="packages/extension/public/icons/logo.svg" alt="Logo LetMe" width="100" height="100" />
</p>

<h1 align="center">LetMe</h1>

<p align="center">
  <b>Inspektor visual UI/UX presisi tinggi, pelacak bug layout, dan jembatan debugging multi-elemen untuk AI Coding Agent via Model Context Protocol (MCP).</b>
</p>

<p align="center">
  <a href="#lisensi"><img src="https://img.shields.io/badge/Lisensi-MIT-blue.svg?style=flat-square" alt="Lisensi: MIT" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://developer.chrome.com/docs/extensions/mv3/"><img src="https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" /></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-Compatible-black?style=flat-square" alt="MCP Compatible" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D18.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> &bull; <a href="README.id.md"><b>Bahasa Indonesia</b></a>
</p>

---

## Gambaran Umum

Prompt berbasis teks saja sangat tidak efektif untuk menyampaikan bug visual, hierarki antarmuka, dan tata letak frontend kepada AI coding assistant. Menjelaskan pergeseran layout CSS, pemotongan elemen (*clipping*), tabrakan *z-index*, dan *responsive wrapping* yang bermasalah di dalam chat sering kali berujung pada tebak-tebakan kode yang memakan waktu.

**LetMe** mengatasi kesenjangan ini. LetMe menghubungkan layar browser aktif Anda secara langsung ke AI Coding Agent (**Google Antigravity**, **Cursor**, **Claude Desktop**, **Windsurf**, dan **Cline**) menggunakan protokol standar terbuka [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

Dengan LetMe, Anda dapat menginspeksi elemen DOM, menggambar anotasi visual pada kanvas, menjalankan audit otomatis berbasis Vision AI, men-stage banyak komponen sekaligus, serta mengizinkan asisten AI menyuntikkan **live CSS preview dua arah** langsung ke dalam tab browser Anda sebelum melakukan perubahan kode.

---

## Fitur Utama

### 1. Precision Element Inspector
- **Telemetri Box Model Lengkap**: Mengukur dimensi konten, padding, border, dan margin hingga tingkat sub-piksel presisi.
- **Ekstraksi Computed Styles**: Mengekstrak aturan tata letak penting (`display`, `position`, `flex`, `grid`, `z-index`, `overflow`) secara bersih tanpa informasi berlebih.
- **Pembuatan Selector DOM Otomatis**: Menghasilkan CSS selector unik (`div.card > span#title`) dan cuplikan outerHTML yang ringkas.
- **Diagnostik Layout Otomatis**: Mendeteksi secara instan pemotongan oleh elemen induk (*ancestor clipping*), tabrakan *z-index*, dan kebocoran horizontal scrollbar.

### 2. Canvas Markup Studio
- **Anotasi Vektor Overlay**: Menggambar panah, kotak pembatas, penggaris pengukur piksel, catatan teks yang dapat digeser (*draggable*), dan kotak sensor blur langsung di atas halaman web.
- **Kanvas Non-Destruktif**: Seluruh coretan dirender pada lapisan kanvas transparan tanpa mengubah struktur DOM atau styling halaman web asli.

### 3. AI Vision Auto Bug Hunter
- **Audit Otomatis Multimodal**: Memanfaatkan model Vision LLM (misalnya Google Gemini 2.0 Flash, Claude 3.5 Sonnet, atau GPT-4o via OpenRouter, Groq, atau Ollama) untuk mendeteksi cacat visual, misalignment, dan teks terpotong secara mandiri.
- **Contextual DOM Text Snapping**: Menghubungkan temuan visual AI langsung ke elemen DOM nyata yang bersangkutan berdasarkan teks target.
- **Sinkronisasi Scroll 60 FPS**: Menggunakan `requestAnimationFrame` berkinerja tinggi sehingga pin dan kotak pembatas tetap menempel presisi saat halaman digulir cepat.
- **Drawer Slide-over Interaktif**: Meninjau bug berdasarkan tingkat keparahan (*critical*, *warning*, *suggestion*), memfilter isu, dan mengklik kartu untuk melakukan *smooth-scroll* langsung ke elemen yang bermasalah.

### 4. Multi-Element Stager
- **Penangkapan Komponen Masif**: Memilih beberapa elemen UI di berbagai section atau halaman dalam satu sesi kerja.
- **Catatan Pengembang per Elemen**: Menambahkan instruksi atau laporan bug khusus pada masing-masing komponen yang distage.
- **Pengiriman Terkonsolidasi**: Menghasilkan prompt terstruktur otomatis lengkap dengan kode laporan unik (`[LETME MULTI-ELEMENT STAGE: LTM-...]`) yang langsung tersalin ke clipboard.

### 5. Interactive Area Crop & Viewport Studio
- **Seleksi Crosshair**: Menarik area seleksi persegi panjang atau mengambil tangkapan layar penuh viewport.
- **Integrasi Clipboard Instan**: Otomatis menyalin gambar hasil crop ke sistem clipboard sekaligus menyinkronkannya ke MCP server.

### 6. Bidirectional Live CSS Preview
- **Pengujian Gaya Tanpa Reload**: Coding agent dapat memanggil tool MCP `letme_apply_css_preview` untuk langsung menguji perbaikan CSS pada tab browser Anda secara instan.
- **Reversi Seketika**: Satu klik tombol atau tool `letme_clear_preview` untuk mengembalikan styling ke kondisi awal setelah selesai ditinjau.

### 7. Desain Monokrom Minimalis
- **Anti AI-Slop**: Dibangun dengan antarmuka kontras tinggi bertema hitam-putih terinspirasi dari standar desain Linear dan Vercel.
- **Official Lucide SVG Icons**: 100% menggunakan ikon vektor SVG resmi Lucide untuk ketajaman visual maksimal di layar Retina dan resolusi tinggi.

---

## Arsitektur Sistem

```mermaid
flowchart LR
    subgraph Browser["Google Chrome (Halaman Web Target)"]
        UI["Content Script & Markup Studio"]
        SW["Background Service Worker (MV3)"]
        UI <-->|"chrome.runtime (internal)"| SW
    end

    subgraph Bridge["LetMe Local MCP Bridge (Node.js)"]
        WS["WebSocket Server (127.0.0.1:8765)"]
        State["In-Memory State Store"]
        SDK["MCP Server Protocol SDK"]
        WS <--> State
        State <--> SDK
    end

    subgraph Agent["AI Coding Harness"]
        AI["Antigravity / Cursor / Claude / Windsurf"]
    end

    SW <-->|"ws://127.0.0.1:8765 (Heartbeat 15 detik)"| WS
    SDK <-->|"Stdio (JSON-RPC)"| AI
```

### Alur Komunikasi:
1. **Ekstensi Chrome (Client)**: Content script menangkap snapshot DOM, box model, dan tangkapan layar visual, lalu meneruskannya ke background service worker.
2. **WebSocket Bridge**: Service worker menyalurkan payload ke `ws://127.0.0.1:8765` dengan mekanisme auto-reconnect dan sinyal heartbeat keepalive setiap 15 detik.
3. **MCP Server**: Mengimplementasikan Model Context Protocol melalui standard input/output (`stdio`), menyajikan tool terstruktur, laporan markdown, dan blok gambar visual ke AI harness.
4. **Umpan Balik Live**: Mutasi styling yang dipanggil oleh AI dikirimkan kembali melalui WebSocket untuk menyuntikkan stylesheet preview ke DOM browser secara real-time.

---

## Panduan Cepat

### Prasyarat
- **Node.js**: `v18.0.0` atau lebih baru
- **npm**: `v9.0.0` atau lebih baru
- **Browser**: Google Chrome atau browser berbasis Chromium (Brave, Edge, Arc)

### 1. Kloning & Bangun Proyek
```bash
git clone https://github.com/your-username/LetMe.git
cd LetMe
npm install
npm run build
```

Perintah di atas akan mengompilasi seluruh paket (`@letme/shared`, `@letme/mcp-server`, dan `@letme/extension`).

### 2. Pasang Ekstensi di Google Chrome
1. Buka Chrome dan akses alamat `chrome://extensions/`.
2. Aktifkan sakelar **Developer mode** di pojok kanan atas.
3. Klik tombol **Load unpacked**.
4. Pilih folder hasil kompilasi ekstensi:
   ```
   <PATH_TO_LETME>/packages/extension/dist
   ```
5. Sematkan (*pin*) ikon ekstensi **LetMe** di toolbar browser Anda.

---

## Konfigurasi AI Agent

Daftarkan LetMe ke aplikasi coding AI pilihan Anda dengan menyalin konfigurasi server berikut ke file pengaturan MCP terkait.

### Google Antigravity IDE
Tambahkan ke `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "letme": {
      "command": "node",
      "args": ["/JALUR/ABSOLUT/KE/LetMe/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Cursor
Tambahkan ke `.cursor/mcp.json` (atau melalui **Cursor Settings > Features > MCP Servers**):
```json
{
  "mcpServers": {
    "letme": {
      "command": "node",
      "args": ["/JALUR/ABSOLUT/KE/LetMe/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Desktop
Tambahkan ke `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Linux: `~/.config/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "letme": {
      "command": "node",
      "args": ["/JALUR/ABSOLUT/KE/LetMe/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Windsurf & Cline
Tambahkan ke konfigurasi MCP pada ekstensi terkait:
```json
{
  "mcpServers": {
    "letme": {
      "command": "node",
      "args": ["/JALUR/ABSOLUT/KE/LetMe/packages/mcp-server/dist/index.js"]
    }
  }
}
```

---

## Alur Kerja Penggunaan

### Alur A: Inspeksi Elemen Tunggal & Anotasi Kanvas
1. Tekan pintasan keyboard `Alt + Shift + I` atau klik **Start Inspecting** pada popup LetMe.
2. Arahkan kursor dan klik elemen target pada halaman web.
3. Gunakan toolbar untuk menggambar panah, memberi kotak sorot, menambahkan catatan teks, atau mengukur jarak dengan alat penggaris.
4. Klik **Send to AI** (atau **Copy Prompt**).
5. Buka chat AI Anda dan tekan `Ctrl + V`. Prompt langsung berisi selector DOM, dimensi box model, dan instruksi Anda.
6. AI akan otomatis memanggil tool `letme_get_active_element` untuk membaca crop visual dan gaya CSS terkait.

### Alur B: Pemindai Bug Mandiri (AI Vision Auto Bug Hunter)
1. Buka popup LetMe -> Klik tab **Settings** untuk memilih penyedia AI dan memasukkan API Key (Google Gemini, OpenRouter, OpenAI, Groq, atau Ollama lokal).
2. Klik **Scan Page with AI Vision**.
3. LetMe menangkap viewport, menormalkan koordinat piksel sesuai DPR 1:1, dan mengirimkannya ke model visual.
4. Penanda pin bernomor (`#1`, `#2`, dll.) langsung menempel pada elemen yang mengalami cacat tampilan di layar.
5. Tinjau rincian bug pada floating drawer di pojok kanan bawah, atau klik **Send All to MCP**.
6. Prompt instruksi lengkap otomatis tersalin ke clipboard dengan kode unik (`[LETME MCP REPORT: LTM-AI-...]`).
7. Paste ke chat AI Anda agar seluruh bug diperbaiki sekaligus.

### Alur C: Multi-Element Stager
1. Buka popup LetMe -> Klik **Pick Elements & Staging**.
2. Klik beberapa komponen di halaman (misalnya tombol navigasi, kartu konten, modal).
3. Buka **Staging Pill** melayang di pojok kanan bawah untuk memeriksa daftar komponen.
4. Tulis catatan atau instruksi khusus untuk masing-masing elemen pada drawer.
5. Klik **Sync to MCP** dan paste prompt yang tersalin ke chat AI.

### Alur D: Live CSS Preview Dua Arah
1. Saat asisten AI Anda mengusulkan perbaikan tampilan, minta AI mengujinya secara langsung:
   > *"Tolong aplikasikan CSS preview untuk mengecek perbaikan layout pada `.hero-card`."*
2. AI menjalankan tool `letme_apply_css_preview(selector=".hero-card", cssRules={"padding": "24px", "display": "flex"})`.
3. Perubahan tampilan langsung tampak di browser Anda seketika tanpa perlu reload tab.
4. Periksa hasilnya. Jika sudah sesuai, minta AI untuk menuliskan kode final tersebut ke file proyek Anda.

---

## Referensi Tool MCP

LetMe mendaftarkan kumpulan tool berikut ke dalam protokol MCP:

| Nama Tool | Parameter | Deskripsi | Format Konten Balikan |
| :--- | :--- | :--- | :--- |
| `letme_get_active_element` | `id` *(string, opsional)*: ID elemen atau laporan spesifik | Mengambil data elemen aktif atau laporan tertentu: box model, diagnostik layout, computed CSS, dan blok gambar PNG beranotasi. | Ringkasan Markdown + Image Block PNG Base64 |
| `letme_list_inspections` | *(Tidak ada)* | Menampilkan riwayat seluruh komponen yang telah ditandai/distage dalam sesi aktif. | Tabel Markdown berisi daftar komponen, selector, dan waktu capture |
| `letme_apply_css_preview` | `selector` *(string, wajib)*: Selector CSS target<br>`cssRules` *(object, wajib)*: Pasangan key-value aturan CSS | Menyuntikkan aturan gaya CSS langsung ke elemen target di tab browser yang aktif secara real-time. | Pesan konfirmasi beserta ringkasan aturan yang disuntikkan |
| `letme_clear_preview` | `selector` *(string, opsional)*: Selector target yang ingin dibersihkan (membersihkan semua jika dikosongkan) | Menghapus stylesheet preview yang disuntikkan dan mengembalikan tampilan DOM browser ke kondisi aslinya. | Pesan konfirmasi pembatalan gaya |
| `letme_get_console_logs` | `limit` *(number, opsional, default: 20)*: Jumlah entri maksimum | Mengambil log error dan peringatan konsol browser terbaru dari halaman web aktif. | Daftar pesan konsol terformat dengan level log |

---

## Pintasan Keyboard

| Pintasan | Konteks | Fungsi |
| :--- | :--- | :--- |
| `Alt + Shift + I` | Seluruh Halaman Web | Menyalakan / mematikan Element Inspector |
| `Esc` | Inspector Aktif | Membatalkan inspeksi atau menutup modal/drawer |
| `Ctrl + Z` / `Cmd + Z` | Markup Studio | Membatalkan coretan anotasi terakhir (Undo) |

---

## Struktur Monorepo

```
LetMe/
├── packages/
│   ├── shared/             # Interface TypeScript, metrik, dan DTO bersama
│   │   ├── src/index.ts    # BoxModelMetrics, LayoutBugReport, ElementSnapshot
│   │   └── package.json
│   ├── mcp-server/         # Server Node.js MCP & jembatan WebSocket
│   │   ├── src/index.ts    # Entry point server & handler tool MCP
│   │   ├── src/state.ts    # State store in-memory untuk sesi inspeksi
│   │   ├── test/           # Test suite otomatis (Node test runner)
│   │   └── package.json
│   └── extension/          # Ekstensi Chrome (Manifest V3 + Vite)
│       ├── manifest.json   # Manifest ekstensi & permissions
│       ├── src/
│       │   ├── icons.ts    # Definisi vektor ikon SVG Lucide
│       │   ├── background/ # Service worker & WebSocket client
│       │   ├── content/    # Overlay UI, Markup Studio, Auto Bug Hunter
│       │   └── popup/      # Antarmuka popup ekstensi & menu Settings
│       └── package.json
├── package.json            # Konfigurasi workspace monorepo root
└── tsconfig.json           # Konfigurasi dasar TypeScript
```

---

## Pengembangan & Pengujian

### Menjalankan Mode Pengembangan (Watch)
Jalankan proses watcher pada tab terminal terpisah:

```bash
# Terminal 1: Watch & kompilasi ekstensi Chrome
npm run dev:extension

# Terminal 2: Watch & kompilasi server MCP
npm run dev:server
```

### Menjalankan Test Suite
Jalankan pengujian unit otomatis menggunakan Node.js native test runner:

```bash
npm test
```

Cakupan pengujian:
- Siklus hidup state store dan persistensi snapshot elemen.
- Handler pemanggilan seluruh tool MCP (`letme_get_active_element`, `letme_list_inspections`, `letme_apply_css_preview`, dll.).
- Pemformatan markdown dan struktur blok gambar visual.
- Resolusi timeout dan penyuntikan preview CSS.

---

## Pertanyaan yang Sering Diajukan (FAQ)

#### 1. Mengapa status pada popup menunjukkan "MCP Offline"?
- Pastikan MCP Server sedang berjalan atau aplikasi AI Anda (Antigravity/Cursor) telah memanggilnya melalui konfigurasi MCP.
- Untuk menjalankan server secara manual untuk debugging:
  ```bash
  npm run start:server
  ```
- Ekstensi secara otomatis mengecek ulang status koneksi dan mengirimkan sinyal heartbeat setiap 15 detik.

#### 2. Fitur AI Vision memunculkan error HTTP 405 atau "Method Not Allowed"
- Pastikan **Base URL** pada menu Settings di popup LetMe mengarah ke endpoint `/chat/completions` yang kompatibel dengan format OpenAI.
- Untuk **Google Gemini**: Gunakan `https://generativelanguage.googleapis.com/v1beta/openai/` dengan model `gemini-2.0-flash`.
- Untuk **OpenRouter**: Gunakan `https://openrouter.ai/api/v1` dengan model `google/gemini-2.0-flash-001`.
- Untuk **Ollama**: Pastikan Ollama berjalan di komputer lokal dengan model berkemampuan visual (misal `http://127.0.0.1:11434/v1`).

#### 3. Apakah saya perlu me-reload ekstensi setelah mengubah kode?
- Content script dan service worker diperbarui saat Anda mengklik tombol **Reload (🔄)** pada menu `chrome://extensions/`. Setelah me-reload, cukup muat ulang (*refresh*) halaman web target Anda.

---

## Kontribusi

Kontribusi dari komunitas sangat dinantikan! Silakan ikuti panduan berikut sebelum mengajukan Pull Request:

1. **Fork** repositori dan buat branch fitur (`git checkout -b feat/fitur-baru`).
2. Pertahankan standar desain **monokrom minimalis** (tidak menggunakan emoji unicode mentah di dalam kode antarmuka; gunakan `packages/extension/src/icons.ts`).
3. Pastikan seluruh pengujian berhasil: `npm test`.
4. Pastikan hasil kompilasi bersih tanpa error: `npm run build`.
5. Ajukan Pull Request dengan penjelasan perubahan yang jelas.

---

## Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).
Perangkat lunak open-source yang dirancang untuk pengembang dan asisten AI.
