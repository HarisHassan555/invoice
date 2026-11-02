import { createSlice, nanoid } from '@reduxjs/toolkit'
import { normalizeDeliveryStatus, normalizePaymentStatus } from '../../utils/invoiceStatus'
import { normalizeLineItems } from '../../utils/invoiceLines'

const initialState = {
  items: [],
}

function nextInvoiceNumber(existing) {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const nums = existing
    .filter((inv) => !inv.isDraft)
    .map((inv) => inv.invoiceNumber)
    .filter((n) => n?.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

function nextDraftNumber(existing) {
  const year = new Date().getFullYear()
  const prefix = `DRAFT-${year}-`
  const nums = existing
    .filter((inv) => inv.isDraft)
    .map((inv) => inv.invoiceNumber)
    .filter((n) => n?.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

function finalizeInvoiceFields(data) {
  const paymentStatus = normalizePaymentStatus(data.paymentStatus)
  const deliveryStatus = normalizeDeliveryStatus(data.deliveryStatus, data.status)
  const lineItems = normalizeLineItems(data.lineItems).map(({ deliveredQuantity, ...line }) => line)

  return {
    ...data,
    paymentStatus,
    deliveryStatus,
    lineItems,
    status: deliveryStatus,
    deliveryLog: Array.isArray(data.deliveryLog) ? data.deliveryLog : [],
    activityLog: Array.isArray(data.activityLog) ? data.activityLog : [],
    isDraft: Boolean(data.isDraft),
    isInactive: Boolean(data.isInactive),
  }
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
        const base = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
          paymentStatus: data.paymentStatus ?? 'payment_pending',
          deliveryStatus: data.deliveryStatus ?? 'pending_delivery',
          status: data.status ?? data.deliveryStatus ?? 'pending_delivery',
          deliveryLog: data.deliveryLog ?? [],
          activityLog: data.activityLog ?? [],
          isDraft: data.isDraft ?? false,
          isInactive: data.isInactive ?? false,
        }
        return { payload: finalizeInvoiceFields(base) }
      },
    },
    updateInvoice(state, action) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id)
      if (idx === -1) return
      state.items[idx] = finalizeInvoiceFields({
        ...state.items[idx],
        ...action.payload,
        updatedAt: new Date().toISOString(),
      })
    },
    removeInvoice(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload)
    },
    setInvoiceItems(state, action) {
      state.items = (action.payload ?? []).map((inv) => finalizeInvoiceFields(inv))
    },
  },
})

export { nextDraftNumber, nextInvoiceNumber }
export const { addInvoice, updateInvoice, removeInvoice, setInvoiceItems } = invoicesSlice.actions
export default invoicesSlice.reducer
