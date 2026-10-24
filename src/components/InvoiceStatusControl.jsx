import { inputClass } from './MasterDataForm'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import { INVOICE_STATUSES, normalizeInvoiceStatus } from '../utils/invoiceStatus'

export default function InvoiceStatusControl({ value, onChange, showBadge = true }) {
  const status = normalizeInvoiceStatus(value)

  return (
    <div className="panel flex flex-wrap items-end justify-between gap-4 p-5">
      <div>
        <p className="field-label">Delivery status</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Track whether this order is pending, partially delivered, or fully delivered.
        </p>
      </div>
      <div className="flex min-w-[220px] flex-col gap-2 sm:items-end">
        {showBadge ? <InvoiceStatusBadge status={status} /> : null}
        <select
          className={inputClass}
          value={status}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Delivery status"
        >
          {INVOICE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
