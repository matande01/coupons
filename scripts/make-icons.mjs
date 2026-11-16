// Generates the app icons (PNG) without any image library: indigo→violet background
// with a white ticket. Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

// Shape in unit coordinates. Returns 'ticket' | 'bg'.
function shape(x, y) {
  const [x0, y0, x1, y1, r] = [0.17, 0.3, 0.83, 0.7, 0.07]
  // rounded rect
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  if (x < x0 || x > x1 || y < y0 || y > y1 || (x - cx) ** 2 + (y - cy) ** 2 > r * r) return 'bg'
  // side notches
  if ((x - x0) ** 2 + (y - 0.5) ** 2 < 0.065 ** 2 || (x - x1) ** 2 + (y - 0.5) ** 2 < 0.065 ** 2) return 'bg'
  // perforation
  if (Math.abs(x - 0.62) < 0.011 && y > 0.35 && y < 0.65 && ((y - 0.35) % 0.06) < 0.032) return 'bg'
  return 'ticket'
}

function render(size) {
  const ss = 4 // supersampling for smooth edges
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) / size
          const y = (py + (sy + 0.5) / ss) / size
          if (shape(x, y) === 'ticket') {
            r += 255; g += 255; b += 255
          } else {
            const t = (x + y) / 2 // indigo-600 → violet-600
            r += 79 + (124 - 79) * t
            g += 70 + (58 - 70) * t
            b += 229 + (237 - 229) * t
          }
        }
      const o = py * (size * 3 + 1) + 1 + px * 3
      raw[o] = r / ss / ss
      raw[o + 1] = g / ss / ss
      raw[o + 2] = b / ss / ss
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = new URL('../public/', import.meta.url)
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(name, out), render(size))
  console.log('wrote', name)
}
