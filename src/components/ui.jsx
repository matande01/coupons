import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

const press = 'transition duration-200 ease-out active:scale-[.97] disabled:opacity-45 disabled:active:scale-100'

export const btn = {
  primary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 px-5 font-semibold text-white shadow-[0_8px_20px_-8px_rgb(67_56_202/.7)] hover:brightness-110 ${press}`,
  amber: `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-5 font-semibold text-navy-950 shadow-glow hover:brightness-105 ${press}`,
  secondary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-navy-900/[.06] px-4 font-semibold text-navy-800 hover:bg-navy-900/10 ${press}`,
  danger: `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-500/10 px-4 font-semibold text-rose-600 hover:bg-rose-500/15 ${press}`,
}

export const inputCls =
  'w-full min-h-12 rounded-2xl border border-navy-900/10 bg-white px-4 py-3 text-base text-navy-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgb(15_23_64/.04)] transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none'

export function Field({ label, hint, badge, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 px-1 text-[13px] font-semibold text-slate-600">
        {label}
        {badge}
      </span>
      {children}
      {hint && <span className="mt-1 block px-1 text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

// Each brand gets a stable colour from its name.
export const BRAND_TONES = [
  { grad: 'from-indigo-500 to-violet-700', soft: 'bg-indigo-50 text-indigo-700' },
  { grad: 'from-amber-400 to-orange-600', soft: 'bg-amber-50 text-amber-800' },
  { grad: 'from-emerald-400 to-teal-700', soft: 'bg-emerald-50 text-emerald-700' },
  { grad: 'from-sky-400 to-blue-700', soft: 'bg-sky-50 text-sky-700' },
  { grad: 'from-rose-400 to-pink-700', soft: 'bg-rose-50 text-rose-700' },
  { grad: 'from-fuchsia-500 to-purple-700', soft: 'bg-fuchsia-50 text-fuchsia-700' },
  { grad: 'from-teal-400 to-cyan-700', soft: 'bg-teal-50 text-teal-700' },
  { grad: 'from-orange-400 to-red-600', soft: 'bg-orange-50 text-orange-700' },
]
export function brandTone(brand) {
  let h = 0
  for (const ch of (brand || '?').trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return BRAND_TONES[h % BRAND_TONES.length]
}
export const brandInitial = (brand) => [...(brand?.trim() || '?')][0].toUpperCase()

export function BrandAvatar({ brand, size = 'size-10 text-lg', muted = false }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-display font-semibold text-white shadow-sm ${size} ${muted ? 'from-slate-300 to-slate-500' : brandTone(brand).grad}`}
      aria-hidden
    >
      {brandInitial(brand)}
    </div>
  )
}

export function CopyButton({ text, className = '', label = 'העתקת קוד' }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(t)
  }, [done])
  const copy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for http:// on the local network, where the Clipboard API is unavailable
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
  }
  return (
    <button
      onClick={copy}
      aria-label={done ? 'הועתק' : label}
      className={`grid size-11 shrink-0 place-items-center rounded-xl transition active:scale-90 ${className}`}
    >
      {done ? <CheckIcon className="text-emerald-500" width={19} height={19} /> : <CopyIcon width={18} height={18} />}
    </button>
  )
}

export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!blob) return setUrl(null)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}
