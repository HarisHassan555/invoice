import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

function nextInvoiceNumber(existing) {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const nums = existing
    .map((inv) => inv.invoiceNumber)
    .filter((n) => n?.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    addInvoice: {
      reducer(state, action) {
        state.items.unshift(action.payload)
      },
      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            createdAt: new Date().toISOString(),
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate ?? null,
            notes: data.notes ?? null,
            companyId: data.companyId ?? null,
            customerId: data.customerId ?? null,
            companySnapshot: data.companySnapshot ?? null,
            customerSnapshot: data.customerSnapshot ?? null,
            lineItems: data.lineItems,
            additionalDiscount: data.additionalDiscount ?? 0,
            status: data.status ?? 'pending',
          },
        }
      },
    },
    updateInvoice(state, action) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
    removeInvoice(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    setInvoiceItems(state, action) {
      state.items = action.payload
    },
  },
})

export { nextInvoiceNumber }
export const { addInvoice, updateInvoice, removeInvoice, setInvoiceItems } = invoicesSlice.actions
export default invoicesSlice.reducer
