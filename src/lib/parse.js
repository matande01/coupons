import { detectBrand } from './brands'

// Turns raw OCR text (+ an optional decoded barcode) into coupon fields.
// Pure functions only, so they can be tested without a browser.

const DATE_RE =
  /(?<!\d)(?:(\d{1,2})\s*[./\-]\s*(\d{1,2})\s*[./\-]\s*(\d{4}|\d{2})|(\d{4})\s*[./\-]\s*(\d{1,2})\s*[./\-]\s*(\d{1,2}))(?!\d)/g

const CURRENCY = /(₪|ש"ח|שח|nis|ils|שקל)/i
const AMOUNT_KW = /(סכום|שווי|ערך|יתרה|בסך|סך|זיכוי|טעינה|amount|value|balance|worth|total)/i
const EXPIRY_KW = /(תוקף|בתוקף|תפוג|פג|עד|expir|valid|until|use by|exp\b)/i
const ISSUE_KW = /(הונפק|נרכש|רכישה|הופק|issued|purchase|order date)/i
const CODE_KW = /(קוד|קופון|שובר|מספר|כרטיס|ברקוד|מימוש|code|voucher|coupon|card|serial|number|no\.)/i
const PIN_KW = /(pin|cvv|קוד\s*סודי|קוד\s*אימות|סיסמ)/i
const PHONE_KW = /(טלפון|טל'|שירות לקוחות|phone|tel|whatsapp|וואטסאפ)/i

export function normalizeOcr(text) {
  return text
    .replace(/[״”“]/g, '"')
    .replace(/[׳’‘`]/g, "'")
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

function toIso(d, m, y) {
  d = +d
  m = +m
  y = +y
  if (y < 100) y += 2000
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCDate() !== d) return null // e.g. 31/02
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function findDates(line) {
  const out = []
  for (const m of line.matchAll(DATE_RE)) {
    const iso = m[4] ? toIso(m[6], m[5], m[4]) : toIso(m[1], m[2], m[3]) // Israeli order: day/month/year
    if (iso) out.push({ iso, index: m.index, raw: m[0] })
  }
  return out
}

export function findExpiry(lines) {
  const candidates = []
  lines.forEach((line, i) => {
    for (const d of findDates(line)) {
      let score = 0
      if (EXPIRY_KW.test(line)) score += 3
      else if (i > 0 && EXPIRY_KW.test(lines[i - 1])) score += 2
      if (ISSUE_KW.test(line)) score -= 3
      candidates.push({ ...d, score })
    }
  })
  // Highest score wins; on a tie, the later date (expiry is after purchase date).
  candidates.sort((a, b) => b.score - a.score || b.iso.localeCompare(a.iso))
  return candidates[0]?.iso ?? ''
}

const NUM_RE = /(?<![\d.,])(?:\d{1,3}(?:,\d{3})+|\d{1,6})(?:\.\d{1,2})?(?![\d])/g

export function findAmount(lines) {
  let best = null
  lines.forEach((rawLine, i) => {
    const line = rawLine.replace(DATE_RE, (s) => ' '.repeat(s.length)) // dates aren't amounts
    for (const m of line.matchAll(NUM_RE)) {
      const value = Number(m[0].replace(/,/g, ''))
      if (!(value >= 1 && value <= 50000)) continue
      const before = line.slice(Math.max(0, m.index - 5), m.index)
      const after = line.slice(m.index + m[0].length, m.index + m[0].length + 5)
      let score = 0
      if (CURRENCY.test(before) || CURRENCY.test(after)) score += 3
      if (AMOUNT_KW.test(line)) score += 2
      else if (i > 0 && AMOUNT_KW.test(lines[i - 1])) score += 1
      if (PHONE_KW.test(line) || CODE_KW.test(line)) score -= 2
      if (score <= 0) continue
      if (!best || score > best.score || (score === best.score && value > best.value)) best = { value, score }
    }
  })
  return best?.value ?? null
}

// Runs of space/dash separated alphanumeric pieces that contain digits: "1234 5678 9012", "WOLT-AB12CD".
function codeCandidates(line) {
  const out = []
  let run = []
  const flush = () => {
    if (run.length) out.push(run.join(' '))
    run = []
  }
  for (const piece of line.split(' ')) {
    if (/^[A-Za-z0-9-]+$/.test(piece) && /\d/.test(piece)) run.push(piece)
    else flush()
  }
  flush()
  return out
}

const compact = (s) => s.replace(/\s+/g, '')

export function findCodeAndPin(lines) {
  let code = null
  let pin = null
  lines.forEach((line, i) => {
    const prev = i > 0 ? lines[i - 1] : ''
    const isPin = PIN_KW.test(line) || (!CODE_KW.test(line) && PIN_KW.test(prev))
    for (const cand of codeCandidates(line)) {
      const c = compact(cand)
      const digits = (c.match(/\d/g) || []).length
      if (isPin) {
        if (/^\d{3,8}$/.test(c) && (!pin || PIN_KW.test(line))) pin = c
        continue
      }
      if (c.length < 5 || digits < 4 || c.length > 40) continue
      let score = Math.min(c.length, 20) / 10
      if (CODE_KW.test(line)) score += 3
      else if (CODE_KW.test(prev)) score += 2
      if (PHONE_KW.test(line) || /^0\d{1,2}-?\d{7}$/.test(c)) score -= 4
      if (!code || score > code.score) code = { value: c, score }
    }
  })
  return { code: code && code.score > 0 ? code.value : '', pin: pin || '' }
}

export function parseCouponText(text, barcode = null) {
  const lines = normalizeOcr(text || '')
  const joined = lines.join('\n')
  const { code: textCode, pin } = findCodeAndPin(lines)
  const barcodeText = barcode?.text?.trim()
  const barcodeIsUrl = barcodeText && /^(https?:\/\/|www\.)/i.test(barcodeText)
  return {
    brand: detectBrand(joined),
    code: barcodeText && !barcodeIsUrl ? barcodeText : textCode,
    pin,
    amount: findAmount(lines),
    expiry: findExpiry(lines),
    barcode: barcode || null,
    rawText: joined,
  }
}
