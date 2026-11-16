import { useState } from 'react'
import Sheet from './Sheet'
import { BrandAvatar, CopyButton, btn, useObjectUrl } from './ui'
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
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {status === 'active' && (
            <button className={`${btn.primary} flex-1`} onClick={onSpend}>
              <WalletIcon width={18} height={18} /> עדכון יתרה
            </button>
          )}
          <button className={`${btn.secondary} ${status === 'active' ? '' : 'flex-1'}`} onClick={onEdit}>
            <PencilIcon width={18} height={18} /> עריכה
          </button>
          <button className={btn.danger} onClick={remove} aria-label="מחיקה">
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BrandAvatar brand={coupon.brand} size="size-14 text-xl" />
          <div>
            <p className="text-3xl font-bold tabular-nums">{formatMoney(coupon.balance)}</p>
            <p className="text-sm text-slate-500">
              מתוך {formatMoney(coupon.amount)} · {expiryLabel(coupon.expiry, today)}
              {status === 'used' && ' · נוצל'}
            </p>
          </div>
        </div>

        {coupon.code && (
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-xs text-slate-400">קוד הקופון</p>
            <div className="mt-1 flex items-center gap-2">
              <span dir="ltr" className="flex-1 font-mono text-xl tracking-widest break-all text-start select-all">
                {coupon.code}
              </span>
              <CopyButton text={coupon.code} className="text-slate-300 hover:bg-white/10" />
            </div>
            {coupon.pin && (
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-sm">
                <span className="text-slate-400">PIN</span>
                <button onClick={() => setShowPin((s) => !s)} className="flex items-center gap-2">
                  <span dir="ltr" className="font-mono tracking-widest">{showPin ? coupon.pin : '••••'}</span>
                  {!showPin && <span className="text-xs text-indigo-300">הצגה</span>}
                </button>
                {showPin && <CopyButton text={coupon.pin} className="text-slate-300 hover:bg-white/10" />}
              </div>
            )}
          </div>
        )}

        {imageUrl && (
          <button onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <img src={imageUrl} alt="צילום הקופון" className="max-h-72 w-full object-contain bg-slate-50" />
            <span className="block py-1.5 text-xs text-slate-500">הקשה להגדלה (להצגה בקופה)</span>
          </button>
        )}

        {coupon.notes && <p className="rounded-2xl bg-amber-50 p-3 text-sm whitespace-pre-wrap text-amber-900">{coupon.notes}</p>}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">היסטוריית שימוש</h3>
            {history.length > 0 && (
              <button onClick={undo} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                <UndoIcon width={15} height={15} /> ביטול אחרון
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">עדיין לא נעשה שימוש בקופון</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 tabular-nums">−{formatMoney(h.amount)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(h.date.slice(0, 10))}
                      {h.note && ` · ${h.note}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">יתרה {formatMoney(h.balanceAfter)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {zoom && imageUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white p-2" onClick={() => setZoom(false)}>
          <img src={imageUrl} alt="צילום הקופון" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </Sheet>
  )
}
