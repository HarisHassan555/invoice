import { nanoid } from '@reduxjs/toolkit'
import { normalizeLineItems } from './invoiceLines'
import {
  clampDeliveredQuantity,
  deliveryTotals,
  normalizeDeliveryStatus,
} from './invoiceStatus'

export function latestDeliveryLogEntry(deliveryLog) {
  const entries = deliveryLog ?? []
  if (!entries.length) return null
  return entries[0]
}

export function deliveryTotalsFromLogLines(lines) {
  let ordered = 0
  let delivered = 0
  for (const line of lines ?? []) {
    const q = Number(line.orderedQuantity ?? line.quantity) || 0
    ordered += q
    delivered += clampDeliveredQuantity(line.deliveredQuantity, q)
  }
  return {
    ordered,
    delivered,
    pending: Math.max(0, ordered - delivered),
  }
}

/** Prefer latest log snapshot; fall back to legacy line deliveredQuantity. */
export function deliveryTotalsForInvoice(invoice) {
  const activityDelivery = (invoice?.activityLog ?? []).find(
    (e) => (e.type === 'delivery' || e.lines) && e.lines?.length,
  )
  if (activityDelivery?.lines?.length) {
    return deliveryTotalsFromLogLines(activityDelivery.lines)
  }
  const latest = latestDeliveryLogEntry(invoice?.deliveryLog)
  if (latest?.lines?.length) {
    return deliveryTotalsFromLogLines(latest.lines)
  }
  return deliveryTotals(invoice?.lineItems)
}

export function defaultLogLinesForStatus(invoice, deliveryStatus, previousEntry) {
  const status = normalizeDeliveryStatus(deliveryStatus)
  const prevByLine = new Map((previousEntry?.lines ?? []).map((l) => [l.lineId, l]))

  return normalizeLineItems(invoice.lineItems).map((line) => {
    const orderedQuantity = Number(line.quantity) || 0
    let deliveredQuantity = 0
    if (status === 'delivery_completed') {
      deliveredQuantity = orderedQuantity
    } else if (status === 'partial_delivery' || status === 'pending_delivery') {
      deliveredQuantity =
        prevByLine.get(line.lineId)?.deliveredQuantity ??
        clampDeliveredQuantity(line.deliveredQuantity, orderedQuantity)
    }
    deliveredQuantity = clampDeliveredQuantity(deliveredQuantity, orderedQuantity)
    return {
      lineId: line.lineId,
      productName: line.productName,
      orderedQuantity,
      deliveredQuantity,
      pendingQuantity: Math.max(0, orderedQuantity - deliveredQuantity),
    }
  })
}

/** True when more units can still be marked delivered on this invoice. */
export function canRecordDeliveryProgress(invoice, deliveryStatus) {
  const status = normalizeDeliveryStatus(deliveryStatus, invoice?.status)
  const totals = deliveryTotalsForInvoice(invoice)
  if (totals.pending <= 0) return false
  return status === 'partial_delivery' || totals.delivered > 0
}

function buildLineChanges(priorLines, normalizedLines) {
  if (!priorLines?.length) return null
  const priorByLine = new Map(priorLines.map((l) => [l.lineId, l.deliveredQuantity ?? 0]))
  const changes = normalizedLines.map((line) => {
    const previousDelivered = priorByLine.get(line.lineId) ?? 0
    const deltaDelivered = line.deliveredQuantity - previousDelivered
    return {
      lineId: line.lineId,
      productName: line.productName,
      previousDelivered,
      deliveredQuantity: line.deliveredQuantity,
      deltaDelivered,
    }
  })
  return changes
}

export function deriveDeliveryStatusFromLogLines(lines) {
  const { delivered, pending } = deliveryTotalsFromLogLines(lines)
  if (delivered <= 0) return 'pending_delivery'
  if (pending <= 0) return 'delivery_completed'
  return 'partial_delivery'
}

export function createDeliveryLogEntry({
  previousDeliveryStatus,
  lines,
  note,
  priorSnapshotLines,
  progressUpdate,
}) {
  const normalizedLines = (lines ?? []).map((line) => {
    const orderedQuantity = Number(line.orderedQuantity) || 0
    const deliveredQuantity = clampDeliveredQuantity(line.deliveredQuantity, orderedQuantity)
    return {
      lineId: line.lineId,
      productName: line.productName ?? '—',
      orderedQuantity,
      deliveredQuantity,
      pendingQuantity: Math.max(0, orderedQuantity - deliveredQuantity),
    }
  })

  const resolvedStatus = deriveDeliveryStatusFromLogLines(normalizedLines)
  const previous = normalizeDeliveryStatus(previousDeliveryStatus)
  const isProgressUpdate =
    Boolean(progressUpdate) ||
    (previous === resolvedStatus && previous === 'partial_delivery')

  return {
    id: nanoid(),
    type: 'delivery',
    createdAt: new Date().toISOString(),
    previousDeliveryStatus: previous,
    deliveryStatus: resolvedStatus,
    progressUpdate: isProgressUpdate,
    note: note?.trim() || null,
    lines: normalizedLines,
    lineChanges: buildLineChanges(priorSnapshotLines, normalizedLines),
  }
}

export function formatLogTimestamp(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
