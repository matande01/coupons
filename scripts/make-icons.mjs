// Generates the app icons (PNG) from the Cop mascot SVG. Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { copMarkup } from '../src/mascot/copSvg.js'

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#253178"/>
      <stop offset=".55" stop-color="#0F1740"/>
      <stop offset="1" stop-color="#070C26"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".55" r=".5">
      <stop offset="0" stop-color="#F5A524" stop-opacity=".45"/>
      <stop offset="1" stop-color="#F5A524" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" fill="url(#bg)"/>
  <circle cx="100" cy="110" r="88" fill="url(#glow)"/>
  <g transform="translate(100 106) scale(1.1) translate(-100 -88)">${copMarkup('head', 'icon')}</g>
</svg>`

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png)
  console.log('wrote', name)
}
