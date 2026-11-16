import { couponStatus, urgency } from '../lib/coupons'
import { expiryLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { BrandAvatar, CopyButton } from './ui'
import { ClockIcon, WalletIcon } from './icons'

const URGENCY = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  medium: 'bg-amber-50 text-amber-800 ring-amber-200',
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function CouponCard({ coupon, today, onOpen, onSpend, showBrand = false }) {
  const status = couponStatus(coupon, today)
  const archived = status !== 'active'
  const pct = coupon.amount > 0 ? Math.max(0, Math.min(100, (coupon.balance / coupon.amount) * 100)) : 0
  const badge = archived
    ? status === 'used'
      ? { text: 'נוצל במלואו', cls: URGENCY.low }
      : { text: expiryLabel(coupon.expiry, today), cls: URGENCY.low }
    : { text: expiryLabel(coupon.expiry, today), cls: URGENCY[urgency(coupon, today)] }

  return (
    <article
      onClick={onOpen}
      className={`group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[.99] ${archived ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {showBrand && <BrandAvatar brand={coupon.brand} />}
          <div className="min-w-0">
            {showBrand && <p className="truncate font-semibold text-slate-900">{coupon.brand}</p>}
            <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatMoney(coupon.balance)}
              {coupon.amount !== coupon.balance && <span className="ms-1.5 text-sm font-medium text-slate-400">מתוך {formatMoney(coupon.amount)}</span>}
            </p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
          <ClockIcon width={13} height={13} />
          {badge.text}
        </span>
      </div>

      {coupon.amount > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {coupon.code ? (
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-slate-50 py-1 ps-3 pe-1">
            <span dir="ltr" className={`flex-1 truncate text-start font-mono text-slate-700 ${coupon.code.length > 13 ? 'text-xs' : 'text-sm tracking-wider'}`}>
              {coupon.code}
            </span>
            <CopyButton text={coupon.code} />
          </div>
        ) : (
          <div className="flex-1 text-sm text-slate-400">אין קוד</div>
        )}
        {!archived && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSpend()
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95"
          >
            <WalletIcon width={16} height={16} />
            עדכון יתרה
          </button>
        )}
      </div>
    </article>
  )
}
