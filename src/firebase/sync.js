import { signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { SEEDED_USERNAME } from '../auth/credentials'
import { setCompanyItems } from '../store/slices/companiesSlice'
import { setCustomerItems } from '../store/slices/customersSlice'
import { setInvoiceItems } from '../store/slices/invoicesSlice'
import { setProductItems } from '../store/slices/productsSlice'
import { seedMasterDataIfEmpty } from '../data/seedMasterData'
import { clearLegacyLocalState, loadLegacyLocalState } from '../store/storage'
import { mergeRemoteWithLocal } from './cloudMerge'
import { sanitizeSliceForCloud } from './cloudSanitize'
import { auth, db } from './config'

const SLICES = ['companies', 'customers', 'products', 'invoices']

let remoteUpdate = false
let hydrated = false
let writeTimer = null
let unsubscribeStore = null
let basePath = null
let syncStarted = false
const lastSyncedIds = {
  companies: new Set(),
  customers: new Set(),
  products: new Set(),
  invoices: new Set(),
}

export const cloudSyncState = {
  status: 'connecting',
  error: null,
  mode: null,
}

function setCloudStatus(status, error = null, mode = cloudSyncState.mode) {
  cloudSyncState.status = status
  cloudSyncState.error = error
  if (mode) cloudSyncState.mode = mode
}

function payloadToDispatches(payload, dispatch) {
  dispatch(setCompanyItems(payload.companies ?? []))
  dispatch(setCustomerItems(payload.customers ?? []))
  dispatch(setProductItems(payload.products ?? []))
  dispatch(setInvoiceItems(payload.invoices ?? []))
}

function rememberSyncedIds(itemsBySlice) {
  for (const slice of SLICES) {
    lastSyncedIds[slice] = new Set((itemsBySlice[slice] ?? []).map((i) => i.id).filter(Boolean))
  }
}

function ensureStoreSubscription(store) {
  if (unsubscribeStore) return
  unsubscribeStore = store.subscribe(() => {
    if (!hydrated || remoteUpdate) return
    scheduleWrite(store)
  })
}

async function fetchCollection(pathSegments, sliceName) {
  const snap = await getDocs(collection(db, ...pathSegments, sliceName))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function loadLegacySingleDoc(pathSegments) {
  const legacyRef = doc(db, ...pathSegments, 'data', 'app')
  const snap = await getDoc(legacyRef)
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    companies: data.companies ?? [],
    customers: data.customers ?? [],
    products: data.products ?? [],
    invoices: data.invoices ?? [],
  }
}

async function loadRemoteState(pathSegments) {
  const fromCollections = {}
  let total = 0

  for (const slice of SLICES) {
    fromCollections[slice] = await fetchCollection(pathSegments, slice)
    total += fromCollections[slice].length
  }

  if (total > 0) return fromCollections

  const legacy = await loadLegacySingleDoc(pathSegments)
  if (legacy) return legacy

  return fromCollections
}

async function isMasterDataSeeded(pathSegments) {
  try {
    const snap = await getDoc(doc(db, ...pathSegments, 'meta', 'bootstrap'))
    return snap.exists() && snap.data()?.masterDataSeeded === true
  } catch {
    return false
  }
}

async function markMasterDataSeeded(pathSegments) {
  try {
    await setDoc(
      doc(db, ...pathSegments, 'meta', 'bootstrap'),
      { masterDataSeeded: true, seededAt: new Date().toISOString() },
      { merge: true },
    )
  } catch (err) {
    console.warn('Could not mark master data as seeded:', err)
  }
}

async function maybeSeedMasterData(store, pathSegments, remoteState) {
  const remoteHasMaster =
    (remoteState.customers?.length ?? 0) > 0 || (remoteState.products?.length ?? 0) > 0

  if (remoteHasMaster) {
    await markMasterDataSeeded(pathSegments)
    return false
  }

  if (await isMasterDataSeeded(pathSegments)) return false

  remoteUpdate = true
  const seeded = seedMasterDataIfEmpty(store)
  remoteUpdate = false

  if (seeded) {
    await markMasterDataSeeded(pathSegments)
  }
  return seeded
}

async function writeCollection(pathSegments, sliceName, items) {
  const sanitized = sanitizeSliceForCloud(sliceName, items)
  const newIds = new Set(sanitized.map((i) => i.id).filter(Boolean))
  const previousIds = lastSyncedIds[sliceName] ?? new Set()

  for (const id of previousIds) {
    if (!newIds.has(id)) {
      try {
        await deleteDoc(doc(db, ...pathSegments, sliceName, id))
      } catch (err) {
        console.error(`Failed to delete ${sliceName}/${id}:`, err)
        throw err
      }
    }
  }

  for (const item of sanitized) {
    const { id, ...body } = item
    if (!id) continue
    await setDoc(doc(db, ...pathSegments, sliceName, id), body, { merge: true })
  }

  lastSyncedIds[sliceName] = newIds
}

async function pushToCloud(store) {
  if (!basePath || remoteUpdate) return false
  try {
    const state = store.getState()
    for (const slice of SLICES) {
      await writeCollection(basePath, slice, state[slice].items)
    }
    setCloudStatus('connected')
    return true
  } catch (err) {
    console.error('Firebase save failed:', err)
    setCloudStatus('error', err?.message ?? 'Save failed')
    return false
  }
}

export async function flushCloudWrite(store) {
  if (!hydrated) return false
  clearTimeout(writeTimer)
  writeTimer = null
  return pushToCloud(store)
}

function scheduleWrite(store) {
  if (!basePath || !hydrated) return
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    flushCloudWrite(store)
  }, 800)
}

