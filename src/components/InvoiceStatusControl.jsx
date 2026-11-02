import { inputClass } from './MasterDataForm'
import { DeliveryStatusBadge, PaymentStatusBadge } from './InvoiceStatusBadge'
import {
  DELIVERY_STATUSES,
  PAYMENT_STATUSES,
  normalizeDeliveryStatus,
  normalizePaymentStatus,
} from '../utils/invoiceStatus'

export default function InvoiceStatusControl({
  paymentStatus,
  deliveryStatus,
  legacyStatus,
  deliveryProgress,
  onPaymentChange,
  onDeliveryChange,
  showBadges = true,
}) {
  const payment = normalizePaymentStatus(paymentStatus)
  const delivery = normalizeDeliveryStatus(deliveryStatus, legacyStatus)
  const totals = deliveryProgress ?? { ordered: 0, delivered: 0, pending: 0 }

  return (
    <div className="space-y-3">
      <div className="panel flex flex-wrap items-end justify-between gap-4 p-5">
        <div>
          <p className="field-label">Payment status</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track whether payment is pending, partial, or completed.
          </p>
        </div>
        <div className="flex min-w-[220px] flex-col gap-2 sm:items-end">
          {showBadges ? <PaymentStatusBadge status={payment} /> : null}
          <select
            className={inputClass}
            value={payment}
            onChange={(e) => onPaymentChange?.(e.target.value)}
            aria-label="Payment status"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel flex flex-wrap items-end justify-between gap-4 p-5">
        <div>
          <p className="field-label">Delivery status</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pending, partial, or fully delivered. Changing status opens a delivery log (does not
            change the invoice PDF).
          </p>
          {delivery === 'partial_delivery' || totals.delivered > 0 ? (
            <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              Delivered {totals.delivered} of {totals.ordered} · Pending {totals.pending}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-[220px] flex-col gap-2 sm:items-end">
          {showBadges ? (
            <DeliveryStatusBadge status={delivery} legacyStatus={legacyStatus} />
          ) : null}
          <select
            className={inputClass}
            value={delivery}
            onChange={(e) => onDeliveryChange?.(e.target.value)}
            aria-label="Delivery status"
          >
            {DELIVERY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
