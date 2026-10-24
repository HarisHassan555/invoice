const STORAGE_KEY = 'invoice-app-state'

function normalizeSlice(data) {
  if (Array.isArray(data)) return { items: data }
  if (data?.items) return { items: data.items }
  return { items: [] }
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    return {
      companies: normalizeSlice(parsed.companies),
      customers: normalizeSlice(parsed.customers),
      products: normalizeSlice(parsed.products),
      invoices: normalizeSlice(parsed.invoices),
    }
  } catch {
    return undefined
  }
}

export function persistState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      companies: state.companies,
      customers: state.customers,
      products: state.products,
      invoices: state.invoices,
    }),
  )
}
