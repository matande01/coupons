// All balance math is done in agorot (integer cents) to avoid floating-point drift.
export const toCents = (v) => Math.round(Number(v) * 100)
export const fromCents = (c) => c / 100

// Accepts "50", "50.5", "50,5", "1,000", "₪ 120" → number, or NaN.
export function parseAmountInput(raw) {
  if (raw === null || raw === undefined) return NaN
  let s = String(raw).replace(/[₪\s]/g, '')
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '') // thousands separators
  else s = s.replace(',', '.') // decimal comma
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN
  return Number(s)
}

const formatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
export const formatMoney = (n) => formatter.format(Number(n) || 0)
