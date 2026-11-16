// "Cop" (קופ) — the raccoon who guards your coupons.
// Pure SVG markup (no React) so the same drawing is used by the app and by the icon generator script.
// viewBox: 0 0 200 210. Poses: idle | magnify | scan | thumbs | head (head only, for the app icon)

const C = {
  fur: '#9EA6BA',
  furDark: '#5C6480',
  mask: '#2A2F45',
  cream: '#F8F4EC',
  navy: '#1B2660',
  navyDark: '#0F1740',
  amber: '#F5A524',
  pink: '#F7A8B8',
  wood: '#8A5A34',
}

const tail = `
  <g class="cop-tail">
    <path d="M126 176 C 168 176, 186 142, 170 108" fill="none" stroke="${C.fur}" stroke-width="24" stroke-linecap="round"/>
    <path d="M126 176 C 168 176, 186 142, 170 108" fill="none" stroke="${C.mask}" stroke-width="24" stroke-dasharray="9 11" stroke-dashoffset="3"/>
  </g>`

const body = `
  <ellipse cx="100" cy="170" rx="42" ry="30" fill="${C.fur}"/>
  <ellipse cx="100" cy="177" rx="26" ry="20" fill="${C.cream}"/>
  <path d="M74 150 Q100 162 126 150 L122 158 Q100 168 78 158 Z" fill="${C.navy}"/>
  <path d="M86 160 l3.2 6.4 7 1 -5.1 5 1.2 7 -6.3-3.3 -6.3 3.3 1.2-7 -5.1-5 7-1z" fill="${C.amber}" transform="translate(0 -2) scale(1)"/>
  <ellipse cx="80" cy="198" rx="13" ry="7" fill="${C.furDark}"/>
  <ellipse cx="120" cy="198" rx="13" ry="7" fill="${C.furDark}"/>`

const armLeft = `<ellipse cx="62" cy="170" rx="10" ry="17" fill="${C.furDark}" transform="rotate(22 62 170)"/>`
const armRightDown = `<ellipse cx="138" cy="170" rx="10" ry="17" fill="${C.furDark}" transform="rotate(-22 138 170)"/>`

const ears = `
  <circle cx="48" cy="58" r="20" fill="${C.furDark}"/><circle cx="48" cy="60" r="11" fill="${C.pink}"/>
  <circle cx="152" cy="58" r="20" fill="${C.furDark}"/><circle cx="152" cy="60" r="11" fill="${C.pink}"/>`

const head = (happy) => `
  <path d="M44 100 L24 116 L46 118 L30 132 L58 126 Z" fill="${C.fur}"/>
  <path d="M156 100 L176 116 L154 118 L170 132 L142 126 Z" fill="${C.fur}"/>
  <ellipse cx="100" cy="98" rx="62" ry="52" fill="${C.fur}"/>
  <ellipse cx="74" cy="83" rx="19" ry="8" fill="${C.cream}" transform="rotate(-8 74 83)"/>
  <ellipse cx="126" cy="83" rx="19" ry="8" fill="${C.cream}" transform="rotate(8 126 83)"/>
  <path d="M46 104 C 48 88, 70 86, 86 94 C 94 98, 106 98, 114 94 C 130 86, 152 88, 154 104 C 154 119, 132 121, 118 111 C 110 106, 90 106, 82 111 C 68 121, 46 119, 46 104 Z" fill="${C.mask}"/>
  ${
    happy
      ? `<g fill="none" stroke="${C.cream}" stroke-width="4.5" stroke-linecap="round">
           <path d="M67 106 Q76 95 85 106"/><path d="M115 106 Q124 95 133 106"/>
         </g>`
      : `<g class="cop-eyes">
           <circle cx="76" cy="103" r="10.5" fill="#0B0D14"/><circle cx="124" cy="103" r="10.5" fill="#0B0D14"/>
           <circle cx="79.8" cy="98.8" r="3.8" fill="#fff"/><circle cx="127.8" cy="98.8" r="3.8" fill="#fff"/>
           <circle cx="72.6" cy="107.2" r="1.6" fill="#fff"/><circle cx="120.6" cy="107.2" r="1.6" fill="#fff"/>
         </g>`
  }
  <ellipse cx="100" cy="125" rx="25" ry="17" fill="${C.cream}"/>
  <ellipse cx="55" cy="124" rx="9" ry="5" fill="${C.pink}" opacity=".6"/>
  <ellipse cx="145" cy="124" rx="9" ry="5" fill="${C.pink}" opacity=".6"/>
  <path d="M91.5 115.5 Q100 110 108.5 115.5 Q106.5 123 100 124 Q93.5 123 91.5 115.5 Z" fill="${C.mask}"/>
  <ellipse cx="97" cy="115" rx="2.8" ry="1.4" fill="#fff" opacity=".75"/>
  ${
    happy
      ? `<path d="M90 128 Q100 140 110 128 Z" fill="#7A2E3F"/><path d="M95 133 Q100 137 105 133" fill="${C.pink}"/>`
      : `<path d="M100 124 V128 M100 128 Q95 133 90.5 129 M100 128 Q105 133 109.5 129" stroke="${C.mask}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  }`

