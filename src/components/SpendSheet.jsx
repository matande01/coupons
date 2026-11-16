import { useState } from 'react'
import Sheet from './Sheet'
import { Field, btn, inputCls } from './ui'
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

  return (
    <Sheet
      title={`עדכון יתרה · ${coupon.brand}`}
      onClose={onClose}
      footer={
        <button form="spend-form" type="submit" disabled={preview === null || saving} className={`${btn.primary} w-full`}>
          {saving ? 'שומר…' : 'שמירה'}
        </button>
      }
    >
      <form id="spend-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">יתרה נוכחית</p>
          <p className="text-3xl font-bold tabular-nums">{formatMoney(coupon.balance)}</p>
        </div>

        <Field label="כמה שילמת עכשיו?">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3.5 grid place-items-center text-slate-400">₪</span>
              <input
                autoFocus
                inputMode="decimal"
                className={`${inputCls} ps-8 text-xl font-semibold tabular-nums`}
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <button type="button" className={btn.secondary} onClick={() => setValue(String(coupon.balance))}>
              כל היתרה
            </button>
          </div>
        </Field>

        <Field label="הערה (לא חובה)">
          <input className={inputCls} placeholder="למשל: קניות שבועיות" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="min-h-14 rounded-2xl border border-dashed border-slate-200 p-3 text-center" aria-live="polite">
          {preview !== null && (
            <p className="text-slate-600">
              יתרה אחרי העדכון: <strong className="text-lg text-indigo-700 tabular-nums">{formatMoney(preview)}</strong>
              {preview === 0 && <span className="block text-xs text-slate-500">הקופון יעבור לארכיון</span>}
            </p>
          )}
          {(previewError || error) && <p className="text-sm font-medium text-rose-600">{previewError || error}</p>}
          {preview === null && !previewError && !error && <p className="text-sm text-slate-400">היתרה החדשה תוצג כאן</p>}
        </div>
      </form>
    </Sheet>
  )
}
