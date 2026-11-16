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
import { BrandAvatar } from './components/ui'
import { CameraIcon, MenuIcon, PencilIcon, PlusIcon, SearchIcon, TicketIcon } from './components/icons'

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

  const notify = useCallback((text, action) => setToast({ text, action, key: Date.now() }), [])
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
    notify(`היתרה עודכנה: ${formatMoney(newBalance)}`, {
      label: 'ביטול',
      fn: async () => {
        const b = await undoLastSpend(id)
        notify(`בוטל · היתרה חזרה ל-${formatMoney(b)}`)
      },
    })
  }

  if (coupons === undefined) return <div className="min-h-dvh bg-slate-50" />

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-gradient-to-bl from-indigo-600 via-indigo-600 to-violet-600 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-14 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <TicketIcon /> הקופונים שלי
          </h1>
          <button onClick={() => setModal({ type: 'menu' })} aria-label="גיבוי ושחזור" className="grid size-10 place-items-center rounded-full hover:bg-white/15">
            <MenuIcon />
          </button>
        </div>
        <div className="mx-auto mt-5 max-w-3xl">
          <p className="text-sm text-indigo-100">יתרה זמינה</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">{formatMoney(totalActive)}</p>
          <p className="mt-1 text-sm text-indigo-100">
            {active.length} קופונים פעילים
            {expiringSoon > 0 && <span className="ms-2 rounded-full bg-amber-300/90 px-2 py-0.5 text-xs font-semibold text-amber-950">{expiringSoon} פגים בחודש הקרוב</span>}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-9 max-w-3xl px-4">
        {/* Tabs + search */}
        <div className="rounded-3xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/70">
          <div className="grid grid-cols-2 gap-1" role="tablist">
            {[
              ['active', `פעילים (${active.length})`],
              ['archive', `ארכיון (${archived.length})`],
            ].map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-2xl py-2.5 text-sm font-semibold transition ${tab === k ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(coupons.length > 3 || query) && (
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-slate-400" width={18} height={18} />
            <input
              type="search"
              placeholder="חיפוש לפי מותג או קוד"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 ps-10 pe-3 text-base focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none"
            />
          </div>
        )}

        {/* Content */}
        {tab === 'active' ? (
          groups.length === 0 ? (
            <EmptyState hasAny={coupons.length > 0 || Boolean(query)} onScan={() => scanRef.current.click()} onManual={() => setModal({ type: 'form' })} />
          ) : (
            <div className="mt-5 space-y-7">
              {groups.map((g) => (
                <section key={g.brand}>
                  <div className="mb-2.5 flex items-center gap-2.5 px-1">
                    <BrandAvatar brand={g.brand} size="size-8 text-sm" />
                    <h2 className="flex-1 font-bold text-slate-800">{g.brand}</h2>
                    <span className="text-sm font-medium text-slate-500 tabular-nums">
                      {g.items.length > 1 && `${g.items.length} · `}
                      {formatMoney(g.total)}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {g.items.map((c) => (
                      <CouponCard
                        key={c.id}
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
          <p className="mt-16 text-center text-slate-400">אין קופונים בארכיון. קופונים שפג תוקפם או שנוצלו עד הסוף יעברו לכאן.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {archivedShown.map((c) => (
              <CouponCard key={c.id} coupon={c} today={today} showBrand onOpen={() => setModal({ type: 'detail', id: c.id })} />
            ))}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <div className="fixed end-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-2">
        {fabOpen && (
          <>
            <div className="fixed inset-0 -z-10" onClick={() => setFabOpen(false)} />
            <FabAction icon={<CameraIcon width={18} height={18} />} label="סריקה מצילום מסך" onClick={() => { setFabOpen(false); scanRef.current.click() }} />
            <FabAction icon={<PencilIcon width={18} height={18} />} label="הזנה ידנית" onClick={() => { setFabOpen(false); setModal({ type: 'form' }) }} />
          </>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          aria-label="הוספת קופון"
          aria-expanded={fabOpen}
          className="grid size-15 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95"
        >
          <PlusIcon width={28} height={28} className={`transition ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

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

      {/* Modals */}
      {modal?.type === 'form' && (
        <CouponForm
          key={modal.id ?? 'new'}
          coupon={modalCoupon}
          initialFile={modal.file}
          knownBrands={knownBrands}
          onClose={modal.back === 'detail' ? () => setModal({ type: 'detail', id: modal.id }) : close}
          onSaved={(id) => {
            setModal(modal.id ? { type: 'detail', id } : null)
            notify(modal.id ? 'השינויים נשמרו' : 'הקופון נוסף')
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

      {/* Toast */}
      {toast && (
        <div key={toast.key} className="fixed inset-x-4 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] z-50 mx-auto flex max-w-md animate-up items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl" role="status">
          <span className="flex-1">{toast.text}</span>
          {toast.action && (
            <button
              onClick={() => {
                setToast(null)
                toast.action.fn()
              }}
              className="font-semibold text-indigo-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FabAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex animate-up items-center gap-2 rounded-full bg-white py-2.5 ps-4 pe-3 font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50">
      {label}
      <span className="grid size-8 place-items-center rounded-full bg-indigo-100 text-indigo-700">{icon}</span>
    </button>
  )
}

function EmptyState({ hasAny, onScan, onManual }) {
  if (hasAny) return <p className="mt-16 text-center text-slate-400">לא נמצאו קופונים פעילים</p>
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-indigo-100 text-indigo-600">
        <TicketIcon width={40} height={40} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-800">עוד אין קופונים</h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">צלמו מסך של קופון או גיפט קארד והפרטים ימולאו אוטומטית.</p>
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
        <button onClick={onScan} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700">
          <CameraIcon width={18} height={18} /> סריקה מצילום מסך
        </button>
        <button onClick={onManual} className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          הזנה ידנית
        </button>
      </div>
    </div>
  )
}
