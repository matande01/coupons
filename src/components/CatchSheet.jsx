import { useState } from 'react'
import Sheet from './Sheet'
import { btn, inputCls } from './ui'
import { MailIcon } from './icons'
import Cop from '../mascot/Cop'
import { db } from '../lib/db'
import { saveCoupon } from '../lib/coupons'
import { catchVoucher, isComplete } from '../lib/catch'

// Voucher Catcher: paste a gift-card email, Cop parses it and saves it like a manual entry.
// Complete vouchers (brand + code + amount) are saved right away; partial ones open the form.
export default function CatchSheet({ onClose, onCaught, onReview }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canRead = Boolean(navigator.clipboard?.readText)

  async function run(raw) {
    setError('')
    const v = catchVoucher(raw)
    if (!v.found.length) return setError('קופ לא מצא פרטי שובר בטקסט. כדאי לוודא שהעתקתם את כל המייל.')
    setBusy(true)
    try {
      const dup = v.code && (await db.coupons.filter((c) => c.code.replace(/[\s-]/g, '').toUpperCase() === v.code.replace(/[\s-]/g, '').toUpperCase()).first())
      if (dup) return onCaught(dup.id, true)
      const fields = { brand: v.brand, code: v.code, pin: v.pin, amount: v.amount, expiry: v.expiry }
      if (!isComplete(v)) return onReview(fields)
      const id = await saveCoupon({ ...fields, balance: v.amount, notes: 'נתפס ממייל' })
      onCaught(id, false)
    } catch (err) {
      setError(err.message || 'משהו השתבש')
    } finally {
      setBusy(false)
    }
  }

  async function pasteAndCatch() {
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip?.trim()) return setError('הלוח ריק. העתיקו את המייל ונסו שוב.')
      setText(clip)
      await run(clip)
    } catch {
      setError('אין גישה ללוח. אפשר להדביק את המייל בתיבה למטה.')
    }
  }

  return (
    <Sheet
      title="תפיסת שובר ממייל"
      subtitle="קרפור, Terminal X, דרים קארד, תו פלוס, קצפת ועוד"
      onClose={onClose}
      footer={
        <button type="button" disabled={busy || !text.trim()} onClick={() => run(text)} className={`${btn.primary} w-full text-[17px]`}>
          {busy ? 'קופ תופס…' : 'קופ, תפוס!'}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-soft">
          <Cop pose="magnify" className="size-20 shrink-0" />
          <p className="text-sm leading-relaxed text-slate-600">
            העתיקו את המייל עם הגיפט קארד, וקופ יזהה את המותג, הקוד, הסכום והתוקף. הטקסט לא יוצא מהטלפון.
          </p>
        </div>
        {canRead && (
          <button type="button" disabled={busy} onClick={pasteAndCatch} className={`${btn.amber} w-full text-[17px]`}>
            <MailIcon width={20} height={20} /> הדבקה מהמייל ותפיסה
          </button>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-900">{canRead ? 'או הדביקו כאן ידנית' : 'הדביקו כאן את תוכן המייל'}</span>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError('') }}
            rows={6}
            dir="auto"
            placeholder="מספר השובר: …&#10;סכום: …&#10;בתוקף עד: …"
            className={`${inputCls} min-h-36 resize-y py-3 leading-relaxed`}
          />
        </label>
        {error && <p role="alert" className="rounded-2xl bg-rose-500/10 p-3 text-sm font-medium text-rose-700">{error}</p>}
      </div>
    </Sheet>
  )
}
