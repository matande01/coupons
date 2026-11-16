import { useState } from 'react'
import Sheet from './Sheet'
import { CopyButton, brandInitial, brandTone, btn, useObjectUrl } from './ui'
import { PencilIcon, TrashIcon, UndoIcon, WalletIcon } from './icons'
import { couponStatus, deleteCoupon, undoLastSpend } from '../lib/coupons'
import { expiryLabel, formatDate } from '../lib/dates'
import { formatMoney } from '../lib/money'

export default function DetailSheet({ coupon, today, onClose, onSpend, onEdit, notify }) {
  const imageUrl = useObjectUrl(coupon.image)
  const [zoom, setZoom] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const status = couponStatus(coupon, today)
  const history = [...(coupon.history || [])].reverse()
  const tone = brandTone(coupon.brand)
  const pct = coupon.amount > 0 ? Math.max(0, Math.min(100, (coupon.balance / coupon.amount) * 100)) : 0

  const remove = async () => {
    if (!window.confirm(`למחוק את הקופון של ${coupon.brand}? אי אפשר לבטל את זה.`)) return
    await deleteCoupon(coupon.id)
    onClose()
    notify('הקופון נמחק')
  }

  const undo = async () => {
    const b = await undoLastSpend(coupon.id)
    notify(`העדכון האחרון בוטל · יתרה ${formatMoney(b)}`)
  }

  return (
    <Sheet
      title={coupon.brand}
      subtitle={expiryLabel(coupon.expiry, today) + (status === 'used' ? ' · נוצל' : '')}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {status === 'active' && (
            <button className={`${btn.amber} flex-1`} onClick={onSpend}>
              <WalletIcon width={18} height={18} /> עדכון יתרה
            </button>
          )}
          <button className={`${btn.secondary} ${status === 'active' ? '' : 'flex-1'}`} onClick={onEdit}>
            <PencilIcon width={18} height={18} /> עריכה
          </button>
          <button className={`${btn.danger} w-12 px-0`} onClick={remove} aria-label="מחיקת הקופון">
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Voucher hero */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lift ${status === 'active' ? tone.grad : 'from-slate-400 to-slate-600'}`}>
          <span className="absolute -end-8 -top-10 size-36 rounded-full bg-white/15" aria-hidden />
          <span className="absolute -bottom-14 start-10 size-32 rounded-full bg-black/10" aria-hidden />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">יתרה זמינה</p>
              <p className="font-display text-[40px] leading-tight font-semibold tabular-nums">{formatMoney(coupon.balance)}</p>
              <p className="text-sm text-white/80 tabular-nums">מתוך {formatMoney(coupon.amount)}</p>
            </div>
            <span className="grid size-16 place-items-center rounded-2xl bg-white/20 font-display text-3xl font-semibold backdrop-blur" aria-hidden>
              {brandInitial(coupon.brand)}
            </span>
          </div>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden>
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {coupon.code && (
          <div className="rounded-3xl border-2 border-dashed border-navy-900/15 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold text-slate-500">קוד הקופון</p>
            <div className="mt-1 flex items-center gap-2">
              <span dir="ltr" className={`flex-1 font-mono font-medium break-all text-start text-navy-900 select-all ${coupon.code.length > 12 ? 'text-lg tracking-wide' : 'text-[22px] tracking-widest'}`}>
                {coupon.code}
              </span>
              <CopyButton text={coupon.code} className="bg-navy-900 text-amber-300 hover:bg-navy-800" />
            </div>
            {coupon.pin && (
              <div className="mt-3 flex items-center gap-2 border-t border-dashed border-navy-900/10 pt-3 text-sm">
                <span className="font-semibold text-slate-500">PIN</span>
                <button onClick={() => setShowPin((s) => !s)} className="flex min-h-11 items-center gap-2">
                  <span dir="ltr" className="font-mono text-lg tracking-widest text-navy-900">{showPin ? coupon.pin : '••••'}</span>
                  {!showPin && <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-700">הצגה</span>}
                </button>
                {showPin && <CopyButton text={coupon.pin} label="העתקת PIN" className="text-slate-500 hover:bg-navy-900/5" />}
              </div>
            )}
          </div>
        )}

        {imageUrl && (
          <button onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-3xl bg-white shadow-soft">
            <img src={imageUrl} alt="צילום הקופון" className="max-h-72 w-full bg-canvas object-contain" />
            <span className="block py-2.5 text-xs font-medium text-slate-500">הקשה להגדלה (להצגה בקופה)</span>
          </button>
        )}

        {coupon.notes && <p className="rounded-3xl bg-amber-400/15 p-4 text-sm whitespace-pre-wrap text-amber-900">{coupon.notes}</p>}

        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-navy-900">היסטוריית שימוש</h3>
            {history.length > 0 && (
              <button onClick={undo} className="-me-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-500/10">
                <UndoIcon width={15} height={15} /> ביטול אחרון
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">עדיין לא נעשה שימוש בקופון</p>
          ) : (
            <ul className="divide-y divide-dashed divide-navy-900/10">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600" aria-hidden>
                      <WalletIcon width={16} height={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900 tabular-nums">−{formatMoney(h.amount)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {formatDate(h.date.slice(0, 10))}
                        {h.note && ` · ${h.note}`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy-900/5 px-2.5 py-1 text-xs text-slate-600 tabular-nums">נשאר {formatMoney(h.balanceAfter)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {zoom && imageUrl && (
        <div className="fixed inset-0 z-50 grid animate-fade place-items-center bg-white p-2" onClick={() => setZoom(false)} role="button" aria-label="סגירת התמונה">
          <img src={imageUrl} alt="צילום הקופון" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </Sheet>
  )
}
