import { useEffect, useState } from 'react'
import { cloudSyncState } from '../firebase/sync'

export default function CloudSyncStatus() {
  const [sync, setSync] = useState(() => ({ ...cloudSyncState }))

  useEffect(() => {
    const tick = () => setSync({ ...cloudSyncState })
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [])

  if (sync.status === 'connecting') {
    return <p className="px-3 py-2 text-xs text-slate-500">Loading from database…</p>
  }

  if (sync.status === 'error') {
    return (
      <p className="px-3 py-2 text-xs text-amber-400" title={sync.error ?? ''}>
        Database unavailable
      </p>
    )
  }

  return (
    <p className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
      Saved to database
    </p>
  )
}
