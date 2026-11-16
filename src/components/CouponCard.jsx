import { couponStatus, urgency } from '../lib/coupons'
import { expiryLabel } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { CopyButton, brandInitial, brandTone } from './ui'
import { ClockIcon, WalletIcon } from './icons'

const URGENCY = {
  high: 'bg-rose-500/10 text-rose-600',
  medium: 'bg-amber-500/15 text-amber-700',
  low: 'bg-emerald-500/10 text-emerald-700',
  off: 'bg-navy-900/[.06] text-slate-500',
}

const STUB = 76 // px — width of the brand stub; the perforation sits right after it

// A digital voucher: brand stub · dashed tear-off line · balance, expiry, code.
export default function CouponCard({ coupon, today, onOpen, onSpend, index = 0 }) {
  const status = couponStatus(coupon, today)
  const archived = status !== 'active'
  const tone = brandTone(coupon.brand)
  const pct = coupon.amount > 0 ? Math.max(0, Math.min(100, (coupon.balance / coupon.amount) * 100)) : 0
  const badge = archived
    ? { text: status === 'used' ? 'נוצל במלואו' : expiryLabel(coupon.expiry, today), cls: URGENCY.off }
    : { text: expiryLabel(coupon.expiry, today), cls: URGENCY[urgency(coupon, today)] }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${coupon.brand}, יתרה ${formatMoney(coupon.balance)}, ${badge.text}`}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      style={{ '--stub': `${STUB}px`, animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group relative flex min-h-[136px] min-w-0 animate-rise cursor-pointer rounded-3xl bg-white shadow-soft transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift active:scale-[.985]"
    >
      {/* Brand stub */}
      <div
        className={`relative flex shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-s-3xl bg-gradient-to-br px-2 text-white ${archived ? 'from-slate-300 to-slate-500' : tone.grad}`}
        style={{ width: STUB }}
      >
        <span className="absolute -end-6 -top-6 size-16 rounded-full bg-white/15" aria-hidden />
        <span className="absolute -bottom-8 -start-5 size-16 rounded-full bg-black/10" aria-hidden />
        <span className="relative font-display text-[30px] leading-none font-semibold drop-shadow-sm">{brandInitial(coupon.brand)}</span>
        <span className="relative line-clamp-2 text-center text-[11px] leading-tight font-semibold text-white/90">{coupon.brand}</span>
      </div>

      {/* Perforation + notches */}
      <span className="voucher-notch -top-2.5 shadow-[inset_0_-2px_3px_rgb(15_23_64/.06)]" aria-hidden />
      <span className="voucher-notch -bottom-2.5 shadow-[inset_0_2px_3px_rgb(15_23_64/.06)]" aria-hidden />
      <span className="absolute inset-y-4 border-s-2 border-dashed border-navy-900/10" style={{ insetInlineStart: STUB - 1 }} aria-hidden />

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-3.5 ps-4 pe-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400">יתרה</p>
            <p className="font-display text-[28px] leading-8 font-semibold tracking-tight text-navy-900 tabular-nums">
              {formatMoney(coupon.balance)}
            </p>
            {coupon.amount !== coupon.balance && <p className="text-xs text-slate-400 tabular-nums">מתוך {formatMoney(coupon.amount)}</p>}
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${badge.cls}`}>
            <ClockIcon width={12} height={12} />
            {badge.text}
          </span>
        </div>

        {coupon.amount > 0 && !archived && (
          <div className="h-1.5 overflow-hidden rounded-full bg-navy-900/[.06]" aria-hidden>
            <div className={`h-full rounded-full bg-gradient-to-l ${tone.grad} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="mt-auto flex items-center gap-2">
          {coupon.code ? (
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-dashed border-navy-900/15 bg-canvas/70 ps-2.5">
              <span dir="ltr" className={`flex-1 truncate text-start font-mono text-navy-800 ${coupon.code.length > 10 ? 'text-[11.5px]' : 'text-[13px] tracking-wider'}`}>
                {coupon.code}
              </span>
              <CopyButton text={coupon.code} className="size-9 text-slate-400 hover:text-navy-800" />
            </div>
          ) : (
            <span className="flex-1 text-xs text-slate-400">אין קוד</span>
          )}
          {!archived && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSpend()
              }}
              aria-label="עדכון יתרה"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-navy-900 px-3 text-[13px] font-semibold text-white shadow-[0_6px_14px_-6px_rgb(15_23_64/.6)] transition hover:bg-navy-800 active:scale-95"
            >
              <WalletIcon width={16} height={16} className="text-amber-300" />
              עדכון
            </button>
          )}
        </div>
      </div>

      {archived && (
        <span
          className={`pointer-events-none absolute end-6 top-[46px] -rotate-12 rounded-lg border-2 px-2 py-0.5 font-display text-sm font-semibold opacity-80 ${status === 'used' ? 'border-emerald-500 text-emerald-600' : 'border-rose-400 text-rose-500'}`}
          aria-hidden
        >
          {status === 'used' ? 'נוצל' : 'פג תוקף'}
        </span>
      )}
    </article>
  )
}
