import { useRef, useState } from 'react'
import Sheet from './Sheet'
import { btn } from './ui'
import { exportBackup, importBackup } from '../lib/coupons'

export default function MenuSheet({ onClose, notify }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const doExport = async () => {
    setBusy(true)
    try {
      const blob = await exportBackup()
      const name = `coupons-backup-${new Date().toISOString().slice(0, 10)}.json`
      const file = new File([blob], name, { type: 'application/json' })
      // On iPhone the share sheet lets you save the file to Files / iCloud Drive.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'גיבוי קופונים' }).catch(() => {})
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }
    } finally {
      setBusy(false)
    }
  }

  const doImport = async (file) => {
    setBusy(true)
    try {
      const n = await importBackup(file)
      notify(n ? `שוחזרו ${n} קופונים` : 'כל הקופונים בקובץ כבר קיימים')
      onClose()
    } catch (err) {
      notify(err.message || 'הקובץ לא תקין')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="גיבוי ושחזור" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          הקופונים שמורים רק על המכשיר הזה. כדאי לשמור גיבוי מדי פעם (למשל ב-iCloud Drive) כדי לא לאבד אותם אם מוחקים את האפליקציה.
        </p>
        <button className={`${btn.primary} w-full`} onClick={doExport} disabled={busy}>
          שמירת גיבוי
        </button>
        <button className={`${btn.secondary} w-full`} onClick={() => fileRef.current.click()} disabled={busy}>
          שחזור מקובץ גיבוי
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) doImport(f)
          }}
        />
      </div>
    </Sheet>
  )
}
