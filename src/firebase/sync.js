import { signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { setCompanyItems } from '../store/slices/companiesSlice'
import { setCustomerItems } from '../store/slices/customersSlice'
import { setInvoiceItems } from '../store/slices/invoicesSlice'
import { setProductItems } from '../store/slices/productsSlice'
import { seedMasterDataIfEmpty } from '../data/seedMasterData'
import { mergeRemoteWithLocal } from './cloudMerge'
import { sanitizeSliceForCloud } from './cloudSanitize'
import { auth, db } from './config'
import { getDeviceId } from './deviceId'

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

async function writeCollection(pathSegments, sliceName, items) {
  const sanitized = sanitizeSliceForCloud(sliceName, items)
  const newIds = new Set(sanitized.map((i) => i.id))

  for (const id of lastSyncedIds[sliceName]) {
    if (!newIds.has(id)) {
      await deleteDoc(doc(db, ...pathSegments, sliceName, id))
    }
  }

  for (const item of sanitized) {
    const { id, ...body } = item
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
  return pushToCloud(store)
}

function scheduleWrite(store) {
  if (!basePath) return
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    flushCloudWrite(store)
  }, 800)
}

async function loadFromFirestore(pathSegments, store) {
  const localState = store.getState()
  const remoteState = await loadRemoteState(pathSegments)
  const merged = mergeRemoteWithLocal(localState, remoteState)

  remoteUpdate = true
  payloadToDispatches(merged, store.dispatch)
  remoteUpdate = false

  await pushToCloud(store)
}

async function resolveBasePath() {
  try {
    const session = auth.currentUser ?? (await signInAnonymously(auth)).user
    return { path: ['users', session.uid], mode: 'auth' }
  } catch (err) {
    const code = err?.code ?? ''
    const useDeviceFallback =
      code === 'auth/configuration-not-found' ||
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation'

    if (!useDeviceFallback) throw err

    console.warn('Anonymous auth unavailable; syncing with device id instead.', err)
    return { path: ['devices', getDeviceId()], mode: 'device' }
  }
}

async function attachCloudSync(store) {
  const { path, mode } = await resolveBasePath()
  basePath = path
  await loadFromFirestore(path, store)

  remoteUpdate = true
  const seeded = seedMasterDataIfEmpty(store)
  remoteUpdate = false
  if (seeded) {
    await pushToCloud(store)
  }

  hydrated = true
  setCloudStatus('connected', null, mode)

  if (!unsubscribeStore) {
    unsubscribeStore = store.subscribe(() => {
      if (!hydrated || remoteUpdate) return
      scheduleWrite(store)
    })
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
      seedMasterDataIfEmpty(store)
      setCloudStatus('error', err?.message ?? 'Cloud sync unavailable', 'local')
      hydrated = true
      onError?.(err)
      onReady?.(cloudSyncState)
    }
  })()

  return () => {}
}
