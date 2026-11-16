import { useEffect } from 'react'
import { XIcon } from './icons'

// iOS-style bottom sheet on phones (grabber, large radius), centered card on wider screens.
export default function Sheet({ title, subtitle, onClose, children, footer, header }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-navy-950/45 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative flex max-h-[93dvh] w-full animate-up flex-col overflow-hidden rounded-t-[28px] bg-canvas shadow-lift sm:max-w-lg sm:animate-pop sm:rounded-[28px]">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-navy-900/15 sm:hidden" aria-hidden />
        {header}
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold text-navy-900">{title}</h2>
            {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="סגירה" className="-me-1 grid size-11 shrink-0 place-items-center rounded-full bg-navy-900/[.06] text-slate-500 transition hover:bg-navy-900/10 active:scale-90">
            <XIcon width={18} height={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-5">{children}</div>
        {footer && <div className="border-t border-navy-900/[.06] bg-white/70 px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur-xl">{footer}</div>}
        {!footer && <div className="pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>
  )
}
