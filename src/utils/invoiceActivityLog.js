import { nanoid } from '@reduxjs/toolkit'
import { latestDeliveryLogEntry } from './invoiceDeliveryLog'
import {
  deliveryStatusLabel,
  normalizePaymentStatus,
  paymentStatusLabel,
} from './invoiceStatus'

export function createPaymentStatusActivityEntry({ previousPaymentStatus, paymentStatus, note }) {
  const previous = normalizePaymentStatus(previousPaymentStatus)
  const next = normalizePaymentStatus(paymentStatus)
  if (previous === next) return null
  return {
    id: nanoid(),
    type: 'payment_status',
    createdAt: new Date().toISOString(),
    previousPaymentStatus: previous,
    paymentStatus: next,
    note: note?.trim() || null,
  }
}

/** Unified timeline (newest first). Merges activityLog with legacy deliveryLog entries. */
export function invoiceActivityTimeline(invoice) {
  const merged = [...(invoice?.activityLog ?? [])]
  const seen = new Set(merged.map((e) => e.id))
  for (const entry of invoice?.deliveryLog ?? []) {
    if (!seen.has(entry.id)) {
      merged.push({ ...entry, type: entry.type ?? 'delivery' })
    }
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function deliveryActivityForTotals(invoice) {
  const timeline = invoiceActivityTimeline(invoice)
  const latestDelivery = timeline.find((e) => e.type === 'delivery' || e.lines)
  if (latestDelivery?.lines?.length) return latestDelivery
  return null
}

export function formatActivityTimestamp(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export function activityHeadline(entry) {
  if (entry.type === 'payment_status') {
    return `Payment: ${paymentStatusLabel(entry.previousPaymentStatus)} → ${paymentStatusLabel(entry.paymentStatus)}`
  }

  const deliveryType = entry.type === 'delivery' || entry.lines
  if (!deliveryType) return 'Activity'

  if (entry.progressUpdate && entry.previousDeliveryStatus === entry.deliveryStatus) {
    return `Delivery update · ${deliveryStatusLabel(entry.deliveryStatus)}`
  }
  if (entry.previousDeliveryStatus !== entry.deliveryStatus) {
    return `Delivery status: ${deliveryStatusLabel(entry.previousDeliveryStatus)} → ${deliveryStatusLabel(entry.deliveryStatus)}`
  }
  return `Delivery · ${deliveryStatusLabel(entry.deliveryStatus)}`
}

export function deliveryShipmentLines(entry) {
  const changes = entry.lineChanges ?? []
  const withDelta = changes.filter((c) => (c.deltaDelivered ?? 0) > 0)
  if (withDelta.length) {
    return withDelta.map((c) => ({
      productName: c.productName,
      quantity: c.deltaDelivered,
      label: `${c.deltaDelivered} piece${c.deltaDelivered === 1 ? '' : 's'} of ${c.productName}`,
    }))
  }
  if (entry.lines?.length && !entry.lineChanges) {
    return entry.lines
      .filter((l) => (l.deliveredQuantity ?? 0) > 0)
      .map((l) => ({
        productName: l.productName,
        quantity: l.deliveredQuantity,
        label: `${l.deliveredQuantity} piece${l.deliveredQuantity === 1 ? '' : 's'} of ${l.productName} (total so far)`,
      }))
  }
  return []
}
