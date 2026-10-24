export const INVOICE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial_delivery', label: 'Partial delivery' },
  { value: 'complete_delivery', label: 'Delivered' },
]

export function invoiceStatusLabel(status) {
  return INVOICE_STATUSES.find((s) => s.value === status)?.label ?? 'Pending'
}

export function normalizeInvoiceStatus(status) {
  if (status === 'partial_delivery' || status === 'complete_delivery') return status
  return 'pending'
}