const cap = `
  <path d="M55 68 C 55 26, 145 26, 145 68 Z" fill="${C.navy}"/>
  <path d="M68 46 C 78 36, 94 33, 104 34" stroke="#fff" stroke-opacity=".18" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="55" y="58" width="90" height="11" rx="2" fill="${C.navyDark}"/>
  <rect x="55" y="61.5" width="90" height="3" fill="${C.amber}"/>
  <path d="M48 70 Q100 60 152 70 Q100 86 48 70 Z" fill="${C.navyDark}"/>
  <path d="M100 34 L111.5 38.5 V47 C111.5 54 106.5 58.5 100 60.5 C93.5 58.5 88.5 54 88.5 47 V38.5 Z" fill="${C.amber}" stroke="#FFF7E0" stroke-width="1.8"/>
  <path d="M100 41.5 l2 4 4.4 .6 -3.2 3.1 .8 4.4 -4-2.1 -4 2.1 .8-4.4 -3.2-3.1 4.4-.6z" fill="#FFF7E0"/>`

const magnifier = (uid, glow) => `
  ${glow ? `<circle class="cop-spot" cx="174" cy="114" r="42" fill="url(#${uid}-spot)"/>` : ''}
  <ellipse cx="141" cy="158" rx="10" ry="18" fill="${C.furDark}" transform="rotate(-48 141 158)"/>
  <g class="cop-tool">
    <line x1="153" y1="148" x2="164" y2="131" stroke="${C.wood}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="174" cy="114" r="18" fill="#D6ECFF" fill-opacity=".55" stroke="${C.amber}" stroke-width="6"/>
    <path d="M164 109 Q167 101 176 100" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="153" cy="148" r="8.5" fill="${C.furDark}"/>
  </g>`

const thumbsUp = `
  <g class="cop-thumb">
    <ellipse cx="143" cy="156" rx="10" ry="18" fill="${C.furDark}" transform="rotate(-38 143 156)"/>
    <rect x="148" y="132" width="20" height="17" rx="7" fill="${C.furDark}"/>
    <rect x="153" y="114" width="8" height="22" rx="4" fill="${C.furDark}"/>
    <path d="M151 139 H165 M151 144 H165" stroke="${C.mask}" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>
  </g>
  <g fill="${C.amber}" class="cop-sparkles">
    <path d="M180 92 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5-6 -6-2.5 6-2.5z"/>
    <path d="M30 70 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8-4.2 -4.2-1.8 4.2-1.8z"/>
  </g>`

export function copMarkup(pose = 'idle', uid = 'cop') {
  const defs = `<defs><radialGradient id="${uid}-spot"><stop offset="0" stop-color="#FDE68A" stop-opacity=".9"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient></defs>`
  if (pose === 'head') return `${ears}${head(false)}${cap}`
  const happy = pose === 'thumbs'
  const rightArm = pose === 'magnify' ? magnifier(uid, false) : pose === 'scan' ? magnifier(uid, true) : pose === 'thumbs' ? thumbsUp : armRightDown
  const tailSide = pose === 'idle' ? tail : `<g transform="translate(200 0) scale(-1 1)">${tail}</g>`
  return `${defs}${tailSide}${body}${armLeft}${ears}${head(happy)}${cap}${rightArm}`
}
