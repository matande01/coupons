import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet'
import { Field, btn, inputCls, useObjectUrl } from './ui'
import { CameraIcon, SparkIcon, TrashIcon } from './icons'
import Cop from '../mascot/Cop'
import { saveCoupon } from '../lib/coupons'
import { parseAmountInput, toCents } from '../lib/money'
import { BRANDS } from '../lib/brands'

const STAGE_TEXT = {
  barcode: 'מחפש ברקוד…',
  loading: 'טוען את כלי הזיהוי (רק בפעם הראשונה)…',
  ocr: 'קורא את הטקסט מהתמונה…',
}

const empty = { brand: '', code: '', pin: '', amount: '', balance: '', expiry: '', notes: '' }

// prefill: fields found by Voucher Catcher ({brand, code, pin, amount, expiry}); shown with the "קופ זיהה" badge.
export default function CouponForm({ coupon, initialFile, prefill, knownBrands, onClose, onSaved }) {
  const editing = Boolean(coupon)
  const prefilled = Object.fromEntries(Object.entries(prefill || {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  const [form, setForm] = useState(() =>
    coupon
      ? { ...empty, ...coupon, amount: String(coupon.amount), balance: String(coupon.balance) }
      : { ...empty, ...prefilled, balance: prefilled.amount ?? '', notes: prefill ? 'נתפס ממייל' : '' },
  )
  const [image, setImage] = useState(coupon?.image ?? null)
  const [balanceTouched, setBalanceTouched] = useState(editing)
  const [scan, setScan] = useState(null) // {stage, progress}
  const [auto, setAuto] = useState(() => new Set(Object.keys(prefilled))) // fields filled by recognition
  const [scanNote, setScanNote] = useState(prefill ? 'קופ תפס חלק מהפרטים מהמייל. השלימו את מה שחסר ושמרו.' : '')
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const imageUrl = useObjectUrl(image)
  const started = useRef(false)

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'amount' && !balanceTouched) next.balance = value
      return next
    })
    setAuto((a) => {
      if (!a.has(key)) return a
      const n = new Set(a)
      n.delete(key)
      return n
    })
  }

  async function runScan(file) {
    setError('')
    setScanNote('')
    setScan({ stage: 'barcode', progress: 0 })
    try {
      const { compressImage, extractCoupon } = await import('../lib/extract') // loaded only when scanning
      setImage(await compressImage(file))
      const r = await extractCoupon(file, setScan)
      const found = {}
      if (r.brand) found.brand = r.brand
      if (r.code) found.code = r.code
      if (r.pin) found.pin = r.pin
      if (r.amount) found.amount = String(r.amount)
      if (r.expiry) found.expiry = r.expiry
      setForm((f) => {
        const next = { ...f, ...found }
        if (found.amount && !balanceTouched) next.balance = found.amount
        return next
      })
      setAuto(new Set(Object.keys(found)))
      setRawText(r.rawText)
      const n = Object.keys(found).length
      setScanNote(n ? `קופ מצא ${n} פרטים, כדאי לוודא שהם נכונים.` : 'קופ לא הצליח לזהות פרטים מהתמונה. אפשר למלא ידנית — התמונה תישמר עם הקופון.')
    } catch (err) {
      console.error(err)
      setScanNote(
        navigator.onLine
          ? 'הזיהוי נכשל. אפשר למלא את הפרטים ידנית.'
          : 'בפעם הראשונה הזיהוי צריך חיבור לאינטרנט כדי להוריד את קבצי השפה. אפשר למלא ידנית.',
      )
    } finally {
      setScan(null)
    }
  }

  useEffect(() => {
    if (initialFile && !started.current) {
      started.current = true
      runScan(initialFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile])

  const submit = async (e) => {
    e.preventDefault()
    const amount = parseAmountInput(form.amount)
    const balance = parseAmountInput(form.balance === '' ? form.amount : form.balance)
    if (!form.brand.trim()) return setError('חסר שם מותג / חנות')
    if (!(amount > 0)) return setError('יש להזין סכום תקין')
    if (!(balance >= 0)) return setError('יש להזין יתרה תקינה')
    if (toCents(balance) > toCents(amount)) return setError('היתרה לא יכולה להיות גדולה מהסכום המקורי')
    setSaving(true)
    try {
      const id = await saveCoupon({ ...form, amount, balance, image }, coupon?.id)
      onSaved(id)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const AutoBadge = ({ k }) =>
    auto.has(k) ? (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <SparkIcon width={11} height={11} /> קופ זיהה
      </span>
    ) : null
  const autoCls = (k) => (auto.has(k) ? ' border-amber-300 bg-amber-50/60' : '')

  const brandOptions = [...new Set([...knownBrands, ...BRANDS.map((b) => b.name)])]
  const pct = scan?.stage === 'ocr' ? Math.max(4, Math.round(scan.progress * 100)) : null

  return (
    <Sheet
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      footer={
        <button form="coupon-form" type="submit" disabled={saving || Boolean(scan)} className={`${btn.primary} w-full text-[17px]`}>
          {saving ? 'שומר…' : editing ? 'שמירת שינויים' : 'הוספת קופון'}
        </button>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="space-y-4">
        {/* Scan / image area */}
        {scan ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-4 text-white shadow-soft" aria-live="polite">
            <span className="absolute -start-10 -top-10 size-40 rounded-full bg-amber-300/20 blur-2xl" aria-hidden />
            <div className="relative flex items-center gap-3">
              <Cop pose="scan" className="size-28 shrink-0 drop-shadow-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold">קופ מנתח את התמונה…</p>
                <p className="mt-0.5 text-sm text-indigo-200">{STAGE_TEXT[scan.stage]}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  {pct === null ? (
                    <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-l from-amber-300 to-amber-500" />
                  ) : (
                    <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-amber-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
                  )}
                </div>
                {pct !== null && <p className="mt-1 text-xs text-indigo-200 tabular-nums">{pct}%</p>}
              </div>
              {imageUrl && (
                <div className="relative hidden h-24 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/20 min-[380px]:block">
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                  <span className="absolute inset-x-0 h-6 animate-[scanline_1.6s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-amber-300/70 to-transparent" aria-hidden />
                </div>
              )}
            </div>
          </div>
        ) : imageUrl ? (
          <div className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-soft">
            <img src={imageUrl} alt="צילום הקופון" className="h-24 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-navy-900/10" />
            <div className="flex flex-1 flex-col gap-2">
              <button type="button" className={`${btn.secondary} min-h-11 text-sm`} onClick={() => fileRef.current.click()}>
                <CameraIcon width={16} height={16} /> תמונה אחרת
              </button>
              <button type="button" className={`${btn.danger} min-h-11 text-sm`} onClick={() => setImage(null)}>
                <TrashIcon width={16} height={16} /> הסרת תמונה
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="group flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-indigo-300/70 bg-gradient-to-br from-indigo-50 to-white p-3 text-start transition hover:border-indigo-400 active:scale-[.99]"
          >
            <Cop pose="magnify" className="size-20 shrink-0" />
            <span className="flex-1">
              <span className="block font-display text-base font-semibold text-navy-900">העלאת צילום מסך של הקופון</span>
              <span className="block text-sm text-slate-500">קופ יקרא את הפרטים וימלא אותם בשבילך</span>
            </span>
            <span className="grid size-11 place-items-center rounded-2xl bg-navy-900 text-amber-300 transition group-hover:scale-105">
              <CameraIcon width={20} height={20} />
            </span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) runScan(f)
          }}
        />

        {scanNote && !scan && (
          <div className="rounded-2xl bg-white/70 px-3.5 py-2.5 text-sm text-slate-600 shadow-soft">
            {scanNote}
            {rawText && (
              <details className="mt-1 text-xs text-slate-500">
                <summary className="cursor-pointer py-1">הטקסט שזוהה בתמונה</summary>
                <pre dir="auto" className="mt-1 max-h-40 overflow-auto rounded-xl bg-canvas p-2 whitespace-pre-wrap">{rawText}</pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-4 rounded-3xl bg-white p-4 shadow-soft">
          <Field label="מותג / חנות" badge={<AutoBadge k="brand" />}>
            <input className={inputCls + autoCls('brand')} list="brand-list" placeholder="למשל: קרפור" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            <datalist id="brand-list">
              {brandOptions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>

          <Field label="קוד קופון / מספר ברקוד" badge={<AutoBadge k="code" />}>
            <input dir="ltr" className={`${inputCls} text-start font-mono tracking-wider${autoCls('code')}`} autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={form.code} onChange={(e) => set('code', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="סכום (₪)" badge={<AutoBadge k="amount" />}>
              <input inputMode="decimal" className={inputCls + autoCls('amount')} placeholder="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </Field>
            <Field label="יתרה נוכחית (₪)">
              <input
                inputMode="decimal"
                className={inputCls}
                placeholder="0"
                value={form.balance}
                onChange={(e) => {
                  setBalanceTouched(true)
                  set('balance', e.target.value)
                }}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="תוקף" badge={<AutoBadge k="expiry" />}>
              <input type="date" className={`${inputCls}${autoCls('expiry')}`} value={form.expiry} onChange={(e) => set('expiry', e.target.value)} />
            </Field>
            <Field label="קוד סודי / PIN" badge={<AutoBadge k="pin" />}>
              <input dir="ltr" inputMode="numeric" className={`${inputCls} text-start font-mono${autoCls('pin')}`} value={form.pin} onChange={(e) => set('pin', e.target.value)} />
            </Field>
          </div>

          <Field label="הערות">
            <textarea rows={2} className={inputCls} placeholder="למשל: מתנה מהעבודה, תקף רק בסניפים" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-rose-500/10 p-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  )
}
