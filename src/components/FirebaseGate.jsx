import { useEffect, useState } from 'react'
import { cloudSyncState, retryCloudSync, startFirebaseSync } from '../firebase/sync'
import { store } from '../store'

export default function FirebaseGate({ children }) {
  const [ready, setReady] = useState(false)
  const [sync, setSync] = useState(cloudSyncState)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    startFirebaseSync(store, {
      onReady: (state) => {
        setSync({ ...state })
        setReady(true)
      },
      onError: () => {
        setSync({ ...cloudSyncState })
        setReady(true)
      },
    })
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading from database…</p>
        </div>
      </div>
    )
  }

  if (sync.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="panel max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cannot load data</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Invoices and master data are stored in Firebase only. This device could not reach the
            database.
          </p>
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">{sync.error}</p>
          <p className="mt-3 text-xs text-slate-500">
            Publish <code className="text-[11px]">firestore.rules</code> in the Firebase console if
            you recently updated rules.
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            disabled={retrying}
            onClick={async () => {
              setRetrying(true)
              const ok = await retryCloudSync(store)
              setSync({ ...cloudSyncState })
              setRetrying(false)
              if (!ok) return
            }}
          >
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  return children
}
