import { useState } from 'react'
import Sheet from './Sheet'
import { BrandAvatar, btn, inputCls } from './ui'
import { computeSpend, recordSpend } from '../lib/coupons'
import { formatMoney, parseAmountInput } from '../lib/money'

// "Update balance": enter what you just spent, see the new balance, save.
export default function SpendSheet({ coupon, onClose, onDone }) {
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const spent = parseAmountInput(value)
  let preview = null
  let previewError = ''
  if (value.trim()) {
    try {
      preview = computeSpend(coupon.balance, spent)
    } catch (e) {
      previewError = e.message
    }
  }

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    setSaving(true)
    try {
      const newBalance = await recordSpend(coupon.id, spent, note)
      onDone(newBalance)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const quick = [20, 50, 100].filter((n) => n < coupon.balance)
  const after = preview ?? coupon.balance
  const pctAfter = coupon.amount > 0 ? (after / coupon.amount) * 100 : 0

  return (
    <Sheet
      title="עדכון יתרה"
      subtitle={coupon.brand}
      onClose={onClose}
      footer={
        <button form="spend-form" type="submit" disabled={preview === null || saving} className={`${btn.amber} w-full text-[17px]`}>
          {saving ? 'שומר…' : preview !== null ? `שמירה · נשאר ${formatMoney(preview)}` : 'שמירה'}
        </button>
      }
    >
      <form id="spend-form" onSubmit={submit} className="space-y-5">
        {/* Before → after */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-4 text-white shadow-soft">
          <span className="absolute -end-10 -top-12 size-36 rounded-full bg-indigo-500/25 blur-2xl" aria-hidden />
          <div className="relative flex items-center gap-3">
            <BrandAvatar brand={coupon.brand} size="size-11 text-xl" />
            <div className="flex flex-1 items-end justify-between gap-2">
              <div>
                <p className="text-xs text-indigo-200">יתרה נוכחית</p>
                <p className="font-display text-2xl font-semibold tabular-nums">{formatMoney(coupon.balance)}</p>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mb-1.5 text-indigo-300" aria-hidden>
                <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-end">
                <p className="text-xs text-indigo-200">אחרי העדכון</p>
                <p className={`font-display text-2xl font-semibold tabular-nums transition-colors ${preview !== null ? 'text-amber-300' : 'text-white/40'}`}>
                  {formatMoney(after)}
                </p>
              </div>
            </div>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-emerald-400 transition-[width] duration-500 ease-out" style={{ width: `${pctAfter}%` }} />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="spent" className="mb-2 block text-center text-sm font-semibold text-slate-600">
            כמה שילמת עכשיו?
          </label>
          <div className="relative mx-auto max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 start-5 grid place-items-center font-display text-2xl text-slate-300">₪</span>
            <input
              id="spent"
              autoFocus
              inputMode="decimal"
              aria-invalid={Boolean(previewError || error)}
              className="w-full rounded-3xl border-2 border-navy-900/10 bg-white py-4 ps-12 pe-5 text-center font-display text-4xl font-semibold text-navy-900 tabular-nums shadow-soft transition placeholder:text-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 focus:outline-none"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {quick.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue(String(n))}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${value === String(n) ? 'bg-navy-900 text-white' : 'bg-white text-navy-800 shadow-soft hover:bg-navy-900/5'}`}
              >
                ₪{n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setValue(String(coupon.balance))}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${value === String(coupon.balance) ? 'bg-navy-900 text-white' : 'bg-amber-400/20 text-amber-800 hover:bg-amber-400/30'}`}
            >
              כל היתרה
            </button>
          </div>
          <p className="mt-2 min-h-5 text-center text-sm" aria-live="polite">
            {(previewError || error) && <span className="font-medium text-rose-600">{previewError || error}</span>}
            {!previewError && !error && preview === 0 && <span className="text-slate-500">הקופון ינוצל במלואו ויעבור לארכיון</span>}
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block px-1 text-[13px] font-semibold text-slate-600">הערה (לא חובה)</span>
          <input className={inputCls} placeholder="למשל: קניות שבועיות" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </form>
    </Sheet>
  )
}
