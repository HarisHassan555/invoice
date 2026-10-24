import { useEffect, useState } from 'react'
import { cloudSyncState, startFirebaseSync } from '../firebase/sync'
import { store } from '../store'

export default function FirebaseGate({ children }) {
  const [ready, setReady] = useState(false)
  const [sync, setSync] = useState(cloudSyncState)

  useEffect(() => {
    startFirebaseSync(store, {
      onReady: (state) => {
        setSync({ ...state })
        setReady(true)
      },
      onError: (err) => {
        setSync({
          status: 'error',
          error: err?.message ?? 'Cloud sync failed',
          mode: 'local',
        })
        setReady(true)
      },
    })
  }, [])

  const banner = (() => {
    if (!ready) return null
    if (sync.status === 'error') {
      return (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          Cloud save failed ({sync.error}). Your data is still saved in this browser. Publish the
          updated rules from <code className="text-xs">firestore.rules</code> in Firebase (one
          document per company/product/invoice). Product logos and images stay on this device only.
        </div>
      )
    }
    return null
  })()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Connecting to cloud…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {banner}
      {children}
    </>
  )
}
