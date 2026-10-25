/** Legacy browser persistence (removed). Used only for one-time migration into Firestore. */

const STORAGE_KEY = 'invoice-app-state'

function normalizeSlice(data) {
  if (Array.isArray(data)) return { items: data }
  if (data?.items) return { items: data.items }
  return { items: [] }
}

export function loadLegacyLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      companies: normalizeSlice(parsed.companies),
      customers: normalizeSlice(parsed.customers),
      products: normalizeSlice(parsed.products),
      invoices: normalizeSlice(parsed.invoices),
    }
  } catch {
    return null
  }
}

export function clearLegacyLocalState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
