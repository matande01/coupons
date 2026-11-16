const pad = (n) => String(n).padStart(2, '0')

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Whole days from today until the ISO date (negative = already passed).
export function daysUntil(iso, today = todayISO()) {
  if (!iso) return Infinity
  const a = Date.UTC(...today.split('-').map((x, i) => (i === 1 ? x - 1 : +x)))
  const b = Date.UTC(...iso.split('-').map((x, i) => (i === 1 ? x - 1 : +x)))
  return Math.round((b - a) / 86400000)
}

export function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function expiryLabel(iso, today) {
  const days = daysUntil(iso, today)
  if (days === Infinity) return 'ללא תוקף'
  if (days < 0) return `פג ב-${formatDate(iso)}`
  if (days === 0) return 'פג היום'
  if (days === 1) return 'פג מחר'
  if (days <= 60) return `עוד ${days} ימים`
  return `עד ${formatDate(iso)}`
}
