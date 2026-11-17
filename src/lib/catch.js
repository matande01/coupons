// Voucher Catcher: turns a pasted gift-card email into coupon fields.
// Pure functions (no DB, no DOM) so they can be tested in Node.
import { PROVIDERS } from './providers'
import { findDates, parseCouponText } from './parse'
import { todayISO } from './dates'

// Emails pasted from Mail are usually plain text, but HTML sources work too.
export function emailToText(raw = '') {
  return String(raw)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8362;|&#x20aa;/gi, '₪')
    .replace(/[״”“]/g, '"')
    .replace(/[׳’‘`]/g, "'")
    .replace(/‏|‎/g, '') // RTL/LTR marks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

const NORMALIZE = {
  code: (s) => s.replace(/[\s-]+/g, '').toUpperCase(),
  pin: (s) => s.trim(),
  amount: (s) => {
    const n = Number(s.replace(/,/g, ''))
    return n >= 1 && n <= 50000 ? n : null
  },
  expiry: (s) => findDates(s)[0]?.iso ?? null,
}

function firstMatch(text, patterns = []) {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

// "בתוקף ל-5 שנים" / "valid for 3 years" → today + N years
function relativeExpiry(text, today) {
  const m = text.match(/(?:תוקף|בתוקף|valid)[^\n]{0,20}?(\d{1,2})\s*(?:שנים|years?)/i)
  if (!m) return null
  const [y, mo, d] = today.split('-').map(Number)
  return `${y + Number(m[1])}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function detectProvider(text) {
  return PROVIDERS.find((p) => p.detect.test(text)) ?? null
}

// Returns { brand, code, pin, amount, expiry, provider, found: [field names] }
export function catchVoucher(raw, today = todayISO()) {
  const text = emailToText(raw)
  const provider = detectProvider(text)
  const generic = parseCouponText(text)
  const out = { brand: provider?.brand || generic.brand || '', provider: provider?.brand ?? null }

  for (const key of ['code', 'pin', 'amount', 'expiry']) {
    const hit = provider && firstMatch(text, provider.fields?.[key])
    const value = hit ? NORMALIZE[key](hit) : null
    out[key] = value ?? generic[key] ?? (key === 'amount' ? null : '')
  }
  if (!out.expiry) out.expiry = relativeExpiry(text, today) || ''

  out.found = ['brand', 'code', 'pin', 'amount', 'expiry'].filter((k) => out[k])
  return out
}

// Enough to save without asking: we know where, what code, and how much.
export const isComplete = (v) => Boolean(v.brand && v.code && v.amount)
