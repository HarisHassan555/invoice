import { invoiceStatusLabel, normalizeInvoiceStatus } from '../utils/invoiceStatus'

const styles = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  partial_delivery: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
  complete_delivery: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
}

export default function InvoiceStatusBadge({ status }) {
  const key = normalizeInvoiceStatus(status)
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[key]}`}
    >
      {invoiceStatusLabel(key)}
    </span>
  )
}
