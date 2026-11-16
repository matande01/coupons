import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet'
import { Field, btn, inputCls, useObjectUrl } from './ui'
import { CameraIcon, SparkIcon, TrashIcon } from './icons'
import { saveCoupon } from '../lib/coupons'
import { parseAmountInput, toCents } from '../lib/money'
import { BRANDS } from '../lib/brands'

const STAGE_TEXT = {
  barcode: 'מחפש ברקוד…',
  loading: 'טוען את מנוע זיהוי הטקסט (רק בפעם הראשונה)…',
  ocr: 'קורא את הטקסט מהתמונה…',
}

const empty = { brand: '', code: '', pin: '', amount: '', balance: '', expiry: '', notes: '' }

export default function CouponForm({ coupon, initialFile, knownBrands, onClose, onSaved }) {
  const editing = Boolean(coupon)
  const [form, setForm] = useState(() =>
    coupon ? { ...empty, ...coupon, amount: String(coupon.amount), balance: String(coupon.balance) } : empty,
  )
  const [image, setImage] = useState(coupon?.image ?? null)
  const [balanceTouched, setBalanceTouched] = useState(editing)
  const [scan, setScan] = useState(null) // {stage, progress}
  const [auto, setAuto] = useState(new Set()) // fields filled by recognition
  const [scanNote, setScanNote] = useState('')
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
      setScanNote(n ? `זוהו ${n} שדות אוטומטית — כדאי לוודא שהם נכונים.` : 'לא הצלחתי לזהות פרטים מהתמונה. אפשר למלא ידנית — התמונה תישמר עם הקופון.')
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
      <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700">
        <SparkIcon width={11} height={11} /> זוהה
      </span>
    ) : null
  const autoCls = (k) => (auto.has(k) ? ' bg-violet-50/60 border-violet-300' : '')

  const brandOptions = [...new Set([...knownBrands, ...BRANDS.map((b) => b.name)])]

  return (
    <Sheet
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      footer={
        <button form="coupon-form" type="submit" disabled={saving || Boolean(scan)} className={`${btn.primary} w-full`}>
          {saving ? 'שומר…' : editing ? 'שמירת שינויים' : 'הוספת קופון'}
        </button>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="space-y-4">
        {/* Image + recognition */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
          {imageUrl ? (
            <div className="flex items-center gap-3">
              <img src={imageUrl} alt="צילום הקופון" className="h-24 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
              <div className="flex flex-1 flex-col gap-2">
                <button type="button" className={`${btn.secondary} py-2 text-sm`} onClick={() => fileRef.current.click()} disabled={Boolean(scan)}>
                  <CameraIcon width={16} height={16} /> תמונה אחרת
                </button>
                <button type="button" className={`${btn.danger} py-2 text-sm`} onClick={() => setImage(null)} disabled={Boolean(scan)}>
                  <TrashIcon width={16} height={16} /> הסרת תמונה
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current.click()} className="flex w-full flex-col items-center gap-1 py-4 text-slate-600">
              <span className="grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
                <CameraIcon />
              </span>
              <span className="font-semibold">העלאת צילום מסך של הקופון</span>
              <span className="text-xs text-slate-500">הפרטים ימולאו אוטומטית</span>
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

          {scan && (
            <div className="mt-3" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                <span>{STAGE_TEXT[scan.stage]}</span>
                {scan.stage === 'ocr' && <span className="tabular-nums">{Math.round(scan.progress * 100)}%</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-violet-500 transition-all ${scan.stage !== 'ocr' ? 'w-1/3 animate-pulse' : ''}`}
                  style={scan.stage === 'ocr' ? { width: `${Math.max(5, scan.progress * 100)}%` } : undefined}
                />
              </div>
            </div>
          )}
          {scanNote && !scan && <p className="mt-2 text-sm text-slate-600">{scanNote}</p>}
          {rawText && !scan && (
            <details className="mt-1 text-xs text-slate-500">
              <summary className="cursor-pointer">הטקסט שזוהה בתמונה</summary>
              <pre dir="auto" className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-2 whitespace-pre-wrap">{rawText}</pre>
            </details>
          )}
        </div>

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
            <input type="date" className={`${inputCls} min-h-[50px]${autoCls('expiry')}`} value={form.expiry} onChange={(e) => set('expiry', e.target.value)} />
          </Field>
          <Field label="קוד סודי / PIN" badge={<AutoBadge k="pin" />}>
            <input dir="ltr" inputMode="numeric" className={`${inputCls} text-start font-mono${autoCls('pin')}`} value={form.pin} onChange={(e) => set('pin', e.target.value)} />
          </Field>
        </div>

        <Field label="הערות">
          <textarea rows={2} className={inputCls} placeholder="למשל: מתנה מהעבודה, תקף רק בסניפים" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
      </form>
    </Sheet>
  )
}
