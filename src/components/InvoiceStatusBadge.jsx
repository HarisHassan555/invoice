import {
  deliveryStatusLabel,
  normalizeDeliveryStatus,
  normalizePaymentStatus,
  paymentStatusLabel,
} from '../utils/invoiceStatus'

const paymentStyles = {
  payment_pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  partial_payment: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200',
  payment_completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
}

const deliveryStyles = {
  pending_delivery: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  partial_delivery: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
  delivery_completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
}

export function PaymentStatusBadge({ status }) {
  const key = normalizePaymentStatus(status)
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[key]}`}
    >
      {paymentStatusLabel(key)}
    </span>
  )
}

export function DeliveryStatusBadge({ status, legacyStatus }) {
  const key = normalizeDeliveryStatus(status, legacyStatus)
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${deliveryStyles[key]}`}
    >
      {deliveryStatusLabel(key)}
    </span>
  )
}

/** @deprecated Use PaymentStatusBadge / DeliveryStatusBadge. */
export default function InvoiceStatusBadge({ status }) {
  return <DeliveryStatusBadge legacyStatus={status} />
}
