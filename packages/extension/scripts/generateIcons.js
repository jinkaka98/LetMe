import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createPng(width, height, renderPixel) {
  // RGBA buffer with filter byte (0) per row
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Helper for CRC32
  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const toCrc = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel Grid Lens drawing function
function renderPixelGridLens(x, y, w, h) {
  const normX = x / w;
  const normY = y / h;

  // Background rounded rect check
  const cornerRadius = 0.18;
  const dx = Math.max(0, Math.abs(normX - 0.5) - (0.5 - cornerRadius));
  const dy = Math.max(0, Math.abs(normY - 0.5) - (0.5 - cornerRadius));
  if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside rounded corner
  }

  // Base background: #09090b (Zinc 950)
  let r = 9, g = 9, b = 11, a = 255;

  // Subtle Border: 1px around the edge
  if (normX < 0.05 || normX > 0.95 || normY < 0.05 || normY > 0.95) {
    return [39, 39, 42, 255]; // #27272a
  }

  // Pixel Grid Lines (3x3 grid)
  const gridCells = 4;
  const cellX = (normX * gridCells) % 1;
  const cellY = (normY * gridCells) % 1;
  const lineWidth = 0.04;
  if (cellX < lineWidth || cellY < lineWidth) {
    r = 24; g = 24; b = 27; // subtle grid lines #18181b
  }

  // Central Focus Lens Reticle
  // Target center at (0.5, 0.5)
  const distCenter = Math.sqrt((normX - 0.5) ** 2 + (normY - 0.5) ** 2);

  // Center Focus Dot (pure white)
  if (distCenter < 0.08) {
    return [255, 255, 255, 255];
  }

  // Crosshair brackets / aperture corners
  const boxHalf = 0.28;
  const tickLen = 0.12;
  const tickThick = 0.045;

  const inLeftEdge = Math.abs(normX - (0.5 - boxHalf)) < tickThick;
  const inRightEdge = Math.abs(normX - (0.5 + boxHalf)) < tickThick;
  const inTopEdge = Math.abs(normY - (0.5 - boxHalf)) < tickThick;
  const inBottomEdge = Math.abs(normY - (0.5 + boxHalf)) < tickThick;

  const inXRange = normX >= 0.5 - boxHalf && normX <= 0.5 + boxHalf;
  const inYRange = normY >= 0.5 - boxHalf && normY <= 0.5 + boxHalf;

  const nearCornerX = normX < 0.5 - boxHalf + tickLen || normX > 0.5 + boxHalf - tickLen;
  const nearCornerY = normY < 0.5 - boxHalf + tickLen || normY > 0.5 + boxHalf - tickLen;

  if (
    ((inLeftEdge || inRightEdge) && inYRange && nearCornerY) ||
    ((inTopEdge || inBottomEdge) && inXRange && nearCornerX)
  ) {
    // Sharp white focus brackets #fafafa
    return [250, 250, 250, 255];
  }

  // Focus ring pulse (ring between dot and brackets)
  if (Math.abs(distCenter - 0.18) < 0.02) {
    return [82, 82, 91, 200]; // #52525b
  }

  return [r, g, b, a];
}

const iconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate PNGs
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const pngBuf = createPng(size, size, renderPixelGridLens);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuf);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#09090b" stroke="#27272a" stroke-width="2"/>
  <!-- Pixel Grid -->
  <path d="M32 0v128M64 0v128M96 0v128M0 32h128M0 64h128M0 96h128" stroke="#18181b" stroke-width="2"/>
  <!-- Focus Ring -->
  <circle cx="64" cy="64" r="23" fill="none" stroke="#52525b" stroke-width="2" stroke-dasharray="4 2"/>
  <!-- Viewfinder Corner Brackets -->
  <path d="M28 44V28h16M100 44V28H84M28 84v16h16M100 84v16H84" fill="none" stroke="#fafafa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Center Target Dot -->
  <circle cx="64" cy="64" r="8" fill="#ffffff"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'logo.svg'), svgContent);
console.log('Generated logo.svg');
