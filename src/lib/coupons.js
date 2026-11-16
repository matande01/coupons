import { db } from './db'
import { toCents, fromCents, formatMoney } from './money'
import { daysUntil, todayISO } from './dates'

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/* ───────────── Balance management ───────────── */

// Pure: validate a spend and return the new balance. Throws a Hebrew message on bad input.
export function computeSpend(balance, spent) {
  const b = toCents(balance)
  const s = toCents(spent)
  if (!Number.isFinite(s) || s <= 0) throw new Error('יש להזין סכום גדול מאפס')
  if (s > b) throw new Error(`הסכום גבוה מהיתרה (${formatMoney(balance)})`)
  return fromCents(b - s)
}

// Records a purchase atomically: re-reads the coupon inside the transaction so two
// quick taps can never double-charge from a stale balance.
export async function recordSpend(id, spent, note = '') {
  return db.transaction('rw', db.coupons, async () => {
    const c = await db.coupons.get(id)
    if (!c) throw new Error('הקופון לא נמצא')
    const balanceAfter = computeSpend(c.balance, spent)
    const entry = { id: uid(), date: new Date().toISOString(), amount: fromCents(toCents(spent)), balanceAfter, note: note.trim() }
    await db.coupons.update(id, { balance: balanceAfter, history: [...(c.history || []), entry], updatedAt: Date.now() })
    return balanceAfter
  })
}

// Reverts the most recent purchase (adds its amount back to the balance).
export async function undoLastSpend(id) {
  return db.transaction('rw', db.coupons, async () => {
    const c = await db.coupons.get(id)
    const history = [...(c?.history || [])]
    const last = history.pop()
    if (!last) return c?.balance
    const balance = fromCents(toCents(c.balance) + toCents(last.amount))
    await db.coupons.update(id, { balance, history, updatedAt: Date.now() })
    return balance
  })
}

/* ───────────── CRUD ───────────── */

export async function saveCoupon(data, id) {
  const record = {
    brand: data.brand.trim(),
    code: data.code.trim(),
    pin: (data.pin || '').trim(),
    amount: data.amount,
    balance: data.balance,
    expiry: data.expiry || '',
    notes: (data.notes || '').trim(),
    image: data.image ?? null,
    updatedAt: Date.now(),
  }
  if (id) {
    await db.coupons.update(id, record)
    return id
  }
  return db.coupons.add({ ...record, history: [], createdAt: Date.now() })
}

export const deleteCoupon = (id) => db.coupons.delete(id)

/* ───────────── Status, sorting, grouping ───────────── */

export function couponStatus(c, today = todayISO()) {
  if (c.expiry && daysUntil(c.expiry, today) < 0) return 'expired'
  if (toCents(c.balance) <= 0) return 'used'
  return 'active'
}

export function urgency(c, today) {
  const d = daysUntil(c.expiry, today)
  if (d <= 7) return 'high'
  if (d <= 30) return 'medium'
  return 'low'
}

const byExpiry = (a, b) => {
  if (!a.expiry && !b.expiry) return a.brand.localeCompare(b.brand, 'he')
  if (!a.expiry) return 1
  if (!b.expiry) return -1
  return a.expiry.localeCompare(b.expiry)
}

// Groups by brand (case-insensitive). Groups are ordered by their soonest-expiring coupon.
export function groupByBrand(coupons) {
  const map = new Map()
  for (const c of coupons) {
    const key = c.brand.trim().toLocaleLowerCase('he') || '—'
    if (!map.has(key)) map.set(key, { brand: c.brand.trim() || 'ללא מותג', items: [] })
    map.get(key).items.push(c)
  }
  const groups = [...map.values()]
  for (const g of groups) {
    g.items.sort(byExpiry)
    g.total = fromCents(g.items.reduce((s, c) => s + toCents(c.balance), 0))
  }
  return groups.sort((a, b) => byExpiry(a.items[0], b.items[0]))
}

export function matchesQuery(c, q) {
  if (!q) return true
  const s = q.trim().toLowerCase()
  return [c.brand, c.code, c.notes].some((f) => (f || '').toLowerCase().includes(s))
}

/* ───────────── Backup (export / import JSON) ───────────── */

const blobToDataUrl = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(blob)
  })

export async function exportBackup() {
  const all = await db.coupons.toArray()
  const coupons = await Promise.all(
    all.map(async ({ id: _id, image, ...rest }) => ({ ...rest, image: image ? await blobToDataUrl(image) : null })),
  )
  return new Blob([JSON.stringify({ app: 'coupons', version: 1, exportedAt: new Date().toISOString(), coupons }, null, 2)], {
    type: 'application/json',
  })
}

// Merges a backup into the current data; skips coupons that already exist.
export async function importBackup(file) {
  const json = JSON.parse(await file.text())
  if (json?.app !== 'coupons' || !Array.isArray(json.coupons)) throw new Error('זה לא קובץ גיבוי של האפליקציה')
  const existing = await db.coupons.toArray()
  const seen = new Set(existing.map((c) => `${c.createdAt}|${c.code}`))
  let added = 0
  for (const c of json.coupons) {
    if (seen.has(`${c.createdAt}|${c.code}`)) continue
    const image = c.image ? await (await fetch(c.image)).blob() : null
    await db.coupons.add({ ...c, image, history: c.history || [] })
    added++
  }
  return added
}
