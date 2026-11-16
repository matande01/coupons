import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm shadow-indigo-600/20 active:scale-[.98] hover:bg-indigo-700 disabled:opacity-50 transition',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-800 active:scale-[.98] hover:bg-slate-200 disabled:opacity-50 transition',
  danger: 'inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 font-semibold text-rose-700 active:scale-[.98] hover:bg-rose-100 transition',
}

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none'

export function Field({ label, hint, badge, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {badge}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

const PALETTE = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
]
export function BrandAvatar({ brand, size = 'size-10 text-base' }) {
  const name = brand?.trim() || '?'
  let h = 0
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return <div className={`grid shrink-0 place-items-center rounded-2xl font-bold ${size} ${PALETTE[h % PALETTE.length]}`}>{[...name][0].toUpperCase()}</div>
}

export function CopyButton({ text, className = '' }) {
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
    <button onClick={copy} aria-label="העתקת קוד" className={`grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/70 ${className}`}>
      {done ? <CheckIcon className="text-emerald-600" width={18} height={18} /> : <CopyIcon width={18} height={18} />}
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
