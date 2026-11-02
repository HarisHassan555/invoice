export const PAYMENT_STATUSES = [
  { value: 'payment_pending', label: 'Payment pending' },
  { value: 'partial_payment', label: 'Partial payment' },
  { value: 'payment_completed', label: 'Payment completed' },
]

export const DELIVERY_STATUSES = [
  { value: 'pending_delivery', label: 'Pending delivery' },
  { value: 'partial_delivery', label: 'Partial delivery' },
  { value: 'delivery_completed', label: 'Delivery completed' },
]

export function paymentStatusLabel(status) {
  return PAYMENT_STATUSES.find((s) => s.value === status)?.label ?? 'Payment pending'
}

export function deliveryStatusLabel(status) {
  return DELIVERY_STATUSES.find((s) => s.value === status)?.label ?? 'Pending delivery'
}

export function normalizePaymentStatus(status) {
  if (status === 'partial_payment' || status === 'payment_completed') return status
  return 'payment_pending'
}

/** Maps current + legacy delivery values onto the new delivery status set. */
export function normalizeDeliveryStatus(status, legacyStatus) {
  const candidate = status ?? legacyStatus
  if (candidate === 'partial_delivery') return 'partial_delivery'
  if (candidate === 'delivery_completed' || candidate === 'complete_delivery') {
    return 'delivery_completed'
  }
  return 'pending_delivery'
}

/** @deprecated Prefer paymentStatus / deliveryStatus badges. */
export function normalizeInvoiceStatus(status) {
  return normalizeDeliveryStatus(null, status)
}

/** @deprecated Prefer deliveryStatusLabel / paymentStatusLabel. */
export function invoiceStatusLabel(status) {
  return deliveryStatusLabel(normalizeDeliveryStatus(null, status))
}

export function clampDeliveredQuantity(delivered, ordered) {
  const qty = Number(ordered) || 0
  const d = Number(delivered)
  if (!Number.isFinite(d) || d < 0) return 0
  return Math.min(Math.floor(d), qty)
}

export function pendingQuantity(line) {
  const ordered = Number(line.quantity) || 0
  const delivered = clampDeliveredQuantity(line.deliveredQuantity, ordered)
  return Math.max(0, ordered - delivered)
}

export function deliveryTotals(lineItems) {
  const lines = lineItems ?? []
  let ordered = 0
  let delivered = 0
  for (const line of lines) {
    const q = Number(line.quantity) || 0
    ordered += q
    delivered += clampDeliveredQuantity(line.deliveredQuantity, q)
  }
  return {
    ordered,
    delivered,
    pending: Math.max(0, ordered - delivered),
  }
}

/** Derive delivery status from line delivered quantities. */
export function deriveDeliveryStatus(lineItems) {
  const { ordered, delivered, pending } = deliveryTotals(lineItems)
  if (ordered <= 0 || delivered <= 0) return 'pending_delivery'
  if (pending <= 0) return 'delivery_completed'
  return 'partial_delivery'
}

/**
 * When status changes, sync deliveredQuantity on lines so totals stay consistent.
 * - pending_delivery → all delivered = 0
 * - delivery_completed → all delivered = quantity
 * - partial_delivery → keep existing delivered (clamped); if all zero, leave for user to fill
 */
export function applyDeliveryStatusToLines(lineItems, deliveryStatus) {
  const status = normalizeDeliveryStatus(deliveryStatus)
  return (lineItems ?? []).map((line) => {
    const quantity = Number(line.quantity) || 0
    if (status === 'pending_delivery') {
      return { ...line, deliveredQuantity: 0 }
    }
    if (status === 'delivery_completed') {
      return { ...line, deliveredQuantity: quantity }
    }
    return {
      ...line,
      deliveredQuantity: clampDeliveredQuantity(line.deliveredQuantity, quantity),
    }
  })
}

export function normalizeInvoiceStatuses(invoice) {
  return {
    paymentStatus: normalizePaymentStatus(invoice?.paymentStatus),
    deliveryStatus: normalizeDeliveryStatus(invoice?.deliveryStatus, invoice?.status),
  }
}
