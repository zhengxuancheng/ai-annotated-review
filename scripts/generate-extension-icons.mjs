import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const sizes = [16, 32, 48, 128];
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(
  repoRoot,
  "apps",
  "browser-extension",
  "public",
  "icons"
);

await mkdir(outputDir, { recursive: true });

for (const size of sizes) {
  await writeFile(
    path.join(outputDir, `icon-${size}.png`),
    createIconPng(size)
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      outputDir,
      sizes
    },
    null,
    2
  )
);

function createIconPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * 0.18);
  const pad = Math.max(2, Math.round(size * 0.13));
  const bg = [37, 111, 88, 255];
  const accent = [31, 95, 154, 255];
  const white = [255, 255, 255, 255];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const alpha = roundedRectAlpha(x, y, size, radius);
      const mix = y / Math.max(1, size - 1);
      pixels[offset] = Math.round(bg[0] * (1 - mix) + accent[0] * mix);
      pixels[offset + 1] = Math.round(bg[1] * (1 - mix) + accent[1] * mix);
      pixels[offset + 2] = Math.round(bg[2] * (1 - mix) + accent[2] * mix);
      pixels[offset + 3] = alpha;

      const inDocument =
        x >= pad * 1.35 &&
        x <= size - pad * 1.25 &&
        y >= pad &&
        y <= size - pad;
      const fold =
        x > size - pad * 2.45 &&
        y < pad * 2.65 &&
        x + y > size - pad * 1.55;
      if (inDocument && !fold && alpha > 0) {
        pixels[offset] = white[0];
        pixels[offset + 1] = white[1];
        pixels[offset + 2] = white[2];
        pixels[offset + 3] = white[3];
      }

      const lineLeft = Math.round(size * 0.35);
      const lineRight = Math.round(size * 0.68);
      const lineHeight = Math.max(1, Math.round(size * 0.04));
      const lineYs = [
        Math.round(size * 0.45),
        Math.round(size * 0.56),
        Math.round(size * 0.67)
      ];
      if (
        x >= lineLeft &&
        x <= lineRight &&
        lineYs.some((lineY) => y >= lineY && y <= lineY + lineHeight)
      ) {
        pixels[offset] = bg[0];
        pixels[offset + 1] = bg[1];
        pixels[offset + 2] = bg[2];
        pixels[offset + 3] = 255;
      }
    }
  }

  return encodePng(size, size, pixels);
}

function roundedRectAlpha(x, y, size, radius) {
  const max = size - 1;
  const inside =
    (x >= radius && x <= max - radius) ||
    (y >= radius && y <= max - radius);
  if (inside) return 255;

  const cx = x < radius ? radius : max - radius;
  const cy = y < radius ? radius : max - radius;
  const distance = Math.hypot(x - cx, y - cy);
  return distance <= radius ? 255 : 0;
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr(width, height)),
    chunk("IDAT", zlib.deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function ihdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