async function loadFromFirestore(pathSegments, store) {
  const remoteState = await loadRemoteState(pathSegments)
  const legacy = loadLegacyLocalState()

  let localState = store.getState()
  if (legacy) {
    localState = {
      companies: legacy.companies,
      customers: legacy.customers,
      products: legacy.products,
      invoices: legacy.invoices,
    }
  }

  const merged = mergeRemoteWithLocal(localState, remoteState)

  // Track remote IDs before push so local deletes are compared correctly.
  rememberSyncedIds({
    companies: remoteState.companies ?? [],
    customers: remoteState.customers ?? [],
    products: remoteState.products ?? [],
    invoices: remoteState.invoices ?? [],
  })

  remoteUpdate = true
  payloadToDispatches(merged, store.dispatch)
  remoteUpdate = false

  rememberSyncedIds({
    companies: merged.companies ?? [],
    customers: merged.customers ?? [],
    products: merged.products ?? [],
    invoices: merged.invoices ?? [],
  })

  await pushToCloud(store)

  if (legacy) clearLegacyLocalState()

  return remoteState
}

async function resolveBasePath() {
  try {
    await signInAnonymously(auth)
  } catch (err) {
    const code = err?.code ?? ''
    const useDeviceFallback =
      code === 'auth/configuration-not-found' ||
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation'

    if (!useDeviceFallback) throw err
    console.warn('Anonymous auth unavailable; using shared account path only.', err)
  }

  return { path: ['accounts', SEEDED_USERNAME], mode: 'cloud' }
}

async function attachCloudSync(store) {
  const { path, mode } = await resolveBasePath()
  basePath = path
  const remoteState = await loadFromFirestore(path, store)

  const seeded = await maybeSeedMasterData(store, path, remoteState)
  if (seeded) {
    await pushToCloud(store)
  }

  hydrated = true
  setCloudStatus('connected', null, mode)
  ensureStoreSubscription(store)
}

export async function retryCloudSync(store) {
  setCloudStatus('connecting', null, cloudSyncState.mode)
  hydrated = false
  try {
    if (!basePath) {
      const { path, mode } = await resolveBasePath()
      basePath = path
      cloudSyncState.mode = mode
    }
    const remoteState = await loadFromFirestore(basePath, store)
    const seeded = await maybeSeedMasterData(store, basePath, remoteState)
    if (seeded) await pushToCloud(store)
    hydrated = true
    setCloudStatus('connected', null, cloudSyncState.mode)
    ensureStoreSubscription(store)
    return true
  } catch (err) {
    console.error('Firebase sync retry failed:', err)
    hydrated = false
    setCloudStatus('error', err?.message ?? 'Cloud sync unavailable', cloudSyncState.mode)
    return false
  }
}

export function startFirebaseSync(store, { onReady, onError }) {
  if (syncStarted) {
    onReady?.(cloudSyncState)
    return () => {}
  }
  syncStarted = true

  ;(async () => {
    try {
      await attachCloudSync(store)
      onReady?.(cloudSyncState)
    } catch (err) {
      console.error('Firebase sync failed:', err)
      hydrated = false
      setCloudStatus('error', err?.message ?? 'Cloud sync unavailable', null)
      onError?.(err)
      onReady?.(cloudSyncState)
    }
  })()

  return () => {}
}
