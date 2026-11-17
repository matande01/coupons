import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, requestPersistentStorage } from './lib/db'
import { couponStatus, groupByBrand, matchesQuery, undoLastSpend } from './lib/coupons'
import { daysUntil, todayISO } from './lib/dates'
import { formatMoney, fromCents, toCents } from './lib/money'
import CouponCard from './components/CouponCard'
import CouponForm from './components/CouponForm'
import SpendSheet from './components/SpendSheet'
import DetailSheet from './components/DetailSheet'
import MenuSheet from './components/MenuSheet'
import CatchSheet from './components/CatchSheet'
import Cop from './mascot/Cop'
import { BrandAvatar, btn } from './components/ui'
import { CameraIcon, MailIcon, MenuIcon, PencilIcon, PlusIcon, SearchIcon } from './components/icons'

export default function App() {
  const coupons = useLiveQuery(() => db.coupons.toArray(), [])
  const [tab, setTab] = useState('active')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // {type, id?, file?, back?}
  const [fabOpen, setFabOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const scanRef = useRef(null)
  const today = todayISO()

  useEffect(() => {
    requestPersistentStorage()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  // notify(text, action?, extra?) — extra: { title, cop } for the mascot toast
  const notify = useCallback((text, action, extra) => setToast({ text, action, ...extra, key: Date.now() }), [])
  const close = useCallback(() => setModal(null), [])

  const { active, archived } = useMemo(() => {
    const a = []
    const r = []
    for (const c of coupons || []) (couponStatus(c, today) === 'active' ? a : r).push(c)
    r.sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0))
    return { active: a, archived: r }
  }, [coupons, today])

  const groups = useMemo(() => groupByBrand(active.filter((c) => matchesQuery(c, query))), [active, query])
  const archivedShown = archived.filter((c) => matchesQuery(c, query))
  const totalActive = fromCents(active.reduce((s, c) => s + toCents(c.balance), 0))
  const expiringSoon = active.filter((c) => daysUntil(c.expiry, today) <= 30).length
  const knownBrands = [...new Set((coupons || []).map((c) => c.brand))]
  const byId = (id) => coupons?.find((c) => c.id === id)

  const modalCoupon = modal?.id ? byId(modal.id) : null

  const afterSpend = (id, newBalance) => {
    setModal(modal?.back === 'detail' ? { type: 'detail', id } : null)
    notify(
      `היתרה החדשה: ${formatMoney(newBalance)}`,
      {
        label: 'ביטול',
        fn: async () => {
          const b = await undoLastSpend(id)
          notify(`בוטל · היתרה חזרה ל-${formatMoney(b)}`)
        },
      },
      { title: 'עודכן בהצלחה!', cop: 'thumbs' },
    )
  }

  if (coupons === undefined) return <div className="min-h-dvh bg-canvas" />

  let cardIndex = 0

  return (
    <div className="min-h-dvh bg-canvas pb-32">
      {/* ── Header ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-16 text-white">
        <span className="pointer-events-none absolute -start-16 -top-24 size-72 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -end-10 bottom-0 size-56 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
        <svg className="pointer-events-none absolute inset-0 size-full opacity-[.07]" aria-hidden>
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-[28px] leading-none font-semibold tracking-tight">
              Cop<span className="text-amber-400">.</span>
            </h1>
            <span className="text-sm font-medium text-indigo-200">קופ שומר על הקופונים שלך</span>
          </div>
          <button
            onClick={() => setModal({ type: 'menu' })}
            aria-label="גיבוי ושחזור"
            className="grid size-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/20 active:scale-90"
          >
            <MenuIcon />
          </button>
        </div>

        <div className="relative mx-auto mt-6 flex max-w-3xl items-end justify-between gap-2">
          <div className="pb-1">
            <p className="text-sm font-medium text-indigo-200">יתרה זמינה</p>
            <p className="font-display text-[44px] leading-[1.1] font-semibold tracking-tight tabular-nums">{formatMoney(totalActive)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium ring-1 ring-white/10 backdrop-blur">{active.length} קופונים פעילים</span>
              {expiringSoon > 0 && (
                <span className="rounded-full bg-amber-400 px-2.5 py-1 font-semibold text-navy-950">{expiringSoon} פגים בחודש הקרוב</span>
              )}
            </div>
          </div>
          {coupons.length > 0 && <Cop pose="idle" className="-mb-14 size-32 shrink-0 animate-float drop-shadow-[0_12px_18px_rgb(0_0_0/.35)] sm:size-36" />}
        </div>
      </header>

      <main className="relative mx-auto -mt-8 max-w-3xl px-4">
        {/* ── Segmented control ── */}
        <div className="relative grid grid-cols-2 rounded-[22px] bg-white/80 p-1.5 shadow-soft ring-1 ring-navy-900/5 backdrop-blur-xl" role="tablist">
          <span
            className="absolute inset-y-1.5 start-1.5 w-[calc(50%-6px)] rounded-2xl bg-navy-900 shadow-[0_6px_16px_-6px_rgb(15_23_64/.6)] transition-transform duration-500 ease-[var(--ease-ios)]"
            style={{ transform: `translateX(${tab === 'active' ? '0' : '-100%'})` }}
            aria-hidden
          />
          {[
            ['active', 'פעילים', active.length],
            ['archive', 'ארכיון', archived.length],
          ].map(([k, label, n]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-[15px] font-semibold transition-colors duration-300 ${tab === k ? 'text-white' : 'text-slate-500 hover:text-navy-800'}`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === k ? 'bg-white/15 text-amber-300' : 'bg-navy-900/5'}`}>{n}</span>
            </button>
          ))}
        </div>

        {(coupons.length > 3 || query) && (
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute inset-y-0 start-4 my-auto text-slate-400" width={18} height={18} />
            <input
              type="search"
              aria-label="חיפוש"
              placeholder="חיפוש לפי מותג או קוד"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-12 w-full rounded-2xl bg-white py-3 ps-11 pe-4 text-base shadow-soft ring-1 ring-navy-900/5 transition placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
        )}

        {/* ── Content ── */}
        {tab === 'active' ? (
          groups.length === 0 ? (
            <EmptyState hasAny={coupons.length > 0 || Boolean(query)} onScan={() => scanRef.current.click()} onManual={() => setModal({ type: 'form' })} onCatch={() => setModal({ type: 'catch' })} />
          ) : (
            <div className="mt-6 space-y-7">
              {groups.map((g) => (
                <section key={g.brand} aria-label={g.brand}>
                  <div className="mb-3 flex items-center gap-2.5 px-1">
                    <BrandAvatar brand={g.brand} size="size-8 text-base rounded-xl" />
                    <h2 className="flex-1 truncate font-display text-lg font-semibold text-navy-900">{g.brand}</h2>
                    {g.items.length > 1 && <span className="rounded-full bg-navy-900/5 px-2 py-0.5 text-xs font-semibold text-slate-500">{g.items.length} קופונים</span>}
                    <span className="font-display text-base font-semibold text-navy-800 tabular-nums">{formatMoney(g.total)}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {g.items.map((c) => (
                      <CouponCard
                        key={c.id}
                        index={cardIndex++}
                        coupon={c}
                        today={today}
                        onOpen={() => setModal({ type: 'detail', id: c.id })}
                        onSpend={() => setModal({ type: 'spend', id: c.id })}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : archivedShown.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Cop pose="idle" className="size-28 opacity-90" />
            <p className="mt-3 max-w-xs text-sm text-slate-500">הארכיון ריק. קופונים שנוצלו עד הסוף או שפג תוקפם יעברו לכאן.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {archivedShown.map((c, i) => (
              <CouponCard key={c.id} index={i} coupon={c} today={today} onOpen={() => setModal({ type: 'detail', id: c.id })} />
            ))}
          </div>
        )}
      </main>

      {/* ── Floating add button (the empty state has its own buttons) ── */}
      {coupons.length > 0 && (
      <div className="fixed end-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-2.5">
        {fabOpen && (
          <>
            <div className="fixed inset-0 -z-10 animate-fade bg-navy-950/20 backdrop-blur-[2px]" onClick={() => setFabOpen(false)} />
            <FabAction delay={120} icon={<MailIcon width={18} height={18} />} label="תפיסת שובר ממייל" onClick={() => { setFabOpen(false); setModal({ type: 'catch' }) }} />
            <FabAction delay={60} icon={<CameraIcon width={18} height={18} />} label="סריקה מצילום מסך" onClick={() => { setFabOpen(false); scanRef.current.click() }} />
            <FabAction delay={0} icon={<PencilIcon width={18} height={18} />} label="הזנה ידנית" onClick={() => { setFabOpen(false); setModal({ type: 'form' }) }} />
          </>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          aria-label={fabOpen ? 'סגירת התפריט' : 'הוספת קופון'}
          aria-expanded={fabOpen}
          className="grid size-16 place-items-center rounded-[22px] bg-gradient-to-b from-amber-300 to-amber-500 text-navy-950 shadow-glow ring-4 ring-white/60 transition duration-300 hover:brightness-105 active:scale-90"
        >
          <PlusIcon width={30} height={30} strokeWidth={2.6} className={`transition-transform duration-300 ease-[var(--ease-spring)] ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
      )}

      <input
        ref={scanRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) setModal({ type: 'form', file: f })
        }}
      />

      {/* ── Modals ── */}
      {modal?.type === 'form' && (
        <CouponForm
          key={modal.id ?? 'new'}
          coupon={modalCoupon}
          initialFile={modal.file}
          prefill={modal.prefill}
          knownBrands={knownBrands}
          onClose={modal.back === 'detail' ? () => setModal({ type: 'detail', id: modal.id }) : close}
          onSaved={(id) => {
            setModal(modal.id ? { type: 'detail', id } : null)
            notify(modal.id ? 'השינויים נשמרו' : 'קופ שומר עליו מעכשיו', undefined, modal.id ? undefined : { title: 'הקופון נוסף!', cop: 'thumbs' })
            if (!modal.id) setTab('active')
          }}
        />
      )}
      {modal?.type === 'detail' && modalCoupon && (
        <DetailSheet
          coupon={modalCoupon}
          today={today}
          onClose={close}
          notify={notify}
          onSpend={() => setModal({ type: 'spend', id: modalCoupon.id, back: 'detail' })}
          onEdit={() => setModal({ type: 'form', id: modalCoupon.id, back: 'detail' })}
        />
      )}
      {modal?.type === 'spend' && modalCoupon && (
        <SpendSheet
          coupon={modalCoupon}
          onClose={modal.back === 'detail' ? () => setModal({ type: 'detail', id: modal.id }) : close}
          onDone={(b) => afterSpend(modalCoupon.id, b)}
        />
      )}
      {modal?.type === 'menu' && <MenuSheet onClose={close} notify={notify} />}
      {modal?.type === 'catch' && (
        <CatchSheet
          onClose={close}
          onReview={(prefill) => setModal({ type: 'form', prefill })}
          onCaught={(id, duplicate) => {
            setModal(null)
            setTab('active')
            const open = { label: 'פתיחה', fn: () => setModal({ type: 'detail', id }) }
            if (duplicate) notify('השובר הזה כבר שמור אצל קופ', open)
            else notify('נשמר כמו קופון רגיל · כדאי לוודא את הפרטים', open, { title: 'קופ תפס שובר!', cop: 'thumbs' })
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  return (
    <div
      key={toast.key}
      role="status"
      className={`fixed inset-x-4 bottom-[max(7rem,calc(env(safe-area-inset-bottom)+6rem))] z-50 mx-auto flex max-w-md animate-pop items-center gap-3 rounded-3xl bg-navy-900/95 py-3 pe-3 text-white shadow-lift ring-1 ring-white/10 backdrop-blur-xl ${toast.cop ? 'ps-2' : 'ps-5'}`}
    >
      {toast.cop && <Cop pose={toast.cop} className="-my-8 size-20 shrink-0 drop-shadow-lg" />}
      <div className="min-w-0 flex-1">
        {toast.title && <p className="font-display text-base font-semibold text-amber-300">{toast.title}</p>}
        <p className="text-sm text-white/90">{toast.text}</p>
      </div>
      {toast.action && (
        <button
          onClick={() => {
            onDismiss()
            toast.action.fn()
          }}
          className="min-h-11 shrink-0 rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}

function FabAction({ icon, label, onClick, delay }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="flex min-h-12 animate-pop items-center gap-2.5 rounded-2xl bg-white py-2 ps-4 pe-2 font-semibold text-navy-900 shadow-lift ring-1 ring-navy-900/5 transition hover:bg-canvas active:scale-95"
    >
      {label}
      <span className="grid size-9 place-items-center rounded-xl bg-navy-900 text-amber-300">{icon}</span>
    </button>
  )
}

function EmptyState({ hasAny, onScan, onManual, onCatch }) {
  if (hasAny)
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <Cop pose="magnify" className="size-28" />
        <p className="mt-2 text-slate-500">קופ חיפש בכל מקום ולא מצא קופונים פעילים</p>
      </div>
    )
  return (
    <div className="mt-8 flex flex-col items-center text-center">
      <div className="relative">
        <span className="absolute inset-6 rounded-full bg-amber-300/40 blur-2xl" aria-hidden />
        <Cop pose="magnify" className="relative size-52 animate-float" title="קופ, הדביבון ששומר על הקופונים" />
      </div>
      <h2 className="mt-2 max-w-xs text-balance font-display text-[22px] leading-snug font-semibold text-navy-900">אין עדיין קופונים? תן לי לשמור על משהו!</h2>
      <p className="mt-2 max-w-xs text-sm text-balance text-slate-500">שלחו לקופ צילום מסך של קופון או גיפט קארד, והוא ימלא את כל הפרטים לבד.</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
        <button onClick={onScan} className={`${btn.amber} text-[17px]`}>
          <CameraIcon width={20} height={20} /> סריקה מצילום מסך
        </button>
        <button onClick={onManual} className="min-h-12 rounded-2xl bg-white font-semibold text-navy-800 shadow-soft ring-1 ring-navy-900/5 transition hover:bg-white/70 active:scale-[.97]">
          הזנה ידנית
        </button>
        <button onClick={onCatch} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-indigo-700">
          <MailIcon width={16} height={16} /> קיבלתם גיפט קארד במייל?
        </button>
      </div>
    </div>
  )
}
