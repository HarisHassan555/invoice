import { flushCloudWrite } from '../firebase/sync'
import { store } from '../store'

/** Ask before permanent delete. Returns true if the user confirmed. */
export function confirmDelete(message) {
  return window.confirm(message)
}

/**
 * Dispatch a remove action and flush the cloud write immediately so deletes
 * persist (and do not come back on refresh).
 */
export async function deleteAndSync(action) {
  store.dispatch(action)
  const ok = await flushCloudWrite(store)
  if (!ok) {
    // Still deleted in local Redux; sync will retry on next change / reconnect.
    console.warn('Delete saved locally; cloud flush did not complete yet.')
  }
  return ok
}
